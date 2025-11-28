import 'dotenv/config';
import { FinanceService } from '../finance.service';
import { ExcelService } from '../excel/excel.service';

async function run() {
  const excel = new ExcelService({ get: () => process.env.PATH_EXCEL } as any);
  const finance = new FinanceService(excel);
  const result = await finance.importFromExcel();
  console.log(`✅ Importação concluída: ${result.imported} linhas sincronizadas.`);
  process.exit(0);
}

run().catch((err) => {
  console.error('Erro ao importar Excel:', err);
  process.exit(1);
});




