import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';
import { TwilioService } from './twilio.service';
import { EmailService } from './email.service';
import { FinanceService } from '../finance/finance.service';

@Injectable()
export class RemindersService {
  private readonly logger = new Logger(RemindersService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly twilioService: TwilioService,
    private readonly emailService: EmailService,
    private readonly financeService: FinanceService,
  ) {}

  /**
   * Busca transações pendentes próximas do vencimento
   */
  async getUpcomingTransactions(diasAntes: number[]): Promise<
    Array<{
      transaction: any;
      diasRestantes: number;
      dataVencimento: Date;
    }>
  > {
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);

    // Busca todas as transações pendentes
    const allTransactions = await this.financeService.findAll(1, 10000);
    const pendentes = allTransactions.items.filter((t) => t.status === 'pendente');

    const upcoming: Array<{
      transaction: any;
      diasRestantes: number;
      dataVencimento: Date;
    }> = [];

    for (const transaction of pendentes) {
      const dataVencimento = new Date(transaction.data);
      dataVencimento.setHours(0, 0, 0, 0);

      // Calcula dias restantes (pode ser negativo se já venceu)
      const diffTime = dataVencimento.getTime() - hoje.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      // Verifica se está dentro dos dias configurados
      if (diasAntes.includes(diffDays)) {
        upcoming.push({
          transaction,
          diasRestantes: diffDays,
          dataVencimento,
        });
      }
    }

