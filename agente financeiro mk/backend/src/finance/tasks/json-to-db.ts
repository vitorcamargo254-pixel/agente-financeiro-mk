import 'dotenv/config';
import * as path from 'node:path';
import * as fs from 'fs';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const jsonPath = path.join(process.cwd(), 'transactions.json');

interface Transaction {
  descricao: string;
  codigo: string;
  centroCusto: string;
  ndoc?: string;
  valor: number;
  status: 'pago' | 'pendente';
  data: string;
  saldo?: number;
}

async function importJson() {
  console.log('📥 Importando transações do JSON...');
  
  if (!fs.existsSync(jsonPath)) {
    console.error('❌ Arquivo transactions.json não encontrado!');
    console.log('💡 Execute primeiro: npm run convert:excel');
    process.exit(1);
  }
  
  const jsonData = fs.readFileSync(jsonPath, 'utf-8');
  const transactions: Transaction[] = JSON.parse(jsonData);
  
  console.log(`📊 Total de transações no JSON: ${transactions.length}`);
  
  // Limpa o banco
  console.log('🗑️ Limpando banco de dados...');
  const deleted = await prisma.transaction.deleteMany({});
  console.log(`✅ ${deleted.count} transações removidas`);
  
  let imported = 0;
  let errors = 0;
  const batchSize = 100;
  
  for (let i = 0; i < transactions.length; i += batchSize) {
    const batch = transactions.slice(i, i + batchSize);
    
    try {
      await prisma.$transaction(
        batch.map((tx) =>
          prisma.transaction.upsert({
            where: { codigo: tx.codigo },
            update: {
              descricao: tx.descricao,
              centroCusto: tx.centroCusto,
              ndoc: tx.ndoc,
              valor: tx.valor,
              status: tx.status,
              data: new Date(tx.data),
              saldo: tx.saldo,
            },
            create: {
              descricao: tx.descricao,
              codigo: tx.codigo,
              centroCusto: tx.centroCusto,
              ndoc: tx.ndoc,
              valor: tx.valor,
              status: tx.status,
              data: new Date(tx.data),
              saldo: tx.saldo,
            },
          }),
        ),
      );
      imported += batch.length;
      process.stdout.write(`\r📊 Progresso: ${imported}/${transactions.length}...`);
    } catch (err) {
      errors += batch.length;
      console.error(`\n⚠️ Erro no lote ${i / batchSize + 1}:`, err.message);
    }
  }
  
  console.log(`\n\n✅ Importação concluída!`);
  console.log(`📥 Importadas: ${imported}`);
  console.log(`❌ Erros: ${errors}`);
}

importJson()
  .then(() => {
    prisma.$disconnect();
    process.exit(0);
  })
  .catch((err) => {
    console.error('❌ Erro fatal:', err);
    prisma.$disconnect();
    process.exit(1);
  });

