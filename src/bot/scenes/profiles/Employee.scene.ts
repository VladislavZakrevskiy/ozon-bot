import { Injectable } from '@nestjs/common';
import { Action, Ctx, On, Scene, SceneEnter } from 'nestjs-telegraf';
import { UserService } from 'src/user/user.service';
import { SessionSceneContext } from 'src/bot/types/Scene';
import { Scenes as ScenesEnum } from '../../types/Scenes';
import { Order, OrderProcess } from '@prisma/client';
import { getDefaultText } from 'src/core/helpers/getDefaultText';
import { OrderService } from 'src/order/order.service';
import { ListManager } from '../../templates/ListManager';

@Injectable()
@Scene(ScenesEnum.PROFILE_EMPLOYEE)
export class EmployeeScene {
  constructor(
    private readonly userService: UserService,
    private readonly orderService: OrderService,
    private readonly listManager: ListManager<Order>,
  ) {}

  @SceneEnter()
  async onSceneEnter(@Ctx() ctx: SessionSceneContext) {
    const user = await this.userService.findUserById(ctx.session.user_id, true);
    ctx.reply(getDefaultText(user), {
      reply_markup: {
        inline_keyboard: [
          [{ callback_data: 'done_orders', text: 'Выполненные' }],
          [{ callback_data: 'work_orders', text: 'В работе' }],
        ],
      },
    });
  }

  @Action('done_orders')
  async sendDoneOrders(@Ctx() ctx: SessionSceneContext) {
    const user = await this.userService.findUserById(ctx.session.user_id, true);
    const orders = await this.orderService.findManyByParameter({
      order_by_date: 'desc',
      process: [OrderProcess.DONE],
      user_id: user.id,
    });

    this.listManager.setTemplate(orders, {
      getText: getDefaultText,
      getImage: ({ image_urls }) => image_urls[0],
    });

    this.listManager.sendInitialMessage(ctx);
  }

  @Action('work_orders')
  async sendWorkOrders(@Ctx() ctx: SessionSceneContext) {
    const user = await this.userService.findUserById(ctx.session.user_id, true);
    const orders = await this.orderService.findManyByParameter({
      order_by_date: 'desc',
      process: [OrderProcess.IN_WORK],
      user_id: user.id,
    });

    this.listManager.setTemplate(orders, {
      getText: getDefaultText,
      getImage: ({ image_urls }) => image_urls[0],
    });

    this.listManager.sendInitialMessage(ctx);
  }

  @On('text')
  onText(@Ctx() ctx: SessionSceneContext) {
    ctx.scene.leave();
  }
}
