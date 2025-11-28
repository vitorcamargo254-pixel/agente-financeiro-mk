import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { FinanceService } from '../finance/finance.service';
import { RemindersService } from '../reminders/reminders.service';
import { CreateTransactionDto } from '../finance/dto/create-transaction.dto';
import { UpdateTransactionDto } from '../finance/dto/update-transaction.dto';

@Injectable()
export class AssistantService {
  private readonly logger = new Logger(AssistantService.name);
  private readonly apiKey: string;

  constructor(
    private readonly config: ConfigService,
    private readonly financeService: FinanceService,
    private readonly remindersService: RemindersService,
  ) {
    this.apiKey = this.config.get<string>('GROQ_API_KEY') || '';
  }

  // Define as funções disponíveis para o assistente
  private getAvailableFunctions() {
    return [
      {
        type: 'function',
        function: {
          name: 'adicionar_transacao',
          description: 'Adiciona uma nova transação financeira (despesa ou receita) na planilha',
          parameters: {
            type: 'object',
            properties: {
              descricao: {
                type: 'string',
                description: 'Descrição da transação (ex: "Salário Vitor", "Aluguel", "Venda produto")',
              },
              valor: {
                type: 'number',
                description: 'Valor da transação. Use negativo para despesas e positivo para receitas',
              },
              categoria: {
                type: 'string',
                description: 'Categoria ou centro de custo (ex: "Salários", "Aluguel", "Vendas")',
              },
              data: {
                type: 'string',
                description: 'Data da transação no formato YYYY-MM-DD. Se não informada, usa a data atual',
              },
              status: {
                type: 'string',
                enum: ['pago', 'pendente'],
                description: 'Status da transação. Padrão: "pendente"',
              },
            },
            required: ['descricao', 'valor', 'categoria'],
          },
        },
      },
      {
        type: 'function',
        function: {
          name: 'marcar_como_pago',
          description: 'Marca uma transação como paga. Você pode buscar por descrição ou código',
          parameters: {
            type: 'object',
            properties: {
              descricao: {
                type: 'string',
                description: 'Descrição ou parte da descrição da transação a ser marcada como paga',
              },
              codigo: {
                type: 'string',
                description: 'Código único da transação (se conhecido)',
              },
            },
            required: ['descricao'],
          },
        },
      },
      {
        type: 'function',
        function: {
          name: 'criar_transacao_recorrente',
          description: 'Cria uma transação que se repete mensalmente (ex: salários, aluguel)',
          parameters: {
            type: 'object',
            properties: {
              descricao: {
                type: 'string',
                description: 'Descrição da transação recorrente',
              },
              valor: {
                type: 'number',
                description: 'Valor da transação. Use negativo para despesas e positivo para receitas',
              },
              categoria: {
                type: 'string',
                description: 'Categoria ou centro de custo',
              },
              quantidade_meses: {
                type: 'number',
                description: 'Quantidade de meses para criar a transação. Padrão: 12 meses',
              },
              data_inicio: {
                type: 'string',
                description: 'Data de início no formato YYYY-MM-DD. Se não informada, usa o próximo mês',
              },
            },
            required: ['descricao', 'valor', 'categoria'],
          },
        },
      },
      {
        type: 'function',
        function: {
          name: 'criar_lembrete',
          description: 'Cria um lembrete para uma data futura',
          parameters: {
            type: 'object',
            properties: {
              titulo: {
                type: 'string',
                description: 'Título do lembrete',
              },
              descricao: {
                type: 'string',
                description: 'Descrição detalhada do lembrete',
              },
              data: {
                type: 'string',
                description: 'Data do lembrete no formato YYYY-MM-DD',
              },
            },
            required: ['titulo', 'descricao', 'data'],
          },
        },
      },
      {
        type: 'function',
        function: {
          name: 'excluir_transacao',
          description: 'Exclui uma transação financeira permanentemente. Use com cuidado!',
          parameters: {
            type: 'object',
            properties: {
              descricao: {
                type: 'string',
                description: 'Descrição ou parte da descrição da transação a ser excluída',
              },
              codigo: {
                type: 'string',
                description: 'Código único da transação (se conhecido)',
              },
            },
            required: ['descricao'],
          },
        },
      },
      {
        type: 'function',
        function: {
          name: 'processar_lembretes',
          description: 'Processa e envia lembretes de pagamentos imediatamente. Verifica transações próximas do vencimento e envia e-mails/faz ligações conforme configurado',
          parameters: {
            type: 'object',
            properties: {},
            required: [],
          },
        },
      },
    ];
  }

