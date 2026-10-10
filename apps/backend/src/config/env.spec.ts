import {
  isOtpDevCodeExposed,
  resolveCorsOrigins,
  resolveTrustProxy,
  validateEnv,
} from './env';

describe('validateEnv', () => {
  it('falha sem JWT_SECRET', () => {
    expect(() => validateEnv({}, { warn: jest.fn() })).toThrow(/JWT_SECRET/);
    expect(() =>
      validateEnv({ JWT_SECRET: '  ' }, { warn: jest.fn() }),
    ).toThrow();
  });

  it('avisa, sem derrubar, se o segredo tiver menos de 32 caracteres', () => {
    const warn = jest.fn();
    expect(() => validateEnv({ JWT_SECRET: 'curto' }, { warn })).not.toThrow();
    expect(warn).toHaveBeenCalledTimes(1);
  });

  it('não avisa com segredo forte', () => {
    const warn = jest.fn();
    validateEnv({ JWT_SECRET: 'a'.repeat(32) }, { warn });
    expect(warn).not.toHaveBeenCalled();
  });
});

describe('resolveCorsOrigins', () => {
  it('sem variável mantém o comportamento atual (Vercel)', () => {
    const origins = resolveCorsOrigins('');
    expect(origins.some((o) => o instanceof RegExp)).toBe(true);
  });

  it('com variável usa só a lista e ignora coringa', () => {
    expect(
      resolveCorsOrigins(
        'https://jogae.razielhub.cloud, http://localhost:5173,*',
      ),
    ).toEqual(['https://jogae.razielhub.cloud', 'http://localhost:5173']);
  });
});

describe('resolveTrustProxy', () => {
  it('usa 1 por padrão e aceita inteiros', () => {
    expect(resolveTrustProxy(undefined)).toBe(1);
    expect(resolveTrustProxy('2')).toBe(2);
    expect(resolveTrustProxy('abc')).toBe(1);
  });
});

describe('isOtpDevCodeExposed', () => {
  it('é desligada por padrão e só liga com "true"', () => {
    expect(isOtpDevCodeExposed(undefined)).toBe(false);
    expect(isOtpDevCodeExposed('1')).toBe(false);
    expect(isOtpDevCodeExposed('TRUE')).toBe(true);
  });
});
