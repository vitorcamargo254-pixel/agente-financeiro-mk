# 🔧 Problema: Timeout de Conexão SMTP no Render

## ❌ Problema Identificado

O log mostra:
```
❌ Erro ao verificar conexão SMTP: Connection timeout
⚠️ Serviço de e-mail configurado mas conexão falhou
```

## 🔍 Causa

O **Render pode bloquear conexões SMTP de saída** por padrão. Isso é comum em serviços de hospedagem gratuitos para prevenir spam.

## ✅ Soluções

### Opção 1: Usar Serviço de E-mail Externo (Recomendado)

Use um serviço especializado em envio de e-mails:

#### **SendGrid** (Recomendado - 100 e-mails/dia grátis)
1. Crie conta em: https://sendgrid.com
2. Crie API Key
3. Configure no Render:
   ```
   EMAIL_HOST = smtp.sendgrid.net
   EMAIL_PORT = 587
   EMAIL_USER = apikey
   EMAIL_PASSWORD = sua-api-key-do-sendgrid
   ```

#### **Mailgun** (5.000 e-mails/mês grátis)
1. Crie conta em: https://www.mailgun.com
2. Configure no Render:
   ```
   EMAIL_HOST = smtp.mailgun.org
   EMAIL_PORT = 587
   EMAIL_USER = seu-usuario-mailgun
   EMAIL_PASSWORD = sua-senha-mailgun
   ```

#### **Resend** (3.000 e-mails/mês grátis)
1. Crie conta em: https://resend.com
2. Use API diretamente (não SMTP)

### Opção 2: Verificar Configuração Gmail

Se quiser continuar com Gmail:

1. **Use Senha de App** (não senha normal):
   - Ative verificação em 2 etapas
   - Crie senha de app: https://support.google.com/accounts/answer/185833
   - Use essa senha no `EMAIL_PASSWORD`

2. **Verifique se Render permite SMTP:**
   - Alguns planos do Render bloqueiam SMTP
   - Pode precisar de plano pago

### Opção 3: Usar API do Gmail (Mais Complexo)

Em vez de SMTP, usar Gmail API diretamente (requer mais código).

## 🎯 Recomendação

**Use SendGrid** - É gratuito, confiável e funciona bem no Render.

## 📋 Próximos Passos

1. Escolha um serviço (SendGrid recomendado)
2. Configure as variáveis no Render
3. Teste novamente

## 💡 Nota

A verificação de conexão pode falhar, mas o envio pode funcionar na hora de usar. O código já está preparado para tentar enviar mesmo se a verificação falhar.