  // Executa as funções chamadas pelo assistente
  private async executeFunction(functionName: string, args: any): Promise<string> {
    try {
      switch (functionName) {
        case 'adicionar_transacao':
          return await this.adicionarTransacao(args);
        
        case 'marcar_como_pago':
          return await this.marcarComoPago(args);
        
        case 'criar_transacao_recorrente':
          return await this.criarTransacaoRecorrente(args);
        
        case 'criar_lembrete':
          return await this.criarLembrete(args);
        
        case 'excluir_transacao':
          return await this.excluirTransacao(args);
        
        case 'processar_lembretes':
          return await this.processarLembretes(args);
        
        default:
          return `Função ${functionName} não encontrada.`;
      }
    } catch (error) {
      this.logger.error(`Erro ao executar função ${functionName}:`, error);
      return `Erro ao executar ${functionName}: ${error.message}`;
    }
  }

  private async adicionarTransacao(args: any): Promise<string> {
    try {
      const hoje = new Date();
      const data = args.data || hoje.toISOString().split('T')[0];
      
      this.logger.log(`➕ Adicionando transação: ${args.descricao}, Valor: ${args.valor}, Categoria: ${args.categoria}`);
      
      const dto: CreateTransactionDto = {
        descricao: args.descricao,
        valor: args.valor,
        codigo: `ASSISTENTE-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        centroCusto: args.categoria || 'Outros',
        status: args.status || 'pendente',
        data: data,
        ndoc: args.fornecedor,
      };

      const created = await this.financeService.create(dto);
      
      // Busca novamente para pegar o saldo atualizado
      const updated = await this.financeService.findAll(1, 10000);
      const transacaoAtualizada = updated.items.find(t => t.id === created.id);
      const saldo = transacaoAtualizada?.saldo ? Number(transacaoAtualizada.saldo) : null;
      
      let resposta = `✅ Transação adicionada com sucesso!\n\nDescrição: ${created.descricao}\nValor: R$ ${Math.abs(Number(created.valor)).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}\nData: ${new Date(created.data).toLocaleDateString('pt-BR')}\nStatus: ${created.status}`;
      
      if (saldo !== null) {
        resposta += `\nSaldo: R$ ${saldo.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
      }
      
      return resposta;
    } catch (error) {
      this.logger.error('Erro ao adicionar transação:', error);
      return `❌ Erro ao adicionar transação: ${error.message}`;
    }
  }

  private async marcarComoPago(args: any): Promise<string> {
    // Busca todas as transações
    const transactions = await this.financeService.findAll(1, 10000);
    const descricaoBusca = args.descricao.toLowerCase().trim();
    
    this.logger.log(`🔍 Buscando transação com descrição: "${descricaoBusca}"`);
    this.logger.log(`📊 Total de transações: ${transactions.items.length}`);
    
    // Busca mais flexível: verifica se a descrição contém as palavras-chave
    const palavrasChave = descricaoBusca.split(/\s+/).filter(p => p.length > 2);
    
    const matching = transactions.items.filter((t) => {
      const descricaoTrans = t.descricao.toLowerCase();
      // Verifica se todas as palavras-chave estão presentes na descrição
      const todasPalavras = palavrasChave.every(palavra => descricaoTrans.includes(palavra));
      // Ou verifica se a descrição contém a busca completa
      const contemCompleto = descricaoTrans.includes(descricaoBusca);
      
      return (todasPalavras || contemCompleto) && t.status === 'pendente';
    });

    this.logger.log(`🔍 Transações encontradas: ${matching.length}`);

    if (matching.length === 0) {
      // Tenta buscar sem filtro de status
      const matchingAll = transactions.items.filter((t) => {
        const descricaoTrans = t.descricao.toLowerCase();
        const palavrasChave = descricaoBusca.split(/\s+/).filter(p => p.length > 2);
        const todasPalavras = palavrasChave.every(palavra => descricaoTrans.includes(palavra));
        const contemCompleto = descricaoTrans.includes(descricaoBusca);
        return todasPalavras || contemCompleto;
      });
      
      if (matchingAll.length > 0) {
        const statusList = matchingAll.map(t => t.status).join(', ');
        return `❌ Encontrada(s) ${matchingAll.length} transação(ões), mas nenhuma está pendente. Status encontrados: ${statusList}`;
      }
      
      // Lista algumas transações pendentes para ajudar
      const pendentes = transactions.items.filter(t => t.status === 'pendente').slice(0, 5);
      const exemplos = pendentes.map(t => `- ${t.descricao}`).join('\n');
      return `❌ Nenhuma transação pendente encontrada com a descrição "${args.descricao}".\n\nTransações pendentes disponíveis:\n${exemplos || 'Nenhuma'}`;
    }

    if (matching.length > 1) {
      const lista = matching.map((t, i) => `${i + 1}. ${t.descricao} (${new Date(t.data).toLocaleDateString('pt-BR')})`).join('\n');
      return `⚠️ Encontradas ${matching.length} transações pendentes:\n\n${lista}\n\nPor favor, seja mais específico na descrição.`;
    }

    const transaction = matching[0];
    const updateDto: UpdateTransactionDto = {
      status: 'pago',
    };

    this.logger.log(`✅ Marcando transação ${transaction.codigo} como paga`);
    const updated = await this.financeService.update(transaction.codigo, updateDto);
    
    // Tenta atualizar no Excel (opcional, não bloqueia se falhar)
    try {
      const entity = {
        descricao: updated.descricao,
        codigo: updated.codigo,
        centroCusto: updated.centroCusto,
        ndoc: updated.ndoc,
        valor: Number(updated.valor),
        status: 'pago' as 'pago' | 'pendente',
        data: new Date(updated.data),
        saldo: updated.saldo ? Number(updated.saldo) : undefined,
      };
      // Acessa o excelService através do financeService (precisa ser público ou criar método)
      // Por enquanto, vamos apenas logar que precisa atualizar no Excel
      this.logger.log(`📝 Transação marcada como paga. Para atualizar no Excel, use a sincronização.`);
    } catch (error) {
      this.logger.warn(`⚠️ Não foi possível atualizar no Excel: ${error.message}`);
    }
    
    return `✅ Transação "${transaction.descricao}" marcada como paga!`;
  }

  private async criarTransacaoRecorrente(args: any): Promise<string> {
    const quantidadeMeses = args.quantidade_meses || 12;
    const hoje = new Date();
    let dataInicio = args.data_inicio 
      ? new Date(args.data_inicio) 
      : new Date(hoje.getFullYear(), hoje.getMonth() + 1, 1); // Próximo mês, dia 1

    const transacoesCriadas = [];
    
    for (let i = 0; i < quantidadeMeses; i++) {
      const data = new Date(dataInicio);
      data.setMonth(dataInicio.getMonth() + i);
      const dataStr = data.toISOString().split('T')[0];

      const dto: CreateTransactionDto = {
        descricao: `${args.descricao} - ${data.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}`,
        valor: args.valor,
        codigo: `RECORRENTE-${Date.now()}-${i}-${Math.random().toString(36).substr(2, 9)}`,
        centroCusto: args.categoria,
        status: 'pendente',
        data: dataStr,
      };

      const created = await this.financeService.create(dto);
      transacoesCriadas.push(created);
    }

    return `✅ Criadas ${quantidadeMeses} transações recorrentes!\n\nDescrição: ${args.descricao}\nValor mensal: R$ ${Math.abs(args.valor).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}\nPeríodo: ${dataInicio.toLocaleDateString('pt-BR')} até ${new Date(dataInicio.getFullYear(), dataInicio.getMonth() + quantidadeMeses - 1, 1).toLocaleDateString('pt-BR')}`;
  }

  private async criarLembrete(args: any): Promise<string> {
    // Por enquanto, apenas retorna uma mensagem. Pode ser implementado com banco de dados depois
    this.logger.log(`Lembrete criado: ${args.titulo} - ${args.descricao} - ${args.data}`);
    return `✅ Lembrete criado!\n\nTítulo: ${args.titulo}\nDescrição: ${args.descricao}\nData: ${new Date(args.data).toLocaleDateString('pt-BR')}\n\n⚠️ Nota: Os lembretes estão sendo registrados. Em breve será implementado um sistema completo de lembretes.`;
  }

  private async excluirTransacao(args: any): Promise<string> {
    try {
      // Busca todas as transações
      const transactions = await this.financeService.findAll(1, 10000);
      const descricaoBusca = args.descricao.toLowerCase().trim();
      
      this.logger.log(`🗑️ Buscando transação para excluir com descrição: "${descricaoBusca}"`);
      
      // Se tiver código, busca direto
      if (args.codigo) {
        try {
          await this.financeService.remove(args.codigo);
          return `✅ Transação com código "${args.codigo}" excluída com sucesso!`;
        } catch (error) {
          this.logger.error(`Erro ao excluir por código: ${error.message}`);
          // Continua para buscar por descrição
        }
      }
      
      // Busca por descrição (similar ao marcarComoPago)
      const palavrasChave = descricaoBusca.split(/\s+/).filter(p => p.length > 2);
      
      const matching = transactions.items.filter((t) => {
        const descricaoTrans = t.descricao.toLowerCase();
        const todasPalavras = palavrasChave.every(palavra => descricaoTrans.includes(palavra));
        const contemCompleto = descricaoTrans.includes(descricaoBusca);
        return todasPalavras || contemCompleto;
      });

      if (matching.length === 0) {
        // Lista algumas transações para ajudar
        const exemplos = transactions.items.slice(0, 5).map(t => `- ${t.descricao} (${new Date(t.data).toLocaleDateString('pt-BR')})`).join('\n');
        return `❌ Nenhuma transação encontrada com a descrição "${args.descricao}".\n\nTransações disponíveis:\n${exemplos || 'Nenhuma'}`;
      }

      if (matching.length > 1) {
        const lista = matching.map((t, i) => `${i + 1}. ${t.descricao} (${new Date(t.data).toLocaleDateString('pt-BR')}) - R$ ${Math.abs(Number(t.valor)).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`).join('\n');
        return `⚠️ Encontradas ${matching.length} transações:\n\n${lista}\n\nPor favor, seja mais específico na descrição para evitar excluir a transação errada.`;
      }

      const transaction = matching[0];
      this.logger.log(`🗑️ Excluindo transação: ${transaction.descricao} (código: ${transaction.codigo})`);
      
      await this.financeService.remove(transaction.codigo);
      
      return `✅ Transação "${transaction.descricao}" excluída permanentemente!\n\nValor: R$ ${Math.abs(Number(transaction.valor)).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}\nData: ${new Date(transaction.data).toLocaleDateString('pt-BR')}\n\n⚠️ Os saldos das transações subsequentes foram recalculados automaticamente.`;
    } catch (error) {
      this.logger.error('Erro ao excluir transação:', error);
      return `❌ Erro ao excluir transação: ${error.message}`;
    }
  }

  private async processarLembretes(args: any): Promise<string> {
    try {
      this.logger.log('🔄 Processando lembretes via assistente (forçando ligações imediatas)...');
      // forceCall = true para permitir ligações imediatas quando solicitado via assistente
      const result = await this.remindersService.processReminders(true);
      
      let resposta = `✅ Lembretes processados com sucesso!\n\n`;
      resposta += `📊 Transações verificadas: ${result.processed}\n`;
      resposta += `📧 E-mails enviados: ${result.emailsSent}\n`;
      resposta += `📞 Ligações realizadas: ${result.callsMade}\n`;
      
      if (result.errors && result.errors.length > 0) {
        resposta += `\n⚠️ Erros encontrados: ${result.errors.length}\n`;
        result.errors.slice(0, 3).forEach((err, i) => {
          resposta += `${i + 1}. ${err}\n`;
        });
        if (result.errors.length > 3) {
          resposta += `... e mais ${result.errors.length - 3} erro(s)\n`;
        }
      }
      
      if (result.processed === 0) {
        resposta += `\nℹ️ Nenhuma transação próxima do vencimento encontrada no momento.`;
      }
      
      return resposta;
    } catch (error) {
      this.logger.error('Erro ao processar lembretes:', error);
      return `❌ Erro ao processar lembretes: ${error.message}`;
    }
  }

  // Tenta detectar e executar comandos diretamente do texto
  private async tryDirectCommand(message: string): Promise<string | null> {
    const lowerMessage = message.toLowerCase().trim();
    
    // Padrão: "adicionar despesa X: Y reais" ou "adicionar despesa X Y reais"
    const addExpenseMatch = lowerMessage.match(/adicionar\s+(?:despesa|receita)\s+(.+?)\s*[:]\s*([\d.,]+)\s*(?:reais?|r\$)?/i);
    if (addExpenseMatch) {
      const descricao = addExpenseMatch[1].trim();
      const valorStr = addExpenseMatch[2].replace(/\./g, '').replace(',', '.');
      const valor = parseFloat(valorStr);
      
      if (!isNaN(valor)) {
        const isDespesa = lowerMessage.includes('despesa');
        const valorFinal = isDespesa ? -Math.abs(valor) : Math.abs(valor);
        const categoria = 'Outros'; // Pode ser extraído depois
        
        return await this.executeFunction('adicionar_transacao', {
          descricao,
          valor: valorFinal,
          categoria,
        });
      }
    }
    
    // Padrão: "marcar X como pago"
    const markPaidMatch = lowerMessage.match(/marcar\s+(.+?)\s+como\s+pago/i);
    if (markPaidMatch) {
      const descricao = markPaidMatch[1].trim();
      return await this.executeFunction('marcar_como_pago', { descricao });
    }
    
    // Padrão: "excluir transação X" ou "deletar transação X" ou "remover transação X"
    const deleteMatch = lowerMessage.match(/(?:excluir|deletar|remover)\s+(?:transa[çc][ãa]o|despesa|receita)\s+(.+?)(?:\s|$)/i);
    if (deleteMatch) {
      const descricao = deleteMatch[1].trim();
      return await this.executeFunction('excluir_transacao', { descricao });
    }
    
    // Padrão: "enviar lembrete agora", "processar lembretes", "lembretes agora"
    const processRemindersMatch = lowerMessage.match(/(?:enviar|processar|mandar)\s+lembrete(?:s)?\s+(?:agora|já|imediato|imediatamente)?/i) ||
                                  lowerMessage.match(/lembrete(?:s)?\s+(?:agora|já|imediato|imediatamente)/i);
    if (processRemindersMatch) {
      return await this.executeFunction('processar_lembretes', {});
    }
    
    return null;
  }

  async chat(message: string): Promise<string> {
    // Primeiro tenta executar comandos diretamente (sem API)
    const directResult = await this.tryDirectCommand(message);
    if (directResult) {
      return directResult;
    }

    if (!this.apiKey || this.apiKey === 'gsk_sua_chave_aqui') {
      return '⚠️ Configure a chave GROQ_API_KEY no arquivo .env para usar o assistente.';
    }

    try {
      // Se não conseguiu executar diretamente, usa a API para respostas gerais
      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'llama-3.1-8b-instant',
          messages: [
            {
              role: 'system',
              content: `Você é um assistente financeiro inteligente para a empresa Microkids. 
Você pode ajudar com:
- Adicionar despesas e receitas (use: "adicionar despesa [nome]: [valor] reais")
- Marcar transações como pagas (use: "marcar [nome] como pago")
- Excluir transações (use: "excluir transação [nome]" ou "deletar transação [nome]")
- Criar transações recorrentes
- Criar lembretes
- Processar lembretes imediatamente (use: "enviar lembrete agora" ou "processar lembretes")

⚠️ IMPORTANTE: Ao excluir uma transação, seja cuidadoso e confirme com o usuário se houver múltiplas correspondências.

Seja direto e objetivo.`,
            },
            {
              role: 'user',
              content: message,
            },
          ],
          temperature: 0.7,
          max_tokens: 1024,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        this.logger.error(`Groq API error ${response.status}:`, errorText);
        
        // Se for erro 400, tenta novamente sem function calling
        if (response.status === 400) {
          return '⚠️ Erro na API. Tente usar comandos diretos como:\n- "adicionar despesa salário vitor: 10000 reais"\n- "marcar salário vitor como pago"';
        }
        
        throw new Error(`Groq API error: ${response.status}`);
      }

      const data = await response.json();
      return data.choices[0]?.message?.content || 'Sem resposta do assistente.';
    } catch (error) {
      this.logger.error('Erro ao chamar Groq API:', error);
      return `Erro ao conectar com o assistente: ${error.message}`;
    }
  }
}


