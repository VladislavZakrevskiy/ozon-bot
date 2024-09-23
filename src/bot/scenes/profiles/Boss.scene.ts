import { Injectable } from '@nestjs/common';
import { Ctx, Scene, SceneEnter, Action } from 'nestjs-telegraf';
import { UserService } from 'src/user/user.service';
import { SessionContext, SessionSceneContext } from 'src/bot/types/Scene';
import { Scenes as ScenesEnum } from '../../types/Scenes';
import { EmployeeLevel, User } from '@prisma/client';
import { getDefaultText } from 'src/core/helpers/getDefaultText';
import { RedisService } from 'src/core/redis/redis.service';
import { getRedisKeys } from 'src/core/redis/redisKeys';

// Потом поменяю когда затесчу
@Injectable()
@Scene(ScenesEnum.PROFILE_BOSS)
export class BossScene {
  constructor(
    private readonly userService: UserService,
    private redis: RedisService,
  ) {}

  async getArrowMessage(
    ctx: SessionContext,
    user: User,
    isFirst: boolean = false,
  ) {
    const users = await this.userService.findUserByRole([
      EmployeeLevel.ADMIN,
      EmployeeLevel.EMPLOYEE,
    ]);

    const bossLastUserId = await this.redis.get(
      getRedisKeys('bossLastUserId', ctx.chat.id),
    );

    if (!bossLastUserId) {
      await this.redis.set(
        getRedisKeys('bossLastUserId', ctx.chat.id),
        users[0].id,
      );
    } else {
      const next_index =
        (users.findIndex(({ id }) => id == bossLastUserId) + 1) % users.length;

      await this.redis.set(
        getRedisKeys('bossLastUserId', ctx.chat.id),
        users[next_index].id,
      );
    }

    const current_user = users.find(({ id }) => id == bossLastUserId);
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
    const user_id = await this.redis.get(getRedisKeys('user_id', ctx.chat.id));
    const user = await this.userService.findUserById(user_id, true);
    this.getArrowMessage(ctx, user, true);
  }

  @Action('boss_back')
  async adminBackArrow(ctx: SessionContext) {
    const user_id = await this.redis.get(getRedisKeys('user_id', ctx.chat.id));
    const user = await this.userService.findUserById(user_id, true);
    this.getArrowMessage(ctx, user);
  }

  @Action('boss_forward')
  async adminForwardArrow(ctx: SessionContext) {
    const user_id = await this.redis.get(getRedisKeys('user_id', ctx.chat.id));
    const user = await this.userService.findUserById(user_id, true);
    this.getArrowMessage(ctx, user);
  }
}
