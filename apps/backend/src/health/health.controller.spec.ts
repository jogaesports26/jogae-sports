import { HealthController } from './health.controller';

describe('HealthController', () => {
  it('responde ok sem dependências', () => {
    expect(new HealthController().check()).toEqual({ status: 'ok' });
  });
});
