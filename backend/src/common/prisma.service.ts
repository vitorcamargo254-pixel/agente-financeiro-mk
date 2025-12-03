import { Injectable, OnModuleInit, Logger, Inject } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { ConfigService } from '@nestjs/config';
import * as path from 'path';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  private readonly logger = new Logger(PrismaService.name);

  constructor(@Inject(ConfigService) private config: ConfigService) {
    const dbUrl = config.get<string>('DATABASE_URL') || 'file:./prisma/dev.db';
    
    // Converte caminho relativo para absoluto
    let finalUrl = dbUrl;
    if (dbUrl.startsWith('file:./') || dbUrl.startsWith('file:../')) {
      const relativePath = dbUrl.replace('file:', '');
      const absolutePath = path.resolve(process.cwd(), relativePath);
      finalUrl = `file:${absolutePath.replace(/\\/g, '/')}`;
    }
    
    super({
      datasources: {
        db: { url: finalUrl },
      },
    });
    
    this.logger.log(`Caminho do banco: ${finalUrl}`);
  }

  async onModuleInit() {
    try {
      this.logger.log('Conectando ao banco de dados...');
      
      // Garantir que as migrations foram executadas
      try {
        this.logger.log('📊 Verificando e aplicando migrations...');
        const { execSync } = require('child_process');
        execSync('npx prisma migrate deploy', { 
          stdio: 'pipe',
          cwd: process.cwd(),
          env: { ...process.env, DATABASE_URL: this.config.get<string>('DATABASE_URL') || 'file:./dev.db' }
        });
        this.logger.log('✅ Migrations aplicadas com sucesso');
      } catch (migrationError: any) {
        this.logger.warn('⚠️ Aviso ao executar migrations:', migrationError.message);
        // Tenta usar db push como alternativa
        try {
          this.logger.log('🔄 Tentando db push como alternativa...');
          const { execSync } = require('child_process');
          execSync('npx prisma db push --accept-data-loss', { 
            stdio: 'pipe',
            cwd: process.cwd(),
            env: { ...process.env, DATABASE_URL: this.config.get<string>('DATABASE_URL') || 'file:./dev.db' }
          });
          this.logger.log('✅ Schema aplicado com db push');
        } catch (pushError: any) {
          this.logger.warn('⚠️ Aviso ao executar db push:', pushError.message);
          // Continua mesmo assim - pode ser que já esteja criado
        }
      }
      
      await this.$connect();
      this.logger.log('✅ Conectado ao banco de dados');
      
      // SOLUÇÃO DEFINITIVA: Cria todas as tabelas via SQL direto se não existirem
      try {
        // Lista de tabelas necessárias
        const tablesToCreate = [
          {
            name: 'Transaction',
            sql: `
              CREATE TABLE IF NOT EXISTS "Transaction" (
                "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
                "descricao" TEXT NOT NULL,
                "codigo" TEXT NOT NULL UNIQUE,
                "centroCusto" TEXT NOT NULL,
                "ndoc" TEXT,
                "valor" DECIMAL NOT NULL,
                "status" TEXT NOT NULL DEFAULT 'PENDENTE',
                "data" DATETIME NOT NULL,
                "saldo" DECIMAL,
                "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
                "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
              )
            `
          },
          {
            name: 'ReminderConfig',
            sql: `
              CREATE TABLE IF NOT EXISTS "ReminderConfig" (
                "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
                "diasAntesVencimento" TEXT NOT NULL,
                "telefoneDestino" TEXT NOT NULL,
                "emailDestino" TEXT NOT NULL,
                "ativo" INTEGER NOT NULL DEFAULT 1,
                "enviarEmail" INTEGER NOT NULL DEFAULT 1,
                "fazerLigacao" INTEGER NOT NULL DEFAULT 1,
                "horarioLigacao" TEXT NOT NULL DEFAULT '09:00',
                "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
                "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
              )
            `
          },
          {
            name: 'ReminderLog',
            sql: `
              CREATE TABLE IF NOT EXISTS "ReminderLog" (
                "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
                "transactionId" INTEGER,
                "tipo" TEXT NOT NULL,
                "status" TEXT NOT NULL,
                "mensagem" TEXT,
                "erro" TEXT,
                "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
              )
            `
          }
        ];

        // Verifica e cria cada tabela
        for (const table of tablesToCreate) {
          const tables = await this.$queryRaw<Array<{ name: string }>>`
            SELECT name FROM sqlite_master WHERE type='table' AND name=${table.name}
          `;
          
          if (tables.length === 0) {
            this.logger.log(`🔄 Criando tabela ${table.name} via SQL direto...`);
            await this.$executeRawUnsafe(table.sql);
            this.logger.log(`✅ Tabela ${table.name} criada com sucesso!`);
          } else {
            this.logger.log(`✅ Tabela ${table.name} já existe`);
          }
        }
        
        // Testa acesso às tabelas principais
        await this.transaction.count();
        this.logger.log('✅ Todas as tabelas criadas e banco de dados pronto!');
      } catch (error: any) {
        this.logger.error('❌ Erro ao verificar/criar tabelas:', error.message);
        // Continua mesmo assim - não bloqueia servidor
      }
    } catch (error) {
      this.logger.error('❌ Erro ao conectar ao banco de dados:', error);
      this.logger.error('Verifique se o arquivo do banco existe e tem permissões de leitura/escrita');
      throw error;
    }
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}

