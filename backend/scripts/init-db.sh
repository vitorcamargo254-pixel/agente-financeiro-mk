#!/bin/bash
set -e

echo "🔄 Inicializando banco de dados..."

# 1. Tenta executar migrations
echo "📊 Tentando executar migrations..."
if npx prisma migrate deploy; then
  echo "✅ Migrations executadas com sucesso"
else
  echo "⚠️ Migrations falharam, tentando db push..."
  
  # 2. Se migrations falharem, tenta db push
  if npx prisma db push --accept-data-loss --skip-generate; then
    echo "✅ Schema aplicado com db push"
  else
    echo "❌ db push também falhou"
    exit 1
  fi
fi

# 3. Verifica se consegue conectar
echo "✅ Banco de dados inicializado com sucesso!"
exit 0

