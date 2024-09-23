import { Injectable } from '@nestjs/common';
import { Ctx, Scene, SceneEnter, Action } from 'nestjs-telegraf';
import { UserService } from 'src/user/user.service';
import { SessionContext, SessionSceneContext } from 'src/bot/types/Scene';
import { Scenes as ScenesEnum } from '../../types/Scenes';
import { OrderProcess, User } from '@prisma/client';
import { getDefaultText } from 'src/core/helpers/getDefaultText';
import { OrderService } from '../../../order/order.service';
import { RedisService } from 'src/core/redis/redis.service';
import { getRedisKeys } from 'src/core/redis/redisKeys';

// Add CRUD
@Injectable()
@Scene(ScenesEnum.PROFILE_ADMIN)
export class AdminScene {
  constructor(
    private readonly userService: UserService,
    private readonly orderService: OrderService,
    private redis: RedisService,
  ) {}

  async getArrowMessage(
    ctx: SessionContext,
    user: User,
    isFirst: boolean = false,
  ) {
    const orders = await this.orderService.findManyByParameter({
      order_by_date: 'desc',
      process: [OrderProcess.RETURN],
    });
    const adminLastOrderId = await this.redis.get(
      getRedisKeys('adminLastOrderId', ctx.chat.id),
    );

    if (!adminLastOrderId) {
      await this.redis.set(
        getRedisKeys('adminLastOrderId', ctx.chat.id),
        orders[0].id,
      );
    } else {
      const next_index =
        (orders.findIndex(({ id }) => id == adminLastOrderId) + 1) %
        orders.length;

      await this.redis.set(
        getRedisKeys('adminLastOrderId', ctx.chat.id),
        orders[next_index].id,
      );
    }

    const order = orders.find(({ id }) => id === adminLastOrderId);
    const order_index = orders.findIndex(({ id }) => id === order.id);

    if (isFirst) {
      // First message
      await ctx.reply(getDefaultText(user));

      // admin's returns
      await ctx.reply('Здесь возвраты!');
      await ctx.reply(getDefaultText(order), {
        reply_markup: {
          inline_keyboard: [
            [
              order_index !== 0
                ? { text: '⬅️', callback_data: 'admin_back' }
                : undefined,
              order_index !== orders.length - 1
                ? { text: '➡️', callback_data: 'admin_forward' }
                : undefined,
            ],
          ],
        },
      });
    } else {
      // next messages
      await ctx.editMessageText(getDefaultText(order), {
        reply_markup: {
          inline_keyboard: [
            [
              order_index !== 0
                ? { text: '⬅️', callback_data: 'admin_back' }
                : undefined,
              order_index !== orders.length - 1
                ? { text: '➡️', callback_data: 'admin_forward' }
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

  @Action('admin_back')
  async adminBackArrow(ctx: SessionContext) {
    const user_id = await this.redis.get(getRedisKeys('user_id', ctx.chat.id));
    const user = await this.userService.findUserById(user_id, true);
    this.getArrowMessage(ctx, user);
  }

  @Action('admin_forward')
  async adminForwardArrow(ctx: SessionContext) {
    const user_id = await this.redis.get(getRedisKeys('user_id', ctx.chat.id));
    const user = await this.userService.findUserById(user_id, true);
    this.getArrowMessage(ctx, user);
  }
}
