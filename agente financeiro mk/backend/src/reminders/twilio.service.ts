import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as twilio from 'twilio';

@Injectable()
export class TwilioService {
  private readonly logger = new Logger(TwilioService.name);
  private client: twilio.Twilio | null = null;
  private readonly accountSid: string;
  private readonly authToken: string;
  private readonly fromNumber: string;

  constructor(private readonly config: ConfigService) {
    this.accountSid = this.config.get<string>('TWILIO_ACCOUNT_SID') || '';
    this.authToken = this.config.get<string>('TWILIO_AUTH_TOKEN') || '';
    this.fromNumber = this.config.get<string>('TWILIO_FROM_NUMBER') || '';

    if (this.accountSid && this.authToken) {
      this.client = twilio(this.accountSid, this.authToken);
      this.logger.log('✅ Twilio inicializado com sucesso');
    } else {
      this.logger.warn('⚠️ Twilio não configurado. Configure TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN e TWILIO_FROM_NUMBER no .env');
    }
  }

  async makeCall(to: string, message: string): Promise<{ success: boolean; callSid?: string; error?: string }> {
    if (!this.client) {
      return {
        success: false,
        error: 'Twilio não configurado. Configure as variáveis de ambiente.',
      };
    }

    try {
      // Remove caracteres não numéricos do número
      const cleanNumber = to.replace(/\D/g, '');
      
      // Adiciona código do país se necessário (assume Brasil +55)
      const formattedNumber = cleanNumber.startsWith('55') 
        ? `+${cleanNumber}` 
        : `+55${cleanNumber}`;

      this.logger.log(`📞 Fazendo ligação para ${formattedNumber}...`);

      // Cria uma URL de TwiML para a mensagem
      // Usa o endpoint local ou uma URL configurada
      const baseUrl = this.config.get<string>('BASE_URL') || 'http://localhost:4000';
      const twimlUrl = `${baseUrl}/reminders/twiml/${Date.now()}`;

      // Gera TwiML inline (alternativa mais simples)
      const twiml = this.generateTwiML(message);

      const call = await this.client.calls.create({
        to: formattedNumber,
        from: this.fromNumber,
        twiml: twiml, // Usa TwiML inline em vez de URL
      });

      this.logger.log(`✅ Ligação iniciada: ${call.sid}`);
      return {
        success: true,
        callSid: call.sid,
      };
    } catch (error) {
      this.logger.error(`❌ Erro ao fazer ligação: ${error.message}`, error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Gera TwiML para uma mensagem de voz
   * Você pode hospedar isso em um endpoint ou usar Twilio Functions
   */
  generateTwiML(message: string): string {
    // Escapa caracteres especiais para XML
    const escapedMessage = message
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');

    return `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say language="pt-BR" voice="alice">${escapedMessage}</Say>
  <Pause length="2"/>
  <Say language="pt-BR" voice="alice">${escapedMessage}</Say>
</Response>`;
  }
}

