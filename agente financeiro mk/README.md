# 💰 Sistema Financeiro Microkids

Sistema completo de gestão financeira com assistente inteligente, lembretes automáticos e integração com Excel.

## ✨ Funcionalidades

- 📊 **Controle Financeiro**: Visualização e gestão de transações
- 📈 **Dashboard**: Indicadores e gráficos financeiros
- 🤖 **Assistente Inteligente**: Comandos de voz para adicionar despesas, marcar pagos, etc.
- 🔔 **Lembretes Automáticos**: E-mails e ligações para pagamentos próximos do vencimento
- 📧 **Notificações**: E-mails automáticos via Gmail
- 📞 **Ligações**: Ligações automáticas via Twilio
- 📝 **Sincronização**: Sincronização bidirecional com Excel

## 🚀 Instalação Rápida

### Pré-requisitos

- Node.js 18+ ([Download](https://nodejs.org/))
- Arquivo Excel com transações financeiras

### Passo a Passo

1. **Clone ou copie este projeto**

2. **Entre na pasta backend:**
   ```bash
   cd backend
   ```

3. **Instale as dependências:**
   ```bash
   npm install
   ```

4. **Configure o ambiente:**
   ```bash
   copy .env.example .env
   ```
   Edite o arquivo `.env` com suas credenciais.

5. **Configure o banco de dados:**
   ```bash
   npx prisma generate
   npx prisma migrate deploy
   ```

6. **Inicie o servidor:**
   ```bash
   npm run start:dev
   ```
   Ou use o script:
   ```bash
   iniciar-backend.bat
   ```

7. **Abra o sistema:**
   - Abra o arquivo `sistema.html.html` no navegador
   - Ou acesse `http://localhost:4000` (se configurado)

## ⚙️ Configuração

### Arquivo .env

Configure as seguintes variáveis no arquivo `backend/.env`:

```env
# Banco de Dados
DATABASE_URL="file:./prisma/dev.db"

# Excel
PATH_EXCEL="C:/caminho/para/financeiro.xlsx"

# API
PORT=4000

# Groq AI (Assistente)
GROQ_API_KEY=sua_chave_groq

# E-mail (Gmail)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=seu-email@gmail.com
EMAIL_PASSWORD=sua-senha-de-app  # Use "Senha de App" do Google
EMAIL_FROM=seu-email@gmail.com

# Twilio (Ligações)
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=seu_auth_token
TWILIO_FROM_NUMBER=+5511999999999
BASE_URL=http://localhost:4000
```

### Como Obter Credenciais

- **Groq API**: https://console.groq.com/
- **Gmail Senha de App**: https://myaccount.google.com/apppasswords
- **Twilio**: https://www.twilio.com/try-twilio

Veja `LEMBRETES_CONFIG.md` para instruções detalhadas.

## 📖 Uso

### Assistente Inteligente

Fale com o assistente usando comandos naturais:

- "adicionar despesa salário vitor: 1500 reais"
- "marcar salário vitor como pago"
- "excluir transação teste"
- "enviar lembrete agora"

### Lembretes Automáticos

1. Acesse a aba "Lembretes & Chamadas"
2. Configure:
   - Telefone para receber ligações
   - E-mail para notificações
   - Dias antes do vencimento (ex: "2,0" = 2 dias antes e no vencimento)
   - Horário para ligações
3. Salve as configurações
4. Os lembretes são enviados automaticamente!

## 📁 Estrutura do Projeto

```
sistema-financeiro-mk/
├── backend/              # API NestJS
│   ├── src/
│   │   ├── finance/     # Módulo financeiro
│   │   ├── assistant/   # Assistente inteligente
│   │   └── reminders/   # Lembretes e chamadas
│   ├── prisma/          # Banco de dados
│   └── package.json
├── sistema.html.html    # Interface web
└── README.md
```

## 🛠️ Scripts Disponíveis

```bash
# Desenvolvimento
npm run start:dev        # Inicia servidor em modo desenvolvimento

# Banco de Dados
npm run prisma:generate  # Gera cliente Prisma
npm run prisma:migrate   # Executa migrações

# Sincronização
npm run sync:all         # Sincroniza Excel → Banco
```

## 📚 Documentação

- `LEMBRETES_CONFIG.md` - Configuração de lembretes e chamadas
- `COMO_COMPARTILHAR.md` - Como compartilhar o sistema

## 🔒 Segurança

- ⚠️ **NUNCA** compartilhe o arquivo `.env` com credenciais
- ⚠️ **NUNCA** faça commit do `.env` no Git
- ✅ Use `.env.example` como template
- ✅ Cada instalação deve ter seu próprio `.env`

## 🐛 Problemas Comuns

### Erro ao conectar no banco
- Verifique se o arquivo `prisma/dev.db` existe
- Execute: `npx prisma migrate deploy`

### Erro de e-mail
- Use "Senha de App" do Google, não a senha normal
- Verifique se a verificação em duas etapas está ativada

### Erro de ligação
- Verifique se o Twilio está configurado
- Contas trial só ligam para números verificados

## 📞 Suporte

Para dúvidas ou problemas, consulte a documentação ou abra uma issue.

## 📄 Licença

Uso interno - Microkids

---

**Desenvolvido com ❤️ para Microkids**

