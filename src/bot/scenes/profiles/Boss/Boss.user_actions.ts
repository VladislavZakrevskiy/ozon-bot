import { UserService } from 'src/user/user.service';
import { BossParent } from './Boss.parent';
import { OrderService } from 'src/order/order.service';
import { RedisService } from 'src/core/redis/redis.service';
import { Action, Ctx, Update } from 'nestjs-telegraf';
import { SessionSceneContext } from 'src/bot/types/Scene';
import { CallbackQuery } from 'telegraf/typings/core/types/typegram';
import { EmployeeLevel } from '@prisma/client';
import { getRedisKeys } from 'src/core/redis/redisKeys';

@Update()
export class BossUserActions extends BossParent {
  constructor(
    readonly userService: UserService,
    readonly orderService: OrderService,
    readonly redis: RedisService,
  ) {
    super(userService, orderService, redis);
  }

  // UserList
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
      await ctx.answerCbQuery('Нет следующего элемента 1');
    }
  }

  @Action(/^prev__currentIndex_boss_(ADMIN|EMPLOYEE|BOSS)$/)
  public async handleUserPrev(@Ctx() ctx: SessionSceneContext): Promise<void> {
    const prefix = (ctx.callbackQuery as CallbackQuery.DataQuery).data.split(
      '_',
    )?.[4] as EmployeeLevel;
    const { currentIndex, listManager } = await this.getUsersListManager(ctx, prefix);
    if (currentIndex > 0) {
      console.log('ABOBA');
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
}
