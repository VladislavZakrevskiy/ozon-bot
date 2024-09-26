import { Injectable } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { EmployeeLevel, OrderProcess } from '@prisma/client';
import { Update } from 'nestjs-telegraf';
import { SessionContext } from '../types/Scene';
import { getDefaultText } from 'src/core/helpers/getDefaultText';
import { UserService } from 'src/user/user.service';
import { OrderService } from 'src/order/order.service';

@Injectable()
@Update()
export class BotAdminService {
  constructor(
    private userService: UserService,
    private orderService: OrderService,
  ) {}

  @Cron(process.env.OZON_PING_STEP)
  async broadcastUser(ctx: SessionContext) {
    const newReturns = await this.orderService.findManyByParameter({
      order_by_date: 'desc',
      process: [OrderProcess.RETURN],
      is_send: false,
    });
    const users = await this.userService.findUserByRole([
      EmployeeLevel.ADMIN,
      EmployeeLevel.EMPLOYEE,
    ]);

    for (const user of users) {
      for (const ret of newReturns) {
        await ctx.telegram.sendMediaGroup(
          user.tg_chat_id,
          ret.image_urls.map((url, i) => ({
            media: url,
            type: 'photo',
            parse_mode: 'MarkdownV2',
            caption: i === 0 ? getDefaultText(ret, 'new') : undefined,
          })),
        );
      }
    }

    for (const ret of newReturns) {
      await this.orderService.updateOrder(ret.product_id, {
        ...ret,
        is_send: true,
      });
    }
  }
}
