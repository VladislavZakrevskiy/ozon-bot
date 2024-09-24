import { EmployeeLevel, OrderProcess } from '@prisma/client';
import { ListManager } from 'src/bot/templates/ListManager';
import { SessionSceneContext } from 'src/bot/types/Scene';
import { getDefaultText } from 'src/core/helpers/getDefaultText';
import { getTelegramImage } from 'src/core/helpers/getTelegramImage';
import { RedisService } from 'src/core/redis/redis.service';
import { getRedisKeys } from 'src/core/redis/redisKeys';
import { OrderService } from 'src/order/order.service';
import { UserService } from 'src/user/user.service';

export class BossParent {
  constructor(
    readonly userService: UserService,
    readonly orderService: OrderService,
    readonly redis: RedisService,
  ) {}

  async getUsersListManager(ctx: SessionSceneContext, type: EmployeeLevel = 'EMPLOYEE') {
    const currentIndex = Number(
      await this.redis.get(getRedisKeys('currentIndex_boss', type, ctx.chat.id)),
    );
    const users = await this.userService.findUserByRole(type);
    const listManager = new ListManager(
      this.redis,
      users,
      {
        extraButtons: [
          [{ text: 'Редактировать', callback_data: 'edit', web_app: `${process.env.WEBAPP_URL}` }],
        ],
        getText: (user) => getDefaultText(user, 'char'),
        getImage: async (user) => (await getTelegramImage(ctx, user.tg_user_id)).toString(),
      },
      ctx,
      type,
      'currentIndex_boss',
    );

    return { listManager, currentIndex, users };
  }

  async getOrdersListManager(ctx: SessionSceneContext, process_type: OrderProcess = 'DONE') {
    const currentIndex = Number(
      await this.redis.get(getRedisKeys('currentIndex_boss', process_type, ctx.chat.id)),
    );
    const orders = await this.orderService.findManyByParameter({ process: [process_type] });
    const listManager = new ListManager(
      this.redis,
      orders,
      {
        extraButtons: [
          [{ text: 'Редактировать', callback_data: 'edit', web_app: `${process.env.WEBAPP_URL}` }],
          [{ text: 'Сделать возвратом', callback_data: 'make_returns' }],
        ],
        getText: (order) => getDefaultText(order, 'char'),
        getImage: async (order) => order.image_urls[0],
      },
      ctx,
      process_type,
      'currentIndex_boss',
    );

    return { listManager, currentIndex, orders };
  }
}
