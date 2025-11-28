# 📱 Como Compartilhar pelo WhatsApp (Deploy Online)

## 🎯 Objetivo Final
Ter um link tipo: `https://microkids-financeiro.onrender.com`  
→ Compartilhar pelo WhatsApp  
→ Pessoa acessa e usa direto, sem instalar nada!

---

## ⚡ Método Mais Rápido (Render.com)

### **Passo 1: Colocar Código no GitHub** (3 min)

1. Acesse: https://github.com
2. Crie conta (se não tiver)
3. "New repository" → Nome: `microkids-financeiro`
4. Faça upload do código:
   - Use GitHub Desktop (mais fácil)
   - Ou arraste arquivos pelo navegador

**⚠️ IMPORTANTE**: Não faça upload do arquivo `backend/.env`!

---

### **Passo 2: Deploy Backend no Render** (5 min)

1. Acesse: https://render.com
2. "Get Started" → Login com GitHub
3. "New +" → "Web Service"
4. Conecte seu repositório
5. Configure:
   ```
   Name: microkids-backend
   Root Directory: backend
   Environment: Node
   Build Command: npm install && npx prisma generate && npx prisma migrate deploy
   Start Command: npm run start:dev
   Plan: Free
   ```
6. Clique "Create Web Service"

**Aguarde o deploy terminar** (pode demorar 2-3 minutos)

---

### **Passo 3: Configurar Variáveis** (2 min)

No Render, vá em "Environment" e adicione:

```
DATABASE_URL=file:./prisma/dev.db
PATH_EXCEL=/tmp/financeiro.xlsx
GROQ_API_KEY=sua_chave_groq
PORT=4000
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=seu-email@gmail.com
EMAIL_PASSWORD=sua-senha-de-app
EMAIL_FROM=seu-email@gmail.com
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=seu_auth_token_aqui
TWILIO_FROM_NUMBER=+5511999999999
BASE_URL=https://microkids-backend-XXXX.onrender.com
```

**⚠️ IMPORTANTE**: 
- Substitua `BASE_URL` pelo link que o Render gerou (algo como `https://microkids-backend-abc123.onrender.com`)
- Você verá esse link na página do serviço no Render

---

### **Passo 4: Deploy Frontend** (3 min)

1. No Render, "New +" → "Static Site"
2. Conecte o mesmo repositório
3. Configure:
   ```
   Name: microkids-frontend
   Root Directory: /
   Build Command: (deixe vazio)
   Publish Directory: /
   ```

4. **ANTES de fazer deploy**, edite `sistema.html.html`:
   - Abra o arquivo
   - Encontre: `const API_BASE = 'http://localhost:4000';`
   - Mude para: `const API_BASE = 'https://microkids-backend-XXXX.onrender.com';`
   - (Use o link do seu backend)
   - Salve e faça commit no GitHub

5. No Render, "Manual Deploy" → "Deploy latest commit"

---

### **Passo 5: Pronto! 🎉**

Você terá um link tipo:
```
https://microkids-frontend.onrender.com
```

**Compartilhe esse link pelo WhatsApp!**

---

## 📱 Como Compartilhar

1. Copie o link do frontend
2. Abra WhatsApp
3. Cole o link e envie
4. A pessoa clica e usa direto!

---

## 🔄 Atualizar o Sistema

Sempre que fizer mudanças:
1. Faça commit no GitHub
2. O Render atualiza automaticamente (ou clique "Manual Deploy")

---

## ⚠️ Limitações do Plano Gratuito

- **Render pode "dormir"** após 15min sem uso
- Primeira requisição pode demorar ~30 segundos
- **Solução**: Configure um "cron job" para manter acordado (veja abaixo)

---

## 🔧 Manter Servidor Acordado (Opcional)

Para evitar que o servidor "durma":

1. No Render, vá em "Cron Jobs"
2. "New Cron Job"
3. Configure:
   ```
   Schedule: */14 * * * *  (a cada 14 minutos)
   Command: curl https://microkids-backend-XXXX.onrender.com/finance/transactions
   ```

---

## 🆘 Problemas?

### Link não funciona
- Verifique se o deploy terminou (veja logs no Render)
- Confira se o `API_BASE` está correto no frontend

### Erro 404
- Verifique se o "Publish Directory" está como `/`
- Confira se o arquivo `sistema.html.html` está na raiz

### Backend não conecta
- Verifique os logs no Render
- Confira se todas as variáveis estão configuradas

---

## ✅ Checklist Final

- [ ] Código no GitHub (sem `.env`)
- [ ] Backend deployado no Render
- [ ] Variáveis configuradas
- [ ] Frontend deployado
- [ ] `API_BASE` atualizado no `sistema.html.html`
- [ ] Link testado no navegador
- [ ] Link compartilhado pelo WhatsApp

---

**Tempo total: ~10-15 minutos** ⏱️

**Depois disso, é só compartilhar o link!** 🚀

