import { Ctx, Action, Update } from 'nestjs-telegraf';
import { SessionSceneContext } from 'src/bot/types/Scene';
import { OrderProcess } from '@prisma/client';
import { getDefaultText } from 'src/core/helpers/getDefaultText';
import { RedisService } from 'src/core/redis/redis.service';
import { getRedisKeys } from 'src/core/redis/redisKeys';
import { ListManager } from 'src/bot/template/ListManager';
import { OrderService } from 'src/order/order.service';
import { CallbackQuery } from 'telegraf/typings/core/types/typegram';
import { UserService } from 'src/user/user.service';
import { getTelegramImage } from 'src/core/helpers/getTelegramImage';

@Update()
export class AdminProfileService {
  constructor(
    private readonly orderService: OrderService,
    private readonly userService: UserService,
    private redis: RedisService,
  ) {}

  async getOrdersListManager(ctx: SessionSceneContext, process_type: OrderProcess = 'DONE') {
    const redisIndex = await this.redis.get(
      getRedisKeys('currentIndex_adminOrders', process_type, ctx.chat.id),
    );
    const orders = await this.orderService.findManyByParameter({ process: [process_type] });

    // Проверяем, что индекс валидный
    let currentIndex = redisIndex ? Number(redisIndex) : 0;
    if (isNaN(currentIndex) || currentIndex < 0 || currentIndex >= orders.length) {
      currentIndex = 0;
      await this.redis.set(getRedisKeys('currentIndex_adminOrders', process_type, ctx.chat.id), 0);
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
      'currentIndex_adminOrders',
    );

    return { listManager, currentIndex, orders };
  }
  // OrderList
  @Action(/^next__currentIndex_adminOrders_(DONE|IN_WORK|RETURN)$/)
  public async handleOrderNext(@Ctx() ctx: SessionSceneContext): Promise<void> {
    const prefix = (ctx.callbackQuery as CallbackQuery.DataQuery).data.split(
      '_',
    )?.[4] as OrderProcess;
    const { currentIndex, listManager, orders } = await this.getOrdersListManager(ctx, prefix);

    if (currentIndex < orders.length - 1) {
      await this.redis.set(
        getRedisKeys('currentIndex_adminOrders', listManager.prefix, ctx.chat.id),
        currentIndex + 1,
      );
      await listManager.editMessage();
    } else {
      await ctx.answerCbQuery('Нет следующего элемента');
    }
  }

  @Action(/^prev__currentIndex_adminOrders_(DONE|IN_WORK|RETURN)$/)
  public async handleOrderPrev(@Ctx() ctx: SessionSceneContext): Promise<void> {
    const prefix = (ctx.callbackQuery as CallbackQuery.DataQuery).data.split(
      '_',
    )?.[4] as OrderProcess;
    const { currentIndex, listManager } = await this.getOrdersListManager(ctx, prefix);

    if (currentIndex > 0) {
      await this.redis.set(
        getRedisKeys('currentIndex_adminOrders', listManager.prefix, ctx.chat.id),
        currentIndex - 1,
      );
      await listManager.editMessage();
    } else {
      await ctx.answerCbQuery('Нет предыдущего элемента');
    }
  }

  @Action('admin_done_orders')
  async doneOrders(@Ctx() ctx: SessionSceneContext) {
    const { listManager, orders } = await this.getOrdersListManager(ctx, OrderProcess.DONE);

    if (orders.length === 0) {
      await ctx.reply('Выполненных заказов нет(');
      return;
    }

    listManager.sendInitialMessage();
  }

  @Action('admin_work_orders')
  async workOrders(@Ctx() ctx: SessionSceneContext) {
    const { listManager, orders } = await this.getOrdersListManager(ctx, OrderProcess.IN_WORK);

    if (orders.length === 0) {
      await ctx.reply('Заказов в работе нет(');
      return;
    }

    listManager.sendInitialMessage();
  }

  @Action('admin_return_orders')
  async returnOrders(@Ctx() ctx: SessionSceneContext) {
    const { listManager, orders } = await this.getOrdersListManager(ctx, OrderProcess.RETURN);

    if (orders.length === 0) {
      await ctx.reply('Возвратов нет(');
      return;
    }

    listManager.sendInitialMessage();
  }

  async handleProfile(ctx: SessionSceneContext) {
    const user_id = await this.redis.get(getRedisKeys('user_id', ctx.chat.id));
    const user = await this.userService.findUserById(user_id, true);

    // Используем getTelegramImage для безопасного получения URL фотографии
    const photo_url = await getTelegramImage(ctx, user.tg_user_id);

    ctx.sendPhoto(
      { url: photo_url.toString() },
      {
        caption: getDefaultText(user, 'new'),
        parse_mode: 'MarkdownV2',
        reply_markup: {
          inline_keyboard: [
            [{ callback_data: 'admin_done_orders', text: 'Все выполненные' }],
            [{ callback_data: 'admin_work_orders', text: 'Все в работе' }],
            [{ callback_data: 'admin_return_orders', text: 'Все возвраты' }],
            [{ callback_data: 'admin_add_return', text: 'Добавить возврат' }],
          ],
        },
      },
    );
  }

  @Action('admin_add_return')
  async addReturn(@Ctx() ctx: SessionSceneContext) {
    // Сохраняем в Redis, что мы находимся в процессе добавления возврата
    await this.redis.set(getRedisKeys('adding_return', ctx.chat.id), 'true');

    // Запрашиваем информацию о возврате
    await ctx.reply(
      'Введите информацию о возврате в следующем формате:\n\n' +
        'Название товара\n' +
        'Артикул (SKU)\n' +
        'ID товара\n' +
        'Цена\n' +
        'URL изображения\n\n' +
        'Например:\n' +
        'Смартфон Xiaomi\n' +
        'XM-123456\n' +
        '123456789\n' +
        '15000\n' +
        'https://example.com/image.jpg',
    );

    // Переходим в сцену ожидания ввода информации о возврате
    await ctx.scene.enter('RETURN_INPUT');
  }
}
