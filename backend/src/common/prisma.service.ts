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
      await this.$connect();
      this.logger.log('✅ Conectado ao banco de dados');
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

