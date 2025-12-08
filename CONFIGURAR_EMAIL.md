# 📧 Como Configurar Envio de E-mails

## ❌ Problema

Os lembretes são processados, mas nenhum e-mail é enviado porque as variáveis de ambiente de e-mail não estão configuradas no Render.

## ✅ Solução

Configure as variáveis de ambiente no Render para habilitar o envio de e-mails.

---

## 📋 Passo a Passo

### 1️⃣ Acesse o Render

1. Vá em **render.com** → Faça login
2. Vá em **Dashboard**
3. Clique no serviço **BACKEND** (`agente-financeiro-mk-backend`)

### 2️⃣ Vá em Environment Variables

1. No menu lateral, clique em **"Environment"** ou **"Environment Variables"**
2. Você verá a lista de variáveis existentes

### 3️⃣ Adicione as Variáveis de E-mail

Clique em **"+ Add Environment Variable"** e adicione cada uma:

#### **EMAIL_HOST**
- **Key:** `EMAIL_HOST`
- **Value:** O servidor SMTP do seu provedor de e-mail
  - **Gmail:** `smtp.gmail.com`
  - **Outlook/Hotmail:** `smtp-mail.outlook.com`
  - **Yahoo:** `smtp.mail.yahoo.com`
  - **Outros:** Consulte seu provedor

#### **EMAIL_PORT**
- **Key:** `EMAIL_PORT`
- **Value:** `587` (padrão, funciona para maioria)
  - Ou `465` se usar SSL direto
  - Ou `25` para alguns provedores

#### **EMAIL_USER**
- **Key:** `EMAIL_USER`
- **Value:** Seu e-mail completo (ex: `seuemail@gmail.com`)

#### **EMAIL_PASSWORD**
- **Key:** `EMAIL_PASSWORD`
- **Value:** Sua senha de e-mail
  - **Gmail:** Use "Senha de App" (não a senha normal)
    - Como criar: https://support.google.com/accounts/answer/185833

#### **EMAIL_FROM** (Opcional)
- **Key:** `EMAIL_FROM`
- **Value:** Nome que aparece como remetente (ex: `"Microkids Financeiro" <seuemail@gmail.com>`)
- Se não configurar, usa o `EMAIL_USER`

### 4️⃣ Salve e Aguarde Deploy

1. Após adicionar todas as variáveis, **salve**
2. O Render pode fazer deploy automático
3. Aguarde 1-2 minutos

---

## 🔐 Exemplo: Configuração Gmail

Se você usa Gmail:

```
EMAIL_HOST = smtp.gmail.com
EMAIL_PORT = 587
EMAIL_USER = seuemail@gmail.com
EMAIL_PASSWORD = sua-senha-de-app-aqui
EMAIL_FROM = seuemail@gmail.com
```

**⚠️ IMPORTANTE para Gmail:**
- Não use sua senha normal!
- Use "Senha de App": https://support.google.com/accounts/answer/185833
- Ative verificação em 2 etapas primeiro

---

## ✅ Como Verificar se Funcionou

1. **Verifique os logs do backend:**
   - Render → Backend → Logs
   - Procure por: `✅ Serviço de e-mail inicializado`
   - Se aparecer, está configurado! ✅

2. **Teste novamente:**
   - No site, clique em "Processar Lembretes"
   - Deve mostrar: `E-mails: 1` (ou mais) em vez de `E-mails: 0`

---

## 🚨 Se Ainda Não Funcionar

1. **Verifique os logs:**
   - Render → Backend → Logs
   - Procure por erros relacionados a e-mail
   - Me envie os erros

2. **Verifique as variáveis:**
   - Certifique-se de que todas estão corretas
   - Sem espaços extras
   - Sem aspas desnecessárias

3. **Teste com outro provedor:**
   - Alguns provedores bloqueiam SMTP
   - Tente com Gmail ou Outlook

---

## 📝 Resumo

**Variáveis necessárias:**
- ✅ `EMAIL_HOST` - Servidor SMTP
- ✅ `EMAIL_PORT` - Porta (geralmente 587)
- ✅ `EMAIL_USER` - Seu e-mail
- ✅ `EMAIL_PASSWORD` - Sua senha (ou senha de app)

**Variável opcional:**
- `EMAIL_FROM` - Nome do remetente

Depois de configurar, teste novamente! 📧


