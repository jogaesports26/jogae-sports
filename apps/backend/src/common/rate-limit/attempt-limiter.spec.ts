import { AttemptLimiter } from './attempt-limiter';

describe('AttemptLimiter', () => {
  it('permite até o máximo e bloqueia depois', () => {
    const limiter = new AttemptLimiter(2, 1000);
    expect(limiter.hit('a')).toBe(true);
    expect(limiter.hit('a')).toBe(true);
    expect(limiter.hit('a')).toBe(false);
    expect(limiter.hit('b')).toBe(true);
  });

  it('libera após a janela', () => {
    let t = 0;
    const limiter = new AttemptLimiter(1, 1000, () => t);
    expect(limiter.hit('a')).toBe(true);
    expect(limiter.hit('a')).toBe(false);
    t = 1001;
    expect(limiter.hit('a')).toBe(true);
  });

  it('isBlocked e reset', () => {
    const limiter = new AttemptLimiter(1, 1000);
    limiter.hit('a');
    expect(limiter.isBlocked('a')).toBe(true);
    limiter.reset('a');
    expect(limiter.isBlocked('a')).toBe(false);
  });
});
