import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { FinanceService } from './finance.service';
import { FinanceSyncService } from './finance-sync.service';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { UpdateTransactionDto } from './dto/update-transaction.dto';

@Controller('finance')
export class FinanceController {
  constructor(
    private readonly financeService: FinanceService,
    private readonly financeSyncService: FinanceSyncService,
  ) {}

  @Get('transactions')
  findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.financeService.findAll(
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 5000,
    );
  }

  @Get('summary')
  getSummary() {
    return this.financeService.getSummary();
  }

  @Post()
  create(@Body() dto: CreateTransactionDto) {
    return this.financeService.create(dto);
  }

  @Put(':codigo')
  update(@Param('codigo') codigo: string, @Body() dto: UpdateTransactionDto) {
    return this.financeService.update(codigo, dto);
  }

  // IMPORTANTE: Esta rota deve vir ANTES de @Delete(':codigo')
  // para que o NestJS não interprete "id" como um código
  @Delete('id/:id')
  async removeById(@Param('id') id: string) {
    try {
      const transactionId = parseInt(id, 10);
      console.log(`🗑️ Tentando excluir transação com ID: ${transactionId}`);
      
      if (isNaN(transactionId)) {
        return {
          success: false,
          message: `ID inválido: ${id}`,
        };
      }
      
      // Busca a transação pelo ID para pegar o código
      const transaction = await this.financeService.findOneById(transactionId);
      if (!transaction) {
        return {
          success: false,
          message: `Transação com ID ${transactionId} não encontrada`,
        };
      }
      
      console.log(`✅ Transação encontrada: código="${transaction.codigo}"`);
      await this.financeService.remove(transaction.codigo);
      return { success: true, message: 'Transação excluída com sucesso' };
    } catch (error) {
      console.error('Erro ao excluir transação por ID:', error);
      return {
        success: false,
        message: `Erro ao excluir transação: ${error.message || 'Erro desconhecido'}`,
        error: error.message || String(error),
      };
    }
  }

  @Delete(':codigo')
  async remove(@Param('codigo') codigo: string) {
    try {
      const decodedCodigo = decodeURIComponent(codigo);
      console.log(`🗑️ Tentando excluir transação com código: "${decodedCodigo}"`);
      await this.financeService.remove(decodedCodigo);
      return { success: true, message: 'Transação excluída com sucesso' };
    } catch (error) {
      console.error('Erro ao excluir transação:', error);
      return {
        success: false,
        message: `Erro ao excluir transação: ${error.message || 'Erro desconhecido'}`,
        error: error.message || String(error),
      };
    }
  }

  @Post('sync')
  async sync() {
    try {
      const result = await this.financeSyncService.syncFromExcel();
      return {
        success: true,
        message: `Sincronização concluída com sucesso!`,
        imported: result.imported,
      };
    } catch (error) {
      console.error('Erro na sincronização:', error);
      return {
        success: false,
        message: `Erro na sincronização: ${error.message || 'Erro desconhecido'}`,
        error: error.message || String(error),
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      };
    }
  }

  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  async uploadExcel(@UploadedFile() file: any) {
    try {
      if (!file) {
        throw new BadRequestException('Nenhum arquivo foi enviado');
      }

      // Valida se é um arquivo Excel
      const allowedMimes = [
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
        'application/vnd.ms-excel', // .xls
        'application/octet-stream', // Alguns navegadores enviam assim
      ];

      const fileExtension = file.originalname.toLowerCase().split('.').pop();
      if (!['xlsx', 'xls'].includes(fileExtension)) {
        throw new BadRequestException('Apenas arquivos Excel (.xlsx ou .xls) são permitidos');
      }

      // Sincroniza usando o arquivo enviado
      const result = await this.financeSyncService.syncFromUploadedFile(file);
      
      return {
        success: true,
        message: `Planilha enviada e sincronizada com sucesso!`,
        imported: result.imported,
        filename: file.originalname,
      };
    } catch (error) {
      console.error('Erro no upload:', error);
      return {
        success: false,
        message: `Erro ao processar planilha: ${error.message || 'Erro desconhecido'}`,
        error: error.message || String(error),
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      };
    }
  }
}

