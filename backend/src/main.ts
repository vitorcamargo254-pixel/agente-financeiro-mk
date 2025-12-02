import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { execSync } from 'child_process';

async function bootstrap() {
  try {
    console.log('🔄 Iniciando aplicação...');
    
    // Garantir que as migrations foram executadas
    try {
      console.log('📊 Verificando migrations do banco de dados...');
      execSync('npx prisma migrate deploy', { stdio: 'inherit' });
      console.log('✅ Migrations verificadas/aplicadas');
    } catch (migrationError) {
      console.warn('⚠️ Aviso ao executar migrations:', migrationError);
      // Continua mesmo se der erro (pode ser que já estejam aplicadas)
    }
    
    const app = await NestFactory.create(AppModule, { 
      cors: {
        origin: true, // Permite qualquer origem (ajuste em produção se necessário)
        credentials: true,
      }
    });
    console.log('✅ Aplicação criada');

    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
        transformOptions: { enableImplicitConversion: true },
      }),
    );
    console.log('✅ Pipes configurados');

    const port = process.env.PORT || 4000;
    // Render precisa que escutemos em 0.0.0.0, não apenas localhost
    await app.listen(port, '0.0.0.0');
    console.log(`🚀 Microkids backend rodando na porta ${port}`);
  } catch (error) {
    console.error('❌ Erro ao iniciar aplicação:', error);
    process.exit(1);
  }
}

bootstrap();




