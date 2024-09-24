import { Injectable } from '@nestjs/common';
import { Action, Ctx, Update } from 'nestjs-telegraf';
import { UserService } from 'src/user/user.service';
import { SessionSceneContext } from 'src/bot/types/Scene';
import { OrderProcess } from '@prisma/client';
import { getDefaultText } from 'src/core/helpers/getDefaultText';
import { OrderService } from 'src/order/order.service';
import { ListManager } from '../../templates/ListManager';
import { RedisService } from 'src/core/redis/redis.service';
import { getRedisKeys } from 'src/core/redis/redisKeys';
import { OzonImagesService } from '../../../ozon/ozon.images.service';
import { CallbackQuery } from 'telegraf/typings/core/types/typegram';

@Injectable()
@Update()
export class EmployeeProdfileService {
  constructor(
    private readonly userService: UserService,
    private readonly orderService: OrderService,
    private readonly ozonImagesService: OzonImagesService,
    private redis: RedisService,
  ) {}

  // ListManager and some data
  async getListManager(ctx: SessionSceneContext, process: OrderProcess) {
    const prefix = process === 'IN_WORK' ? 'work' : 'done';

    const currentIndex = Number(
      await this.redis.get(getRedisKeys('currentIndex_employee', prefix, ctx.chat.id)),
    );
    const user_id = await this.redis.get(getRedisKeys('user_id', ctx.chat.id));
    const orders = await this.orderService.findManyByParameter({
      order_by_date: 'desc',
      process: [process],
      user_id: user_id,
    });
    const listManager = new ListManager(
      this.redis,
      orders,
      {
        extraButtons: [[{ text: 'Сдать заказ', callback_data: 'end_order' }]],
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

    const photo_file_id = (await ctx.telegram.getUserProfilePhotos(user.tg_user_id, 0, 1))
      .photos[0][2].file_id;
    const photo_url = await ctx.telegram.getFileLink(photo_file_id);

    ctx.sendPhoto(
      { url: photo_url.toString() },
      {
        caption: getDefaultText(user, 'new'),
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
  @Action(/^next_currentIndex_employee_.*/)
  public async handleNext(@Ctx() ctx: SessionSceneContext): Promise<void> {
    const prefix = (ctx.callbackQuery as CallbackQuery.DataQuery).data.split('_')?.[3];
    const { currentIndex, listManager, orders } = await this.getListManager(
      ctx,
      prefix === 'work' ? OrderProcess.IN_WORK : OrderProcess.DONE,
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

  @Action(/^prev_currentIndex_employee_.*/)
  public async handlePrev(@Ctx() ctx: SessionSceneContext): Promise<void> {
    const prefix = (ctx.callbackQuery as CallbackQuery.DataQuery).data.split('_')?.[3];
    const { currentIndex, listManager } = await this.getListManager(
      ctx,
      prefix === 'work' ? OrderProcess.IN_WORK : OrderProcess.DONE,
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
    const { listManager, orders } = await this.getListManager(ctx, OrderProcess.DONE);

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

  // TODO
  // List Actions
  @Action('end_order')
  endOrder() {}
}
