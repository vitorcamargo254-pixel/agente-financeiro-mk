import { Injectable, Logger } from '@nestjs/common';
import * as path from 'node:path';
import * as fs from 'node:fs';
import * as ExcelJS from 'exceljs';
import { ConfigService } from '@nestjs/config';
import { TransactionEntity } from '../entities/transaction.entity';

const HEADER_MAP = {
  descricao: 'Descrição',
  codigo: 'Código',
  centroCusto: 'Centro de Custo',
  ndoc: 'N.DOC',
  valor: 'Valor',
  status: 'Pago',
  data: 'Data',
  saldo: 'Saldo',
} as const;

@Injectable()
export class ExcelService {
  private readonly logger = new Logger(ExcelService.name);
  private readonly excelPath: string;

  constructor(private readonly config: ConfigService) {
    // Tenta usar PATH_EXCEL do .env, senão usa arquivo na pasta backend/
    this.excelPath =
      this.config.get<string>('PATH_EXCEL') ||
      path.join(process.cwd(), 'Financeiro_ETC-.xlsm');
  }

  async loadWorkbook(): Promise<ExcelJS.Workbook> {
    this.logger.log(`Tentando carregar Excel de: ${this.excelPath}`);
    
    if (!fs.existsSync(this.excelPath)) {
      const errorMsg = `Arquivo Excel não encontrado em ${this.excelPath}. Verifique o caminho no arquivo .env (PATH_EXCEL)`;
      this.logger.error(errorMsg);
      throw new Error(errorMsg);
    }

    try {
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.readFile(this.excelPath);
      this.logger.log(`✅ Excel carregado com sucesso. Planilhas: ${workbook.worksheets.length}`);
      return workbook;
    } catch (error) {
      this.logger.error(`Erro ao ler arquivo Excel: ${error.message}`);
      throw new Error(`Erro ao ler arquivo Excel: ${error.message}`);
    }
  }

  private toTransaction(row: ExcelJS.Row): TransactionEntity | null {
    try {
      const safe = (key: keyof typeof HEADER_MAP) => {
        try {
          const cell = row.getCell(HEADER_MAP[key]);
          return cell?.text?.trim()?.replace(/\r?\n/g, ' ').trim() ?? '';
        } catch (error) {
          // Se falhar ao acessar por nome, tenta por índice
          return '';
        }
      };

      if (!safe('codigo') && !safe('descricao')) {
        return null;
      }

    const valor = Number(
      safe('valor')
        .replace(/[R$\s.]/g, '')
        .replace(',', '.'),
    );

    const saldoRaw = safe('saldo');
    const saldo = saldoRaw
      ? Number(saldoRaw.replace(/[R$\s.]/g, '').replace(',', '.'))
      : undefined;

      return {
        descricao: safe('descricao'),
        codigo: safe('codigo'),
        centroCusto: safe('centroCusto'),
        ndoc: safe('ndoc') || undefined,
        valor: Number.isNaN(valor) ? 0 : valor,
        status: safe('status').toLowerCase() === 'pago' ? 'pago' : 'pendente',
        data: safe('data') ? new Date(safe('data')) : new Date(),
        saldo,
      };
    } catch (error) {
      this.logger.warn(`Erro ao processar linha ${row.number}: ${error.message}`);
      return null;
    }
  }

