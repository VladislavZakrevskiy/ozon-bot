import { Injectable, UseGuards } from '@nestjs/common';
import { Start, Command, Ctx, Update } from 'nestjs-telegraf';
import { Scenes as ScenesEnum } from './types/Scenes';
import { Scenes } from 'telegraf';
import { SessionContext } from './types/Scene';
import { RedisService } from 'src/core/redis/redis.service';
import { getRedisKeys } from 'src/core/redis/redisKeys';
import { AuthGuard } from 'src/core/decorators/Auth.guard';

@Injectable()
@Update()
export class BotService {
  constructor(private redis: RedisService) {}

  @Start()
  async startCommand(@Ctx() ctx: SessionContext) {
    await ctx.reply(
      'Добро пожаловать! Используйте /login для авторизации, /register для регистрации',
    );
  }

  @Command('login')
  async loginCommand(@Ctx() ctx: Scenes.SceneContext) {
    await ctx.scene.enter(ScenesEnum.LOGIN);
  }

  @Command('register')
  async registerCommand(@Ctx() ctx: Scenes.SceneContext) {
    await ctx.scene.enter(ScenesEnum.REGISTER);
  }

  @UseGuards(AuthGuard)
  @Command('logout')
  async logout(@Ctx() ctx: Scenes.SceneContext) {
    await this.redis.delete(getRedisKeys('user', ctx.chat.id));
    await this.redis.delete(getRedisKeys('user_id', ctx.chat.id));
    await this.redis.delete(getRedisKeys('user', ctx.chat.id));

    await ctx.reply('Вы вышли, возвращайтесь!');
  }
}
