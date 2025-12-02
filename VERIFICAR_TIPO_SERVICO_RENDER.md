# 🔍 Verificar Tipo de Serviço no Render

## 🎯 Problema Identificado

Você está vendo:
- ✅ Build Command
- ✅ Publish Directory
- ❌ **NÃO tem Start Command**

Isso significa que você está configurando um **Static Site**, não um **Web Service**.

## ✅ Solução

O backend precisa ser um **Web Service**, não um Static Site.

### 1️⃣ Verificar Qual Serviço Você Está Editando

1. Olhe o nome do serviço no topo da página
2. Se for `agente-financeiro-mk-1` ou algo com `-1`, provavelmente é o **FRONTEND**
3. Você precisa editar o **BACKEND**, que deve ter outro nome

### 2️⃣ Encontrar o Serviço do Backend

1. Vá em render.com → Dashboard
2. Na lista de serviços, procure por:
   - `agente-financeiro-mk` (sem o -1)
   - `microkids-backend`
   - `backend`
   - Ou outro nome que você escolheu para o backend
3. **Clique no serviço do BACKEND** (não o frontend)

### 3️⃣ Verificar Tipo do Serviço

No serviço do backend, você deve ver:
- ✅ **Start Command** (isso é o que você precisa!)
- ✅ Build Command
- ✅ Environment Variables
- ❌ NÃO deve ter "Publish Directory" (isso é só para Static Sites)

### 4️⃣ Se Não Encontrar o Backend

Se você não tem um serviço de backend ainda, precisa criar:

1. Render → Dashboard → **"+ New"**
2. Escolha **"Web Service"** (NÃO Static Site!)
3. Conecte ao seu repositório GitHub
4. Configure:
   - **Name:** `agente-financeiro-mk-backend` (ou outro nome)
   - **Root Directory:** `backend`
   - **Build Command:** `npm install && npx prisma generate && npm run build && npx prisma migrate deploy`
   - **Start Command:** `npm run start:prod`
   - **Environment:** Adicione `DATABASE_URL` = `file:./dev.db`
5. Salve

## 📋 Resumo

- **Frontend** = Static Site (tem Publish Directory, NÃO tem Start Command)
- **Backend** = Web Service (tem Start Command, NÃO tem Publish Directory)

Você precisa editar o **Web Service** (backend), não o Static Site (frontend)!

## 🚀 Próximos Passos

1. Encontre o serviço do BACKEND na lista
2. Clique nele
3. Vá em Settings → Build & Deploy
4. Você verá **Start Command** lá!

