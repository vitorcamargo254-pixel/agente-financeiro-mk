import { Module } from '@nestjs/common';
import { AssistantController } from './assistant.controller';
import { AssistantService } from './assistant.service';
import { FinanceModule } from '../finance/finance.module';
import { RemindersModule } from '../reminders/reminders.module';

@Module({
  imports: [FinanceModule, RemindersModule],
  controllers: [AssistantController],
  providers: [AssistantService],
})
export class AssistantModule {}


