import { Injectable, UseGuards } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { EmployeeLevel, OrderProcess } from '@prisma/client';
import { Action, Command, Ctx, InjectBot, Update } from 'nestjs-telegraf';
import { SessionContext, SessionSceneContext } from '../types/Scene';
import { getDefaultText } from 'src/core/helpers/getDefaultText';
import { OrderService } from 'src/order/order.service';
import { UserService } from 'src/user/user.service';
import { Roles, RolesGuard } from 'src/core/decorators/Roles.guard';
import { Telegraf } from 'telegraf';
import { RedisService } from 'src/core/redis/redis.service';
import { getRedisKeys } from 'src/core/redis/redisKeys';

@Injectable()
@Update()
export class BotEmployeeService {
  constructor(
    private orderService: OrderService,
    private userService: UserService,
    @InjectBot() private bot: Telegraf,
    private redis: RedisService,
  ) {}

  // Тут нельзя сделать ctx, поэтому без session
  @Cron('*/30 * * * * *')
  async broadcastEmployees() {
    const newOrders = await this.orderService.findManyByParameter({
      process: [OrderProcess.FREE],
      is_send: false,
    });
    const employees = await this.userService.findUserByRole(
      EmployeeLevel.EMPLOYEE,
    );

    for (const employee of employees) {
      for (const newOrder of newOrders) {
        const returns = await this.orderService.getOrdersOnReturns(
          newOrder.name,
        );

        const { message_id } = await this.bot.telegram.sendPhoto(
          employee.tg_chat_id,
          { url: newOrder.image_urls[0] },
          {
            caption: getDefaultText(newOrder, returns),
            reply_markup: {
              inline_keyboard: [
                [
                  {
                    text:
                      returns.length === 0
                        ? 'Взять в работу!'
                        : 'Забрать со склада!',
                    callback_data:
                      returns.length === 0
                        ? 'go_to_work_order'
                        : 'take_from_warehouse',
                  },
                ],
              ],
            },
          },
        );

        this.redis.addToList(
          getRedisKeys('orderToDelete', newOrder.id, employee.tg_chat_id),
          message_id,
        );
      }
    }

    for (const order of newOrders) {
      delete order.id;
      await this.orderService.updateOrder(order.product_id, {
        ...order,
        is_send: true,
      });
    }
  }

  @Action('go_to_work_order')
  async goToWorkOrder(@Ctx() ctx: SessionContext) {
    const employees = await this.userService.findUserByRole(
      EmployeeLevel.EMPLOYEE,
    );

    const current_chat_id = ctx.chat.id;
    const current_order_id = ctx.text.split(' ')[4].split('\n')[0].slice(0, -1);
    const current_message_id = this.redis.get(
      getRedisKeys('orderToDelete', current_order_id, current_chat_id),
    );

    const current_order = await this.orderService.findOneByParameter({
      id: current_order_id,
    });

    await this.orderService.updateOrder(Number(current_order_id), {
      ...current_order,
      user_id: ctx.session.user_id,
      proccess: OrderProcess.IN_WORK,
    });

    for (const employee of employees) {
      const emp_chat_id = employee.tg_chat_id;
      const emp_message_id = await this.redis.get(
        getRedisKeys('orderToDelete', current_order_id, emp_chat_id),
      );

      if (emp_message_id && current_message_id == emp_message_id) {
        await ctx.telegram.deleteMessage(emp_chat_id, Number(emp_message_id));
      }
    }

    ctx.reply('Вы взяли в работу этот заказ!');
  }

  // @Action('take_from_warehouse')
  // takeFromWarehouse(@Ctx() ctx: SessionContext) {}

  @UseGuards(RolesGuard)
  @Roles(EmployeeLevel.EMPLOYEE)
  @Command('end_order')
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
