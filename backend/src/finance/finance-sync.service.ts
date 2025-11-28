import { Injectable, Logger } from '@nestjs/common';
import * as path from 'node:path';
import * as fs from 'fs';
import * as ExcelJS from 'exceljs';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../common/prisma.service';

@Injectable()
export class FinanceSyncService {
  private readonly logger = new Logger(FinanceSyncService.name);
  private readonly excelPath: string;

  constructor(
    private readonly config: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    this.excelPath =
      this.config.get<string>('PATH_EXCEL') ||
      path.join(process.cwd(), 'financeiro.xlsx');
  }

  async syncFromExcel(): Promise<{ imported: number }> {
    this.logger.log('🔄 Iniciando sincronização Excel → Banco...');

    // Passo 1: Converter Excel para JSON (em memória)
    const transactions = await this.convertExcelToJson();

    // Passo 2: Importar para banco
    const imported = await this.importJsonToDb(transactions);

    this.logger.log(`✅ Sincronização concluída: ${imported} transações importadas`);
    return { imported };
  }

  private async convertExcelToJson() {
    this.logger.log('📊 Convertendo Excel para JSON...');

    if (!fs.existsSync(this.excelPath)) {
      throw new Error(`Arquivo Excel não encontrado: ${this.excelPath}`);
    }

    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(this.excelPath);

    const sheet = workbook.getWorksheet('Dados') || workbook.worksheets[0];
    this.logger.log(`Usando planilha: ${sheet.name}`);

    // Detecta cabeçalho
    let headerRow = 1;
    const columnMap: { [key: string]: number } = {};

    for (let rowIdx = 1; rowIdx <= Math.min(10, sheet.rowCount); rowIdx++) {
      const row = sheet.getRow(rowIdx);
      let foundHeaders = 0;

      for (let colIdx = 1; colIdx <= 30; colIdx++) {
        try {
          const cell = row.getCell(colIdx);
          if (!cell) continue;

          const val = cell.value;
          if (val === null || val === undefined) continue;

          let cellText = '';
          if (typeof val === 'string') {
            cellText = val.trim().toLowerCase();
          } else if (typeof val === 'number') {
            cellText = val.toString().toLowerCase();
          } else {
            continue;
          }

          if (cellText.includes('descrição') || cellText.includes('descricao')) {
            columnMap.descricao = colIdx;
            foundHeaders++;
          }
          if (cellText.includes('código') || cellText.includes('codigo')) {
            columnMap.codigo = colIdx;
            foundHeaders++;
          }
          if (cellText.includes('centro de custo') || cellText.includes('centro de cu')) {
            columnMap.centroCusto = colIdx;
            foundHeaders++;
          }
          if (cellText.includes('n.doc') || cellText.includes('ndoc')) {
            columnMap.ndoc = colIdx;
          }
          if (cellText === 'valor') {
            columnMap.valor = colIdx;
            foundHeaders++;
          }
          if (cellText === 'pago' || cellText === 'pa' || cellText.includes('status')) {
            columnMap.pago = colIdx;
            foundHeaders++;
          }
          if (cellText === 'data') {
            columnMap.data = colIdx;
            foundHeaders++;
          }
          if (cellText === 'saldo') {
            columnMap.saldo = colIdx;
          }
        } catch {
          continue;
        }
      }

      if (foundHeaders >= 2) {
        headerRow = rowIdx;
        this.logger.log(`Cabeçalho encontrado na linha ${headerRow}`);
        this.logger.log(`📋 Mapeamento de colunas: ${JSON.stringify(columnMap)}`);
        break;
      }
    }

    if (!columnMap.descricao || !columnMap.codigo) {
      throw new Error('Não foi possível encontrar os cabeçalhos necessários');
    }
    
    // Log de debug: mostra valores da primeira linha de dados
    if (headerRow + 1 <= sheet.rowCount) {
      const firstDataRow = sheet.getRow(headerRow + 1);
      this.logger.log('🔍 Debug - Primeira linha de dados:');
      this.logger.log(`  Col ${columnMap.descricao} (Descrição): "${firstDataRow.getCell(columnMap.descricao)?.value || 'VAZIO'}"`);
      this.logger.log(`  Col ${columnMap.codigo} (Código): "${firstDataRow.getCell(columnMap.codigo)?.value || 'VAZIO'}"`);
      this.logger.log(`  Col ${columnMap.valor} (Valor): "${firstDataRow.getCell(columnMap.valor)?.value || 'VAZIO'}"`);
      this.logger.log(`  Col ${columnMap.data} (Data): "${firstDataRow.getCell(columnMap.data)?.value || 'VAZIO'}"`);
    }

    const transactions: any[] = [];
    let processed = 0;
    let skipped = 0;

    // Funções auxiliares
    const parseValue = (valueStr: string | number): number => {
      if (typeof valueStr === 'number') return valueStr;
      if (!valueStr || valueStr.toString().trim() === '') return 0;
      let cleaned = valueStr.toString().replace(/[R$\s]/g, '');
      if (cleaned.includes(',')) {
        cleaned = cleaned.replace(/\./g, '').replace(',', '.');
      } else if (cleaned.includes('.')) {
        const parts = cleaned.split('.');
        if (parts.length > 2) cleaned = cleaned.replace(/\./g, '');
      }
      const num = Number(cleaned);
      return isNaN(num) ? 0 : num;
    };

    const parseDate = (dateStr: string | Date): Date => {
      if (dateStr instanceof Date) {
        // Verifica se a data é válida
        if (!isNaN(dateStr.getTime())) {
          return dateStr;
        }
      }
      
      if (!dateStr || dateStr.toString().trim() === '') {
        // Se não tem data, usa a data de hoje
        return new Date();
      }
      
      const str = dateStr.toString().trim();
      
      // Tenta parsear DD/MM/YY ou DD/MM/YYYY
      const parts = str.split(/[\/\-\.]/);
      if (parts.length === 3) {
        const day = parseInt(parts[0], 10);
        const month = parseInt(parts[1], 10) - 1; // Mês é 0-indexed
        let year = parseInt(parts[2], 10);
        
        // Se ano tem 2 dígitos, assume 2000+
        if (year < 100) {
          year += 2000;
        }
        
        // Valida os valores
        if (day >= 1 && day <= 31 && month >= 0 && month <= 11 && year >= 2000 && year <= 2100) {
          const date = new Date(year, month, day);
          if (!isNaN(date.getTime())) {
            return date;
          }
        }
      }
      
      // Tenta parsear como ISO ou Date padrão
      const date = new Date(str);
      if (!isNaN(date.getTime())) {
        return date;
      }
      
      // Se tudo falhar, retorna data de hoje
      return new Date();
    };

    // Processa linhas
    for (let rowIdx = headerRow + 1; rowIdx <= sheet.rowCount; rowIdx++) {
      const row = sheet.getRow(rowIdx);
      processed++;

      const getCellValue = (col: number): string => {
        try {
          const cell = row.getCell(col);
          if (!cell) return '';
          
          // Tenta value primeiro
          let val = cell.value;
          
          // Se value é null/undefined, tenta text (mas com cuidado)
          if (val === null || val === undefined) {
            try {
              // Tenta acessar text apenas se value for null
              const text = cell.text;
              if (text && typeof text === 'string' && text.trim()) {
                return text.trim();
              }
            } catch {
              // Ignora erro ao acessar text
            }
            return '';
          }
          
          if (val instanceof Date) {
            const day = String(val.getDate()).padStart(2, '0');
            const month = String(val.getMonth() + 1).padStart(2, '0');
            const year = val.getFullYear();
            return `${day}/${month}/${year}`;
          }
          
          if (typeof val === 'number') {
            // Para números, tenta text formatado primeiro
            try {
              const text = cell.text;
              if (text && typeof text === 'string' && text.trim()) {
                return text.trim();
              }
            } catch {
              // Se falhar, usa o número
            }
            return val.toString();
          }
          
          if (typeof val === 'string') return val.trim();
          
          // Se for objeto, tenta extrair
          if (typeof val === 'object') {
            const obj = val as any;
            if (obj.result !== null && obj.result !== undefined) {
              return String(obj.result);
            }
            if (obj.value !== null && obj.value !== undefined) {
              return String(obj.value);
            }
            if (obj.text && typeof obj.text === 'string') {
              return obj.text.trim();
            }
          }
          
          return '';
        } catch (error) {
          // Log apenas para as primeiras linhas para debug
          if (rowIdx <= headerRow + 5) {
            this.logger.warn(`Erro ao ler célula col ${col}, linha ${rowIdx}: ${error.message}`);
          }
          return '';
        }
      };

      const getCellNumber = (col: number): number | null => {
        try {
          const cell = row.getCell(col);
          if (!cell) return null;
          
          const val = cell.value;
          
          // Se é número direto, retorna
          if (typeof val === 'number') {
            return val;
          }
          
          // Se é objeto (fórmula), tenta extrair result
          if (typeof val === 'object' && val !== null) {
            const obj = val as any;
            if (typeof obj.result === 'number') return obj.result;
            if (typeof obj.value === 'number') return obj.value;
            // Se result é string, parseia
            if (typeof obj.result === 'string') {
              const parsed = parseValue(obj.result);
              return parsed !== 0 ? parsed : null;
            }
            if (typeof obj.value === 'string') {
              const parsed = parseValue(obj.value);
              return parsed !== 0 ? parsed : null;
            }
          }
          
          // Se é string, parseia
          if (typeof val === 'string') {
            const parsed = parseValue(val);
            return parsed !== 0 ? parsed : null;
          }
          
          // Se não conseguiu, tenta text formatado (pode ter formato brasileiro)
          try {
            const text = cell.text;
            if (text && text.trim() !== '' && text !== '-') {
              const parsed = parseValue(text);
              return parsed !== 0 ? parsed : null;
            }
          } catch {
            // Ignora
          }
          
          return null;
        } catch {
          return null;
        }
      };

      const descricao = getCellValue(columnMap.descricao).trim();
      const codigo = getCellValue(columnMap.codigo).trim();

      // Aceita linha se tiver descrição OU código OU valor válido
      let temValor = false;
      let valorTemp = 0;
      if (columnMap.valor) {
        const valorNum = getCellNumber(columnMap.valor);
        if (valorNum !== null && valorNum !== 0) {
          temValor = true;
          valorTemp = valorNum;
        } else {
          const valorStr = getCellValue(columnMap.valor);
          if (valorStr && valorStr.trim() !== '' && valorStr !== '0' && valorStr !== '-') {
            const parsed = parseValue(valorStr);
            if (parsed !== 0) {
              temValor = true;
              valorTemp = parsed;
            }
          }
        }
      }
      
      // Só processa se tiver pelo menos descrição OU código OU valor válido
      if (!codigo && !descricao && !temValor) {
        skipped++;
        continue;
      }
      
      // Se não tem descrição nem código, pula (não cria transação genérica)
      if (!descricao && !codigo) {
        skipped++;
        continue;
      }

      const centroCusto = columnMap.centroCusto ? getCellValue(columnMap.centroCusto).trim() : '';
      const ndoc = columnMap.ndoc ? getCellValue(columnMap.ndoc).trim() || undefined : undefined;

      // Lê o valor - SEMPRE usa text formatado primeiro (mais confiável, especialmente para fórmulas)
      let valor: number = 0;
      if (columnMap.valor) {
        try {
          const cell = row.getCell(columnMap.valor);
          if (cell) {
            // SEMPRE tenta text formatado PRIMEIRO (valor exibido no Excel)
            let valorText: number | null = null;
            try {
              const text = cell.text;
              if (text && text.trim() !== '' && text !== '-' && text !== '0') {
                valorText = parseValue(text);
                if (valorText !== 0) {
                  valor = valorText;
                }
              }
            } catch (error) {
              this.logger.warn(`Erro ao ler text da célula valor linha ${rowIdx}: ${error.message}`);
            }
            
            // Se não conseguiu pelo text OU se o text parece errado, tenta value como fallback
            let valorValue: number | null = null;
            if (valor === 0 || (valorText !== null && valorText > 0 && valor < 100)) {
              const val = cell.value;
              if (typeof val === 'number') {
                valorValue = val;
              } else if (typeof val === 'string') {
                valorValue = parseValue(val);
              } else if (typeof val === 'object' && val !== null) {
                const obj = val as any;
                if (typeof obj.result === 'number') {
                  valorValue = obj.result;
                } else if (typeof obj.value === 'number') {
                  valorValue = obj.value;
                } else if (typeof obj.result === 'string') {
                  valorValue = parseValue(obj.result);
                } else if (typeof obj.value === 'string') {
                  valorValue = parseValue(obj.value);
                }
              }
              
              // Se tem valor do value e não tem do text, usa o value
              if (valorValue !== null && valorValue !== 0 && valor === 0) {
                valor = valorValue;
              }
            }
            
            // Se ambos existem e são diferentes, SEMPRE prefere o text (valor exibido)
            if (valorText !== null && valorText !== 0 && valorValue !== null && valorValue !== 0) {
              if (Math.abs(valorText - valorValue) > 100) {
                this.logger.warn(`⚠️ Linha ${rowIdx}: Discrepância detectada! Text formatado: ${valorText}, Value numérico: ${valorValue}. Usando text formatado (valor exibido).`);
                valor = valorText; // SEMPRE usa o text quando há discrepância
              }
            }
          }
        } catch (error) {
          this.logger.warn(`Erro ao ler valor da linha ${rowIdx}: ${error.message}`);
        }
      }
      
      // Debug específico para transações com "Rafael" ou "Direitos Autorais"
      if (descricao.toLowerCase().includes('rafael') || descricao.toLowerCase().includes('direitos autorais')) {
        const valorCell = columnMap.valor ? row.getCell(columnMap.valor) : null;
        this.logger.log(`🔍 [DEBUG RAFAEL] Linha ${rowIdx}: descricao="${descricao}"`);
        this.logger.log(`🔍 [DEBUG RAFAEL] cell.text="${valorCell?.text || 'N/A'}", cell.value=${JSON.stringify(valorCell?.value || 'N/A')}, valor final=${valor}`);
        if (valorCell) {
          this.logger.log(`🔍 [DEBUG RAFAEL] cell.formula=${valorCell.formula || 'N/A'}`);
        }
      }

      let saldo: number | undefined;
      if (columnMap.saldo) {
        try {
          const cell = row.getCell(columnMap.saldo);
          if (cell) {
            const val = cell.value;
            let saldoExcel: number | undefined;
            
            // Tenta extrair o valor
            if (typeof val === 'number') {
              saldoExcel = val;
            } else if (typeof val === 'string') {
              const parsed = parseValue(val);
              saldoExcel = isNaN(parsed) ? undefined : parsed;
            } else if (typeof val === 'object' && val !== null) {
              const obj = val as any;
              if (typeof obj.result === 'number') {
                saldoExcel = obj.result;
              } else if (typeof obj.value === 'number') {
                saldoExcel = obj.value;
              } else if (typeof obj.result === 'string') {
                const parsed = parseValue(obj.result);
                saldoExcel = isNaN(parsed) ? undefined : parsed;
              } else if (typeof obj.value === 'string') {
                const parsed = parseValue(obj.value);
                saldoExcel = isNaN(parsed) ? undefined : parsed;
              }
            }
            
            // Tenta text formatado
            if (saldoExcel === undefined || saldoExcel === null) {
              try {
                const text = cell.text;
                if (text && text.trim() !== '' && text !== '-') {
                  const parsed = parseValue(text);
                  if (!isNaN(parsed) && parsed !== 0) {
                    saldoExcel = parsed;
                  }
                }
              } catch {
                // Ignora
              }
            }
            
            // Se o valor é muito pequeno (< 1000), tenta text formatado
            if (saldoExcel !== undefined && saldoExcel !== null) {
              if (saldoExcel < 1000 && saldoExcel > 0) {
                try {
                  const text = cell.text;
                  if (text && text.trim() !== '' && text !== '-') {
                    const parsed = parseValue(text);
                    if (parsed > saldoExcel && parsed > 1000) {
                      saldo = parsed;
                    } else {
                      saldo = saldoExcel;
                    }
                  } else {
                    saldo = saldoExcel;
                  }
                } catch {
                  saldo = saldoExcel;
                }
              } else {
                saldo = saldoExcel;
              }
            }
          }
        } catch (error) {
          // Ignora erro, será calculado depois
        }
      }

      const statusStr = columnMap.pago ? getCellValue(columnMap.pago).toLowerCase() : '';
      const status: 'pago' | 'pendente' =
        statusStr.includes('pago') || statusStr === 'sim' || statusStr === '*' || statusStr === 'pa'
          ? 'pago'
          : 'pendente';

      let data: Date;
      const dataDate = columnMap.data
        ? (() => {
            try {
              const cell = row.getCell(columnMap.data);
              if (!cell) return null;
              const val = cell.value;
              if (val instanceof Date) return val;
              if (typeof val === 'object' && (val as any).value instanceof Date) {
                return (val as any).value;
              }
              return null;
            } catch {
              return null;
            }
          })()
        : null;

      const dataStr = columnMap.data ? getCellValue(columnMap.data) : '';
      data = dataDate ? parseDate(dataDate) : parseDate(dataStr);

      // Gera código único baseado na linha para garantir unicidade
      const finalCodigo = codigo ? `LINHA-${rowIdx}-${codigo}` : `LINHA-${rowIdx}-SEM`;
      
      // Só adiciona se tiver descrição válida (não vazia)
      if (!descricao || descricao.trim() === '') {
        skipped++;
        continue;
      }

      transactions.push({
        descricao: descricao,
        codigo: finalCodigo,
        centroCusto: centroCusto || (codigo ? codigo : 'Outros'),
        ndoc,
        valor,
        status,
        data,
        saldo,
      });
    }

    this.logger.log(`Processadas ${processed} linhas, ${transactions.length} transações válidas, ${skipped} ignoradas`);
    
    // Calcula saldo acumulado na ordem original do Excel
    const validSaldos = transactions.filter(t => t.saldo !== undefined && t.saldo !== null && t.saldo > 0);
    this.logger.log(`📊 Total de saldos válidos do Excel: ${validSaldos.length} de ${transactions.length}`);
    
    if (validSaldos.length > transactions.length * 0.5) {
      this.logger.log(`✅ Usando saldos do Excel diretamente (${validSaldos.length} saldos válidos)`);
      let saldoAcumulado = 0;
      transactions.forEach((transaction, index) => {
        if (transaction.saldo !== undefined && transaction.saldo !== null && transaction.saldo > 0) {
          saldoAcumulado = transaction.saldo;
        } else {
          saldoAcumulado += transaction.valor;
          transaction.saldo = saldoAcumulado;
        }
      });
    } else {
      this.logger.log(`⚠️ Poucos saldos válidos do Excel (${validSaldos.length}), calculando a partir de referência`);
      let saldoAcumulado = 0;
      if (validSaldos.length > 0) {
        const referenceTransaction = validSaldos[0];
        const refIndex = transactions.indexOf(referenceTransaction);
        for (let i = 0; i < refIndex; i++) {
          saldoAcumulado += transactions[i].valor;
        }
        saldoAcumulado = referenceTransaction.saldo - referenceTransaction.valor;
        this.logger.log(`📊 Usando saldo de referência: R$ ${referenceTransaction.saldo.toLocaleString('pt-BR')} na transação "${referenceTransaction.descricao}"`);
      }
      transactions.forEach((transaction) => {
        saldoAcumulado += transaction.valor;
        transaction.saldo = saldoAcumulado;
      });
    }
    
    // Log de amostra das primeiras 5 transações para debug
    if (transactions.length > 0) {
      this.logger.log('Amostra das primeiras 5 transações:');
      transactions.slice(0, 5).forEach((tx, idx) => {
        this.logger.log(`  ${idx + 1}. ${tx.descricao} - Valor: ${tx.valor} - Saldo: ${tx.saldo} - Data: ${tx.data.toLocaleDateString('pt-BR')}`);
      });
    }
    
    return transactions;
  }

  private async importJsonToDb(transactions: any[]): Promise<number> {
    this.logger.log('📥 Importando para banco de dados...');

    // Limpa o banco
    const deleted = await this.prisma.transaction.deleteMany({});
    this.logger.log(`Removidas ${deleted.count} transações antigas`);

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
      } catch (err) {
        this.logger.error(`Erro no lote ${i / batchSize + 1}:`, err.message);
        throw err;
      }
    }

    return imported;
  }
}

