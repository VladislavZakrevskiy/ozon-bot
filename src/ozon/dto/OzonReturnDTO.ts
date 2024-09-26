import { $Enums, Order } from '@prisma/client';
import { Return } from '../types/OzonReturn';

export class OzonReturnDTO implements Omit<Order, 'id' | 'old_price' | 'user_id'> {
  actions: string[];
  image_urls: string[];
  offer_id: string;
  ozon_id: string;
  currency_code: $Enums.CurrencyCode;
  product_id: number;
  is_express: boolean = false;
  name: string;
  price: number;
  proccess: $Enums.OrderProcess = $Enums.OrderProcess.RETURN;
  quantity: number;
  sku: number;
  total_discount_value: number = 0;
  is_send = false;
  date: Date;

  constructor(data: Return, image_urls: string[]) {
    const { price, product_name, quantity, product_id, sku, return_date } = data;
    this.actions = [];
    this.currency_code = 'RUB';
    this.product_id = product_id;
    this.price = price;
    this.quantity = quantity;
    this.name = product_name;
    this.sku = sku;
    this.date = new Date(return_date);
    this.image_urls = image_urls;
    this.offer_id = '';
  }
}
