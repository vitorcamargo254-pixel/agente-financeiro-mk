import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { RemindersService } from './reminders.service';

@Injectable()
export class RemindersScheduler {
  private readonly logger = new Logger(RemindersScheduler.name);

  constructor(private readonly remindersService: RemindersService) {}

  /**
   * Executa verificação de lembretes a cada hora
   */
  @Cron(CronExpression.EVERY_HOUR)
  async handleReminders() {
    this.logger.log('⏰ Executando verificação automática de lembretes...');
    try {
      const result = await this.remindersService.processReminders();
      this.logger.log(
        `✅ Verificação concluída: ${result.processed} transações, ${result.emailsSent} e-mails, ${result.callsMade} ligações`,
      );
    } catch (error) {
      this.logger.error('❌ Erro ao processar lembretes:', error);
    }
  }

  /**
   * Executa verificação de lembretes diariamente às 8h
   */
  @Cron('0 8 * * *') // Todo dia às 8h
  async handleDailyReminders() {
    this.logger.log('📅 Executando verificação diária de lembretes...');
    try {
      const result = await this.remindersService.processReminders();
      this.logger.log(
        `✅ Verificação diária concluída: ${result.processed} transações, ${result.emailsSent} e-mails, ${result.callsMade} ligações`,
      );
    } catch (error) {
      this.logger.error('❌ Erro ao processar lembretes diários:', error);
    }
  }
}

