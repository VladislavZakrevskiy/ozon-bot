import { Ctx, Action, Update } from 'nestjs-telegraf';
import { SessionSceneContext } from 'src/bot/types/Scene';
import { OrderProcess } from '@prisma/client';
import { getDefaultText } from 'src/core/helpers/getDefaultText';
import { RedisService } from 'src/core/redis/redis.service';
import { getRedisKeys } from 'src/core/redis/redisKeys';
import { ListManager } from 'src/bot/template/ListManager';
import { OrderService } from 'src/order/order.service';
import { CallbackQuery } from 'telegraf/typings/core/types/typegram';

@Update()
export class AdminProfileService {
  constructor(
    private readonly orderService: OrderService,
    private redis: RedisService,
  ) {}

  async getOrdersListManager(ctx: SessionSceneContext, process_type: OrderProcess = 'DONE') {
    const currentIndex = Number(
      await this.redis.get(getRedisKeys('currentIndex_bossorders', process_type, ctx.chat.id)),
    );
    const orders = await this.orderService.findManyByParameter({ process: [process_type] });
    const listManager = new ListManager(
      this.redis,
      orders,
      {
        extraButtons: [
          [
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-ignore
            {
              text: 'Редактировать',
              web_app: (order) => ({ url: `${process.env.WEBAPP_URL}/updateOrder/${order.id}` }),
            },
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-ignore
            {
              text: 'Найти 🔎',
              web_app: () => ({ url: `${process.env.WEBAPP_URL}/find` }),
            },
          ],
        ],
        getText: (order) => getDefaultText(order, 'char'),
        getImage: async (order) => order.image_urls[0],
      },
      ctx,
      process_type,
      'currentIndex_bossorders',
    );

    return { listManager, currentIndex, orders };
  }
  // OrderList
  @Action(/^next__currentIndex_bossorders_(DONE|IN_WORK|RETURN)$/)
  public async handleOrderNext(@Ctx() ctx: SessionSceneContext): Promise<void> {
    const prefix = (ctx.callbackQuery as CallbackQuery.DataQuery).data.split(
      '_',
    )?.[4] as OrderProcess;
    const { currentIndex, listManager, orders } = await this.getOrdersListManager(ctx, prefix);

    if (currentIndex < orders.length - 1) {
      await this.redis.set(
        getRedisKeys('currentIndex_bossorders', listManager.prefix, ctx.chat.id),
        currentIndex + 1,
      );
      await listManager.editMessage();
    } else {
      await ctx.answerCbQuery('Нет следующего элемента');
    }
  }

  @Action(/^prev__currentIndex_bossorders_(DONE|IN_WORK|RETURN)$/)
  public async handleOrderPrev(@Ctx() ctx: SessionSceneContext): Promise<void> {
    const prefix = (ctx.callbackQuery as CallbackQuery.DataQuery).data.split(
      '_',
    )?.[4] as OrderProcess;
    const { currentIndex, listManager } = await this.getOrdersListManager(ctx, prefix);

    if (currentIndex > 0) {
      await this.redis.set(
        getRedisKeys('currentIndex_bossorders', listManager.prefix, ctx.chat.id),
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
}
