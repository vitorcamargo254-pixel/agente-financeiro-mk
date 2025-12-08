# 🔍 Como Descobrir a URL do Backend no Render

## Passo a Passo

### 1️⃣ Acesse o Render.com
- Vá para: https://dashboard.render.com
- Faça login na sua conta

### 2️⃣ Encontre seu Backend
- Na lista de serviços, procure pelo serviço do **backend**
- O nome pode ser algo como:
  - `agente-financeiro-mk`
  - `microkids-backend`
  - `agente-financeiro-mk-backend`
  - Ou outro nome que você escolheu

### 3️⃣ Copie a URL
- Clique no serviço do backend
- Você verá uma seção com **"URL"** ou **"Service URL"**
- A URL será algo como: `https://agente-financeiro-mk-xxxxx.onrender.com`
- **Copie essa URL completa**

### 4️⃣ Me Envie a URL
- Envie a URL para mim
- Ou edite o arquivo `index.html` na linha 389 e substitua:
  ```javascript
  const BACKEND_URL = 'https://SUA-URL-AQUI.onrender.com';
  ```

## ⚠️ Importante

- A URL do backend é **diferente** da URL do frontend
- O frontend está em: `agente-financeiro-mk-1.onrender.com`
- O backend precisa estar em uma URL separada (ex: `agente-financeiro-mk.onrender.com`)

## 🔧 Se Não Encontrar o Backend

1. Verifique se você criou o serviço do backend no Render
2. Se não criou, siga o guia `SOLUCAO_DEFINITIVA_RENDER.md`
3. Certifique-se de que o backend está **online** (status verde)

## ✅ Depois de Configurar

1. Faça commit e push no GitHub Desktop
2. Aguarde o deploy do frontend (1-2 minutos)
3. Teste novamente a sincronização


