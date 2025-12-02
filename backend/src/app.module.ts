import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { FinanceModule } from './finance/finance.module';
import { AssistantModule } from './assistant/assistant.module';
import { RemindersModule } from './reminders/reminders.module';
import { AppController } from './app.controller';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    FinanceModule,
    AssistantModule,
    RemindersModule,
  ],
  controllers: [AppController],
})
export class AppModule {}


