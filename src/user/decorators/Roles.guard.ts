import { SetMetadata } from '@nestjs/common';
import { EmployeeLevel } from '@prisma/client';
import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { SessionContext } from 'src/bot/types/Scene';

export const ROLES_KEY = 'roles';
export const Roles = (...roles: EmployeeLevel[]) =>
  SetMetadata(ROLES_KEY, roles);

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const roles = this.reflector.get<EmployeeLevel[]>(
      ROLES_KEY,
      context.getHandler(),
    );
    if (!roles) {
      return true;
    }

    const ctx = context.switchToHttp().getRequest<SessionContext>();
    const user = ctx.session.user_id;

    if (!user) {
      await ctx.reply(
        'Сначала вам нужно авторизоваться с помощью команды /login.',
      );
      return false;
    }

    const isRoleCorrect = roles.includes(ctx.session.user.employee_level);

    if (!isRoleCorrect) {
      await ctx.reply('У вас нет доступа!');
      return false;
    }
    return true;
  }
}
