# 🚀 Como Criar o Backend no Render

## 🎯 Situação

Você só tem o **frontend** (Static Site) criado. Precisa criar o **backend** (Web Service) agora.

## ✅ Passo a Passo Completo

### 1️⃣ Acesse o Render

1. Vá para: https://dashboard.render.com
2. Faça login na sua conta

### 2️⃣ Criar Novo Serviço

1. Clique no botão **"+ New"** (canto superior direito)
2. Escolha **"Web Service"** (NÃO Static Site!)

### 3️⃣ Conectar ao Repositório

1. Se já conectou antes, escolha seu repositório: `vitorcamargo254-pixel/agente-financeiro-mk`
2. Se não conectou, clique em "Connect account" e autorize o GitHub

### 4️⃣ Configurar o Backend

Preencha os campos:

#### **Name:**
```
agente-financeiro-mk-backend
```
(ou outro nome que você preferir)

#### **Region:**
Escolha a região mais próxima (ex: `Oregon (US West)`)

#### **Branch:**
```
main
```
(ou `master` se for o nome da sua branch)

#### **Root Directory:**
```
backend
```
**IMPORTANTE:** Deve ser exatamente `backend` (sem barras, sem espaços)

#### **Runtime:**
```
Node
```
(ou deixe o padrão)

#### **Build Command:**
```
npm install && npx prisma generate && npm run build && npx prisma migrate deploy
```

#### **Start Command:**
```
npm run start:prod
```

### 5️⃣ Configurar Environment Variables

Clique em **"Advanced"** ou role para baixo até encontrar **"Environment Variables"**

Clique em **"+ Add Environment Variable"** e adicione:

#### Variável 1:
- **Key:** `DATABASE_URL`
- **Value:** `file:./dev.db`
- Clique em **"Add"**

#### Variáveis Adicionais (se necessário):
- `GROQ_API_KEY` - Sua chave da API Groq
- `EMAIL_HOST` - `smtp.gmail.com`
- `EMAIL_PORT` - `587`
- `EMAIL_USER` - Seu email
- `EMAIL_PASSWORD` - Senha de app do Google
- `EMAIL_FROM` - Seu email
- `TWILIO_ACCOUNT_SID` - Se usar Twilio
- `TWILIO_AUTH_TOKEN` - Se usar Twilio
- `TWILIO_FROM_NUMBER` - Se usar Twilio

### 6️⃣ Criar o Serviço

1. Role até o final da página
2. Clique em **"Create Web Service"**
3. Aguarde o deploy (pode levar 2-5 minutos)

### 7️⃣ Verificar o Deploy

1. Após criar, você será redirecionado para a página do serviço
2. Vá em **"Logs"** para ver o progresso
3. Procure por mensagens como:
   - `✅ Migrations aplicadas`
   - `🚀 Microkids backend rodando na porta...`

### 8️⃣ Copiar a URL do Backend

1. Na página do serviço, você verá a **URL** do backend
2. Será algo como: `https://agente-financeiro-mk-backend.onrender.com`
3. **Copie essa URL!**

### 9️⃣ Atualizar o Frontend

1. Vá no serviço do **frontend** (o que tem Publish Directory)
2. Vá em **"Environment"**
3. Adicione variável:
   - **Key:** `BACKEND_URL`
   - **Value:** A URL do backend que você copiou
4. Salve

OU edite o arquivo `index.html` localmente:
- Linha ~406, atualize `BACKEND_URL` com a URL do backend
- Faça commit e push

## 📋 Resumo das Configurações

### Backend (Web Service):
- **Root Directory:** `backend`
- **Build Command:** `npm install && npx prisma generate && npm run build && npx prisma migrate deploy`
- **Start Command:** `npm run start:prod`
- **DATABASE_URL:** `file:./dev.db`

### Frontend (Static Site):
- Já está criado ✅
- Só precisa atualizar a URL do backend

## ✅ Depois de Criar

1. Aguarde o deploy terminar
2. Copie a URL do backend
3. Atualize o frontend com essa URL
4. Teste a sincronização!

## 🆘 Precisa de Ajuda?

Se tiver dúvida em algum passo, me avise! Vou te ajudar! 💪

