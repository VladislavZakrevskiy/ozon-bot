import { Order, OrderProcess, User } from '@prisma/client';
import { isOrder } from './isType';

const processStatuses: Record<OrderProcess, string> = {
  FREE: 'Свободен',
  DONE: 'Выполнен',
  IN_WORK: 'В работе',
  RETURN: 'Возврат',
};

export function getDefaultText(data: User): string;
export function getDefaultText(data: Order, onReturns?: Order[]): string;
export function getDefaultText(data: User | Order, onReturns?: Order[]) {
  if (isOrder(data)) {
    return `Вам новый заказ номер ${data.product_id}:
Наименование товара: ${data.name}
Количество: ${data.quantity}
Цена: ${data.price} ${data.currency_code}
${data.old_price ? `Старая цена: ${data.old_price} ${data.currency_code}` : ''}
Статус: ${processStatuses[data.proccess]}
Экстренный: ${data.is_express ? 'Да' : 'Нет'}
SKU: ${data.sku}

${onReturns?.length !== 0 ? `На складе возвратов: ${onReturns.length}` : ''}`;
  }

  return `Привет! Вот ваш профиль:
Имя: ${data.first_name}
Фамилия: ${data.last_name}
Email: ${data.login}
Должность: ${data.post}
Номер телефона: ${data.phone_number}
${data.money ? `Деньги: ${data.money}` : ''}
Подтвержден: ${data.isApproved ? 'Да' : 'Нет'}`;
}
