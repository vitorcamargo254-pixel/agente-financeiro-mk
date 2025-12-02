# 🗄️ Como Corrigir o Banco de Dados no Render

## 🎯 Problema

O erro mostra:
```
The table `main.Transaction` does not exist in the current database.
```

Isso significa que:
- ✅ O arquivo Excel foi encontrado (progresso!)
- ❌ O banco de dados não tem as tabelas criadas
- 🔧 Precisamos rodar as migrations do Prisma

## ✅ Solução

### Opção 1: Configurar Build Command no Render (RECOMENDADO)

1. Vá em render.com → Seu Backend → Settings
2. Procure por **"Build Command"**
3. Substitua o comando atual por:
   ```bash
   npm install && npx prisma generate && npm run build && npx prisma migrate deploy
   ```
4. **Salve**

### Opção 2: Usar Script Atualizado

O código já foi atualizado para incluir `build:deploy`. Configure:

1. Vá em render.com → Seu Backend → Settings
2. **Build Command:**
   ```bash
   npm install && npm run build:deploy
   ```
3. **Start Command:**
   ```bash
   npm run start:prod
   ```
4. **Salve**

### Opção 3: Rodar Manualmente (Temporário)

Se quiser testar rapidamente:

1. Vá em render.com → Seu Backend → Shell (ou Terminal)
2. Execute:
   ```bash
   npx prisma migrate deploy
   ```
3. Isso vai criar as tabelas no banco

## 🔍 Verificar DATABASE_URL

Certifique-se de que o `DATABASE_URL` está configurado no Render:

1. Vá em render.com → Backend → Environment
2. Procure por `DATABASE_URL`
3. Deve ter um valor como:
   ```
   file:./dev.db
   ```
   ou
   ```
   sqlite:./dev.db
   ```

**Se não tiver:**
- Adicione a variável `DATABASE_URL`
- Valor: `file:./dev.db` (para SQLite local)
- Salve

## 📋 Configuração Completa no Render

### Build Command:
```bash
npm install && npx prisma generate && npm run build && npx prisma migrate deploy
```

### Start Command:
```bash
npm run start:prod
```

### Root Directory:
```
backend
```

### Environment Variables:
- `DATABASE_URL` = `file:./dev.db` (ou o caminho do seu banco)
- Outras variáveis que você já configurou

## ✅ Verificar se Funcionou

Após o deploy:

1. Vá em render.com → Backend → Logs
2. Procure por mensagens como:
   - `✅ Prisma migrations applied`
   - `✅ Database tables created`
   - Ou qualquer mensagem de sucesso do Prisma

3. Teste a sincronização no site
4. Se funcionar, você verá as transações aparecendo!

## 🚨 Se Ainda Não Funcionar

1. Verifique os logs do Render
2. Procure por erros relacionados a:
   - `prisma migrate`
   - `DATABASE_URL`
   - `Transaction`
3. Me envie os logs para eu ajudar!

## 📝 Resumo

1. ✅ Arquivo Excel encontrado
2. ❌ Banco de dados sem tabelas
3. 🔧 Adicionar `npx prisma migrate deploy` no Build Command
4. ✅ Testar sincronização

