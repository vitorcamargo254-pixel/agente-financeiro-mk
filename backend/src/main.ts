import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  try {
    console.log('🔄 Iniciando aplicação...');
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
    await app.listen(port);
    console.log(`🚀 Microkids backend rodando na porta ${port}`);
  } catch (error) {
    console.error('❌ Erro ao iniciar aplicação:', error);
    process.exit(1);
  }
}

bootstrap();




