import { Ctx, Scene, SceneEnter, Command, On } from 'nestjs-telegraf';
import { Scenes } from 'telegraf';
import { Scenes as ScenesEnum } from '../types/Scenes';
import { SessionSceneContext } from '../types/Scene';
import { UserService } from 'src/user/user.service';
import { RedisService } from 'src/core/redis/redis.service';
import { getRedisKeys } from 'src/core/redis/redisKeys';

@Scene(ScenesEnum.LOGIN)
export class LoginScene {
  constructor(
    private readonly userService: UserService,
    private redis: RedisService,
  ) {}

  @SceneEnter()
  async onSceneEnter(@Ctx() ctx: SessionSceneContext) {
    await ctx.reply(`Пожалуйста, введите вашу почту:
При небходимости отменить авторизацию напишите /cancel`);
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

    // Регулярное выражение для валидации почты
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!state.login) {
      const email = ctx.text;

      if (!emailRegex.test(email)) {
        await ctx.reply(
          'Неверный формат почты. Пожалуйста, введите корректный адрес электронной почты:',
        );
        return;
      }

      state.login = email;
      await ctx.reply('Теперь введите ваш пароль:');
    } else {
      const password = ctx.text;

      if (password.length < 4) {
        await ctx.reply('Пароль должен содержать минимум 4 символов. Попробуйте снова:');
        return;
      }

      const user = await this.userService.validateUser(state.login, password);
      if (user) {
        // Сохраняем данные пользователя в Redis
        await this.redis.set(getRedisKeys('user_id', ctx.chat.id), user.candidate.id);
        await this.redis.set(getRedisKeys('user', ctx.chat.id), user.candidate);
        await this.redis.set(getRedisKeys('refresh_token', ctx.chat.id), user.refresh_token);
        await this.redis.set(getRedisKeys('access_token', ctx.chat.id), user.access_token);

        await ctx.reply('Вы успешно авторизовались!');
        await ctx.scene.leave();
      } else {
        await ctx.reply('Неверный логин или пароль, попробуйте снова.');
        // Сбрасываем введенные данные, чтобы пользователь ввел их заново
        state.login = null;
        await ctx.reply('Пожалуйста, введите вашу почту:');
      }
    }
  }
}
