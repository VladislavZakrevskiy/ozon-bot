import { Ctx, On, Scene, SceneEnter } from 'nestjs-telegraf';
import { SessionSceneContext } from '../types/Scene';
import { OrderService } from 'src/order/order.service';
import { RedisService } from 'src/core/redis/redis.service';
import { getRedisKeys } from 'src/core/redis/redisKeys';
import { CategoryService } from 'src/order/category.service';

@Scene('RETURN_INPUT')
export class ReturnInputScene {
  constructor(
    private readonly orderService: OrderService,
    private readonly categoryService: CategoryService,
    private readonly redis: RedisService,
  ) {}

  @SceneEnter()
  async onSceneEnter() {}

  @On('text')
  async onText(@Ctx() ctx: SessionSceneContext) {
    const isAddingReturn = await this.redis.get(getRedisKeys('adding_return', ctx.chat.id));

    if (isAddingReturn !== 'true') {
      await ctx.scene.leave();
      return;
    }

    try {
      const lines = ctx.text.split('\n');

      if (lines.length < 5) {
        await ctx.reply(
          'Недостаточно данных. Пожалуйста, введите информацию в правильном формате.',
        );
        return;
      }

      const name = lines[0].trim();
      const sku = lines[1].trim();
      const product_id = lines[2].trim();
      const price = parseFloat(lines[3].trim());
      const image_url = lines[4].trim();

      if (!name || !sku || !product_id || isNaN(price) || !image_url) {
        await ctx.reply('Некорректные данные. Пожалуйста, проверьте формат ввода.');
        return;
      }

      // Находим категорию по названию товара
      const category = await this.categoryService.findCategory(name);

      if (!category) {
        await ctx.reply('Категория не найдена. Пожалуйста, проверьте название товара.');
        return;
      }

      const returnOrder = await this.orderService.createOrder({
        name,
        sku: parseInt(sku, 10) || 0,
        product_id: parseInt(product_id, 10) || 0,
        offer_id: `manual-${Date.now()}`,
        price: Math.round(price),
        image_urls: [image_url],
        date: new Date(),
        proccess: 'RETURN',
        is_send: false,
        total_discount_value: 0,
        actions: [],
        is_express: false,
        currency_code: 'RUB',
        quantity: 1,
      });

      await this.redis.delete(getRedisKeys('adding_return', ctx.chat.id));
      await ctx.reply(`Возврат успешно добавлен:\n
Название: ${returnOrder.name}
Артикул: ${returnOrder.sku}
ID товара: ${returnOrder.product_id}
Цена: ${returnOrder.price}
Категория: ${category.name}
`);

      await ctx.scene.leave();
    } catch (error) {
      console.error('Ошибка при добавлении возврата:', error);
      await ctx.reply('Произошла ошибка при добавлении возврата. Пожалуйста, попробуйте еще раз.');
    }
  }
}
