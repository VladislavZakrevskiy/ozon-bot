import { Action, Ctx, Update } from 'nestjs-telegraf';
import { UserService } from 'src/user/user.service';
import { SessionSceneContext } from 'src/bot/types/Scene';
import { OrderProcess } from '@prisma/client';
import { getDefaultText } from 'src/core/helpers/getDefaultText';
import { OrderService } from 'src/order/order.service';
import { ListManager } from '../../template/ListManager';
import { RedisService } from 'src/core/redis/redis.service';
import { getRedisKeys } from 'src/core/redis/redisKeys';
import { CallbackQuery } from 'telegraf/typings/core/types/typegram';
import { getTelegramImage } from 'src/core/helpers/getTelegramImage';

@Update()
export class EmployeeProdfileService {
  constructor(
    private readonly userService: UserService,
    private readonly orderService: OrderService,
    private redis: RedisService,
  ) {}

  async getListManager(
    ctx: SessionSceneContext,
    process: OrderProcess,
    withExtraButtons: boolean = true,
  ) {
    const prefix = process === 'IN_WORK' ? 'work' : 'done';

    const redisIndex = await this.redis.get(
      getRedisKeys('currentIndex_employee', prefix, ctx.chat.id),
    );
    const user_id = await this.redis.get(getRedisKeys('user_id', ctx.chat.id));
    const orders = await this.orderService.findManyByParameter({
      order_by_date: 'desc',
      process: [process],
      user_id: user_id,
    });

    // Проверяем, что индекс валидный
    let currentIndex = redisIndex ? Number(redisIndex) : 0;
    if (isNaN(currentIndex) || currentIndex < 0 || currentIndex >= orders.length) {
      currentIndex = 0;
      await this.redis.set(getRedisKeys('currentIndex_employee', prefix, ctx.chat.id), 0);
    }
    const listManager = new ListManager(
      this.redis,
      orders,
      {
        extraButtons: withExtraButtons
          ? [[{ text: 'Сдать заказ', callback_data: `end_order` }]]
          : undefined,
        getText: (order) => getDefaultText(order, 'char'),
        getImage: async (order) => order.image_urls[0],
      },
      ctx,
      prefix,
      'currentIndex_employee',
    );

    return { listManager, currentIndex, orders };
  }

  // Profile
  async handleProfile(ctx: SessionSceneContext) {
    const user_id = await this.redis.get(getRedisKeys('user_id', ctx.chat.id));
    const user = await this.userService.findUserById(user_id, true);

    const photo_url = await getTelegramImage(ctx, ctx.chat.id);

    ctx.sendPhoto(
      { url: photo_url.toString() },
      {
        caption: getDefaultText(user, 'new'),
        parse_mode: 'MarkdownV2',
        reply_markup: {
          inline_keyboard: [
            [{ callback_data: 'done_orders', text: 'Выполненные' }],
            [{ callback_data: 'work_orders', text: 'В работе' }],
          ],
        },
      },
    );
  }

  // List
  @Action(/^next__currentIndex_employee_.*/)
  public async handleNext(@Ctx() ctx: SessionSceneContext): Promise<void> {
    const prefix = (ctx.callbackQuery as CallbackQuery.DataQuery).data.split('_')?.[3];
    const { currentIndex, listManager, orders } = await this.getListManager(
      ctx,
      prefix === 'work' ? OrderProcess.IN_WORK : OrderProcess.DONE,
      prefix === 'work',
    );

    if (currentIndex < orders.length - 1) {
      await this.redis.set(
        getRedisKeys('currentIndex_employee', listManager.prefix, ctx.chat.id),
        currentIndex + 1,
      );
      await listManager.editMessage();
    } else {
      await ctx.answerCbQuery('Нет следующего элемента');
    }
  }

  @Action(/^prev__currentIndex_employee_.*/)
  public async handlePrev(@Ctx() ctx: SessionSceneContext): Promise<void> {
    const prefix = (ctx.callbackQuery as CallbackQuery.DataQuery).data.split('_')?.[3];
    const { currentIndex, listManager } = await this.getListManager(
      ctx,
      prefix === 'work' ? OrderProcess.IN_WORK : OrderProcess.DONE,
      prefix === 'work',
    );

    if (currentIndex > 0) {
      await this.redis.set(
        getRedisKeys('currentIndex_employee', listManager.prefix, ctx.chat.id),
        currentIndex - 1,
      );
      await listManager.editMessage();
    } else {
      await ctx.answerCbQuery('Нет предыдущего элемента');
    }
  }

  @Action('done_orders')
  async sendDoneOrders(@Ctx() ctx: SessionSceneContext) {
    const { listManager, orders } = await this.getListManager(ctx, OrderProcess.DONE, false);

    if (orders.length === 0) {
      await ctx.reply('Выполненных заказов нет(');
      return;
    }

    listManager.sendInitialMessage();
  }

  @Action('work_orders')
  async sendWorkOrders(@Ctx() ctx: SessionSceneContext) {
    const { listManager, orders } = await this.getListManager(ctx, OrderProcess.IN_WORK);

    if (orders.length === 0) {
      await ctx.reply('Заказов в работе нет(');
      return;
    }

    listManager.sendInitialMessage();
  }

  // List Actions
  @Action('end_order')
  async endOrder(@Ctx() ctx: SessionSceneContext) {
    const user_id = await this.redis.get(getRedisKeys('user_id', ctx.chat.id));
    const { listManager } = await this.getListManager(ctx, OrderProcess.IN_WORK);
    const endedOrder = await this.orderService.endOrder(
      (await listManager.currentItem()).id,
      user_id,
    );

    await ctx.replyWithMarkdownV2(`Вы закончили данный заказ и заработали ${endedOrder.price}
${getDefaultText(endedOrder, 'char')}`);
  }
}
