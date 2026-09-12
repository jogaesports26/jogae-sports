import { Injectable, Logger } from '@nestjs/common';
import Anthropic from '@anthropic-ai/sdk';
import { SendMessageDto } from './dto/send-message.dto';

// Trocar por 'claude-haiku-4-5' se o custo por mensagem for uma preocupação —
// é um chatbot de suporte simples, não precisa do modelo mais capaz pra isso.
const MODEL = 'claude-opus-5';
const MAX_HISTORY_MESSAGES = 20;

const SYSTEM_PROMPT = `Você é o assistente virtual do Jogaê Sports, um sistema de reserva de quadras esportivas.

Seu trabalho é ajudar o jogador a:
- Entender como reservar uma quadra: navegar em /reservar, escolher uma quadra, ver os horários livres dos próximos 7 dias, clicar num horário e confirmar com um código enviado por telefone (não precisa de senha).
- Tirar dúvidas sobre como funciona: sem taxa extra por reserva, cancelamento até 2h antes do horário, histórico de reservas em "Minhas reservas".
- Ser redirecionado corretamente: se perguntarem sobre gestão da quadra (dono de estabelecimento), explique que isso é feito pelo painel do dono, não pelo Portal do Cliente.

Responda em português do Brasil, em poucas frases, tom direto e simpático. Se não souber a resposta, diga que a pessoa pode falar direto com o estabelecimento pelo telefone de contato da quadra.`;

@Injectable()
export class ChatService {
  private readonly logger = new Logger(ChatService.name);
  private readonly client: Anthropic | null;

  constructor() {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    this.client = apiKey ? new Anthropic({ apiKey }) : null;
  }

  async sendMessage(dto: SendMessageDto) {
    if (!this.client) {
      // Sem ANTHROPIC_API_KEY configurada ainda (ver card "Integração com IA
      // Generativa + Chatbot Inteligente" do Trello) — degrada de forma
      // previsível em vez de dar 500, mesmo padrão do OTP/e-mail em dev.
      return {
        reply:
          'O assistente virtual ainda não foi configurado nesse ambiente. Fale direto com o estabelecimento pelo telefone de contato da quadra.',
        configured: false,
      };
    }

    const history = (dto.history ?? []).slice(-MAX_HISTORY_MESSAGES);

    const messages: Anthropic.MessageParam[] = [
      ...history.map((m) => ({ role: m.role, content: m.content })),
      { role: 'user' as const, content: dto.message },
    ];

    try {
      const response = await this.client.messages.create({
        model: MODEL,
        max_tokens: 1024,
        system: SYSTEM_PROMPT,
        messages,
      });

      const textBlock = response.content.find(
        (block): block is Anthropic.TextBlock => block.type === 'text',
      );

      return {
        reply:
          textBlock?.text ?? 'Desculpa, não consegui gerar uma resposta agora.',
        configured: true,
      };
    } catch (error) {
      if (error instanceof Anthropic.AuthenticationError) {
        this.logger.error('Chave da API Anthropic inválida ou expirada');
        return {
          reply:
            'O assistente virtual está com um problema de configuração. Fale direto com o estabelecimento.',
          configured: false,
        };
      }

      if (error instanceof Anthropic.RateLimitError) {
        return {
          reply:
            'Muita gente perguntando agora! Tenta de novo em alguns segundos.',
          configured: true,
        };
      }

      this.logger.error('Erro ao chamar a API da Anthropic', error as Error);
      return {
        reply: 'Não consegui responder agora, tenta de novo em instantes.',
        configured: true,
      };
    }
  }
}
