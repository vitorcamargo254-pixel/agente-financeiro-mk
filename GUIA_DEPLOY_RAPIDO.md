# 🚀 Guia Rápido: Colocar Online em 10 Minutos

## 🎯 Objetivo
Ter um link tipo `https://microkids-financeiro.onrender.com` para compartilhar pelo WhatsApp.

---

## 📋 Passo a Passo Simplificado

### **1. Preparar Código no GitHub (5 min)**

1. Acesse: https://github.com
2. Crie uma conta (se não tiver)
3. Clique em "New repository"
4. Nome: `microkids-financeiro`
5. Marque "Public" (ou Private se quiser)
6. Clique "Create repository"

**Agora faça upload do código:**
- Opção A: Use GitHub Desktop (mais fácil)
- Opção B: Use Git no terminal:
  ```bash
  git init
  git add .
  git commit -m "Initial commit"
  git remote add origin https://github.com/SEU_USUARIO/microkids-financeiro.git
  git push -u origin main
  ```

---

### **2. Deploy no Render (5 min)**

1. Acesse: https://render.com
2. Clique "Get Started for Free"
3. Faça login com GitHub
4. Clique "New +" → "Web Service"
5. Conecte o repositório `microkids-financeiro`
6. Configure:
   - **Name**: `microkids-backend`
   - **Region**: Escolha mais próximo (ex: São Paulo)
   - **Branch**: `main`
   - **Root Directory**: `backend`
   - **Environment**: `Node`
   - **Build Command**: `npm install && npx prisma generate && npx prisma migrate deploy`
   - **Start Command**: `npm run start:dev`
   - **Plan**: Free

7. Clique "Create Web Service"

---

### **3. Configurar Variáveis (2 min)**

No Render, vá em "Environment" e adicione:

```
DATABASE_URL=file:./prisma/dev.db
PATH_EXCEL=C:/caminho/para/excel (ou ajuste depois)
GROQ_API_KEY=sua_chave_groq
PORT=4000
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=seu-email@gmail.com
EMAIL_PASSWORD=sua-senha-app
EMAIL_FROM=seu-email@gmail.com
TWILIO_ACCOUNT_SID=ACxxx
TWILIO_AUTH_TOKEN=xxx
TWILIO_FROM_NUMBER=+5511999999999
BASE_URL=https://microkids-backend.onrender.com
```

**Importante**: Substitua `BASE_URL` pelo link que o Render vai gerar (algo como `https://microkids-backend-xxx.onrender.com`)

---

### **4. Deploy do Frontend (3 min)**

1. No Render, clique "New +" → "Static Site"
2. Conecte o mesmo repositório
3. Configure:
   - **Name**: `microkids-frontend`
   - **Root Directory**: `/` (raiz)
   - **Build Command**: (deixe vazio)
   - **Publish Directory**: `/`

4. **IMPORTANTE**: Antes de fazer deploy, edite o `sistema.html.html`:
   - Abra o arquivo
   - Encontre: `const API_BASE = 'http://localhost:4000';`
   - Mude para: `const API_BASE = 'https://microkids-backend-xxx.onrender.com';`
   - (Use o link do seu backend do Render)

5. Faça commit dessa mudança no GitHub
6. No Render, clique "Manual Deploy" → "Deploy latest commit"

---

### **5. Pronto! 🎉**

Você terá um link tipo:
`https://microkids-frontend.onrender.com`

**Compartilhe esse link pelo WhatsApp!**

---

## 🔄 Atualizar o Sistema

Sempre que fizer mudanças:
1. Faça commit no GitHub
2. O Render atualiza automaticamente!

---

## ⚠️ Dicas Importantes

1. **Primeira vez pode demorar**: O Render "dorme" após 15min sem uso. A primeira requisição pode demorar ~30s.

2. **Para evitar "dormir"**: Use o plano pago ou configure um "cron job" para "acordar" o servidor.

3. **Banco de Dados**: O SQLite funciona, mas para produção considere PostgreSQL (Render oferece grátis).

4. **Excel**: Em produção, você pode:
   - Fazer upload do Excel para o servidor
   - Ou usar Google Sheets via API
   - Ou armazenar em nuvem (S3, etc.)

---

## 🆘 Problemas Comuns

### Servidor não inicia
- Verifique os logs no Render
- Confira se todas as variáveis estão configuradas

### Frontend não conecta ao backend
- Verifique se o `API_BASE` está correto
- Verifique CORS no backend (já está configurado)

### Banco de dados não funciona
- Execute: `npx prisma migrate deploy` nos logs do Render
- Ou use PostgreSQL (mais confiável)

---

## 📱 Compartilhar

Depois do deploy, você terá:
- **Link do Frontend**: `https://microkids-frontend.onrender.com`
- Compartilhe esse link pelo WhatsApp, e-mail, etc.
- A pessoa acessa e usa direto, sem instalar nada!

---

**Tempo total: ~10-15 minutos** ⏱️

