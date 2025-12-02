import 'dotenv/config';
import * as path from 'node:path';
import * as fs from 'fs';
import * as ExcelJS from 'exceljs';

// Usa PATH_EXCEL do .env ou arquivo na pasta backend/
const excelPath = process.env.PATH_EXCEL || path.join(process.cwd(), 'Financeiro_ETC-.xlsm');
const outputPath = path.join(process.cwd(), 'transactions.json');

interface Transaction {
  descricao: string;
  codigo: string;
  centroCusto: string;
  ndoc?: string;
  valor: number;
  status: 'pago' | 'pendente';
  data: string; // YYYY-MM-DD
  saldo?: number;
}

// Função para parsear valores brasileiros
function parseValue(valueStr: string | number): number {
  if (typeof valueStr === 'number') {
    return valueStr;
  }
  
  if (!valueStr || valueStr.toString().trim() === '') return 0;
  
  let cleaned = valueStr.toString().replace(/[R$\s]/g, '');
  
  if (cleaned.includes(',')) {
    cleaned = cleaned.replace(/\./g, '').replace(',', '.');
  } else if (cleaned.includes('.')) {
    const parts = cleaned.split('.');
    if (parts.length > 2) {
      cleaned = cleaned.replace(/\./g, '');
    }
  }
  
  const num = Number(cleaned);
  return isNaN(num) ? 0 : num;
}

// Função para parsear datas
function parseDate(dateStr: string | Date): string {
  if (dateStr instanceof Date) {
    return dateStr.toISOString().split('T')[0];
  }
  
  if (!dateStr || dateStr.toString().trim() === '') {
    return new Date().toISOString().split('T')[0];
  }
  
  const str = dateStr.toString().trim();
  const parts = str.split(/[\/\-\.]/);
  
  if (parts.length === 3) {
    const day = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1;
    let year = parseInt(parts[2], 10);
    
    if (year < 100) {
      year += 2000;
    }
    
    const date = new Date(year, month, day);
    if (!isNaN(date.getTime())) {
      return date.toISOString().split('T')[0];
    }
  }
  
  const date = new Date(str);
  return isNaN(date.getTime()) ? new Date().toISOString().split('T')[0] : date.toISOString().split('T')[0];
}

