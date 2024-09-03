import { Injectable } from '@nestjs/common';
import { Start, Command, Ctx, Update } from 'nestjs-telegraf';
import { Scenes as ScenesEnum } from './types/Scenes';
import { Scenes } from 'telegraf';
import { SessionContext } from './types/Scene';

@Injectable()
@Update()
export class BotService {
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
}
