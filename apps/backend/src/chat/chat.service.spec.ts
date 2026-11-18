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
  it('usa a OpenAI quando OPENAI_API_KEY existe, com o modelo configurado', async () => {
    delete process.env.ANTHROPIC_API_KEY;
    process.env.OPENAI_API_KEY = 'sk-test-openai';
    process.env.OPENAI_MODEL = 'modelo-teste';
    const originalFetch = global.fetch;
    const fetchMock = jest.fn().mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({ choices: [{ message: { content: ' Oi! ' } }] }),
    });
    global.fetch = fetchMock;
    try {
      const result = await new ChatService().sendMessage({ message: 'Oi' });
      expect(result).toEqual({ reply: 'Oi!', configured: true });
      const call = fetchMock.mock.calls[0] as [string, { body: string }];
      expect(call[0]).toBe('https://api.openai.com/v1/chat/completions');
      expect(JSON.parse(call[1].body)).toMatchObject({ model: 'modelo-teste' });
    } finally {
      global.fetch = originalFetch;
      delete process.env.OPENAI_API_KEY;
      delete process.env.OPENAI_MODEL;
    }
  });
  it('envia à IA os dados reais do estabelecimento da página (slug)', async () => {
    delete process.env.ANTHROPIC_API_KEY;
    process.env.OPENAI_API_KEY = 'sk-test-openai';
    const originalFetch = global.fetch;
    const fetchMock = jest.fn().mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({ choices: [{ message: { content: 'ok' } }] }),
    });
    global.fetch = fetchMock;
    const prisma = {
      user: {
        findFirst: jest.fn().mockResolvedValue({
          establishmentName: 'Arena Teste',
          establishmentPhone: '85999990000',
          establishmentAddress: 'Rua A, 10',
          aboutDescription: null,
          amenities: ['Vestiário'],
          courts: [
            {
              name: 'Quadra 1',
              sport: 'BEACH_TENNIS',
              surfaceType: 'AREIA',
              hasLighting: true,
              priceRules: [{ pricePerHour: 80 }, { pricePerHour: 120 }],
            },
          ],
        }),
      },
    };
    try {
      const service = new ChatService(prisma as never);
      await service.sendMessage({
        message: 'Quais quadras?',
        slug: 'arena-teste',
      });
      const call = fetchMock.mock.calls[0] as [string, { body: string }];
      const system = (
        JSON.parse(call[1].body) as { messages: { content: string }[] }
      ).messages[0].content;
      expect(system).toContain('Arena Teste');
      expect(system).toContain('Quadra 1');
      expect(system).toContain('R$ 80.00 a R$ 120.00');
    } finally {
      global.fetch = originalFetch;
      delete process.env.OPENAI_API_KEY;
    }
  });

  it('informa horário de funcionamento, faixas de preço e instrutores', async () => {
    delete process.env.ANTHROPIC_API_KEY;
    process.env.OPENAI_API_KEY = 'sk-test-openai';
    const originalFetch = global.fetch;
    const fetchMock = jest.fn().mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({ choices: [{ message: { content: 'ok' } }] }),
    });
    global.fetch = fetchMock;
    const rule = (d: number, s: number, e: number, p: number) => ({
      dayOfWeek: d,
      startMinute: s * 60,
      endMinute: e * 60,
      pricePerHour: p,
    });
    const prisma = {
      user: {
        findFirst: jest.fn().mockResolvedValue({
          establishmentName: 'Arena Teste',
          establishmentPhone: null,
          establishmentAddress: null,
          aboutDescription: null,
          amenities: [],
          instructors: [{ name: 'Carlos' }],
          equipment: [{ name: 'Raquete', pricePerUnit: 10 }],
          courts: [
            {
              name: 'Quadra 1',
              sport: 'AREIA',
              surfaceType: 'AREIA',
              hasLighting: false,
              priceRules: [
                ...[1, 2, 3, 4, 5, 6].map((d) => rule(d, 8, 17, 60)),
                ...[1, 2, 3, 4, 5, 6].map((d) => rule(d, 17, 22, 80)),
                rule(0, 8, 18, 60),
              ],
            },
          ],
        }),
      },
    };
    try {
      const service = new ChatService(prisma as never);
      await service.sendMessage({ message: 'Horário?', slug: 'arena-teste' });
      const call = fetchMock.mock.calls[0] as [string, { body: string }];
      const system = (
        JSON.parse(call[1].body) as { messages: { content: string }[] }
      ).messages[0].content;
      expect(system).toContain('seg a sáb: das 8h às 22h');
      expect(system).toContain('dom: das 8h às 18h');
      expect(system).toContain('seg a sáb 17h-22h R$ 80.00');
      expect(system).toContain('Carlos');
      expect(system).toContain('Raquete (R$ 10.00)');
    } finally {
      global.fetch = originalFetch;
      delete process.env.OPENAI_API_KEY;
    }
  });
});
