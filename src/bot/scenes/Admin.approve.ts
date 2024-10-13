import { Ctx, On, Scene, SceneEnter } from 'nestjs-telegraf';
import { Scenes } from '../types/Scenes';
import { EmployeeLevel } from '@prisma/client';
import { SessionSceneContext } from '../types/Scene';
import { UserService } from 'src/user/user.service';

@Scene(Scenes.APPROVE)
export class ApproveScene {
  constructor(private userService: UserService) {}

  @SceneEnter()
  onSceneEnter(@Ctx() ctx: SessionSceneContext) {
    ctx.reply('Введите должность:');
  }

  @On('text')
  async onText(@Ctx() ctx: SessionSceneContext) {
    const state = ctx.session.approving_data;
    console.log(state);

    if (state && state.userId && state.role) {
      const user = await this.userService.findUserById(state.userId);
      if (!user) {
        await ctx.reply('Не удалось найти пользователя.');
        return;
      }

      const userWithoutId = { ...user };
      delete userWithoutId.id;

      const updatedUser = await this.userService.updateUser(user.id, {
        ...userWithoutId,
        employee_level: state.role,
        post: ctx.text,
        isApproved: true,
      });

      await ctx.reply(`Пользователь назначен на должность ${ctx.text} и подтверждён!`);

      await ctx.telegram.sendMessage(
        updatedUser.tg_chat_id,
        `Привет! Вы теперь ${this.getRoleName(state.role)} на должности "${ctx.text}"! Список своих возможностей можно узнать в разделе /help.`,
      );

      await ctx.scene.leave();

      ctx.session.approving_data = null;
    }
  }

  getRoleName(role: EmployeeLevel): string {
    switch (role) {
      case EmployeeLevel.ADMIN:
        return 'администратор';
      case EmployeeLevel.BOSS:
        return 'начальник';
      case EmployeeLevel.EMPLOYEE:
        return 'сотрудник';
      case EmployeeLevel.ENEMY:
        return 'враг';
      default:
        return 'пользователь';
    }
  }
}
