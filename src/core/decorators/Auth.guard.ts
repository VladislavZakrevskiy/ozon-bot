import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { SessionContext } from 'src/bot/types/Scene';
import { RedisService } from '../redis/redis.service';
import { getRedisKeys } from '../redis/redisKeys';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private redis: RedisService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const ctx = context.switchToHttp().getRequest<SessionContext>();
    const userId = await this.redis.get(getRedisKeys('user_id', ctx.chat.id));
    console.log(userId);

    if (!userId) {
      await ctx.reply('Сначала вам нужно авторизоваться с помощью команды /login.');
      return false;
    }

    return true;
  }
}