    return upcoming;
  }

  /**
   * Processa e envia lembretes para transações próximas do vencimento
   * @param forceCall Se true, força ligações mesmo fora do horário configurado
   */
  async processReminders(forceCall = false): Promise<{
    processed: number;
    emailsSent: number;
    callsMade: number;
    errors: string[];
  }> {
    this.logger.log('🔄 Processando lembretes...');

    // Busca configuração de lembretes
    const config = await this.prisma.reminderConfig.findFirst({
      where: { ativo: true },
    });

    if (!config) {
      this.logger.warn('⚠️ Nenhuma configuração de lembretes ativa encontrada');
      return {
        processed: 0,
        emailsSent: 0,
        callsMade: 0,
        errors: ['Nenhuma configuração de lembretes ativa'],
      };
    }

    // Parse dos dias antes do vencimento
    let diasAntes: number[];
    try {
      diasAntes = JSON.parse(config.diasAntesVencimento).map((d: string) => parseInt(d, 10));
    } catch {
      diasAntes = [2, 0]; // Padrão: 2 dias antes e no vencimento
    }

    // Busca transações próximas do vencimento
    const upcoming = await this.getUpcomingTransactions(diasAntes);

    this.logger.log(`📊 Encontradas ${upcoming.length} transações para lembrar`);

    let emailsSent = 0;
    let callsMade = 0;
    const errors: string[] = [];

    for (const item of upcoming) {
      const { transaction, diasRestantes } = item;
      const valorFormatado = Math.abs(Number(transaction.valor)).toLocaleString('pt-BR', {
        style: 'currency',
        currency: 'BRL',
      });

      // Envia e-mail se configurado
      if (config.enviarEmail && config.emailDestino) {
        try {
          const result = await this.emailService.sendPaymentReminder(
            config.emailDestino,
            {
              descricao: transaction.descricao,
              valor: Number(transaction.valor),
              data: new Date(transaction.data),
              diasRestantes,
            },
          );

          if (result.success) {
            emailsSent++;
            await this.prisma.reminderLog.create({
              data: {
                transactionId: transaction.id,
                tipo: 'EMAIL',
                status: 'SUCCESS',
                mensagem: `E-mail enviado para ${config.emailDestino}`,
              },
            });
          } else {
            errors.push(`Erro ao enviar e-mail: ${result.error}`);
            await this.prisma.reminderLog.create({
              data: {
                transactionId: transaction.id,
                tipo: 'EMAIL',
                status: 'FAILED',
                erro: result.error,
              },
            });
          }
        } catch (error) {
          errors.push(`Erro ao enviar e-mail: ${error.message}`);
        }
      }

      // Faz ligação se configurado
      if (config.fazerLigacao && config.telefoneDestino) {
        // Verifica se está no horário permitido (ou se foi solicitado imediatamente via assistente)
        const agora = new Date();
        const [horas, minutos] = config.horarioLigacao.split(':').map(Number);
        const horarioLigacao = new Date();
        horarioLigacao.setHours(horas, minutos, 0, 0);

        // Permite ligação se estiver no horário ou próximo (margem de 1 hora)
        // OU se for processamento forçado via assistente
        const diffHoras = Math.abs(agora.getHours() - horarioLigacao.getHours());
        const diffMinutos = Math.abs(agora.getMinutes() - horarioLigacao.getMinutes());

        if (diffHoras === 0 && diffMinutos <= 30 || forceCall) {
          try {
            let mensagem = '';
            if (diasRestantes === 0) {
              mensagem = `Olá! Este é um lembrete do sistema financeiro Microkids. A transação ${transaction.descricao} no valor de ${valorFormatado} vence HOJE. Por favor, efetue o pagamento o quanto antes.`;
            } else {
              mensagem = `Olá! Este é um lembrete do sistema financeiro Microkids. A transação ${transaction.descricao} no valor de ${valorFormatado} vence em ${diasRestantes} dias.`;
            }

            const result = await this.twilioService.makeCall(config.telefoneDestino, mensagem);

            if (result.success) {
              callsMade++;
              await this.prisma.reminderLog.create({
                data: {
                  transactionId: transaction.id,
                  tipo: 'CALL',
                  status: 'SUCCESS',
                  mensagem: `Ligação feita para ${config.telefoneDestino}`,
                },
              });
            } else {
              errors.push(`Erro ao fazer ligação: ${result.error}`);
              await this.prisma.reminderLog.create({
                data: {
                  transactionId: transaction.id,
                  tipo: 'CALL',
                  status: 'FAILED',
                  erro: result.error,
                },
              });
            }
          } catch (error) {
            errors.push(`Erro ao fazer ligação: ${error.message}`);
          }
        } else {
          this.logger.log(
            `⏰ Fora do horário de ligação. Horário configurado: ${config.horarioLigacao}, Horário atual: ${agora.toLocaleTimeString('pt-BR')}`,
          );
        }
      }
    }

    this.logger.log(
      `✅ Processamento concluído: ${upcoming.length} transações, ${emailsSent} e-mails, ${callsMade} ligações`,
    );

    return {
      processed: upcoming.length,
      emailsSent,
      callsMade,
      errors,
    };
  }

  /**
   * Busca ou cria configuração de lembretes
   */
  async getConfig() {
    let config = await this.prisma.reminderConfig.findFirst();

    if (!config) {
      // Cria configuração padrão
      config = await this.prisma.reminderConfig.create({
        data: {
          diasAntesVencimento: JSON.stringify(['2', '0']), // 2 dias antes e no vencimento
          telefoneDestino: '',
          emailDestino: '',
          ativo: true,
          enviarEmail: true,
          fazerLigacao: true,
          horarioLigacao: '09:00',
        },
      });
    }

    return {
      ...config,
      diasAntesVencimento: JSON.parse(config.diasAntesVencimento),
    };
  }

  /**
   * Atualiza configuração de lembretes
   */
  async updateConfig(data: {
    diasAntesVencimento?: number[];
    telefoneDestino?: string;
    emailDestino?: string;
    ativo?: boolean;
    enviarEmail?: boolean;
    fazerLigacao?: boolean;
    horarioLigacao?: string;
  }) {
    const existing = await this.prisma.reminderConfig.findFirst();

    const updateData: any = {};
    if (data.diasAntesVencimento !== undefined) {
      updateData.diasAntesVencimento = JSON.stringify(data.diasAntesVencimento.map(String));
    }
    if (data.telefoneDestino !== undefined) updateData.telefoneDestino = data.telefoneDestino;
    if (data.emailDestino !== undefined) updateData.emailDestino = data.emailDestino;
    if (data.ativo !== undefined) updateData.ativo = data.ativo;
    if (data.enviarEmail !== undefined) updateData.enviarEmail = data.enviarEmail;
    if (data.fazerLigacao !== undefined) updateData.fazerLigacao = data.fazerLigacao;
    if (data.horarioLigacao !== undefined) updateData.horarioLigacao = data.horarioLigacao;

    if (existing) {
      return await this.prisma.reminderConfig.update({
        where: { id: existing.id },
        data: updateData,
      });
    } else {
      return await this.prisma.reminderConfig.create({
        data: {
          diasAntesVencimento: JSON.stringify(data.diasAntesVencimento?.map(String) || ['2', '0']),
          telefoneDestino: data.telefoneDestino || '',
          emailDestino: data.emailDestino || '',
          ativo: data.ativo !== undefined ? data.ativo : true,
          enviarEmail: data.enviarEmail !== undefined ? data.enviarEmail : true,
          fazerLigacao: data.fazerLigacao !== undefined ? data.fazerLigacao : true,
          horarioLigacao: data.horarioLigacao || '09:00',
        },
      });
    }
  }

  /**
   * Busca histórico de lembretes
   */
  async getLogs(limit = 50) {
    return await this.prisma.reminderLog.findMany({
      take: limit,
      orderBy: { createdAt: 'desc' },
      // Nota: Para incluir dados da transação, seria necessário adicionar uma relação no schema Prisma
    });
  }
}

