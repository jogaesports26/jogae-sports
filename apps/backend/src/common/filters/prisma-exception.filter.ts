import { ArgumentsHost, Catch, UnauthorizedException } from '@nestjs/common';
import { BaseExceptionFilter } from '@nestjs/core';
import { Prisma } from '@prisma/client';

// P2025 (registro que devia existir pra um update/delete não existe mais) e
// P2003 (violação de foreign key num create) só acontecem, hoje, quando o
// `sub`/`playerId` de um JWT ainda válido aponta pra um User/Player que já
// foi apagado do banco — sessão obsoleta, não um erro do cliente. Sem isso
// esses casos vazavam como 500 genérico em vez de pedir login de novo.
@Catch(Prisma.PrismaClientKnownRequestError)
export class PrismaExceptionFilter extends BaseExceptionFilter {
  catch(exception: Prisma.PrismaClientKnownRequestError, host: ArgumentsHost) {
    if (exception.code === 'P2025' || exception.code === 'P2003') {
      super.catch(new UnauthorizedException('Sessão expirada'), host);
      return;
    }

    super.catch(exception, host);
  }
}
