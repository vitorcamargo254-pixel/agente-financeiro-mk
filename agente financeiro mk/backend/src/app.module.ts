import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { FinanceModule } from './finance/finance.module';
import { AssistantModule } from './assistant/assistant.module';
import { RemindersModule } from './reminders/reminders.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    FinanceModule,
    AssistantModule,
    RemindersModule,
  ],
})
export class AppModule {}


