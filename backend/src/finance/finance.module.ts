import { Module } from '@nestjs/common';
import { FinanceService } from './finance.service';
import { FinanceController } from './finance.controller';
import { ExcelService } from './excel/excel.service';
import { FinanceSyncService } from './finance-sync.service';
import { PrismaService } from '../common/prisma.service';

@Module({
  controllers: [FinanceController],
  providers: [FinanceService, ExcelService, FinanceSyncService, PrismaService],
  exports: [FinanceService],
})
export class FinanceModule {}




