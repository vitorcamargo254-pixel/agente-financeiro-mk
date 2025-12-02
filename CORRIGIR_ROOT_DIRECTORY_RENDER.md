# 🔧 Como Corrigir Root Directory no Render

## 🎯 Problema

O erro mostra:
```
npm error path /opt/render/project/src/package.json
npm error enoent Could not read package.json
```

Isso significa que o Render está procurando o `package.json` no lugar errado.

## ✅ Solução

### 1️⃣ Acesse o Render

1. Vá em render.com → Dashboard
2. Clique no serviço **BACKEND**

### 2️⃣ Vá em Settings

1. No menu lateral, clique em **"Settings"**
2. Role até a seção **"Build & Deploy"**

### 3️⃣ Configure o Root Directory

1. Procure por **"Root Directory"** ou **"Working Directory"**
2. **IMPORTANTE:** Configure como:
   ```
   backend
   ```
3. **NÃO** use:
   - `src/backend` ❌
   - `backend/` ❌ (com barra no final)
   - Deixe vazio ❌
   - Apenas: `backend` ✅

### 4️⃣ Verifique Build Command

Com o Root Directory configurado como `backend`, o Build Command deve ser:
```bash
npm install && npx prisma generate && npm run build && npx prisma migrate deploy
```

### 5️⃣ Verifique Start Command

```bash
npm run start:prod
```

### 6️⃣ Salve

1. Clique em **"Save Changes"**
2. O Render vai fazer um novo deploy automaticamente
3. Aguarde 2-3 minutos

## 📋 Configuração Completa

### Root Directory:
```
backend
```

### Build Command:
```bash
npm install && npx prisma generate && npm run build && npx prisma migrate deploy
```

### Start Command:
```bash
npm run start:prod
```

### Environment Variables:
- `DATABASE_URL` = `file:./dev.db`
- Outras variáveis que você configurou

## ✅ Verificar se Funcionou

Após o deploy:

1. Vá em render.com → Backend → Logs
2. Procure por mensagens como:
   - `✅ Prisma migrations applied`
   - `✅ Database ready`
   - `🚀 Microkids backend rodando na porta...`
3. Se aparecer essas mensagens, está funcionando!

## 🚨 Se Ainda Não Funcionar

1. Verifique se o Root Directory está exatamente como `backend` (sem espaços, sem barras)
2. Verifique os logs do Render
3. Me envie os logs para eu ajudar!

## 📝 Resumo

O problema é que o Root Directory não está configurado. Configure como `backend` e salve!

