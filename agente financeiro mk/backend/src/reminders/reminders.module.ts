import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { RemindersController } from './reminders.controller';
import { RemindersService } from './reminders.service';
import { RemindersScheduler } from './reminders.scheduler';
import { TwilioService } from './twilio.service';
import { EmailService } from './email.service';
import { FinanceModule } from '../finance/finance.module';
import { PrismaService } from '../common/prisma.service';

@Module({
  imports: [ScheduleModule.forRoot(), FinanceModule],
  controllers: [RemindersController],
  providers: [RemindersService, RemindersScheduler, TwilioService, EmailService, PrismaService],
  exports: [RemindersService],
})
export class RemindersModule {}

