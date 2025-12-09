import 'dotenv/config';
import { FinanceService } from '../finance.service';
import { ExcelService } from '../excel/excel.service';
import { PrismaService } from '../../common/prisma.service';
import { ConfigService } from '@nestjs/config';

async function run() {
  // Cria um mock do ConfigService
  const config = {
    get: (key: string) => {
      if (key === 'PATH_EXCEL') return process.env.PATH_EXCEL;
      if (key === 'DATABASE_URL') return process.env.DATABASE_URL;
      return undefined;
    },
  } as ConfigService;

  const excel = new ExcelService(config);
  const prisma = new PrismaService(config);
  const finance = new FinanceService(excel, prisma);
  
  try {
    const result = await finance.importFromExcel();
    console.log(`✅ Importação concluída: ${result.imported} linhas sincronizadas.`);
  } finally {
    await prisma.$disconnect();
  }
  
  process.exit(0);
}

run().catch((err) => {
  console.error('Erro ao importar Excel:', err);
  process.exit(1);
});

