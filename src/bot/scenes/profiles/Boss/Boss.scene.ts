import { Injectable } from '@nestjs/common';
import { UserService } from 'src/user/user.service';
import { SessionSceneContext } from 'src/bot/types/Scene';
import { getDefaultText } from 'src/core/helpers/getDefaultText';
import { RedisService } from 'src/core/redis/redis.service';
import { getRedisKeys } from 'src/core/redis/redisKeys';
import { getTelegramImage } from 'src/core/helpers/getTelegramImage';
import { OrderService } from 'src/order/order.service';
import { BossParent } from './Boss.parent';

@Injectable()
export class BossProfileService extends BossParent {
  constructor(
    readonly userService: UserService,
    readonly orderService: OrderService,
    readonly redis: RedisService,
  ) {
    super(userService, orderService, redis);
  }

  async handleProfile(ctx: SessionSceneContext) {
    const user_id = await this.redis.get(getRedisKeys('user_id', ctx.chat.id));
    const user = await this.userService.findUserById(user_id, true);
    const photo_url = await getTelegramImage(ctx, ctx.from.id);

    ctx.sendPhoto(
      { url: photo_url.toString() },
      {
        caption: getDefaultText(user, 'new'),
        reply_markup: {
          inline_keyboard: [
            [{ callback_data: 'boss_admin_users', text: 'Админы' }],
            [{ callback_data: 'boss_employee_users', text: 'Сотрудники' }],
            [{ callback_data: 'boss_enemy_users', text: 'Незарегистрированные' }],
            [
              { callback_data: 'boss_done_orders', text: 'Все выполненные' },
              { callback_data: 'boss_work_orders', text: 'Все в работе' },
              { callback_data: 'boss_return_orders', text: 'Все возвраты' },
            ],
          ],
        },
      },
    );
  }
}
