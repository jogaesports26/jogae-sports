import { Logger } from '@nestjs/common';
import { maskPhone, NotificationsService } from './notifications.service';

describe('maskPhone', () => {
  it('mostra só os 4 últimos dígitos', () => {
    expect(maskPhone('85988880001')).toBe('****0001');
    expect(maskPhone('+55 (85) 98888-0001')).toBe('****0001');
  });

  it('não vaza números curtos nem vazios', () => {
    expect(maskPhone('1234')).toBe('****');
    expect(maskPhone('')).toBe('****');
  });
});

describe('NotificationsService', () => {
  it('não grava o telefone inteiro no log', async () => {
    const log = jest.spyOn(Logger.prototype, 'log').mockImplementation();
    const service = new NotificationsService();

    const result = await service.notifyReservationConfirmed(
      '85988880001',
      'Quadra 1',
      new Date('2026-10-12T22:00:00Z'),
      new Date('2026-10-12T23:00:00Z'),
    );

    const logged = String(log.mock.calls[0][0]);
    expect(logged).toContain('****0001');
    expect(logged).not.toContain('85988880001');
    expect(result.sent).toBe(false);
    log.mockRestore();
  });
});
