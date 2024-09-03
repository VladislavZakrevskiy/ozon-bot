import { Injectable } from '@nestjs/common';
import { Ctx, Scene, SceneEnter, Command, On } from 'nestjs-telegraf';
import { Scenes } from 'telegraf';
import { Scenes as ScenesEnum } from '../types/Scenes';
import { SessionSceneContext } from '../types/Scene';
import { UserService } from 'src/user/user.service';
import { EmployeeLevel } from '@prisma/client';

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

      const user = await this.userService.registerUser({
        first_name: state.name.split(' ')?.[0] || 'Имя не указано',
        last_name: state.name.split(' ')?.[1] || 'Фамилия не указана',
        login: state.login,
        password: state.password,
        phone_number: phone_number || '',
        tg_chat_id: ctx.message.chat.id,
      });

      await ctx.reply(
        'Регистрация успешно завершена! Ожидайте одобрения админом!',
      );

      const super_admin = await this.userService.findUserByRole(
        EmployeeLevel.SUPER_ADMIN,
      );

      await ctx.telegram.sendMessage(
        Number(super_admin[0].tg_chat_id),
        `Подтвердите регистрацию! Выберите роль пользователя:
Имя: ${user.first_name} ${user.last_name}
Логин: ${user.login}
Номер телефона: ${user.phone_number || 'Нет'}
Телеграм ник: ${ctx.from.username || 'Нет'}
Телеграм имя: ${ctx.from.first_name} ${ctx.from.last_name}
        `,
        {
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
