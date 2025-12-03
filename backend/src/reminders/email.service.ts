import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private transporter: nodemailer.Transporter | null = null;

  constructor(private readonly config: ConfigService) {
    const emailHost = this.config.get<string>('EMAIL_HOST');
    const emailPort = this.config.get<number>('EMAIL_PORT', 587);
    const emailUser = this.config.get<string>('EMAIL_USER');
    const emailPass = this.config.get<string>('EMAIL_PASSWORD');
    const emailFrom = this.config.get<string>('EMAIL_FROM') || emailUser;

    if (emailHost && emailUser && emailPass) {
      this.logger.log(`📧 Configurando transporte de e-mail...`);
      this.logger.log(`   Host: ${emailHost}`);
      this.logger.log(`   Port: ${emailPort}`);
      this.logger.log(`   User: ${emailUser}`);
      this.logger.log(`   Password: ${emailPass ? '***' : 'não configurado'}`);
      
      this.transporter = nodemailer.createTransport({
        host: emailHost,
        port: emailPort,
        secure: emailPort === 465, // true para 465, false para outras portas
        auth: {
          user: emailUser,
          pass: emailPass,
        },
        // Timeouts aumentados para evitar problemas de conexão
        connectionTimeout: 10000, // 10 segundos para conectar
        greetingTimeout: 10000, // 10 segundos para greeting
        socketTimeout: 10000, // 10 segundos para operações de socket
        // Tenta usar TLS se disponível
        requireTLS: false,
        tls: {
          rejectUnauthorized: false, // Aceita certificados auto-assinados
        },
      });

      this.logger.log('✅ Serviço de e-mail inicializado');
      
      // Verifica conexão de forma assíncrona (não bloqueia inicialização)
      this.verifyConnection().catch(() => {
        // Erro já foi logado no método verifyConnection
      });
    } else {
      this.logger.warn('⚠️ E-mail não configurado. Configure EMAIL_HOST, EMAIL_USER e EMAIL_PASSWORD no .env');
      this.logger.warn(`   EMAIL_HOST: ${emailHost || 'não configurado'}`);
      this.logger.warn(`   EMAIL_USER: ${emailUser || 'não configurado'}`);
      this.logger.warn(`   EMAIL_PASSWORD: ${emailPass ? 'configurado' : 'não configurado'}`);
    }
  }

  /**
   * Verifica a conexão SMTP de forma assíncrona
   */
  private async verifyConnection(): Promise<void> {
    if (!this.transporter) return;
    
    try {
      await this.transporter.verify();
      this.logger.log('✅ Conexão SMTP verificada com sucesso!');
    } catch (verifyError: any) {
      this.logger.error(`❌ Erro ao verificar conexão SMTP: ${verifyError.message}`);
      this.logger.warn('⚠️ Serviço de e-mail configurado mas conexão falhou. Verifique as credenciais.');
      // Continua mesmo assim - pode funcionar na hora de enviar
    }
  }

  async sendEmail(
    to: string,
    subject: string,
    html: string,
    text?: string,
  ): Promise<{ success: boolean; messageId?: string; error?: string }> {
    if (!this.transporter) {
      const emailHost = this.config.get<string>('EMAIL_HOST');
      const emailUser = this.config.get<string>('EMAIL_USER');
      const emailPass = this.config.get<string>('EMAIL_PASSWORD');
      
      this.logger.error('❌ TRANSPORTER NÃO ESTÁ CONFIGURADO!');
      this.logger.error(`   EMAIL_HOST: ${emailHost ? '✅ configurado' : '❌ não configurado'}`);
      this.logger.error(`   EMAIL_USER: ${emailUser ? '✅ configurado' : '❌ não configurado'}`);
      this.logger.error(`   EMAIL_PASSWORD: ${emailPass ? '✅ configurado' : '❌ não configurado'}`);
      
      return {
        success: false,
        error: 'Serviço de e-mail não configurado. Configure as variáveis de ambiente.',
      };
    }

    try {
      const emailFrom = this.config.get<string>('EMAIL_FROM') || this.config.get<string>('EMAIL_USER');
      
      this.logger.log(`📧 Enviando e-mail de ${emailFrom} para ${to}...`);
      this.logger.log(`📧 Assunto: ${subject}`);

      const info = await this.transporter.sendMail({
        from: emailFrom,
        to,
        subject,
        text: text || html.replace(/<[^>]*>/g, ''), // Remove HTML se text não for fornecido
        html,
      });

      this.logger.log(`✅ E-mail enviado para ${to}: ${info.messageId}`);
      return {
        success: true,
        messageId: info.messageId,
      };
    } catch (error: any) {
      const errorMessage = error.message || 'Erro desconhecido ao enviar e-mail';
      this.logger.error(`❌ Erro ao enviar e-mail para ${to}: ${errorMessage}`);
      this.logger.error(`❌ Detalhes do erro:`, error);
      return {
        success: false,
        error: errorMessage,
      };
    }
  }

  /**
   * Envia um lembrete de pagamento por e-mail
   */
  async sendPaymentReminder(
    to: string,
    transaction: {
      descricao: string;
      valor: number;
      data: Date;
      diasRestantes: number;
    },
  ): Promise<{ success: boolean; messageId?: string; error?: string }> {
    const valorFormatado = Math.abs(transaction.valor).toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    });

    const dataFormatada = transaction.data.toLocaleDateString('pt-BR');
    const isVencendoHoje = transaction.diasRestantes === 0;
    const isVencendoAmanha = transaction.diasRestantes === 1;

    let titulo = '';
    if (isVencendoHoje) {
      titulo = `⚠️ URGENTE: Pagamento vence HOJE - ${transaction.descricao}`;
    } else if (isVencendoAmanha) {
      titulo = `⚠️ Pagamento vence AMANHÃ - ${transaction.descricao}`;
    } else {
      titulo = `📅 Lembrete: Pagamento vence em ${transaction.diasRestantes} dias - ${transaction.descricao}`;
    }

    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 8px 8px 0 0; }
    .content { background: #f9f9f9; padding: 20px; border-radius: 0 0 8px 8px; }
    .transaction-detail { background: white; padding: 15px; margin: 15px 0; border-left: 4px solid #667eea; border-radius: 4px; }
    .value { font-size: 24px; font-weight: bold; color: #e74c3c; }
    .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🔔 Lembrete de Pagamento</h1>
      <p>Sistema Financeiro Microkids</p>
    </div>
    <div class="content">
      <h2>${titulo}</h2>
      
      <div class="transaction-detail">
        <p><strong>Descrição:</strong> ${transaction.descricao}</p>
        <p><strong>Valor:</strong> <span class="value">${valorFormatado}</span></p>
        <p><strong>Data de Vencimento:</strong> ${dataFormatada}</p>
        <p><strong>Dias Restantes:</strong> ${transaction.diasRestantes === 0 ? '<span style="color: red; font-weight: bold;">VENCE HOJE!</span>' : transaction.diasRestantes}</p>
      </div>

      ${isVencendoHoje ? '<p style="background: #fee; padding: 15px; border-radius: 4px; border-left: 4px solid #e74c3c;"><strong>⚠️ ATENÇÃO:</strong> Este pagamento vence HOJE! Por favor, efetue o pagamento o quanto antes.</p>' : ''}
      
      <p>Este é um lembrete automático do sistema financeiro Microkids.</p>
    </div>
    <div class="footer">
      <p>Este e-mail foi enviado automaticamente. Por favor, não responda.</p>
    </div>
  </div>
</body>
</html>
    `;

    return await this.sendEmail(to, titulo, html);
  }
}

