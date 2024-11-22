import { Cron } from '@nestjs/schedule';
import { EmployeeLevel, OrderProcess } from '@prisma/client';
import { Action, Ctx, InjectBot, Update } from 'nestjs-telegraf';
import { SessionContext } from '../types/Scene';
import { getDefaultText } from 'src/core/helpers/getDefaultText';
import { OrderService } from 'src/order/order.service';
import { UserService } from 'src/user/user.service';
import { Telegraf } from 'telegraf';
import { RedisService } from 'src/core/redis/redis.service';
import { getRedisKeys } from 'src/core/redis/redisKeys';

@Update()
export class BotEmployeeService {
  constructor(
    private orderService: OrderService,
    private userService: UserService,
    @InjectBot() private bot: Telegraf,
    private redis: RedisService,
  ) {}

  @Cron(process.env.OZON_PING_STEP)
  async broadcastEmployees() {
    const newOrders = await this.orderService.findManyByParameter({
      process: [OrderProcess.FREE, OrderProcess.RETURN],
      is_send: false,
    });
    const employees = await this.userService.findUserByRole(EmployeeLevel.EMPLOYEE);

    for (const employee of employees) {
      for (const newOrder of newOrders) {
        try {
          const returns = await this.orderService.getOrdersOnReturns(newOrder.name, newOrder.id);
          const isAuth = await this.redis.get(getRedisKeys('user', employee.tg_chat_id));
          if (isAuth) {
            const { message_id } = await this.bot.telegram.sendPhoto(
              employee.tg_chat_id,
              { url: newOrder.image_urls[0] },
              {
                caption: getDefaultText(newOrder, 'new', returns),
                parse_mode: 'MarkdownV2',
                reply_markup: {
                  inline_keyboard: [
                    [
                      {
                        text: returns.length === 0 ? `Взять в работу\!` : `Забрать со склада\!`,
                        callback_data:
                          returns.length === 0 ? 'go_to_work_order' : 'take_from_warehouse',
                      },
                    ],
                  ],
                },
              },
            );

            await this.redis.set(
              getRedisKeys('orderToDelete', newOrder.id, employee.tg_chat_id),
              message_id,
            );
          }
        } catch (error) {
          console.log(error);
          if (error?.error_code == 403) {
            const employee_index = employees.findIndex(({ id }) => id === employee.id);
            employees.splice(employee_index, 1);
          }
        }
      }
    }

    for (const order of newOrders) {
      delete order.id;
      delete order.category_id;
      delete order.user_id;

      await this.orderService.updateOrder(order.product_id, {
        ...order,
        user: {},
        category: { connect: { id: order.category.id } },
        is_send: true,
      });
    }
  }

  @Action('go_to_work_order')
  async goToWorkOrder(@Ctx() ctx: SessionContext) {
    const employees = await this.userService.findUserByRole(EmployeeLevel.EMPLOYEE);

    const current_chat_id = ctx.chat.id;
    const current_order_id = ctx.text.split(' ')[3].split('\n')[0];
    const current_user_id = await this.redis.get(getRedisKeys('user_id', current_chat_id));

    const current_order = await this.orderService.findOneByParameter({
      id: current_order_id,
    });

    delete current_order?.id;
    delete current_order?.user_id;
    await this.orderService.updateOrder(current_order_id, {
      ...current_order,
      user: { connect: { id: current_user_id } },
      category: { connect: { id: current_order.category_id } },
      proccess: OrderProcess.IN_WORK,
    });

    for (const employee of employees) {
      const emp_chat_id = employee.tg_chat_id;
      const emp_message_id = await this.redis.get(
        getRedisKeys('orderToDelete', current_order_id, emp_chat_id),
      );

      if (emp_message_id) {
        await ctx.telegram.deleteMessage(emp_chat_id, Number(emp_message_id));
      }

      await this.redis.delete(getRedisKeys('orderToDelete', current_order_id, emp_chat_id));
    }

    ctx.reply('Вы взяли в работу этот заказ!');
  }

  @Action('take_from_warehouse')
  async takeFromWarehouse(@Ctx() ctx: SessionContext) {
    const employees = await this.userService.findUserByRole(EmployeeLevel.EMPLOYEE);

    const current_chat_id = ctx.chat.id;
    const current_order_id = ctx.text.split(' ')[3].split('\n')[0];
    const current_user_id = await this.redis.get(getRedisKeys('user_id', current_chat_id));

    const current_order = await this.orderService.findOneByParameter({
      id: current_order_id,
    });
    const current_category_id = current_order.category_id;

    delete current_order?.id;
    delete current_order?.user_id;
    delete current_order.category_id;
    await this.orderService.updateOrder(current_order_id, {
      ...current_order,
      user: { connect: { id: current_user_id } },
      category: { connect: { id: current_category_id } },
      proccess: OrderProcess.DONE,
    });

    for (const employee of employees) {
      const emp_chat_id = employee.tg_chat_id;
      const emp_message_id = await this.redis.get(
        getRedisKeys('orderToDelete', current_order_id, emp_chat_id),
      );

      if (emp_message_id) {
        await ctx.telegram.deleteMessage(emp_chat_id, Number(emp_message_id));
      }

      await this.redis.delete(getRedisKeys('orderToDelete', current_order_id, emp_chat_id));
    }

    ctx.reply('Вы взяли со склада данный товар! ');
  }
}
