import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { execSync } from 'child_process';

const prisma = new PrismaClient();

async function initDatabase() {
  try {
    console.log('🔄 Inicializando banco de dados...');
    
    // 1. Tenta executar migrations
    try {
      console.log('📊 Tentando executar migrations...');
      execSync('npx prisma migrate deploy', { 
        stdio: 'inherit',
        cwd: process.cwd()
      });
      console.log('✅ Migrations executadas');
    } catch (migrationError) {
      console.warn('⚠️ Migrations falharam, tentando db push...');
      
      // 2. Se migrations falharem, tenta db push
      try {
        execSync('npx prisma db push --accept-data-loss --skip-generate', { 
          stdio: 'inherit',
          cwd: process.cwd()
        });
        console.log('✅ Schema aplicado com db push');
      } catch (pushError) {
        console.error('❌ db push também falhou:', pushError);
        throw pushError;
      }
    }
    
    // 3. Verifica se consegue conectar e usar
    await prisma.$connect();
    console.log('✅ Conectado ao banco');
    
    // 4. Tenta fazer uma query simples para verificar se a tabela existe
    try {
      await prisma.$queryRaw`SELECT 1 FROM Transaction LIMIT 1`;
      console.log('✅ Tabela Transaction existe e está funcionando');
    } catch (tableError: any) {
      console.error('❌ Tabela Transaction não existe ou não está acessível');
      console.error('Erro:', tableError.message);
      
      // Última tentativa: db push forçado
      console.log('🔄 Tentando db push forçado...');
      execSync('npx prisma db push --force-reset --accept-data-loss --skip-generate', { 
        stdio: 'inherit',
        cwd: process.cwd()
      });
      
      // Verifica novamente
      await prisma.$queryRaw`SELECT 1 FROM Transaction LIMIT 1`;
      console.log('✅ Tabela criada com sucesso!');
    }
    
    await prisma.$disconnect();
    console.log('✅ Banco de dados inicializado com sucesso!');
    process.exit(0);
  } catch (error: any) {
    console.error('❌ Erro ao inicializar banco de dados:', error);
    await prisma.$disconnect();
    process.exit(1);
  }
}

initDatabase();

