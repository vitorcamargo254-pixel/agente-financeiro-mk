# 🌐 Como Colocar o Sistema Online (Deploy)

## 🎯 Objetivo
Transformar o sistema em um site acessível por link, sem precisar instalar nada.

## 🚀 Opções de Deploy Gratuito

### **Opção 1: Render.com (RECOMENDADO - Mais Fácil)**

#### Passo 1: Preparar o Projeto
1. Crie uma conta no GitHub (se não tiver): https://github.com
2. Crie um repositório no GitHub
3. Faça upload do código (sem `.env` e sem `node_modules`)

#### Passo 2: Deploy no Render
1. Acesse: https://render.com
2. Crie uma conta (pode usar GitHub para login)
3. Clique em "New +" → "Web Service"
4. Conecte seu repositório GitHub
5. Configure:
   - **Name**: `microkids-financeiro`
   - **Environment**: `Node`
   - **Build Command**: `cd backend && npm install && npx prisma generate && npx prisma migrate deploy`
   - **Start Command**: `cd backend && npm run start`
   - **Plan**: Free (gratuito)

#### Passo 3: Configurar Variáveis de Ambiente
No Render, vá em "Environment" e adicione:
```
DATABASE_URL=file:./prisma/dev.db
PATH_EXCEL=/path/to/excel
GROQ_API_KEY=sua_chave
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=seu-email@gmail.com
EMAIL_PASSWORD=sua-senha-app
EMAIL_FROM=seu-email@gmail.com
TWILIO_ACCOUNT_SID=ACxxx
TWILIO_AUTH_TOKEN=xxx
TWILIO_FROM_NUMBER=+5511999999999
BASE_URL=https://seu-app.onrender.com
PORT=4000
```

#### Passo 4: Deploy do Frontend
1. No Render, crie um "Static Site"
2. Conecte o mesmo repositório
3. Configure:
   - **Build Command**: (deixe vazio ou `echo "No build needed"`)
   - **Publish Directory**: `/` (raiz)
4. Aponte para o arquivo `sistema.html.html`

**Resultado**: Você terá um link tipo `https://microkids-financeiro.onrender.com`

---

### **Opção 2: Railway.app (Alternativa)**

1. Acesse: https://railway.app
2. Login com GitHub
3. "New Project" → "Deploy from GitHub repo"
4. Configure as variáveis de ambiente
5. Deploy automático!

---

### **Opção 3: Vercel + Render (Frontend + Backend Separados)**

#### Backend (Render):
- Siga os passos da Opção 1

#### Frontend (Vercel):
1. Acesse: https://vercel.com
2. Importe o repositório
3. Configure:
   - **Framework Preset**: Other
   - **Build Command**: (vazio)
   - **Output Directory**: `/`
4. No `sistema.html.html`, altere:
   ```javascript
   const API_BASE = 'https://seu-backend.onrender.com';
   ```

---

## 📝 Ajustes Necessários no Código

### 1. Atualizar `sistema.html.html`

Altere a linha do `API_BASE` para usar a URL do servidor online:

```javascript
// Para desenvolvimento local:
// const API_BASE = 'http://localhost:4000';

// Para produção (ajuste com seu link):
const API_BASE = 'https://seu-backend.onrender.com';
```

### 2. Configurar CORS no Backend

O arquivo `backend/src/main.ts` já tem `cors: true`, mas vamos garantir:

```typescript
const app = await NestFactory.create(AppModule, { 
  cors: {
    origin: ['https://seu-frontend.vercel.app', 'http://localhost:4000'],
    credentials: true,
  }
});
```

### 3. Banco de Dados Online

Para produção, use um banco online:
- **SQLite** (atual) - Funciona, mas pode ter limitações
- **PostgreSQL** (recomendado) - Render oferece PostgreSQL grátis

---

## 🔧 Configuração para PostgreSQL (Opcional mas Recomendado)

### No Render:
1. Crie um "PostgreSQL" database
2. Copie a connection string
3. Use no `.env`:
   ```
   DATABASE_URL=postgresql://user:pass@host:5432/dbname
   ```

### Atualizar Prisma:
```prisma
datasource db {
  provider = "postgresql"  // Mude de "sqlite" para "postgresql"
  url      = env("DATABASE_URL")
}
```

---

## 📱 Compartilhar o Link

Depois do deploy:
1. Você terá um link tipo: `https://microkids-financeiro.vercel.app`
2. Compartilhe pelo WhatsApp, e-mail, etc.
3. A pessoa acessa e usa direto no navegador!

---

## ⚠️ Limitações do Plano Gratuito

- **Render**: Pode "dormir" após 15min de inatividade (primeira requisição demora)
- **Vercel**: Limite de requisições/hora
- **Railway**: $5 grátis/mês, depois paga

---

## 🎯 Solução Mais Simples (Recomendada para Você)

**Usar Render para TUDO:**
1. Backend no Render (Web Service)
2. Frontend também no Render (Static Site)
3. Tudo no mesmo lugar, mais fácil de gerenciar

---

## 📋 Checklist de Deploy

- [ ] Código no GitHub
- [ ] Conta no Render/Vercel criada
- [ ] Backend deployado
- [ ] Variáveis de ambiente configuradas
- [ ] Frontend deployado
- [ ] `API_BASE` atualizado no frontend
- [ ] Testado o link compartilhado

---

## 🆘 Precisa de Ajuda?

Se tiver dúvidas durante o deploy, me avise!

