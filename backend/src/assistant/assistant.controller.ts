import { Controller, Post, Body } from '@nestjs/common';
import { AssistantService } from './assistant.service';
import { ChatMessageDto } from './dto/chat-message.dto';

@Controller('assistant')
export class AssistantController {
  constructor(private readonly assistantService: AssistantService) {}

  @Post('chat')
  async chat(@Body() dto: ChatMessageDto) {
    const reply = await this.assistantService.chat(dto.message);
    return { reply };
  }
}


