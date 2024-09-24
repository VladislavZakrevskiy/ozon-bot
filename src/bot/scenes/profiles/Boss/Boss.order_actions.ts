import { UserService } from 'src/user/user.service';
import { BossParent } from './Boss.parent';
import { OrderService } from 'src/order/order.service';
import { RedisService } from 'src/core/redis/redis.service';
import { Action, Ctx, Update } from 'nestjs-telegraf';
import { SessionSceneContext } from 'src/bot/types/Scene';
import { CallbackQuery } from 'telegraf/typings/core/types/typegram';
import { getRedisKeys } from 'src/core/redis/redisKeys';
import { OrderProcess } from '@prisma/client';
import { Injectable } from '@nestjs/common';

@Injectable()
@Update()
export class BossOrderActions extends BossParent {
  constructor(
    readonly userService: UserService,
    readonly orderService: OrderService,
    readonly redis: RedisService,
  ) {
    super(userService, orderService, redis);
  }

  // OrderList
  @Action(/^next_(DONE|IN_WORK|RETURN)$/)
  public async handleOrderNext(@Ctx() ctx: SessionSceneContext): Promise<void> {
    const prefix = (ctx.callbackQuery as CallbackQuery.DataQuery).data.split(
      '_',
    )?.[1] as OrderProcess;
    const { currentIndex, listManager, orders } = await this.getOrdersListManager(ctx, prefix);

    if (currentIndex < orders.length - 1) {
      await this.redis.set(
        getRedisKeys('currentIndex_boss', listManager.prefix, ctx.chat.id),
        currentIndex + 1,
      );
      await listManager.editMessage();
    } else {
      await ctx.answerCbQuery('Нет следующего элемента');
    }
  }

  @Action(/^prev_(admin|employee|boss)$/)
  public async handleOrderPrev(@Ctx() ctx: SessionSceneContext): Promise<void> {
    const prefix = (ctx.callbackQuery as CallbackQuery.DataQuery).data.split(
      '_',
    )?.[1] as OrderProcess;
    const { currentIndex, listManager } = await this.getOrdersListManager(ctx, prefix);

    if (currentIndex > 0) {
      await this.redis.set(
        getRedisKeys('currentIndex_boss', listManager.prefix, ctx.chat.id),
        currentIndex - 1,
      );
      await listManager.editMessage();
    } else {
      await ctx.answerCbQuery('Нет предыдущего элемента');
    }
  }

  @Action('boss_done_orders')
  async doneOrders(@Ctx() ctx: SessionSceneContext) {
    const { listManager, orders } = await this.getOrdersListManager(ctx, OrderProcess.DONE);

    if (orders.length === 0) {
      await ctx.reply('Выполненных заказов нет(');
      return;
    }

    listManager.sendInitialMessage();
  }

  @Action('boss_work_orders')
  async workOrders(@Ctx() ctx: SessionSceneContext) {
    const { listManager, orders } = await this.getOrdersListManager(ctx, OrderProcess.IN_WORK);

    if (orders.length === 0) {
      await ctx.reply('Заказов в работе нет(');
      return;
    }

    listManager.sendInitialMessage();
  }

  @Action('boss_return_orders')
  async returnOrders(@Ctx() ctx: SessionSceneContext) {
    const { listManager, orders } = await this.getOrdersListManager(ctx, OrderProcess.RETURN);

    if (orders.length === 0) {
      await ctx.reply('Возвратов нет(');
      return;
    }

    listManager.sendInitialMessage();
  }

  // TODO
  // OrderList Actions
  @Action('make_returns')
  makeReturns() {}
}
