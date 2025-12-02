import { Injectable, Logger } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../common/prisma.service';
import { ExcelService } from './excel/excel.service';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { UpdateTransactionDto } from './dto/update-transaction.dto';
import { TransactionEntity } from './entities/transaction.entity';

@Injectable()
export class FinanceService {
  private readonly logger = new Logger(FinanceService.name);

  constructor(
    private readonly excelService: ExcelService,
    private readonly prisma: PrismaService,
  ) {}

  async findAll(page = 1, limit = 100) {
    const skip = (page - 1) * limit;
    const [items, total] = await Promise.all([
      this.prisma.transaction.findMany({
        skip,
        take: limit,
        orderBy: [
          { id: 'asc' }, // Mantém ordem original do Excel (ordem de inserção)
        ],
      }),
      this.prisma.transaction.count(),
    ]);

    return {
      items: items.map(this.entityToDto),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOneById(id: number) {
    const transaction = await this.prisma.transaction.findUnique({
      where: { id },
    });
    return transaction ? this.entityToDto(transaction) : null;
  }

  async getSummary() {
    const transactions = await this.prisma.transaction.findMany();
    
    let receitas = 0;
    let despesas = 0;

    transactions.forEach((tx) => {
      const valor = Number(tx.valor);
      if (valor > 0) {
        receitas += valor;
      } else {
        despesas += Math.abs(valor);
      }
    });

    return {
      receitas,
      despesas,
      saldo: receitas - despesas,
    };
  }

  async create(dto: CreateTransactionDto) {
    const entity = this.dtoToEntity(dto);
    const created = await this.prisma.transaction.create({
      data: entity,
    });
    
    // Recalcula os saldos após criar a transação
    this.logger.log(`🔄 Recalculando saldos após criar transação ${created.id}...`);
    try {
      await this.recalcularSaldos(created.id);
      this.logger.log(`✅ Recálculo de saldos concluído para transação ${created.id}`);
    } catch (error) {
      this.logger.error(`❌ Erro ao recalcular saldos: ${error.message}`, error);
    }
    
    // Busca a transação atualizada com o saldo recalculado
    const updated = await this.prisma.transaction.findUnique({
      where: { id: created.id },
    });
    
    this.logger.log(`📊 Transação criada - ID: ${updated.id}, Valor: ${updated.valor}, Saldo: ${updated.saldo}`);
    
    // Tenta adicionar no Excel (opcional, não bloqueia se falhar)
    try {
      const entityForExcel = {
        descricao: updated.descricao,
        codigo: updated.codigo,
        centroCusto: updated.centroCusto,
        ndoc: updated.ndoc,
        valor: Number(updated.valor),
        status: updated.status.toLowerCase() as 'pago' | 'pendente',
        data: updated.data,
        saldo: updated.saldo ? Number(updated.saldo) : undefined,
      };
      await this.excelService.appendTransaction(entityForExcel);
      this.logger.log(`✅ Transação adicionada no Excel`);
    } catch (error) {
      this.logger.warn(`⚠️ Não foi possível adicionar no Excel (continuando normalmente): ${error.message}`);
    }
    
    return this.entityToDto(updated);
  }

  async update(codigo: string, dto: UpdateTransactionDto) {
    // Busca a transação atual para comparar o valor antigo
    const current = await this.prisma.transaction.findUnique({
      where: { codigo },
    });

    if (!current) {
      throw new Error(`Transação com código ${codigo} não encontrada`);
    }

    // Constrói o objeto de atualização apenas com os campos fornecidos
    const updateData: any = {};
    
    if (dto.descricao !== undefined) updateData.descricao = dto.descricao;
    if (dto.codigo !== undefined) updateData.codigo = dto.codigo;
    if (dto.centroCusto !== undefined) updateData.centroCusto = dto.centroCusto;
    if (dto.ndoc !== undefined) updateData.ndoc = dto.ndoc;
    if (dto.valor !== undefined) updateData.valor = new Prisma.Decimal(dto.valor);
    if (dto.status !== undefined) updateData.status = dto.status;
    if (dto.data !== undefined) {
      // dto.data é sempre string no DTO (IsDateString)
      updateData.data = new Date(dto.data);
    }
    if (dto.saldo !== undefined) updateData.saldo = new Prisma.Decimal(dto.saldo);

    // Atualiza a transação
    const updated = await this.prisma.transaction.update({
      where: { codigo },
      data: updateData,
    });

    // Se o valor, data ou saldo mudou, recalcula os saldos subsequentes
    const valorMudou = dto.valor !== undefined && Number(dto.valor) !== Number(current.valor);
    const dataMudou = dto.data !== undefined && dto.data !== current.data.toISOString().split('T')[0];
    const saldoMudou = dto.saldo !== undefined && Number(dto.saldo) !== Number(current.saldo || 0);

    if (valorMudou || dataMudou || saldoMudou) {
      this.logger.log(`🔄 Valor, data ou saldo mudou, recalculando saldos a partir da transação ${codigo}...`);
      
      // Se o saldo foi editado manualmente, usa ele como referência
      if (saldoMudou && dto.saldo !== undefined) {
        await this.recalcularSaldosComReferencia(updated.id, Number(dto.saldo));
      } else {
        await this.recalcularSaldos(updated.id);
      }
    }

    // Busca a versão atualizada após recálculo
    const finalUpdated = await this.prisma.transaction.findUnique({
      where: { id: updated.id },
    });

    // Tenta atualizar no Excel (opcional, não bloqueia se falhar)
    try {
      const entity = {
        descricao: finalUpdated.descricao,
        codigo: finalUpdated.codigo,
        centroCusto: finalUpdated.centroCusto,
        ndoc: finalUpdated.ndoc,
        valor: Number(finalUpdated.valor),
        status: finalUpdated.status.toLowerCase() as 'pago' | 'pendente',
        data: finalUpdated.data,
        saldo: finalUpdated.saldo ? Number(finalUpdated.saldo) : undefined,
      };
      await this.excelService.updateTransaction(codigo, entity);
      this.logger.log(`✅ Transação atualizada no Excel`);
    } catch (error) {
      this.logger.warn(`⚠️ Não foi possível atualizar no Excel (continuando normalmente): ${error.message}`);
    }

    return this.entityToDto(finalUpdated);
  }

  async remove(codigo: string) {
    try {
      this.logger.log(`🔍 Buscando transação com código: "${codigo}"`);
      
      // Busca a transação antes de deletar
      const transaction = await this.prisma.transaction.findUnique({
        where: { codigo },
      });

      if (!transaction) {
        // Tenta buscar todas as transações para debug
        const todas = await this.prisma.transaction.findMany({
          take: 10,
          select: { codigo: true, id: true, descricao: true },
        });
        this.logger.warn(`Transação não encontrada. Códigos disponíveis (primeiros 10):`, todas.map(t => t.codigo));
        throw new Error(`Transação com código "${codigo}" não encontrada`);
      }
      
      this.logger.log(`✅ Transação encontrada: ID=${transaction.id}, Código=${transaction.codigo}`);

      // Deleta a transação
      await this.prisma.transaction.delete({
        where: { codigo },
      });

      this.logger.log(`🗑️ Transação ${codigo} excluída`);

      // Recalcula os saldos das transações restantes
      // Busca todas as transações ordenadas por id
      const allTransactions = await this.prisma.transaction.findMany({
        orderBy: { id: 'asc' },
      });

      if (allTransactions.length === 0) {
        this.logger.log(`ℹ️ Nenhuma transação restante após exclusão`);
        return;
      }

      this.logger.log(`📊 Recalculando saldos para ${allTransactions.length} transações restantes`);

      // Encontra o primeiro saldo válido como referência
      let saldoAcumulado = 0;
      let encontrouSaldoReferencia = false;
      let indiceReferencia = -1;

      // Procura por um saldo válido
      for (let i = 0; i < allTransactions.length; i++) {
        if (allTransactions[i].saldo !== null && allTransactions[i].saldo !== undefined) {
          const saldoRef = Number(allTransactions[i].saldo);
          if (saldoRef !== 0 && Math.abs(saldoRef) > 0.01) {
            // O saldo de referência = saldo antes + valor da transação
            // Então: saldo antes = saldo de referência - valor da transação
            saldoAcumulado = saldoRef - Number(allTransactions[i].valor);
            encontrouSaldoReferencia = true;
            indiceReferencia = i;
            this.logger.log(`📊 Usando saldo de referência: R$ ${saldoRef.toLocaleString('pt-BR')} na transação ${allTransactions[i].id}`);
            break;
          }
        }
      }

      // Se encontrou saldo de referência, soma os valores das transações antes da referência
      if (encontrouSaldoReferencia && indiceReferencia >= 0) {
        for (let i = 0; i < indiceReferencia; i++) {
          saldoAcumulado += Number(allTransactions[i].valor);
        }
      } else {
        // Se não encontrou saldo de referência, calcula a partir do início
        this.logger.log(`⚠️ Nenhum saldo de referência encontrado, calculando a partir de zero`);
        saldoAcumulado = 0;
      }

      // Recalcula todos os saldos
      const updates: Array<{ id: number; saldo: number }> = [];

      for (let i = 0; i < allTransactions.length; i++) {
        saldoAcumulado += Number(allTransactions[i].valor);
        updates.push({
          id: allTransactions[i].id,
          saldo: saldoAcumulado,
        });
      }

      // Atualiza todos os saldos
      this.logger.log(`💾 Atualizando ${updates.length} saldos...`);
      for (const update of updates) {
        try {
          await this.prisma.transaction.update({
            where: { id: update.id },
            data: { saldo: new Prisma.Decimal(update.saldo) },
          });
        } catch (updateError) {
          this.logger.error(`Erro ao atualizar saldo da transação ${update.id}:`, updateError);
          throw updateError;
        }
      }

      this.logger.log(`✅ Recalculados ${updates.length} saldos após exclusão`);

    } catch (error) {
      this.logger.error(`❌ Erro ao excluir transação ${codigo}:`, error);
      throw error;
    }
  }

  /**
   * Recalcula os saldos acumulados a partir de uma transação específica
   */
  private async recalcularSaldos(transactionId: number) {
    // Busca todas as transações ordenadas por id (ordem de inserção)
    const allTransactions = await this.prisma.transaction.findMany({
      orderBy: { id: 'asc' },
    });

    if (allTransactions.length === 0) {
      return;
    }

    // Encontra o índice da transação atual
    const currentIndex = allTransactions.findIndex((t) => t.id === transactionId);

    if (currentIndex === -1) {
      this.logger.warn(`Transação com id ${transactionId} não encontrada para recálculo`);
      return;
    }

    // Tenta encontrar um saldo de referência válido antes da transação atual
    let saldoAcumulado = 0;
    let encontrouSaldoReferencia = false;
    let indiceReferencia = -1;

    // Procura por um saldo válido antes da transação atual
    for (let i = currentIndex - 1; i >= 0; i--) {
      if (allTransactions[i].saldo !== null && allTransactions[i].saldo !== undefined) {
        const saldoRef = Number(allTransactions[i].saldo);
        if (saldoRef !== 0 && Math.abs(saldoRef) > 0.01) {
          // O saldo de referência = saldo antes + valor da transação
          // Então: saldo antes = saldo de referência - valor da transação
          saldoAcumulado = saldoRef - Number(allTransactions[i].valor);
          encontrouSaldoReferencia = true;
          indiceReferencia = i;
          this.logger.log(`📊 Usando saldo de referência: R$ ${saldoRef.toLocaleString('pt-BR')} na transação ${allTransactions[i].id} (índice ${i})`);
          break;
        }
      }
    }

    // Se encontrou saldo de referência, soma os valores das transações entre a referência e a atual
    if (encontrouSaldoReferencia && indiceReferencia >= 0) {
      // Soma os valores das transações após a referência até antes da atual
      for (let j = indiceReferencia + 1; j < currentIndex; j++) {
        saldoAcumulado += Number(allTransactions[j].valor);
        this.logger.log(`  + Transação ${allTransactions[j].id}: ${Number(allTransactions[j].valor).toLocaleString('pt-BR')} → Saldo: ${saldoAcumulado.toLocaleString('pt-BR')}`);
      }
    } else {
      // Se não encontrou saldo de referência, procura o último saldo válido em qualquer lugar
      let ultimoSaldoValido = null;
      let ultimoIndice = -1;
      
      for (let i = allTransactions.length - 1; i >= 0; i--) {
        if (i !== currentIndex && allTransactions[i].saldo !== null && allTransactions[i].saldo !== undefined) {
          const saldoRef = Number(allTransactions[i].saldo);
          if (saldoRef !== 0 && Math.abs(saldoRef) > 0.01) {
            ultimoSaldoValido = saldoRef;
            ultimoIndice = i;
            break;
          }
        }
      }
      
      if (ultimoSaldoValido !== null && ultimoIndice >= 0) {
        // Calcula o saldo até o último saldo válido
        let saldoAteUltimo = 0;
        for (let i = 0; i <= ultimoIndice; i++) {
          saldoAteUltimo += Number(allTransactions[i].valor);
        }
        // O saldo antes do último = saldo do último - valor do último
        saldoAcumulado = ultimoSaldoValido - Number(allTransactions[ultimoIndice].valor);
        this.logger.log(`📊 Usando último saldo válido: R$ ${ultimoSaldoValido.toLocaleString('pt-BR')} na transação ${allTransactions[ultimoIndice].id}`);
        // Soma os valores das transações após o último até antes da atual
        for (let j = ultimoIndice + 1; j < currentIndex; j++) {
          saldoAcumulado += Number(allTransactions[j].valor);
        }
      } else {
        // Se não encontrou nenhum saldo válido, calcula a partir do início
        this.logger.log(`⚠️ Nenhum saldo de referência encontrado, calculando a partir de zero`);
        saldoAcumulado = 0;
        // Calcula o saldo até a transação anterior
        for (let i = 0; i < currentIndex; i++) {
          saldoAcumulado += Number(allTransactions[i].valor);
        }
      }
    }

    // Recalcula saldos a partir da transação atual até o final
    const updates: Array<{ id: number; saldo: number }> = [];

    this.logger.log(`📊 Saldo acumulado antes da transação ${transactionId}: R$ ${saldoAcumulado.toLocaleString('pt-BR')}`);

    for (let i = currentIndex; i < allTransactions.length; i++) {
      saldoAcumulado += Number(allTransactions[i].valor);
      updates.push({
        id: allTransactions[i].id,
        saldo: saldoAcumulado,
      });
      
      // Log das primeiras 3 atualizações para debug
      if (i < currentIndex + 3) {
        this.logger.log(`  → Transação ${allTransactions[i].id}: Valor ${Number(allTransactions[i].valor).toLocaleString('pt-BR')}, Saldo: ${saldoAcumulado.toLocaleString('pt-BR')}`);
      }
    }

    // Atualiza todos os saldos em batch
    this.logger.log(`💾 Atualizando ${updates.length} saldos no banco...`);
    for (const update of updates) {
      await this.prisma.transaction.update({
        where: { id: update.id },
        data: { saldo: new Prisma.Decimal(update.saldo) },
      });
    }

    this.logger.log(`✅ Recalculados ${updates.length} saldos a partir da transação ${transactionId}`);
  }

  /**
   * Recalcula os saldos usando um saldo de referência específico
   */
  private async recalcularSaldosComReferencia(transactionId: number, saldoReferencia: number) {
    // Busca todas as transações ordenadas por id (ordem de inserção)
    const allTransactions = await this.prisma.transaction.findMany({
      orderBy: { id: 'asc' },
    });

    if (allTransactions.length === 0) {
      return;
    }

    // Encontra o índice da transação atual
    const currentIndex = allTransactions.findIndex((t) => t.id === transactionId);

    if (currentIndex === -1) {
      this.logger.warn(`Transação com id ${transactionId} não encontrada para recálculo`);
      return;
    }

    // O saldo de referência = saldo antes + valor da transação
    // Então: saldo antes = saldo de referência - valor da transação
    const saldoAntes = saldoReferencia - Number(allTransactions[currentIndex].valor);
    
    this.logger.log(`📊 Usando saldo de referência: R$ ${saldoReferencia.toLocaleString('pt-BR')}, Saldo antes: R$ ${saldoAntes.toLocaleString('pt-BR')}`);

    // Calcula o saldo acumulado até a transação anterior
    let saldoAcumulado = saldoAntes;
    
    // Verifica se o saldo calculado bate com o esperado
    let saldoCalculadoAteAqui = 0;
    for (let i = 0; i < currentIndex; i++) {
      saldoCalculadoAteAqui += Number(allTransactions[i].valor);
    }
    
    // Se a diferença for muito grande, ajusta
    const diferenca = saldoAntes - saldoCalculadoAteAqui;
    if (Math.abs(diferenca) > 0.01) {
      this.logger.log(`⚠️ Diferença detectada: R$ ${diferenca.toLocaleString('pt-BR')}. Ajustando...`);
      saldoAcumulado = saldoCalculadoAteAqui;
    }

    // Recalcula saldos a partir da transação atual até o final
    const updates: Array<{ id: number; saldo: number }> = [];

    for (let i = currentIndex; i < allTransactions.length; i++) {
      saldoAcumulado += Number(allTransactions[i].valor);
      updates.push({
        id: allTransactions[i].id,
        saldo: saldoAcumulado,
      });
    }

    // Atualiza todos os saldos em batch
    for (const update of updates) {
      await this.prisma.transaction.update({
        where: { id: update.id },
        data: { saldo: new Prisma.Decimal(update.saldo) },
      });
    }

    this.logger.log(`✅ Recalculados ${updates.length} saldos usando saldo de referência`);
  }

  async importFromExcel() {
    try {
      this.logger.log('Iniciando importação do Excel...');
      
      // Verifica se a tabela existe antes de limpar
      try {
        // Tenta executar migrations se necessário
        const { execSync } = require('child_process');
        try {
          execSync('npx prisma migrate deploy', { stdio: 'pipe' });
          this.logger.log('✅ Migrations verificadas');
        } catch (migrationError) {
          this.logger.warn('⚠️ Aviso ao executar migrations:', migrationError);
        }
        
        // Verifica se consegue acessar a tabela
        await this.prisma.$queryRaw`SELECT 1 FROM Transaction LIMIT 1`;
        
        // Limpa o banco antes de importar
        this.logger.log('Limpando banco de dados...');
        const deleted = await this.prisma.transaction.deleteMany({});
        this.logger.log(`Removidas ${deleted.count} transações antigas`);
      } catch (error: any) {
        // Se a tabela não existe, cria ela primeiro
        if (error.message?.includes('does not exist') || error.code === 'P2021') {
          this.logger.warn('⚠️ Tabela não existe, tentando criar...');
          const { execSync } = require('child_process');
          execSync('npx prisma migrate deploy', { stdio: 'inherit' });
          this.logger.log('✅ Tabela criada, continuando...');
        } else {
          throw error; // Re-lança outros erros
        }
      }
      
      const transactions = await this.excelService.readTransactions();
      
      if (!transactions || transactions.length === 0) {
        this.logger.warn('⚠️ Nenhuma transação encontrada no Excel');
        return { imported: 0, message: 'Nenhuma transação encontrada no Excel' };
      }
      
      let imported = 0;
      const batchSize = 100;

      for (let i = 0; i < transactions.length; i += batchSize) {
        const batch = transactions.slice(i, i + batchSize);
        
        try {
          await this.prisma.$transaction(
            batch.map((tx) =>
              this.prisma.transaction.upsert({
                where: { codigo: tx.codigo },
                update: {
                  descricao: tx.descricao,
                  centroCusto: tx.centroCusto,
                  ndoc: tx.ndoc,
                  valor: tx.valor,
                  status: tx.status,
                  data: tx.data,
                  saldo: tx.saldo,
                },
                create: {
                  descricao: tx.descricao,
                  codigo: tx.codigo,
                  centroCusto: tx.centroCusto,
                  ndoc: tx.ndoc,
                  valor: tx.valor,
                  status: tx.status,
                  data: tx.data,
                  saldo: tx.saldo,
                },
              }),
            ),
          );
          
          imported += batch.length;
          this.logger.log(`Importadas ${imported}/${transactions.length} transações...`);
        } catch (batchError) {
          this.logger.error(`Erro ao importar lote ${i / batchSize + 1}:`, batchError);
          throw batchError;
        }
      }

      this.logger.log(`✅ Importação concluída: ${imported} transações sincronizadas`);
      return { imported };
    } catch (error) {
      this.logger.error('❌ Erro ao importar do Excel:', error);
      throw error;
    }
  }

  private dtoToEntity(dto: CreateTransactionDto): TransactionEntity {
    return {
      descricao: dto.descricao,
      codigo: dto.codigo,
      centroCusto: dto.centroCusto,
      ndoc: dto.ndoc,
      valor: dto.valor,
      status: dto.status.toLowerCase() as 'pago' | 'pendente',
      data: new Date(dto.data),
      saldo: dto.saldo,
    };
  }

  private entityToDto(entity: any) {
    return {
      id: entity.id,
      descricao: entity.descricao,
      codigo: entity.codigo,
      centroCusto: entity.centroCusto,
      ndoc: entity.ndoc,
      valor: Number(entity.valor),
      status: entity.status?.toLowerCase() || 'pendente',
      data: entity.data,
      saldo: entity.saldo ? Number(entity.saldo) : null,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    };
  }
}

