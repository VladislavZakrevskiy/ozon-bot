import { UseGuards } from '@nestjs/common';
import { Command, Ctx, Update } from 'nestjs-telegraf';
import { OrderService } from '../../order/order.service';
import { EmployeeLevel } from '@prisma/client';
import { Roles, RolesGuard } from 'src/core/decorators/Roles.guard';
import { SessionSceneContext } from '../types/Scene';

@Update()
export class BossLastOrdersService {
  constructor(private readonly orderService: OrderService) {}

  @Roles(EmployeeLevel.BOSS)
  @UseGuards(RolesGuard)
  @Command('last_orders')
  async sendOrdersToBoss(@Ctx() ctx: SessionSceneContext) {
    let days = Number(ctx.text.split(' ')[1]);
    if (isNaN(days) || !days) {
      days = 3;
    }
    const threeDaysAgo = new Date();
    threeDaysAgo.setDate(threeDaysAgo.getDate() - days);
    const orders = await this.orderService.findManyByParameter({ date: { gte: threeDaysAgo } });

    if (!orders.length) {
      await ctx.reply(`За последние ${days} дней не было заказов.`);
      return;
    }

    await ctx.reply(
      `Заказы за последние ${days} дней:

${orders.map(
  ({ name, date }, i) => `${i + 1}. *${name}* ${new Date(date).toISOString().split('T')[0]}
`,
)}`,
      { parse_mode: 'MarkdownV2' },
    );
  }
}
