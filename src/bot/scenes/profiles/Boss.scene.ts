import { Injectable } from '@nestjs/common';
import { Ctx, Scene, SceneEnter, Action } from 'nestjs-telegraf';
import { UserService } from 'src/user/user.service';
import { SessionContext, SessionSceneContext } from 'src/bot/types/Scene';
import { Scenes as ScenesEnum } from '../../types/Scenes';
import { EmployeeLevel, User } from '@prisma/client';
import { getDefaultText } from 'src/core/helpers/getDefaultText';

// Потом поменяю когда затесчу
@Injectable()
@Scene(ScenesEnum.PROFILE_BOSS)
export class BossScene {
  constructor(private readonly userService: UserService) {}

  async getArrowMessage(
    ctx: SessionContext,
    user: User,
    isFirst: boolean = false,
  ) {
    const users = await this.userService.findUserByRole([
      EmployeeLevel.ADMIN,
      EmployeeLevel.EMPLOYEE,
    ]);

    if (!ctx.session.bossLastUserId) {
      ctx.session.bossLastUserId = users[0].id;
    } else {
      const next_index =
        (users.findIndex(({ id }) => id === ctx.session.bossLastUserId) + 1) %
        users.length;

      ctx.session.bossLastUserId = users[next_index].id;
    }

    const current_user = users.find(
      ({ id }) => id === ctx.session.bossLastUserId,
    );
    const user_index = users.findIndex(({ id }) => id === current_user.id);

    if (isFirst) {
      // First message
      await ctx.reply(getDefaultText(user));

      // boss' employees
      await ctx.reply('Здесь ваши сотрудники!');

      await ctx.reply(getDefaultText(current_user), {
        reply_markup: {
          inline_keyboard: [
            [
              user_index !== 0
                ? { text: '⬅️', callback_data: 'boss_back' }
                : undefined,
              user_index !== users.length - 1
                ? { text: '➡️', callback_data: 'boss_forward' }
                : undefined,
            ],
          ],
        },
      });
    } else {
      // next messages
      await ctx.editMessageText(getDefaultText(current_user), {
        reply_markup: {
          inline_keyboard: [
            [
              user_index !== 0
                ? { text: '⬅️', callback_data: 'boss_back' }
                : undefined,
              user_index !== users.length - 1
                ? { text: '➡️', callback_data: 'boss_forward' }
                : undefined,
            ],
          ],
        },
      });
    }
  }

  @SceneEnter()
  async onSceneEnter(@Ctx() ctx: SessionSceneContext) {
    const user = await this.userService.findUserById(ctx.session.user_id, true);
    this.getArrowMessage(ctx, user, true);
  }

  @Action('boss_back')
  async adminBackArrow(ctx: SessionContext) {
    const user = await this.userService.findUserById(ctx.session.user_id, true);
    this.getArrowMessage(ctx, user);
  }

  @Action('boss_forward')
  async adminForwardArrow(ctx: SessionContext) {
    const user = await this.userService.findUserById(ctx.session.user_id, true);
    this.getArrowMessage(ctx, user);
  }
}