async function convertExcelToJson() {
  console.log('🔄 Convertendo Excel para JSON...');
  console.log(`📁 Arquivo: ${excelPath}`);
  
  if (!fs.existsSync(excelPath)) {
    console.error(`❌ Arquivo não encontrado: ${excelPath}`);
    process.exit(1);
  }
  
  const workbook = new ExcelJS.Workbook();
  // Tenta ler com cálculo de fórmulas
  await workbook.xlsx.readFile(excelPath, {
    // Força cálculo de fórmulas se possível
  });
  
  console.log(`\n📋 Planilhas disponíveis:`);
  workbook.worksheets.forEach((ws, idx) => {
    console.log(`  ${idx + 1}. ${ws.name} (${ws.rowCount} linhas)`);
  });
  
  const sheet = workbook.getWorksheet('Dados') || workbook.worksheets[0];
  console.log(`\n📊 Usando planilha: ${sheet.name}`);
  console.log(`📏 Total de linhas: ${sheet.rowCount}`);
  
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
        if (cellText.includes('centro de custo') || 
            cellText.includes('centro de cu') || 
            cellText.includes('categoria') ||
            cellText === 'centro' ||
            cellText.includes('custo')) {
          columnMap.centroCusto = colIdx;
          foundHeaders++;
          console.log(`  ✅ Coluna "Centro de Custo" encontrada na coluna ${colIdx}`);
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
          console.log(`  ✅ Coluna "Saldo" encontrada na coluna ${colIdx}`);
        }
      } catch {
        continue;
      }
    }
    
    if (foundHeaders >= 2) {
      headerRow = rowIdx;
      console.log(`✅ Cabeçalho encontrado na linha ${headerRow}`);
      console.log(`📋 Colunas mapeadas:`, columnMap);
      break;
    }
  }
  
  if (!columnMap.descricao || !columnMap.codigo) {
    console.error('❌ Não foi possível encontrar os cabeçalhos necessários');
    process.exit(1);
  }
  
  const transactions: Transaction[] = [];
  let processed = 0;
  let skipped = 0;
  
  // Processa linhas
  for (let rowIdx = headerRow + 1; rowIdx <= sheet.rowCount; rowIdx++) {
    const row = sheet.getRow(rowIdx);
    processed++;
    
    const getCellValue = (col: number, preferText: boolean = false): string => {
      try {
        if (!col) return '';
        const cell = row.getCell(col);
        if (!cell) return '';
        
        // Se preferText é true (para saldo), SEMPRE tenta text primeiro
        if (preferText) {
          try {
            const text = cell.text;
            if (text && typeof text === 'string' && text.trim()) {
              return text.trim();
            }
          } catch {
            // Continua para tentar value
          }
        }
        
        const val = cell.value;
        if (val === null || val === undefined) {
          // Tenta text como fallback
          try {
            const text = cell.text;
            if (text && typeof text === 'string' && text.trim()) {
              return text.trim();
            }
          } catch {
            // Ignora erro
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
          // Para números, tenta text formatado primeiro (importante para categorias que podem ser números)
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
          if (obj.result !== null && obj.result !== undefined) return String(obj.result).trim();
          if (obj.value !== null && obj.value !== undefined) return String(obj.value).trim();
          if (obj.text && typeof obj.text === 'string') return obj.text.trim();
        }
        
        return '';
      } catch {
        return '';
      }
    };
    
    const getCellNumber = (col: number): number | null => {
      try {
        const cell = row.getCell(col);
        if (!cell) return null;
        const val = cell.value;
        
        // Se é número direto, retorna
        if (typeof val === 'number') return val;
        
        // Se é objeto (fórmula), tenta extrair result
        if (typeof val === 'object' && val !== null) {
          const obj = val as any;
          if (typeof obj.result === 'number') return obj.result;
          if (typeof obj.value === 'number') return obj.value;
        }
        
        // Se é string, tenta parsear
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
    
    let centroCusto = '';
    if (columnMap.centroCusto) {
      centroCusto = getCellValue(columnMap.centroCusto).trim();
      
      // Log de debug para as primeiras 5 linhas
      if (rowIdx <= headerRow + 5) {
        console.log(`🔍 Linha ${rowIdx}: Centro de Custo lido = "${centroCusto}" (Coluna ${columnMap.centroCusto})`);
      }
    } else {
      // Se não encontrou a coluna, tenta usar o código como categoria
      if (codigo && codigo.trim()) {
        centroCusto = codigo.trim();
      }
    }
    
    const ndoc = columnMap.ndoc ? getCellValue(columnMap.ndoc).trim() || undefined : undefined;
    
    // Valor
    let valor: number;
    const valorNum = columnMap.valor ? getCellNumber(columnMap.valor) : null;
    if (valorNum !== null) {
      valor = valorNum;
    } else {
      const valorStr = columnMap.valor ? getCellValue(columnMap.valor) : '0';
      valor = parseValue(valorStr);
    }
    
    // Debug específico para transações com "Rafael" ou valores suspeitos
    if (descricao.toLowerCase().includes('rafael') || descricao.toLowerCase().includes('direitos autorais')) {
      const valorCell = columnMap.valor ? row.getCell(columnMap.valor) : null;
      console.log(`🔍 [DEBUG RAFAEL] Linha ${rowIdx}: descricao="${descricao}"`);
      console.log(`🔍 [DEBUG RAFAEL] valorNum=${valorNum}, valorStr="${columnMap.valor ? getCellValue(columnMap.valor) : 'N/A'}", valor final=${valor}`);
      if (valorCell) {
        console.log(`🔍 [DEBUG RAFAEL] cell.value=${JSON.stringify(valorCell.value)}, cell.text="${valorCell.text}"`);
      }
    }
    
    // Saldo - será calculado depois, baseado nas transações ordenadas por data
    // Por enquanto, apenas armazena o valor do Excel se disponível (para referência)
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
          
          // Se conseguiu ler do Excel, verifica se o valor parece correto
          // Se o valor é muito pequeno (< 1000), pode estar errado - tenta text formatado
          if (saldoExcel !== undefined && saldoExcel !== null) {
            // Se o valor é muito pequeno, tenta ler o text formatado (pode ter formato brasileiro)
            if (saldoExcel < 1000 && saldoExcel > 0) {
              try {
                const text = cell.text;
                if (text && text.trim() !== '' && text !== '-') {
                  const parsed = parseValue(text);
                  // Se o valor parseado é maior, usa ele
                  if (parsed > saldoExcel && parsed > 1000) {
                    saldo = parsed;
                    if (rowIdx <= headerRow + 5) {
                      console.log(`💰 Linha ${rowIdx}: Saldo numérico pequeno (${saldoExcel}), usando text formatado: ${parsed}`);
                    }
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
            
            // Debug para as primeiras 5 linhas
            if (rowIdx <= headerRow + 5) {
              console.log(`💰 Linha ${rowIdx}: Saldo lido do Excel = ${saldo}`);
            }
          }
        }
      } catch (error) {
        // Ignora erro, será calculado depois
      }
    }
    
    // Status
    const statusStr = columnMap.pago ? getCellValue(columnMap.pago).toLowerCase() : '';
    const status: 'pago' | 'pendente' = (statusStr.includes('pago') || statusStr === 'sim' || statusStr === '*' || statusStr === 'pa') ? 'pago' : 'pendente';
    
    // Data
    let dataStr = columnMap.data ? getCellValue(columnMap.data) : '';
    const dataDate = columnMap.data ? (() => {
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
    })() : null;
    
    const data = dataDate ? parseDate(dataDate) : parseDate(dataStr);
    
    // Gera código único sempre (mesmo se tiver código, adiciona linha para garantir unicidade)
    // Formato: LINHA-{linha}-{codigo} ou LINHA-{linha}-SEM se não tiver código
    const finalCodigo = codigo ? `LINHA-${rowIdx}-${codigo}` : `LINHA-${rowIdx}-SEM`;
    
    transactions.push({
      descricao: descricao || `Transação linha ${rowIdx}`,
      codigo: finalCodigo,
      centroCusto: centroCusto || (codigo ? codigo : 'Outros'), // Se não tem centro de custo, usa o código como fallback
      ndoc,
      valor,
      status,
      data,
      saldo,
    });
  }
  
  // Estratégia: Usa os saldos do Excel quando disponíveis, calcula apenas quando necessário
  // Mantém a ordem original do Excel
  const transactionsSorted = [...transactions];
  
  // Verifica quantos saldos válidos temos do Excel
  const validSaldos = transactionsSorted.filter(t => t.saldo !== undefined && t.saldo !== null && t.saldo > 0);
  console.log(`📊 Total de saldos válidos do Excel: ${validSaldos.length} de ${transactionsSorted.length}`);
  
  // Se temos muitos saldos válidos (> 50%), assume que o Excel está correto e usa diretamente
  if (validSaldos.length > transactionsSorted.length * 0.5) {
    console.log(`✅ Usando saldos do Excel diretamente (${validSaldos.length} saldos válidos)`);
    // Os saldos já estão nas transações, não precisa recalcular
    // Apenas garante que todos têm saldo
    let saldoAcumulado = 0;
    transactionsSorted.forEach((transaction, index) => {
      // Se tem saldo do Excel, usa ele e atualiza o acumulado
      if (transaction.saldo !== undefined && transaction.saldo !== null && transaction.saldo > 0) {
        saldoAcumulado = transaction.saldo;
      } else {
        // Se não tem, calcula baseado no anterior
        saldoAcumulado += transaction.valor;
        transaction.saldo = saldoAcumulado;
      }
      
      // Debug para as primeiras 10
      if (index < 10) {
        console.log(`💰 [${index + 1}] ${transaction.data} - ${transaction.descricao.substring(0, 40)}... | Valor: R$ ${transaction.valor.toLocaleString('pt-BR')} | Saldo: R$ ${transaction.saldo.toLocaleString('pt-BR')}`);
      }
    });
  } else {
    // Se temos poucos saldos válidos, usa o primeiro como referência e calcula o resto
    console.log(`⚠️ Poucos saldos válidos do Excel (${validSaldos.length}), calculando a partir de referência`);
    
    let saldoAcumulado = 0;
    if (validSaldos.length > 0) {
      const referenceTransaction = validSaldos[0];
      const refIndex = transactionsSorted.indexOf(referenceTransaction);
      
      // Calcula o saldo acumulado até a referência
      for (let i = 0; i < refIndex; i++) {
        saldoAcumulado += transactionsSorted[i].valor;
      }
      saldoAcumulado = referenceTransaction.saldo - referenceTransaction.valor;
      
      console.log(`📊 Usando saldo de referência: R$ ${referenceTransaction.saldo.toLocaleString('pt-BR')} na transação "${referenceTransaction.descricao}"`);
    }
    
    // Calcula saldo acumulado para todas as transações
    transactionsSorted.forEach((transaction, index) => {
      saldoAcumulado += transaction.valor;
      transaction.saldo = saldoAcumulado;
      
      if (index < 10) {
        console.log(`💰 [${index + 1}] ${transaction.data} - ${transaction.descricao.substring(0, 40)}... | Valor: R$ ${transaction.valor.toLocaleString('pt-BR')} | Saldo: R$ ${saldoAcumulado.toLocaleString('pt-BR')}`);
      }
    });
  }
  
  // Atualiza o array original com os saldos (mantém ordem original)
  const saldoMap = new Map<string, number>();
  transactionsSorted.forEach(t => {
    if (t.saldo !== undefined && t.saldo !== null) {
      saldoMap.set(t.codigo, t.saldo);
    }
  });
  
  transactions.forEach(transaction => {
    const saldoCalculado = saldoMap.get(transaction.codigo);
    if (saldoCalculado !== undefined) {
      transaction.saldo = saldoCalculado;
    }
  });
  
  // Salva JSON
  fs.writeFileSync(outputPath, JSON.stringify(transactions, null, 2), 'utf8');
  
  console.log(`\n✅ Conversão concluída!`);
  console.log(`📊 Processadas: ${processed} transações`);
  console.log(`⏭️ Ignoradas: ${skipped} linhas`);
  console.log(`💾 Arquivo salvo em: ${outputPath}`);
  console.log(`\n📝 Próximo passo: npm run import:json`);
}

convertExcelToJson().catch((err) => {
  console.error('❌ Erro:', err);
  process.exit(1);
});