  async readTransactions(): Promise<TransactionEntity[]> {
    try {
      const workbook = await this.loadWorkbook();
      
      // Procura pela planilha "Dados" primeiro, senão usa a primeira
      let sheet = workbook.getWorksheet('Dados');
      if (!sheet) {
        sheet = workbook.worksheets[0];
        this.logger.log(`Usando planilha: ${sheet?.name || 'primeira disponível'}`);
      } else {
        this.logger.log('Usando planilha: Dados');
      }
      
      if (!sheet) {
        this.logger.warn('Nenhuma planilha encontrada no Excel');
        return [];
      }

      // Detecta dinamicamente a linha de cabeçalho
      let headerRow = 1;
      const columnMap: { [key: string]: number } = {};
      
      // Procura pelos cabeçalhos nas primeiras 10 linhas
      for (let rowIdx = 1; rowIdx <= Math.min(10, sheet.rowCount); rowIdx++) {
        const row = sheet.getRow(rowIdx);
        let foundHeaders = 0;
        
        // Procura nas primeiras 30 colunas
        for (let colIdx = 1; colIdx <= 30; colIdx++) {
          try {
            const cell = row.getCell(colIdx);
            if (!cell) continue;
            
            // Usa value ao invés de text para evitar erro de null
            let cellText = '';
            const val = cell.value;
            if (val !== null && val !== undefined) {
              if (typeof val === 'string') {
                cellText = val.trim().toLowerCase();
              } else if (typeof val === 'number') {
                cellText = val.toString().toLowerCase();
              } else {
                continue;
              }
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
            // Ignora células problemáticas durante detecção de cabeçalho
            continue;
          }
        }
        
        if (foundHeaders >= 2) {
          headerRow = rowIdx;
          this.logger.log(`Cabeçalho encontrado na linha ${headerRow}, colunas: ${JSON.stringify(columnMap)}`);
          break;
        }
      }

      if (!columnMap.descricao || !columnMap.codigo) {
        throw new Error('Não foi possível encontrar os cabeçalhos "Descrição" e "Código" no Excel');
      }

      const transactions: TransactionEntity[] = [];
      let processed = 0;
      let skipped = 0;

      // Função auxiliar para parsear valores brasileiros
      const parseValue = (valueStr: string): number => {
        if (!valueStr || valueStr.trim() === '') return 0;
        
        // Remove R$, espaços e outros caracteres
        let cleaned = valueStr.replace(/[R$\s]/g, '');
        
        // Se tem vírgula, assume formato brasileiro (ponto = milhares, vírgula = decimal)
        if (cleaned.includes(',')) {
          // Remove pontos (milhares) e substitui vírgula por ponto (decimal)
          cleaned = cleaned.replace(/\./g, '').replace(',', '.');
        } else if (cleaned.includes('.')) {
          // Se só tem ponto, pode ser formato internacional ou brasileiro sem vírgula
          // Se tem mais de um ponto, assume que é formato brasileiro (milhares)
          const parts = cleaned.split('.');
          if (parts.length > 2) {
            // Formato brasileiro: remove todos os pontos
            cleaned = cleaned.replace(/\./g, '');
          }
          // Senão, mantém o ponto como decimal
        }
        
        const num = Number(cleaned);
        return isNaN(num) ? 0 : num;
      };

      // Função auxiliar para parsear datas
      const parseDate = (dateStr: string): Date => {
        if (!dateStr || dateStr.trim() === '') return new Date();
        
        // Tenta parsear DD/MM/YY ou DD/MM/YYYY
        const parts = dateStr.trim().split(/[\/\-\.]/);
        if (parts.length === 3) {
          const day = parseInt(parts[0], 10);
          const month = parseInt(parts[1], 10) - 1; // Mês é 0-indexed
          let year = parseInt(parts[2], 10);
          
          // Se ano tem 2 dígitos, assume 2000+
          if (year < 100) {
            year += 2000;
          }
          
          const date = new Date(year, month, day);
          if (!isNaN(date.getTime())) {
            return date;
          }
        }
        
        // Tenta parsear como ISO ou Date padrão
        const date = new Date(dateStr);
        return isNaN(date.getTime()) ? new Date() : date;
      };

      // Processa as linhas após o cabeçalho
      for (let rowIdx = headerRow + 1; rowIdx <= sheet.rowCount; rowIdx++) {
        const row = sheet.getRow(rowIdx);
        processed++;
        
        // Função auxiliar para extrair valor da célula (definida dentro do loop para ter acesso a row)
        const getCellValue = (col: number): string => {
          try {
            if (!row || !row.getCell) return '';
            
            const cell = row.getCell(col);
            if (!cell) return '';
            
            // NUNCA acessa cell.text diretamente - pode causar erro se value é null
            // Sempre usa cell.value primeiro
            
            const val = cell.value;
            
            // Se value é null/undefined, retorna vazio imediatamente
            if (val === null || val === undefined) {
              return '';
            }
            
            // Se é Date, formata
            if (val instanceof Date) {
              const day = String(val.getDate()).padStart(2, '0');
              const month = String(val.getMonth() + 1).padStart(2, '0');
              const year = val.getFullYear();
              return `${day}/${month}/${year}`;
            }
            
            // Se é número, converte para string
            if (typeof val === 'number') {
              return val.toString();
            }
            
            // Se é string, retorna direto
            if (typeof val === 'string') {
              return val.trim();
            }
            
            // Se for objeto, tenta extrair propriedades
            if (typeof val === 'object') {
              const obj = val as any;
              
              // Tenta result primeiro
              if (obj.result !== null && obj.result !== undefined) {
                if (obj.result instanceof Date) {
                  const d = obj.result;
                  const day = String(d.getDate()).padStart(2, '0');
                  const month = String(d.getMonth() + 1).padStart(2, '0');
                  const year = d.getFullYear();
                  return `${day}/${month}/${year}`;
                }
                return String(obj.result);
              }
              
              // Tenta value dentro do objeto
              if (obj.value !== null && obj.value !== undefined) {
                if (obj.value instanceof Date) {
                  const d = obj.value;
                  const day = String(d.getDate()).padStart(2, '0');
                  const month = String(d.getMonth() + 1).padStart(2, '0');
                  const year = d.getFullYear();
                  return `${day}/${month}/${year}`;
                }
                if (typeof obj.value === 'number') return obj.value.toString();
                if (typeof obj.value === 'string') return obj.value.trim();
                return String(obj.value);
              }
              
              // Tenta text dentro do objeto (mais seguro que cell.text)
              if (obj.text && typeof obj.text === 'string') {
                return obj.text.trim();
              }
            }
            
            return '';
          } catch (error) {
            // Silenciosamente retorna vazio para células problemáticas
            return '';
          }
        };
        
        // Função para extrair data diretamente
        const getCellDate = (col: number): Date | null => {
          try {
            const cell = row.getCell(col);
            if (!cell) return null;
            
            const val = cell.value;
            if (val instanceof Date) {
              return val;
            }
            if (typeof val === 'object') {
              const obj = val as any;
              if (obj.value instanceof Date) {
                return obj.value;
              }
            }
            return null;
          } catch {
            return null;
          }
        };
        
        // Função para extrair valor numérico diretamente (para valores)
        const getCellNumber = (col: number): number | null => {
          try {
            const cell = row.getCell(col);
            if (!cell) return null;
            
            const val = cell.value;
            if (typeof val === 'number') {
              return val;
            }
            if (typeof val === 'string') {
              const parsed = parseValue(val);
              return isNaN(parsed) ? null : parsed;
            }
            return null;
          } catch {
            return null;
          }
        };
        
        const descricao = getCellValue(columnMap.descricao).trim();
        const codigo = getCellValue(columnMap.codigo).trim();
        
        if (!codigo && !descricao) {
          skipped++;
          continue;
        }

        const centroCusto = columnMap.centroCusto ? getCellValue(columnMap.centroCusto).trim() : '';
        const ndoc = columnMap.ndoc ? getCellValue(columnMap.ndoc).trim() || undefined : undefined;
        
        // Tenta pegar valor numérico diretamente primeiro, senão parseia a string
        let valor: number;
        const valorNum = columnMap.valor ? getCellNumber(columnMap.valor) : null;
        if (valorNum !== null) {
          valor = valorNum;
        } else {
          const valorStr = columnMap.valor ? getCellValue(columnMap.valor) : '0';
          valor = parseValue(valorStr);
        }
        
        // Parsing do saldo - SEMPRE tenta pegar como string formatada primeiro
        // porque o Excel pode interpretar mal números no formato brasileiro
        let saldo: number | undefined;
        if (columnMap.saldo) {
          try {
            const cell = row.getCell(columnMap.saldo);
            if (cell) {
              // SEMPRE tenta pegar como string formatada primeiro (mais confiável)
              const saldoStr = getCellValue(columnMap.saldo);
              
              if (saldoStr && saldoStr.trim() !== '' && saldoStr !== '-') {
                const parsed = parseValue(saldoStr);
                if (!isNaN(parsed) && parsed !== 0) {
                  saldo = parsed;
                }
              }
              
              // Se não conseguiu pela string, tenta pelo valor direto
              if (saldo === undefined || saldo === null) {
                const val = cell.value;
                
                // Se é número direto
                if (typeof val === 'number') {
                  saldo = val;
                }
                // Se é string
                else if (typeof val === 'string') {
                  const parsed = parseValue(val);
                  saldo = isNaN(parsed) ? undefined : parsed;
                }
                // Se é objeto (fórmula)
                else if (typeof val === 'object' && val !== null) {
                  const obj = val as any;
                  if (typeof obj.result === 'number') {
                    saldo = obj.result;
                  } else if (typeof obj.value === 'number') {
                    saldo = obj.value;
                  } else if (typeof obj.result === 'string') {
                    const parsed = parseValue(obj.result);
                    saldo = isNaN(parsed) ? undefined : parsed;
                  } else if (typeof obj.value === 'string') {
                    const parsed = parseValue(obj.value);
                    saldo = isNaN(parsed) ? undefined : parsed;
                  }
                }
              }
              
              // Debug para as primeiras linhas
              if (transactions.length < 3) {
                this.logger.log(`[DEBUG SALDO] Linha ${rowIdx}: saldoStr="${saldoStr}", saldo final=${saldo}`);
              }
            }
          } catch (error) {
            this.logger.warn(`Erro ao ler saldo da linha ${rowIdx}: ${error.message}`);
          }
        }
        
        const statusStr = columnMap.pago ? getCellValue(columnMap.pago).toLowerCase() : '';
        
        // Parse data - tenta pegar Date diretamente primeiro
        let data: Date;
        const dataDate = columnMap.data ? getCellDate(columnMap.data) : null;
        if (dataDate) {
          data = dataDate;
        } else {
          const dataStr = columnMap.data ? getCellValue(columnMap.data) : '';
          data = parseDate(dataStr);
        }
        
        // Log de debug para as primeiras 5 transações (depois de declarar data)
        if (transactions.length < 5) {
          this.logger.log(`[DEBUG] Linha ${rowIdx}: descricao="${descricao}", valor=${valor}, saldo=${saldo}, data=${data.toLocaleDateString('pt-BR')}`);
        }
        
        // Parse status
        let status: 'pago' | 'pendente' = 'pendente';
        if (statusStr.includes('pago') || statusStr === 'sim' || statusStr === '*' || statusStr === 'pa') {
          status = 'pago';
        }

        // Gera código único se necessário
        const finalCodigo = codigo || `LINHA-${rowIdx}-SEM`;

        transactions.push({
          descricao,
          codigo: finalCodigo,
          centroCusto: centroCusto || 'Outros',
          ndoc,
          valor,
          status,
          data,
          saldo,
        });
      }

      this.logger.log(`Processadas ${processed} linhas, ${transactions.length} transações válidas, ${skipped} ignoradas`);
      return transactions;
    } catch (error) {
      this.logger.error(`Erro ao ler transações do Excel: ${error.message}`);
      throw error;
    }
  }

  async appendTransaction(data: TransactionEntity): Promise<void> {
    const workbook = await this.loadWorkbook();
    const sheet = workbook.worksheets[0];
    if (!sheet) throw new Error('Planilha principal não encontrada');

    const newRow = sheet.addRow({
      [HEADER_MAP.descricao]: data.descricao,
      [HEADER_MAP.codigo]: data.codigo,
      [HEADER_MAP.centroCusto]: data.centroCusto,
      [HEADER_MAP.ndoc]: data.ndoc ?? '',
      [HEADER_MAP.valor]: data.valor,
      [HEADER_MAP.status]: data.status === 'pago' ? 'Pago' : 'Pendente',
      [HEADER_MAP.data]: data.data.toLocaleDateString('pt-BR'),
      [HEADER_MAP.saldo]: data.saldo ?? '',
    });
    newRow.commit();
    await workbook.xlsx.writeFile(this.excelPath);
  }

  async updateTransaction(
    codigo: string,
    data: TransactionEntity,
  ): Promise<void> {
    const workbook = await this.loadWorkbook();
    const sheet = workbook.worksheets[0];
    if (!sheet) throw new Error('Planilha principal não encontrada');

    const targetRow = sheet
      .getRows(2, sheet.rowCount)
      ?.find((row) => row.getCell(HEADER_MAP.codigo).text?.trim() === codigo);

    if (!targetRow) {
      this.logger.warn(
        `Não encontrei a linha com código ${codigo} para atualizar no Excel.`,
      );
      return;
    }

    targetRow.getCell(HEADER_MAP.descricao).value = data.descricao;
    targetRow.getCell(HEADER_MAP.centroCusto).value = data.centroCusto;
    targetRow.getCell(HEADER_MAP.ndoc).value = data.ndoc ?? '';
    targetRow.getCell(HEADER_MAP.valor).value = data.valor;
    targetRow.getCell(HEADER_MAP.status).value =
      data.status === 'pago' ? 'Pago' : 'Pendente';
    targetRow.getCell(HEADER_MAP.data).value = data.data;
    targetRow.getCell(HEADER_MAP.saldo).value = data.saldo ?? '';

    await workbook.xlsx.writeFile(this.excelPath);
  }
}


