import { Injectable } from '@nestjs/common';
import { Workbook } from 'exceljs';
import { OrderService } from './order.service';
import * as path from 'path';

@Injectable()
export class ExcelService {
  constructor(private readonly orderService: OrderService) {}

  async generateOrdersExcel(): Promise<string> {
    const orders = await this.orderService.findManyByParameter({ is_user_include: true });

    const workbook = new Workbook();
    const worksheet = workbook.addWorksheet('Заказы');

    worksheet.columns = [
      { header: 'ID Заказа в системе', key: 'id', width: 40 },
      { header: 'Имя Заказа', key: 'name', width: 30 },
      { header: 'Цена', key: 'price', width: 15 },
      { header: 'Валюта', key: 'currency', width: 15 },
      { header: 'Количество', key: 'quantity', width: 15 },
      { header: 'SKU', key: 'sku', width: 30 },
      { header: 'Дата', key: 'date', width: 20 },
      { header: 'Состояние Заказа', key: 'process', width: 20 },
      { header: 'Категория', key: 'category_name', width: 25 },
      { header: 'ФИО Пользователя', key: 'user_full_name', width: 30 },
      { header: 'Telegram ID', key: 'tg_chat_id', width: 25 },
    ];

    orders.forEach((order) => {
      const fullName = order.user
        ? `${order.user.first_name} ${order.user.last_name}`
        : 'Не назначен';

      worksheet.addRow({
        id: order.id,
        name: order.name,
        price: order.price,
        sku: order.sku,
        currency: order.currency_code,
        quantity: order.quantity,
        date: order.date,
        process: order.proccess,
        category_name: order.category.name,
        user_full_name: fullName,
        tg_chat_id: order.user ? `@${order.user.tg_username}` : 'Не назначен',
      });
    });

    const filePath = path.join(__dirname, '../../public/xlsx', `orders_${Date.now()}.xlsx`);
    await workbook.xlsx.writeFile(filePath);

    return filePath;
  }
}
