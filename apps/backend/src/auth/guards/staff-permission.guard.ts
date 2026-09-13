import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Request } from 'express';
import { REQUIRE_MANAGE_KEY } from '../decorators/require-manage.decorator';

@Injectable()
export class StaffPermissionGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiresManage = this.reflector.getAllAndOverride<boolean>(
      REQUIRE_MANAGE_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiresManage) {
      return true;
    }

    const request = context.switchToHttp().getRequest<Request>();
    const user = request.user;

    if (user?.role === 'STAFF' && user.permission !== 'MANAGE_RESERVATIONS') {
      throw new ForbiddenException(
        'Você não tem permissão para realizar essa ação',
      );
    }

    return true;
  }
}
