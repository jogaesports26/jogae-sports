import { ReservationReminderScheduler } from './reservation-reminder.scheduler';

function buildPrismaMock() {
  return {
    reservation: {
      findMany: jest.fn(),
      update: jest.fn(),
    },
  };
}

describe('ReservationReminderScheduler', () => {
  let prisma: ReturnType<typeof buildPrismaMock>;
  let notifications: { notifyReservationReminder: jest.Mock };
  let scheduler: ReservationReminderScheduler;

  beforeEach(() => {
    prisma = buildPrismaMock();
    notifications = { notifyReservationReminder: jest.fn() };
    scheduler = new ReservationReminderScheduler(
      prisma as any,
      notifications as any,
    );
  });

  it('envia lembrete pro telefone do jogador quando a reserva é de um jogador com conta', async () => {
    const reservation = {
      id: 'res-1',
      startsAt: new Date(),
      endsAt: new Date(),
      guestPhone: null,
      court: { name: 'Quadra 1' },
      player: { phone: '85999998888' },
    };
    prisma.reservation.findMany.mockResolvedValue([reservation]);

    await scheduler.sendUpcomingReminders();

    expect(notifications.notifyReservationReminder).toHaveBeenCalledWith(
      '85999998888',
      'Quadra 1',
      reservation.startsAt,
      reservation.endsAt,
    );
    expect(prisma.reservation.update).toHaveBeenCalledWith({
      where: { id: 'res-1' },
      data: { reminderSentAt: expect.any(Date) },
    });
  });

  it('usa o guestPhone quando a reserva não tem jogador vinculado', async () => {
    const reservation = {
      id: 'res-2',
      startsAt: new Date(),
      endsAt: new Date(),
      guestPhone: '85977776666',
      court: { name: 'Quadra 2' },
      player: null,
    };
    prisma.reservation.findMany.mockResolvedValue([reservation]);

    await scheduler.sendUpcomingReminders();

    expect(notifications.notifyReservationReminder).toHaveBeenCalledWith(
      '85977776666',
      'Quadra 2',
      reservation.startsAt,
      reservation.endsAt,
    );
  });

  it('não envia nem marca lembrete quando não há telefone disponível', async () => {
    const reservation = {
      id: 'res-3',
      startsAt: new Date(),
      endsAt: new Date(),
      guestPhone: null,
      court: { name: 'Quadra 3' },
      player: null,
    };
    prisma.reservation.findMany.mockResolvedValue([reservation]);

    await scheduler.sendUpcomingReminders();

    expect(notifications.notifyReservationReminder).not.toHaveBeenCalled();
    expect(prisma.reservation.update).not.toHaveBeenCalled();
  });

  it('não faz nada quando não há reservas na janela de lembrete', async () => {
    prisma.reservation.findMany.mockResolvedValue([]);

    await scheduler.sendUpcomingReminders();

    expect(notifications.notifyReservationReminder).not.toHaveBeenCalled();
    expect(prisma.reservation.update).not.toHaveBeenCalled();
  });
});
