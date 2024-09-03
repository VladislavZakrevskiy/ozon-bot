import { Injectable } from '@nestjs/common';
import { Ctx, Scene, SceneEnter, Command, On } from 'nestjs-telegraf';
import { Scenes } from 'telegraf';
import { Scenes as ScenesEnum } from '../types/Scenes';
import { SessionSceneContext } from '../types/Scene';
import { UserService } from 'src/user/user.service';

@Injectable()
@Scene(ScenesEnum.LOGIN)
export class LoginScene {
  constructor(private readonly userService: UserService) {}

  @SceneEnter()
  async onSceneEnter(@Ctx() ctx: SessionSceneContext) {
    await ctx.reply('Пожалуйста, введите вашу почту:');
    ctx.scene.session.state = {};
  }

  @Command('cancel')
  async onCancel(@Ctx() ctx: Scenes.SceneContext) {
    await ctx.reply('Авторизация отменена.');
    await ctx.scene.leave();
  }

  @On('text')
  async onText(@Ctx() ctx: SessionSceneContext) {
    const state = ctx.scene.session.state as any;

    if (!state.login) {
      state.login = ctx.text;
      await ctx.reply('Теперь введите ваш пароль:');
    } else {
      const password = ctx.text;

      console.log(state.login, password);
      const user = await this.userService.validateUser(state.login, password);
      if (user) {
        ctx.session.user_id = user.id;
        ctx.session.user = user;
        await ctx.reply('Вы успешно авторизовались!');
        await ctx.scene.leave();
      } else {
        await ctx.reply('Неверный логин или пароль, попробуйте снова.');
        await ctx.scene.reenter();
      }
    }
  }
}
