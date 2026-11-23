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

  describe('consulta de horários livres (ferramenta da IA)', () => {
    function courtFor(date: string) {
      const day = new Date(`${date}T00:00:00`).getDay();
      return {
        id: 'c1',
        name: 'Quadra Beach 1',
        sport: 'BEACH_TENNIS',
        minBookingMinutes: 60,
        priceRules: [{ startMinute: 480, endMinute: 1320, pricePerHour: 70 }],
        recurringMaintenanceBlocks: [],
        reservations: [
          {
            startsAt: new Date(`${date}T19:00:00`),
            endsAt: new Date(`${date}T20:00:00`),
          },
        ],
        maintenanceBlocks: [],
        day,
      };
    }
    function dayFromNow(n: number) {
      const d = new Date();
      d.setDate(d.getDate() + n);
      const p = (x: number) => String(x).padStart(2, '0');
      return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
    }

    it('devolve as janelas livres descontando a reserva', async () => {
      const date = dayFromNow(2);
      const prisma = {
        court: { findMany: jest.fn().mockResolvedValue([courtFor(date)]) },
      };
      const text = await new ChatService(prisma as never).freeSlots(
        'arena-teste',
        date,
      );
      expect(text).toContain('das 8h às 19h');
      expect(text).toContain('das 20h às 22h');
      expect(text).not.toContain('19h às 20h');
    });

    it('recusa data inválida, passada e além da janela de reservas', async () => {
      const service = new ChatService({
        court: { findMany: jest.fn() },
      } as never);
      await expect(service.freeSlots('a', 'amanhã')).resolves.toContain(
        'inválida',
      );
      await expect(service.freeSlots('a', dayFromNow(-2))).resolves.toContain(
        'passou',
      );
      await expect(service.freeSlots('a', dayFromNow(30))).resolves.toContain(
        'Só é possível',
      );
    });

    it('a IA pede a ferramenta, o servidor consulta a agenda e a IA responde com o resultado', async () => {
      delete process.env.ANTHROPIC_API_KEY;
      process.env.OPENAI_API_KEY = 'sk-test-openai';
      const date = dayFromNow(1);
      const originalFetch = global.fetch;
      const fetchMock = jest
        .fn()
        .mockResolvedValueOnce({
          ok: true,
          json: () =>
            Promise.resolve({
              choices: [
                {
                  message: {
                    content: null,
                    tool_calls: [
                      {
                        id: 'call_1',
                        function: {
                          name: 'consultar_horarios_livres',
                          arguments: JSON.stringify({ data: date }),
                        },
                      },
                    ],
                  },
                },
              ],
            }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () =>
            Promise.resolve({
              choices: [{ message: { content: 'Tem das 20h às 22h.' } }],
            }),
        });
      global.fetch = fetchMock;
      const prisma = {
        user: { findFirst: jest.fn().mockResolvedValue(null) },
        court: { findMany: jest.fn().mockResolvedValue([courtFor(date)]) },
      };
      try {
        const result = await new ChatService(prisma as never).sendMessage({
          message: 'Tem horário amanhã?',
          slug: 'arena-teste',
        });
        expect(result.reply).toBe('Tem das 20h às 22h.');
        expect(fetchMock).toHaveBeenCalledTimes(2);
        const second = JSON.parse(
          (fetchMock.mock.calls[1] as [string, { body: string }])[1].body,
        ) as { messages: { role: string; content: string }[] };
        const toolMsg = second.messages.find((m) => m.role === 'tool');
        expect(toolMsg?.content).toContain('das 20h às 22h');
      } finally {
        global.fetch = originalFetch;
        delete process.env.OPENAI_API_KEY;
      }
    });
  });

  describe('previsão do tempo (ferramenta da IA)', () => {
    it('resume a previsão do dia e detalha a hora pedida', async () => {
      const hours = Array.from({ length: 24 }, (_, hour) => ({
        hour,
        temperature: 24 + (hour > 12 ? 6 : 0),
        rainChance: hour === 19 ? 70 : 10,
        wind: 15,
        uv: hour === 12 ? 9 : 2,
        code: 0,
        rating: hour === 19 ? 'attention' : 'good',
      }));
      const weather = {
        enabled: true,
        forecast: jest.fn().mockResolvedValue({
          enabled: true,
          days: [{ date: '2026-11-25', hours }],
        }),
      };
      const service = new ChatService(undefined, weather as never);
      const text = await service.weatherSummary('2026-11-25', 19);
      expect(text).toContain('Open-Meteo');
      expect(text).toContain('chance máxima de chuva 70%');
      expect(text).toContain('Às 19h');
      expect(text).toContain('atenção');
      await expect(service.weatherSummary('2026-12-30')).resolves.toContain(
        'Sem previsão',
      );
    });

    it('sem a previsão ligada, a ferramenta não existe', async () => {
      const service = new ChatService(undefined, { enabled: false } as never);
      await expect(service.weatherSummary('2026-11-25')).resolves.toContain(
        'indisponível',
      );
    });
  });
});
