import { EmployeeLevel, Order, OrderProcess, User } from '@prisma/client';
import { isOrder } from './isType';

const processStatuses: Record<OrderProcess, string> = {
  FREE: 'Свободен',
  DONE: 'Выполнен',
  IN_WORK: 'В работе',
  RETURN: 'Возврат',
};

const roleTranslation: Record<EmployeeLevel, string> = {
  ADMIN: 'Админ',
  BOSS: 'Босс',
  EMPLOYEE: 'Сотрудник',
  ENEMY: 'Крип',
  SUPER_ADMIN: 'Супер админ',
};

type MessageType = 'new' | 'char';

const getNewOrder = (
  order: Order,
  onReturns?: Order[],
) => `Вам новый заказ номер \`\`\`${order.id}\`\`\`:
Наименование товара: ${order.name}
Количество: ${order.quantity}
Цена: ${order.price} ${order.currency_code}
${order.old_price ? `Старая цена: ${order.old_price} ${order.currency_code}` : ''}
Статус: ${processStatuses[order.proccess]}
Экстренный: ${order.is_express ? 'Да' : 'Нет'}
SKU: ${order.sku}

${onReturns?.length !== 0 ? `На складе возвратов: ${onReturns?.length || 0}` : ''}`;

const getCharOrder = (order: Order, onReturns?: Order[]) => `ID товара: \`\`\`${order.id}\`\`\`:
Наименование товара: ${order.name}
Количество: ${order.quantity}
Цена: ${order.price} ${order.currency_code}
${order.old_price ? `Старая цена: ${order.old_price} ${order.currency_code}` : ''}
Статус: ${processStatuses[order.proccess]}
Экстренный: ${order.is_express ? 'Да' : 'Нет'}
SKU: ${order.sku}

${onReturns?.length !== 0 ? `На складе возвратов: ${onReturns?.length || 0}` : ''}
`;

const getHelloUser = (
  user: User,
) => `Привет, ${roleTranslation[user.employee_level]}! Вот ваш профиль:
Имя: ${user.first_name}
Фамилия: ${user.last_name}
Email: ${user.login}
Должность: ${user.post}
Номер телефона: ${user.phone_number}
${user.money ? `Деньги: ${user.money}` : ''}
Подтвержден: ${user.isApproved ? 'Да' : 'Нет'}
`;

const getCharUser = (user: User) => `Имя: ${user.first_name}
Фамилия: ${user.last_name}
Email: ${user.login}
Должность: ${user.post}
Роль в системе: ${roleTranslation[user.employee_level]}
Номер телефона: ${user.phone_number}
${user.money ? `Деньги: ${user.money}` : ''}
Подтвержден: ${user.isApproved ? 'Да' : 'Нет'}
`;

export function getDefaultText(data: User, type: MessageType): string;
export function getDefaultText(data: Order, type: MessageType, onReturns?: Order[]): string;
export function getDefaultText(
  data: User | Order,
  type: 'new' | 'char' = 'new',
  onReturns?: Order[],
) {
  if (isOrder(data)) {
    return type === 'char' ? getCharOrder(data, onReturns) : getNewOrder(data, onReturns);
  }

  return type === 'char' ? getCharUser(data) : getHelloUser(data);
}
