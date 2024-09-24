import { Injectable } from '@nestjs/common';
import { Ctx, Scene, SceneEnter, Command, On } from 'nestjs-telegraf';
import { Scenes } from 'telegraf';
import { Scenes as ScenesEnum } from '../types/Scenes';
import { SessionSceneContext } from '../types/Scene';
import { UserService } from 'src/user/user.service';
import { EmployeeLevel } from '@prisma/client';
import { hashSync } from 'bcrypt';
import { getTelegramImage } from 'src/core/helpers/getTelegramImage';

@Injectable()
@Scene(ScenesEnum.REGISTER)
export class RegisterScene {
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

    if (!state.login && !state.name && !state.password && !state.phone_number) {
      state.login = ctx.text;
      await ctx.reply('Теперь введите ваш пароль:');
    } else if (!state.name && !state.password && !state.phone_number) {
      state.password = ctx.text;
      await ctx.reply('Теперь введите ваши имя и фамилию:');
    } else if (!state.name && !state.phone_number) {
      state.name = ctx.text;
      await ctx.reply(
        'Теперь введите ваш номер телефона в формате +79999999999:',
      );
    } else {
      const phone_number = ctx.text;

      const { user } = await this.userService.registerUser({
        first_name: state.name.split(' ')?.[0] || 'Имя не указано',
        last_name: state.name.split(' ')?.[1] || 'Фамилия не указана',
        login: state.login,
        password: hashSync(state.password, 7),
        phone_number: phone_number || '',
        tg_chat_id: ctx.message.chat.id,
        tg_user_id: ctx.from.id,
      });

      await ctx.reply(
        'Регистрация успешно завершена! Ожидайте одобрения админом!',
      );

      const boss = await this.userService.findUserByRole(EmployeeLevel.BOSS);
      const photo_url = getTelegramImage(ctx, user.tg_user_id);

      await ctx.telegram.sendPhoto(
        Number(boss[0].tg_chat_id),
        {
          url: photo_url.toString(),
        },
        {
          caption: `Подтвердите регистрацию! Выберите роль пользователя:
Имя: ${user.first_name} ${user.last_name}
Логин: ${user.login}
Номер телефона: ${user.phone_number || 'Нет'}
Телеграм ник: @${ctx.from.username || 'Нет'}
Телеграм имя: ${ctx.from.first_name} ${ctx.from.last_name}
        `,
          reply_markup: {
            inline_keyboard: [
              [{ text: 'Админ', callback_data: 'admin' }],
              [{ text: 'Начальник', callback_data: 'boss' }],
              [{ text: 'Сотрудник', callback_data: 'employee' }],
              [{ text: 'Не одабривать', callback_data: 'enemy' }],
            ],
          },
        },
      );

      await ctx.scene.leave();
    }
  }
}
