import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { Request } from 'express';
import type { AuthenticatedUser } from '../guards/jwt-auth.guard';

/**
 * Resolve o ownerId do dono da conta, seja o próprio dono logado (sub) ou
 * um funcionário (STAFF) agindo em nome do dono ao qual está vinculado.
 */
export const CurrentOwnerId = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): string => {
    const request = ctx.switchToHttp().getRequest<Request>();
    const user = request.user as AuthenticatedUser;
    return user.role === 'STAFF' ? (user.ownerId as string) : user.sub;
  },
);
