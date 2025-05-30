import { Ctx, Scene, SceneEnter, Command, On } from 'nestjs-telegraf';
import { Scenes } from 'telegraf';
import { Scenes as ScenesEnum } from '../types/Scenes';
import { SessionSceneContext } from '../types/Scene';
import { UserService } from 'src/user/user.service';
import { EmployeeLevel } from '@prisma/client';
import { hashSync } from 'bcrypt';
import { getTelegramImage } from 'src/core/helpers/getTelegramImage';

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const phoneRegex = /^\+7\d{10}$/;

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
    await ctx.reply('Регистрация отменена.');
    await ctx.scene.leave();
  }

  @On('text')
  async onText(@Ctx() ctx: SessionSceneContext) {
    const state = ctx.scene.session.state as any;

    if (!state.login) {
      const email = ctx.text;

      // Проверка валидности почты
      if (!emailRegex.test(email)) {
        await ctx.reply(
          'Неверный формат почты. Пожалуйста, введите корректный адрес электронной почты:',
        );
        return;
      }

      state.login = email;
      await ctx.reply('Теперь введите ваш пароль (минимум 4 символов):');
    } else if (!state.password) {
      const password = ctx.text;

      if (password.length < 4) {
        await ctx.reply('Пароль слишком короткий. Введите пароль минимум из 4 символов:');
        return;
      }

      state.password = password;
      await ctx.reply('Теперь введите ваши имя и фамилию (через пробел):');
    } else if (!state.name) {
      state.name = ctx.text;
      await ctx.reply('Теперь введите ваш номер телефона в формате +79999999999:');
    } else if (!state.phone_number) {
      const phone_number = ctx.text;

      if (!phoneRegex.test(phone_number)) {
        await ctx.reply('Неверный формат номера телефона. Введите номер в формате +79999999999:');
        return;
      }

      state.phone_number = phone_number;

      const boss_candidate = await this.userService.findUserByRole(EmployeeLevel.BOSS);
      const { user } = await this.userService.registerUser(
        {
          first_name: state.name.split(' ')?.[0] || 'Имя не указано',
          last_name: state.name.split(' ')?.[1] || 'Фамилия не указана',
          login: state.login,
          password: hashSync(state.password, 7),
          phone_number: state.phone_number || '',
          tg_chat_id: ctx.message.chat.id,
          tg_user_id: ctx.from.id,
          tg_username: ctx.from.username,
        },
        !boss_candidate,
      );

      if (!boss_candidate) {
        await ctx.reply('Регистрация успешно завершена! Здравствуйте, Босс!');
        await ctx.scene.leave();
      } else {
        await ctx.reply('Регистрация успешно завершена! Ожидайте одобрения админом!');

        const boss = await this.userService.findUserByRole(EmployeeLevel.BOSS);
        const photo_url = await getTelegramImage(ctx, user.tg_user_id);

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
Телеграм имя: ${ctx.from.first_name} ${ctx.from.last_name ? ctx.from.last_name : ''}`,
            reply_markup: {
              inline_keyboard: [
                [{ text: 'Админ', callback_data: 'admin' }],
                [{ text: 'Начальник', callback_data: 'boss' }],
                [{ text: 'Сотрудник', callback_data: 'employee' }],
                [{ text: 'Не одобрять', callback_data: 'enemy' }],
              ],
            },
          },
        );

        await ctx.scene.leave();
      }
    }
  }
}
