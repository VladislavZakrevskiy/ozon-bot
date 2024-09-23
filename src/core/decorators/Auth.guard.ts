import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { SessionContext } from 'src/bot/types/Scene';

@Injectable()
export class AuthGuard implements CanActivate {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const ctx = context.switchToHttp().getRequest<SessionContext>();
    const userId = ctx?.session?.user_id;

    if (!userId) {
      await ctx.reply(
        'Сначала вам нужно авторизоваться с помощью команды /login.',
      );
      return false;
    }

    return true;
  }
}
