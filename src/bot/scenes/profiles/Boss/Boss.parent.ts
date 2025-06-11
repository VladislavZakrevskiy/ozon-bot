import { EmployeeLevel, OrderProcess } from '@prisma/client';
import { ListManager } from 'src/bot/template/ListManager';
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
    const redisIndex = await this.redis.get(getRedisKeys('currentIndex_boss', type, ctx.chat.id));
    const users = await this.userService.findUserByRole(type);

    let currentIndex = redisIndex ? Number(redisIndex) : 0;
    if (isNaN(currentIndex) || currentIndex < 0 || currentIndex >= users.length) {
      currentIndex = 0;
      await this.redis.set(getRedisKeys('currentIndex_boss', type, ctx.chat.id), 0);
    }
    const listManager = new ListManager(
      this.redis,
      users,
      {
        extraButtons: [
          [
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-ignore
            {
              text: 'Редактировать',
              web_app: (user) => ({ url: `${process.env.WEBAPP_URL}/updateUser/${user.id}` }),
            },
          ],
          [{ text: 'Ограничить доступ', callback_data: 'admin_dismiss_employee' }],
          [{ text: 'Расчитать заработную плату', callback_data: 'admin_give_money' }],
        ],
        getText: (user) => getDefaultText(user, 'char'),
        getImage: async (user) => {
          const photoUrl = await getTelegramImage(ctx, user.tg_user_id);
          return photoUrl.toString(); // Преобразуем URL в строку
        },
      },
      ctx,
      type,
      'currentIndex_boss',
    );

    return { listManager, currentIndex, users };
  }

  async getOrdersListManager(ctx: SessionSceneContext, process_type: OrderProcess = 'DONE') {
    const redisIndex = await this.redis.get(
      getRedisKeys('currentIndex_boss', process_type, ctx.chat.id),
    );
    const orders = await this.orderService.findManyByParameter({ process: [process_type] });

    // Проверяем, что индекс валидный
    let currentIndex = redisIndex ? Number(redisIndex) : 0;
    if (isNaN(currentIndex) || currentIndex < 0 || currentIndex >= orders.length) {
      currentIndex = 0;
      await this.redis.set(getRedisKeys('currentIndex_boss', process_type, ctx.chat.id), 0);
    }
    const listManager = new ListManager(
      this.redis,
      orders,
      {
        extraButtons: [
          [
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-ignore
            {
              text: 'Редактировать',
              web_app: (order) => ({ url: `${process.env.WEBAPP_URL}/updateOrder/${order.id}` }),
            },
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-ignore
            {
              text: 'Найти 🔎',
              web_app: () => ({ url: `${process.env.WEBAPP_URL}/find` }),
            },
          ],
        ],
        getText: (order) => getDefaultText(order, 'char'),
        getImage: async (order) => {
          // Проверяем, что URL существует и преобразуем его в строку
          return order.image_urls && order.image_urls.length > 0
            ? String(order.image_urls[0])
            : 'https://cdn-icons-png.flaticon.com/512/2830/2830524.png';
        },
      },
      ctx,
      process_type,
      'currentIndex_boss',
    );

    return { listManager, currentIndex, orders };
  }
}
