import { ChatService } from './chat.service';

describe('ChatService', () => {
  const originalKey = process.env.ANTHROPIC_API_KEY;

  afterEach(() => {
    process.env.ANTHROPIC_API_KEY = originalKey;
  });

  it('degrada de forma previsível quando não há ANTHROPIC_API_KEY configurada', async () => {
    delete process.env.ANTHROPIC_API_KEY;
    const service = new ChatService();

    const result = await service.sendMessage({
      message: 'Como reservo uma quadra?',
    });

    expect(result.configured).toBe(false);
    expect(result.reply).toMatch(/não foi configurado/i);
  });

  it('corta no teto diário por IP antes de chamar a API', async () => {
    process.env.ANTHROPIC_API_KEY = 'sk-test';
    process.env.CHAT_DAILY_LIMIT_PER_IP = '2';
    const service = new ChatService();
    const create = jest.fn().mockResolvedValue({
      content: [{ type: 'text', text: 'oi' }],
    });
    (service as unknown as { client: unknown }).client = {
      messages: { create },
    };

    await service.sendMessage({ message: 'a' }, '1.1.1.1');
    await service.sendMessage({ message: 'b' }, '1.1.1.1');
    await expect(
      service.sendMessage({ message: 'c' }, '1.1.1.1'),
    ).rejects.toMatchObject({ status: 429 });
    expect(create).toHaveBeenCalledTimes(2);
    await expect(
      service.sendMessage({ message: 'd' }, '2.2.2.2'),
    ).resolves.toMatchObject({ reply: 'oi' });
    delete process.env.CHAT_DAILY_LIMIT_PER_IP;
  });
});
