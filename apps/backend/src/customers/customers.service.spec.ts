import { CustomersService } from './customers.service';

const NOW = new Date('2026-10-11T12:00:00Z');
const day = (offset: number) => new Date(NOW.getTime() + offset * 86_400_000);

function reservation(
  phone: string,
  name: string,
  offsetDays: number,
  status = 'COMPLETED',
  birthDate: Date | null = null,
) {
  return {
    startsAt: day(offsetDays),
    priceSnapshot: 100,
    status,
    guestName: name,
    guestPhone: phone,
    player: birthDate ? { id: `p-${phone}`, name, phone, birthDate } : null,
  };
}

function makeService(rows: ReturnType<typeof reservation>[]) {
  const sorted = [...rows].sort(
    (a, b) => b.startsAt.getTime() - a.startsAt.getTime(),
  );
  const prisma = {
    reservation: { findMany: jest.fn().mockResolvedValue(sorted) },
  };
  return new CustomersService(prisma as never);
}

describe('CustomersService', () => {
  it('ignora reserva futura na "última reserva" e nunca devolve dias negativos', async () => {
    const service = makeService([
      reservation('1', 'Ana', -12),
      reservation('1', 'Ana', 3, 'CONFIRMED'),
    ]);
    const [ana] = await service.listCustomers('o', NOW);
    expect(ana.daysSinceLastReservation).toBe(12);
    expect(ana.totalReservations).toBe(1);
    expect(ana.upcomingReservations).toBe(1);
    expect(ana.nextReservationAt).toEqual(day(3));
  });

  it('cliente só com reserva futura ainda não jogou', async () => {
    const service = makeService([reservation('2', 'Bia', 2, 'CONFIRMED')]);
    const [bia] = await service.listCustomers('o', NOW);
    expect(bia.lastReservationAt).toBeNull();
    expect(bia.daysSinceLastReservation).toBeNull();
  });

  it('filtra inativos, faltas e busca por nome sem acento', async () => {
    const service = makeService([
      reservation('1', 'João', -40),
      reservation('2', 'Bia', -2, 'NO_SHOW'),
      reservation('2', 'Bia', -3, 'NO_SHOW'),
    ]);
    const inactive = await service.listCustomersPage(
      'o',
      { filtro: 'inactive' },
      NOW,
    );
    expect(inactive.items.map((c) => c.name)).toEqual(['João']);
    const noShows = await service.listCustomersPage(
      'o',
      { filtro: 'noShows' },
      NOW,
    );
    expect(noShows.items.map((c) => c.name)).toEqual(['Bia']);
    const busca = await service.listCustomersPage('o', { q: 'joao' }, NOW);
    expect(busca.total).toBe(1);
  });

  it('pagina e limita a página pedida ao total', async () => {
    const rows = Array.from({ length: 25 }, (_, i) =>
      reservation(String(100 + i), `C${i}`, -1 - i),
    );
    const service = makeService(rows);
    const page = await service.listCustomersPage(
      'o',
      { pagina: 9, porPagina: 10 },
      NOW,
    );
    expect(page.totalPaginas).toBe(3);
    expect(page.pagina).toBe(3);
    expect(page.items).toHaveLength(5);
  });

  it('resumo conta inativos, aniversariantes e faltas', async () => {
    const service = makeService([
      reservation('1', 'João', -40),
      reservation(
        '2',
        'Bia',
        -1,
        'COMPLETED',
        new Date('1990-10-05T00:00:00Z'),
      ),
    ]);
    expect(await service.getSummary('o', NOW)).toEqual({
      total: 2,
      inactive: 1,
      birthdays: 1,
      noShows: 0,
    });
  });
});
