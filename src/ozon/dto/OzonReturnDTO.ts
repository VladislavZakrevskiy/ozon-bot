import { $Enums, Order } from '@prisma/client';
import { Return } from '../types/OzonReturn';

export class OzonReturnDTO implements Omit<Order, 'id' | 'old_price'> {
  actions: string[];
  image_urls: string[];
  offer_id: string;
  ozon_id: string;
  currency_code: $Enums.CurrencyCode;
  product_id: string;
  is_express: boolean = false;
  name: string;
  price: number;
  proccess: $Enums.OrderProcess = $Enums.OrderProcess.RETURN;
  quantity: number;
  sku: number;
  total_discount_value: number = 0;
  user_id = '';
  is_send = false;
  date: Date;

  constructor(data: Return, image_urls: string[]) {
    const {
      price,
      product_name,
      quantity,
      product_id,
      sku,
      id,
      last_free_waiting_day,
    } = data;
    this.actions = [];
    this.currency_code = 'RUB';
    this.product_id = String(product_id);
    this.price = price;
    this.quantity = quantity;
    this.name = product_name;
    this.sku = sku;
    this.date = new Date(last_free_waiting_day);
    this.image_urls = image_urls;
    // TODO АРТИКУЛА НЕТ!!!!! ОЗОН САСАТ
    this.offer_id = '';
    this.ozon_id = String(id);
  }
}
