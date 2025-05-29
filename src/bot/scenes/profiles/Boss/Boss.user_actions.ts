import { UserService } from 'src/user/user.service';
import { BossParent } from './Boss.parent';
import { OrderService } from 'src/order/order.service';
import { RedisService } from 'src/core/redis/redis.service';
import { Action, Ctx, Update } from 'nestjs-telegraf';
import { SessionSceneContext } from 'src/bot/types/Scene';
import { CallbackQuery } from 'telegraf/typings/core/types/typegram';
import { EmployeeLevel } from '@prisma/client';
import { getRedisKeys } from 'src/core/redis/redisKeys';
import { getDefaultText } from 'src/core/helpers/getDefaultText';

@Update()
export class BossUserActions extends BossParent {
  constructor(
    readonly userService: UserService,
    readonly orderService: OrderService,
    readonly redis: RedisService,
  ) {
    super(userService, orderService, redis);
  }

  @Action(/^next__currentIndex_boss_(ADMIN|EMPLOYEE|BOSS)$/)
  public async handleUserNext(@Ctx() ctx: SessionSceneContext): Promise<void> {
    const prefix = (ctx.callbackQuery as CallbackQuery.DataQuery).data.split(
      '_',
    )?.[4] as EmployeeLevel;
    const { currentIndex, listManager, users } = await this.getUsersListManager(ctx, prefix);

    if (currentIndex < users.length - 1) {
      await this.redis.set(
        getRedisKeys('currentIndex_boss', listManager.prefix, ctx.chat.id),
        currentIndex + 1,
      );
      await listManager.editMessage();
    } else {
      await ctx.answerCbQuery('Нет следующего элемента');
    }
  }

  @Action(/^prev__currentIndex_boss_(ADMIN|EMPLOYEE|BOSS)$/)
  public async handleUserPrev(@Ctx() ctx: SessionSceneContext): Promise<void> {
    const prefix = (ctx.callbackQuery as CallbackQuery.DataQuery).data.split(
      '_',
    )?.[4] as EmployeeLevel;
    const { currentIndex, listManager } = await this.getUsersListManager(ctx, prefix);
    console.log(
      await this.redis.get(getRedisKeys('currentIndex_boss', listManager.prefix, ctx.chat.id)),
    );
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

  @Action('boss_admin_users')
  async adminUsers(@Ctx() ctx: SessionSceneContext) {
    const { listManager, users } = await this.getUsersListManager(ctx, EmployeeLevel.ADMIN);

    if (users.length === 0) {
      await ctx.reply('Админов нет(');
      return;
    }

    listManager.sendInitialMessage();
  }

  @Action('boss_employee_users')
  async employeeUsers(@Ctx() ctx: SessionSceneContext) {
    const { listManager, users } = await this.getUsersListManager(ctx, EmployeeLevel.EMPLOYEE);

    if (users.length === 0) {
      await ctx.reply('Сотрудников нет(');
      return;
    }

    listManager.sendInitialMessage();
  }

  @Action('boss_enemy_users')
  async enemyUsers(@Ctx() ctx: SessionSceneContext) {
    const { listManager, users } = await this.getUsersListManager(ctx, EmployeeLevel.ENEMY);

    if (users.length === 0) {
      await ctx.reply('Незарегистрированных нет(');
      return;
    }

    listManager.sendInitialMessage();
  }

  @Action('admin_dismiss_employee')
  async dismissEmployee(@Ctx() ctx: SessionSceneContext) {
    const { users, currentIndex } = await this.getUsersListManager(ctx);
    const currentUser = users[currentIndex];

    const userOrders = await this.orderService.findManyByParameter({
      process: ['IN_WORK'],
      user_id: currentUser.id,
    });

    if (userOrders && userOrders.length > 0) {
      for (const order of userOrders) {
        delete order.id;
        delete order.user_id;

        await this.orderService.updateOrder(order.product_id, {
          ...order,
          user: {},
          category: { connect: { id: order.category_id } },
          proccess: 'FREE',
          is_send: false,
        });
      }

      await ctx.reply(
        `Освобождено ${userOrders.length} заказов, которые были в работе у сотрудника`,
      );
    }

    await this.userService.countMoney(currentUser.id);

    this.userService.deleteUser(currentUser.id);

    await ctx.telegram.sendMessage(
      currentUser.tg_chat_id,
      'К сожалению, вы уволены, расчет произведен',
    );

    await ctx.replyWithMarkdownV2(`Уволен данный сотрудник:
${getDefaultText(currentUser, 'char')}`);
  }

  @Action('admin_give_money')
  async giveEmployee(@Ctx() ctx: SessionSceneContext) {
    const { listManager } = await this.getUsersListManager(ctx);
    const currentUser = await listManager.currentItem();

    const updatedUser = await this.userService.countMoney(currentUser.id);
    await ctx.telegram.sendMessage(
      currentUser.tg_user_id,
      'Расчет выплат произведен, в ближайшие дни ожидайте зп',
    );
    await ctx.replyWithMarkdownV2(`Вы сделали перерасчет зп данному сотруднику:
${getDefaultText(updatedUser, 'char')}`);
  }
}
