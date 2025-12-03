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
      
      // Verificar se as tabelas existem usando SQL direto (mais confiável)
      try {
        // Usa SQL direto para verificar se a tabela existe (evita problema com palavras reservadas)
        const result = await this.$queryRaw<Array<{ name: string }>>`
          SELECT name FROM sqlite_master 
          WHERE type='table' AND name='Transaction'
        `;
        
        if (result.length > 0) {
          this.logger.log('✅ Tabela Transaction existe no banco de dados');
          // Tenta uma operação simples para confirmar que está acessível
          try {
            await this.transaction.count();
            this.logger.log('✅ Tabela Transaction está acessível via Prisma Client');
          } catch (prismaError: any) {
            this.logger.warn('⚠️ Tabela existe mas Prisma Client não consegue acessar. Regenerando client...');
            // Tenta regenerar o Prisma Client
            const { execSync } = require('child_process');
            execSync('npx prisma generate', { 
              stdio: 'pipe',
              cwd: process.cwd(),
              env: { ...process.env, DATABASE_URL: this.config.get<string>('DATABASE_URL') || 'file:./dev.db' }
            });
            // Reconecta
            await this.$disconnect();
            await this.$connect();
            this.logger.log('✅ Prisma Client regenerado e reconectado');
          }
        } else {
          throw new Error('Tabela Transaction não existe');
        }
      } catch (tableError: any) {
        this.logger.warn('⚠️ Tabela Transaction não existe. Criando agora...');
        
        // Tenta criar usando db push com force-reset para garantir
        try {
          const { execSync } = require('child_process');
          const dbUrl = this.config.get<string>('DATABASE_URL') || 'file:./dev.db';
          
          this.logger.log('🔄 Executando db push para criar tabelas...');
          execSync('npx prisma db push --accept-data-loss --skip-generate', { 
            stdio: 'inherit', // Muda para inherit para ver o output
            cwd: process.cwd(),
            env: { ...process.env, DATABASE_URL: dbUrl }
          });
          this.logger.log('✅ Schema aplicado com db push');
          
          // Regenera Prisma Client após criar tabelas
          this.logger.log('🔄 Regenerando Prisma Client...');
          execSync('npx prisma generate', { 
            stdio: 'pipe',
            cwd: process.cwd(),
            env: { ...process.env, DATABASE_URL: dbUrl }
          });
          
          // Reconecta após criar
          await this.$disconnect();
          await this.$connect();
          
          // Aguarda um pouco para garantir que tudo está pronto
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          // Verifica novamente usando SQL
          const verifyResult = await this.$queryRaw<Array<{ name: string }>>`
            SELECT name FROM sqlite_master 
            WHERE type='table' AND name='Transaction'
          `;
          
          if (verifyResult.length > 0) {
            this.logger.log('✅ Tabela Transaction criada e verificada com sucesso!');
          } else {
            throw new Error('Tabela ainda não existe após db push');
          }
        } catch (createError: any) {
          this.logger.error('❌ Erro ao criar tabela:', createError.message);
          this.logger.warn('⚠️ O servidor continuará, mas algumas funcionalidades podem não funcionar.');
          // Não lança erro - continua mesmo assim para não bloquear o servidor
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

