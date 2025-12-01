import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { FinanceSyncService } from '../finance-sync.service';
import { ExcelService } from '../excel/excel.service';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../common/prisma.service';

async function run() {
  const config = { get: (key: string) => process.env[key] } as ConfigService;
  const prismaService = new PrismaService(config);
  const excel = new ExcelService(config);
  const financeSync = new FinanceSyncService(config, prismaService);
  const result = await financeSync.syncFromExcel();
  console.log(`✅ Importação concluída: ${result.imported} linhas sincronizadas.`);
  await prismaService.$disconnect();
  process.exit(0);
}


run().catch((err) => {
  console.error('Erro ao importar Excel:', err);
  process.exit(1);
});




