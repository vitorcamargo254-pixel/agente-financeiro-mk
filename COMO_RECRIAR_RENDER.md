# 🔄 Como Recriar o Serviço no Render (Node)

## ⚠️ Se o serviço está como DOCKER

Se você viu campos como "Dockerfile Path" e "Docker Build Context", o serviço está configurado como Docker. Precisamos recriar como Node.

---

## 📋 Passo a Passo Completo

### 1️⃣ Deletar o Serviço Atual

1. No Render.com, vá até o serviço `agente-financeiro-mk`
2. Clique em **"Settings"** (Configurações)
3. Role até o final da página
4. Clique em **"Delete Service"** ou **"Delete"**
5. Digite exatamente: `sudo delete web service agente-financeiro-mk`
6. Clique no botão vermelho **"Delete Web Service"**
7. Confirme a exclusão

---

### 2️⃣ Criar Novo Serviço (NODE)

1. No Render, clique em **"New +"** (canto superior direito)
2. Escolha **"Web Service"**

3. **Conectar Repositório:**
   - Escolha: `vitorcamargo254-pixel/agente-financeiro-mk`
   - Branch: `main`
   - Clique em **"Connect"**

4. **Configurar o Serviço:**
   
   **⚠️ IMPORTANTE: Na primeira tela, procure por "Language" ou "Runtime"**
   - **ESCOLHA "Node"** (NÃO escolha Docker!)
   - Se aparecer um dropdown, escolha "Node.js" ou "Node"

5. **Preencher os campos:**
   - **Name:** `microkids-backend` (ou `agente-financeiro-mk`)
   - **Root Directory:** `backend`
   - **Build Command:** `npm install && npx prisma generate && npm run build`
   - **Start Command:** `npm run start:prod`
   - **Plan:** `Free`

6. **Verificar se está correto:**
   - ✅ Deve aparecer: "Build Command" e "Start Command"
   - ❌ NÃO deve aparecer: "Dockerfile Path" ou "Docker Build Context"
   - Se aparecer campos de Docker, você escolheu Docker por engano!
   - Cancele e comece de novo, escolhendo Node!

7. Clique em **"Create Web Service"**

---

### 3️⃣ Configurar Variáveis de Ambiente

Depois de criar o serviço:

1. Vá em **"Environment"** (barra lateral esquerda)
2. Clique em **"Add Environment Variable"**
3. Adicione uma por uma:

```
DATABASE_URL = file:./prisma/dev.db
PATH_EXCEL = /tmp/financeiro.xlsx
PORT = 4000
GROQ_API_KEY = (sua chave Groq)
EMAIL_HOST = smtp.gmail.com
EMAIL_PORT = 587
EMAIL_USER = (seu email Gmail)
EMAIL_PASSWORD = (sua senha de app do Google)
EMAIL_FROM = (mesmo email Gmail)
TWILIO_ACCOUNT_SID = (seu Account SID)
TWILIO_AUTH_TOKEN = (seu Auth Token)
TWILIO_FROM_NUMBER = (seu número Twilio, ex: +5511999999999)
BASE_URL = (deixe vazio por enquanto, preenche depois com o link do Render)
```

4. Salve cada variável

---

### 4️⃣ Aguardar Deploy

1. O Render vai fazer deploy automaticamente
2. Aguarde 2-3 minutos
3. Veja os logs para acompanhar
4. Quando terminar, você verá status "Live" (verde)

---

## ✅ Checklist Final

- [ ] Serviço deletado
- [ ] Novo serviço criado como **Node** (não Docker)
- [ ] Root Directory configurado como `backend`
- [ ] Build Command configurado
- [ ] Start Command configurado
- [ ] Variáveis de ambiente adicionadas
- [ ] Deploy concluído com sucesso

---

## 🆘 Se Ainda Der Erro

Se mesmo assim der erro:

1. Verifique se o `render.yaml` está na raiz do repositório
2. Verifique se fez commit e push de todas as mudanças
3. Veja os logs do deploy para identificar o erro específico
4. Me avise qual erro apareceu

---

**Boa sorte! 🚀**


