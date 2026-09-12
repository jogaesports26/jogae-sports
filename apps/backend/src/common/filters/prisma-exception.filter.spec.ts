import { UnauthorizedException } from '@nestjs/common';
import { BaseExceptionFilter } from '@nestjs/core';
import { Prisma } from '@prisma/client';
import { PrismaExceptionFilter } from './prisma-exception.filter';

function buildPrismaError(code: string) {
  return Object.assign(
    Object.create(Prisma.PrismaClientKnownRequestError.prototype),
    { code, message: 'erro simulado do prisma', meta: {} },
  ) as Prisma.PrismaClientKnownRequestError;
}

describe('PrismaExceptionFilter', () => {
  let superCatch: jest.SpyInstance;

  beforeEach(() => {
    superCatch = jest
      .spyOn(BaseExceptionFilter.prototype, 'catch')
      .mockImplementation(() => undefined);
  });

  afterEach(() => {
    superCatch.mockRestore();
  });

  it('converte P2025 (registro não encontrado) em 401 "Sessão expirada"', () => {
    const filter = new PrismaExceptionFilter({} as any);
    const host = {} as any;

    filter.catch(buildPrismaError('P2025'), host);

    expect(superCatch).toHaveBeenCalledTimes(1);
    const [exception] = superCatch.mock.calls[0];
    expect(exception).toBeInstanceOf(UnauthorizedException);
    expect(exception.message).toBe('Sessão expirada');
  });

  it('converte P2003 (violação de foreign key) em 401 "Sessão expirada"', () => {
    const filter = new PrismaExceptionFilter({} as any);
    const host = {} as any;

    filter.catch(buildPrismaError('P2003'), host);

    const [exception] = superCatch.mock.calls[0];
    expect(exception).toBeInstanceOf(UnauthorizedException);
  });

  it('repassa outros códigos Prisma pro tratamento padrão (não mascara com 401)', () => {
    const filter = new PrismaExceptionFilter({} as any);
    const host = {} as any;
    const original = buildPrismaError('P2002');

    filter.catch(original, host);

    const [exception] = superCatch.mock.calls[0];
    expect(exception).toBe(original);
  });
});
