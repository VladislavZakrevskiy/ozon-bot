import { $Enums, Order } from '@prisma/client';
import { Product } from '../types/OzonOrder';

export class OzonOrderDTO implements Omit<Order, 'id' | 'ozon_id' | 'category' | 'category_id'> {
  actions: string[];
  offer_id: string;
  image_urls: string[];
  currency_code: $Enums.CurrencyCode;
  product_id: number;
  name: string;
  old_price: number;
  price: number;
  proccess: $Enums.OrderProcess;
  quantity: number;
  sku: number;
  total_discount_value: number;
  user_id = '';
  is_express: boolean = false;
  is_send = false;
  date: Date;

  constructor(data: Product, date: Date, images: string[]) {
    const {
      actions,
      currency_code,
      name,
      old_price,
      price,
      product_id,
      quantity,
      sku,
      total_discount_value,
      offer_id,
    } = data;
    this.actions = actions;
    this.currency_code = currency_code as $Enums.CurrencyCode;
    this.product_id = product_id;
    this.name = name;
    this.old_price = old_price;
    this.price = Number(price);
    this.proccess = $Enums.OrderProcess.FREE;
    this.quantity = quantity;
    this.total_discount_value = total_discount_value;
    this.sku = sku;
    this.user_id = undefined;
    this.is_send = false;
    this.date = date;
    this.offer_id = offer_id;
    this.image_urls = images;
  }
}
