# 🔧 Corrigir DATABASE_URL no Render

## 🎯 Problema

O erro mostra:
```
error: Error validating datasource `db`: the URL must start with the protocol `file:`.
```

Isso significa que a variável `DATABASE_URL` no Render **não está configurada** ou está **incorreta**.

## ✅ Solução

### 1️⃣ Acesse o Render

1. Vá em render.com → Dashboard
2. Clique no serviço **BACKEND** (`agente-financeiro-mk-backend`)

### 2️⃣ Vá em Environment

1. No menu lateral, clique em **"Environment"** ou **"Environment Variables"**
2. Você verá a lista de variáveis

### 3️⃣ Verifique ou Adicione DATABASE_URL

#### Se NÃO tiver DATABASE_URL:
1. Clique em **"+ Add Environment Variable"**
2. Configure:
   - **Key:** `DATABASE_URL`
   - **Value:** `file:./dev.db`
   - Clique em **"Add"**

#### Se JÁ tiver DATABASE_URL:
1. Clique no **valor** da variável `DATABASE_URL`
2. Verifique se está exatamente: `file:./dev.db`
3. Se não estiver, apague e digite: `file:./dev.db`
4. **Salve**

### 4️⃣ Verificar Formato Correto

O valor deve ser **exatamente**:
```
file:./dev.db
```

**NÃO use:**
- `./dev.db` ❌ (falta `file:`)
- `file:dev.db` ❌ (falta `./`)
- `file://./dev.db` ❌ (não precisa `//`)
- `file:./backend/dev.db` ❌ (caminho errado)

**USE:**
- `file:./dev.db` ✅

### 5️⃣ Aguardar Deploy

1. Após salvar, o Render pode fazer deploy automático
2. Ou vá em **"Manual Deploy"** → **"Deploy latest commit"**
3. Aguarde 2-3 minutos

## 📋 Verificar se Funcionou

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

O problema é que `DATABASE_URL` não está configurada ou está incorreta.

**Solução:** Configure como `file:./dev.db` no Render → Backend → Environment

