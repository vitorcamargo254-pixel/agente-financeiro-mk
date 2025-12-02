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
      
      // Verificar se as tabelas existem
      try {
        await this.$queryRaw`SELECT 1 FROM Transaction LIMIT 1`;
        this.logger.log('✅ Tabela Transaction existe');
      } catch (tableError: any) {
        this.logger.error('❌ Tabela Transaction não existe! Tentando criar...');
        // Tenta criar usando db push
        try {
          const { execSync } = require('child_process');
          execSync('npx prisma db push --accept-data-loss --skip-generate', { 
            stdio: 'inherit',
            cwd: process.cwd(),
            env: { ...process.env, DATABASE_URL: this.config.get<string>('DATABASE_URL') || 'file:./dev.db' }
          });
          this.logger.log('✅ Tabelas criadas com db push');
        } catch (createError: any) {
          this.logger.error('❌ Erro ao criar tabelas:', createError.message);
          throw createError;
        }
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

