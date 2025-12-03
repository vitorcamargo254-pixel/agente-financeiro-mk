import { Controller, Get, Post, Put, Body, Query, Res, Param } from '@nestjs/common';
import { Response } from 'express';
import { RemindersService } from './reminders.service';
import { TwilioService } from './twilio.service';

@Controller('reminders')
export class RemindersController {
  constructor(
    private readonly remindersService: RemindersService,
    private readonly twilioService: TwilioService,
  ) {}

  @Get('config')
  async getConfig() {
    return await this.remindersService.getConfig();
  }

  @Put('config')
  async updateConfig(@Body() data: any) {
    return await this.remindersService.updateConfig(data);
  }

  @Post('process')
  async processReminders() {
    // Timeout geral de 60 segundos para todo o processamento
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Timeout: Processamento demorou mais de 60 segundos')), 60000);
    });

    try {
      const result = await Promise.race([
        this.remindersService.processReminders(),
        timeoutPromise,
      ]);
      return result;
    } catch (error: any) {
      // Sempre retorna uma resposta, mesmo em caso de erro
      return {
        processed: 0,
        emailsSent: 0,
        callsMade: 0,
        errors: [error.message || 'Erro desconhecido no processamento'],
      };
    }
  }

  @Get('logs')
  async getLogs(@Query('limit') limit?: string) {
    return await this.remindersService.getLogs(limit ? parseInt(limit, 10) : 50);
  }

  @Get('upcoming')
  async getUpcoming(@Query('dias') dias?: string) {
    const diasArray = dias ? dias.split(',').map((d) => parseInt(d.trim(), 10)) : [2, 0];
    return await this.remindersService.getUpcomingTransactions(diasArray);
  }

  /**
   * Endpoint que retorna TwiML para mensagens de voz do Twilio
   */
  @Post('twiml/:messageId')
  async getTwiml(@Param('messageId') messageId: string, @Res() res: Response) {
    // Por enquanto, retorna uma mensagem genérica
    // Você pode melhorar isso armazenando mensagens no banco
    const message = 'Olá! Este é um lembrete do sistema financeiro Microkids sobre um pagamento próximo do vencimento. Por favor, verifique seu e-mail para mais detalhes.';
    const twiml = this.twilioService.generateTwiML(message);
    res.type('text/xml');
    res.send(twiml);
  }
}

