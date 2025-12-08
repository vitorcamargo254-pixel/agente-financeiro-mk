# 🗄️ Como Adicionar DATABASE_URL no Render

## 🎯 Problema

O erro mostra:
```
Error: Environment variable not found: DATABASE_URL.
```

Isso significa que a variável `DATABASE_URL` não está configurada no Render.

## ✅ Solução

### 1️⃣ Acesse o Render

1. Vá em render.com → Dashboard
2. Clique no serviço **BACKEND**

### 2️⃣ Vá em Environment

1. No menu lateral, clique em **"Environment"** ou **"Environment Variables"**
2. Você verá a lista de variáveis (pode estar vazia)

### 3️⃣ Adicione DATABASE_URL

1. Clique no botão **"+ Add"** ou **"+ Add Environment Variable"**
2. Configure:
   - **Key:** `DATABASE_URL`
   - **Value:** `file:./dev.db`
3. **Salve** (pode ter um botão "Save" ou "Add")

### 4️⃣ Verifique Outras Variáveis Necessárias

Certifique-se de que também tem essas variáveis (se necessário):

- `GROQ_API_KEY` - Sua chave da API Groq
- `EMAIL_HOST` - `smtp.gmail.com`
- `EMAIL_PORT` - `587`
- `EMAIL_USER` - Seu email
- `EMAIL_PASSWORD` - Senha de app do Google
- `EMAIL_FROM` - Seu email
- `TWILIO_ACCOUNT_SID` - Se usar Twilio
- `TWILIO_AUTH_TOKEN` - Se usar Twilio
- `TWILIO_FROM_NUMBER` - Se usar Twilio

### 5️⃣ Aguarde o Deploy

1. Após adicionar `DATABASE_URL`, o Render pode fazer deploy automático
2. Ou vá em **"Manual Deploy"** → **"Deploy latest commit"**
3. Aguarde 2-3 minutos

## 📋 Valor da DATABASE_URL

Para SQLite (recomendado para começar):
```
file:./dev.db
```

Isso cria um banco de dados SQLite local no servidor.

## ✅ Verificar se Funcionou

Após o deploy:

1. Vá em render.com → Backend → Logs
2. Procure por mensagens como:
   - `✅ Prisma migrations applied`
   - `✅ Database ready`
   - `🚀 Microkids backend rodando na porta...`
3. Se aparecer essas mensagens, está funcionando!

## 🚨 Se Ainda Não Funcionar

1. Verifique se `DATABASE_URL` está exatamente como `file:./dev.db`
2. Verifique os logs do Render
3. Me envie os logs para eu ajudar!

## 📝 Resumo

1. ✅ Root Directory configurado
2. ✅ Build Command funcionando
3. ❌ Falta `DATABASE_URL`
4. 🔧 Adicionar `DATABASE_URL` = `file:./dev.db`
5. ✅ Deploy funcionando



