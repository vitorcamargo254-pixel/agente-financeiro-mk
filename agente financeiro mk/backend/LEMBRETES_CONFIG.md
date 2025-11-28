# Configuração de Lembretes e Chamadas

## 📧 Configuração de E-mail

Para enviar e-mails de lembretes, você precisa configurar as seguintes variáveis no arquivo `.env`:

### Opção 1: Gmail (Recomendado para testes)

```env
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=seu-email@gmail.com
EMAIL_PASSWORD=sua-senha-de-app  # Use "Senha de App" do Google, não a senha normal
EMAIL_FROM=seu-email@gmail.com
```

**Como obter senha de app do Gmail:**
1. Acesse: https://myaccount.google.com/apppasswords
2. Gere uma nova senha de app
3. Use essa senha no `EMAIL_PASSWORD`

### Opção 2: Outlook/Hotmail

```env
EMAIL_HOST=smtp-mail.outlook.com
EMAIL_PORT=587
EMAIL_USER=seu-email@outlook.com
EMAIL_PASSWORD=sua-senha
EMAIL_FROM=seu-email@outlook.com
```

### Opção 3: Servidor SMTP Personalizado

```env
EMAIL_HOST=seu-servidor-smtp.com
EMAIL_PORT=587  # ou 465 para SSL
EMAIL_USER=usuario@seu-servidor.com
EMAIL_PASSWORD=sua-senha
EMAIL_FROM=noreply@seu-servidor.com
```

## 📞 Configuração do Twilio

Para fazer ligações automáticas, você precisa:

1. **Criar uma conta no Twilio**: https://www.twilio.com/try-twilio
2. **Obter suas credenciais** no painel do Twilio:
   - Account SID
   - Auth Token
   - Número de telefone (From Number)

3. **Adicionar no `.env`**:

```env
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=seu_auth_token_aqui
TWILIO_FROM_NUMBER=+5511999999999  # Número fornecido pelo Twilio (formato: +5511999999999)
BASE_URL=http://localhost:4000  # URL base da sua aplicação (para TwiML)
```

### Como obter credenciais do Twilio:

1. Acesse: https://console.twilio.com/
2. No dashboard, você verá:
   - **Account SID**: Começa com "AC"
   - **Auth Token**: Clique em "show" para ver
   - **Phone Number**: Vá em "Phone Numbers" > "Manage" > "Buy a number" (ou use um número de trial)

### Nota sobre Twilio Trial:

- Contas trial do Twilio só podem ligar para números verificados
- Para produção, você precisa fazer upgrade da conta
- O número "From" deve ser um número Twilio válido

## 🔧 Configuração no Sistema

1. Acesse a aba **"Lembretes & Chamadas"** no sistema
2. Preencha:
   - **Telefone para Ligações**: Número que receberá as ligações (apenas números, com DDD)
   - **E-mail para Notificações**: E-mail que receberá os lembretes
   - **Dias Antes do Vencimento**: Ex: "2,0" = 2 dias antes e no vencimento
   - **Horário para Ligações**: Ex: "09:00"
3. Marque as opções desejadas:
   - ✅ Lembretes Ativos
   - ✅ Enviar E-mails
   - ✅ Fazer Ligações
4. Clique em **"Salvar Configurações"**

## ⏰ Agendamento Automático

O sistema verifica automaticamente:
- **A cada hora**: Verifica transações próximas do vencimento
- **Diariamente às 8h**: Verificação diária completa

Você também pode processar manualmente clicando em **"Processar Lembretes Agora"**.

## 🧪 Testar

1. Configure as credenciais no `.env`
2. Reinicie o servidor backend
3. Acesse a aba "Lembretes & Chamadas"
4. Configure os lembretes
5. Clique em "Processar Lembretes Agora" para testar

## 📝 Exemplo de Arquivo .env Completo

```env
# Banco de Dados
DATABASE_URL="file:./prisma/dev.db"

# Excel
PATH_EXCEL="C:/caminho/para/financeiro.xlsx"

# API
PORT=4000

# Groq AI
GROQ_API_KEY=sua_chave_groq

# E-mail
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=seu-email@gmail.com
EMAIL_PASSWORD=sua-senha-de-app
EMAIL_FROM=seu-email@gmail.com

# Twilio
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=seu_auth_token
TWILIO_FROM_NUMBER=+5511999999999
BASE_URL=http://localhost:4000
```

