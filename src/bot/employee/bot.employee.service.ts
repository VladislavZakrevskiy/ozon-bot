import { Injectable, UseGuards } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { EmployeeLevel, OrderProcess } from '@prisma/client';
import { Action, Ctx, Update } from 'nestjs-telegraf';
import { SessionContext, SessionSceneContext } from '../types/Scene';
import { EmployeeTgMessageId } from '../types/EmployeeTgMessageId';
import { getDefaultText } from 'src/core/helpers/getDefaultText';
import { OrderService } from 'src/order/order.service';
import { UserService } from 'src/user/user.service';
import { Roles, RolesGuard } from 'src/user/decorators/Roles.guard';

@Injectable()
@Update()
export class BotEmployeeService {
  constructor(
    private orderService: OrderService,
    private userService: UserService,
  ) {}

  @Cron('*/5 * * * *')
  async broadcastEmployees(ctx: SessionContext) {
    const newOrders = await this.orderService.findManyByParameter({
      process: [OrderProcess.FREE],
      is_send: false,
    });
    const employees = await this.userService.findUserByRole(
      EmployeeLevel.EMPLOYEE,
    );
    const orderTgMessagesIds: EmployeeTgMessageId[] = [];

    for (const employee of employees) {
      for (const newOrder of newOrders) {
        const { message_id } = await ctx.telegram.sendPhoto(
          employee.tg_chat_id,
          { url: newOrder.image_urls[0] },
          {
            caption: getDefaultText(
              newOrder,
              await this.orderService.getOrdersOnReturns(newOrder.name),
            ),
            reply_markup: {
              inline_keyboard: [
                [
                  {
                    text: 'Взять в работу!',
                    callback_data: 'go_to_work_order',
                  },
                ],
              ],
            },
          },
        );

        orderTgMessagesIds.push({
          message_id: message_id,
          employee_tg_chat_id: employee.tg_chat_id,
          order_id: newOrder.id,
        });
      }
    }

    for (const order of newOrders) {
      await this.orderService.updateOrder(order.product_id, {
        ...order,
        is_send: true,
      });
    }

    ctx.session.orderTgMessagesIds = orderTgMessagesIds;
  }

  @Action('go_to_work_order')
  async goToWorkOrder(ctx: SessionContext) {
    const current_chat_id = ctx.chat.id;
    const current_order_id = ctx.text.split(' ')[4].split('\n')[0].slice(0, -1);
    const current_message_id = ctx.session.orderTgMessagesIds.find(
      ({ employee_tg_chat_id, order_id }) =>
        employee_tg_chat_id === current_chat_id &&
        current_order_id === order_id,
    ).message_id;

    const current_order = await this.orderService.findOneByParameter({
      id: current_order_id,
    });
    await this.orderService.updateOrder(current_order_id, {
      ...current_order,
      user_id: ctx.session.user_id,
      proccess: OrderProcess.IN_WORK,
    });

    for (const { employee_tg_chat_id, message_id, order_id } of ctx.session
      .orderTgMessagesIds) {
      if (
        employee_tg_chat_id !== current_chat_id &&
        message_id !== current_message_id &&
        order_id !== current_order_id
      ) {
        ctx.telegram.deleteMessage(employee_tg_chat_id, message_id);
      }
    }

    ctx.session.orderTgMessagesIds = [];

    ctx.reply('Вы взяли в работу этот заказ!');
  }

  @UseGuards(RolesGuard)
  @Roles(EmployeeLevel.EMPLOYEE)
  @Action('/end_order')
  async endOrder(@Ctx() ctx: SessionSceneContext) {
    const order_id = ctx.text.split(' ')[1];
    const order = await this.orderService.findOneByParameter({ id: order_id });
    const user_id = ctx.session.user_id;
    const user = await this.userService.findUserById(user_id);

    // Update entities
    await this.userService.updateUser(user_id, {
      ...user,
      money: user.money + order.price,
    });

    await this.orderService.updateOrder(order.product_id, {
      ...order,
      proccess: OrderProcess.DONE,
    });

    await ctx.reply(
      `Заказ завершен! Ваш нынешний баланс: ${user.money + order.price}`,
    );
  }
}
