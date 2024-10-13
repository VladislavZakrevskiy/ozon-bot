import { EmployeeLevel, Order, OrderProcess, User, Category } from '@prisma/client';
import { isOrder } from './isType';
import { escapeMarkdown } from './escapeMarkdown';

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
};

type MessageType = 'new' | 'char';

const getNewOrder = (order: Order & { category: Category }, onReturns?: Order[]) => `#новыйзаказ
Новый ${order.proccess === 'RETURN' ? 'возврат' : 'заказ'} номер \`\`\`${order.id}\`\`\`
Наименование товара: *${order.name}*
Категория: *${order.category.name}*
Количество: *${order.quantity}*
Цена за единицу: *${order.price} ${order.currency_code}*
Цена за упаковку: *${order.category.money}руб*
${order.old_price ? `Старая цена: *${order.old_price} ${order.currency_code}*` : ''}
Статус: *${processStatuses[order.proccess]}*
Экстренный: *${order.is_express ? 'Да' : 'Нет'}*
SKU: *${order.sku}*

${onReturns?.length !== 0 ? `На складе возвратов: *${onReturns?.length || 0}` : ''}*`;

const getCharOrder = (
  order: Order & { category: Category },
  onReturns?: Order[],
) => `ID товара: \`\`\`${order.id}\`\`\`
Наименование товара: *${order.name}*
Категория: *${order.category.name}*
Количество: *${order.quantity}*
Цена за единицу: *${order.price} ${order.currency_code}*
Цена за упаковку: *${order.category.money}руб*
${order.old_price ? `Старая цена: *${order.old_price} ${order.currency_code}*` : ''}
Статус: *${processStatuses[order.proccess]}*
Экстренный: *${order.is_express ? 'Да' : 'Нет'}*
SKU: *${order.sku}*

${onReturns?.length !== 0 ? `На складе возвратов: ${onReturns?.length || 0}` : ''}
`;

const getHelloUser = (user: User) => `#профиль
Привет, ${roleTranslation[user.employee_level]}! Вот ваш профиль:
Имя: ${user.first_name}
Фамилия: ${user.last_name}
Email: ${user.login}
Должность: ${user.post}
Номер телефона: ${user.phone_number}
Подтвержден: ${user.isApproved ? 'Да' : 'Нет'}

${user.money ? `Заработанные деньги: ${user.money}` : ''}
${user.count_date ? `Последний перерасчет: ${user.count_date}` : ''}
${user.count_money ? `Сумма последнего перерасчета: ${user.count_date}` : ''}
`;

const getCharUser = (user: User) => `Имя: ${user.first_name}
Фамилия: ${user.last_name}
Email: ${user.login}
Должность: ${user.post}
Роль в системе: ${roleTranslation[user.employee_level]}
Номер телефона: ${user.phone_number}
Подтвержден: ${user.isApproved ? 'Да' : 'Нет'}

${user.money ? `Деньги: ${user.money}` : ''}
${user.count_date ? `Последний перерасчет: ${user.count_date}` : ''}
${user.count_money ? `Сумма последнего перерасчета: ${user.count_money}` : ''}
`;

export function getDefaultText(data: User, type: MessageType): string;
export function getDefaultText(
  data: Order & { category: Category },
  type: MessageType,
  onReturns?: Order[],
): string;
export function getDefaultText(
  data: User | (Order & { category: Category }),
  type: 'new' | 'char' | 'return' = 'new',
  onReturns?: Order[],
) {
  if (isOrder(data)) {
    switch (type) {
      case 'char':
        return escapeMarkdown(getCharOrder(data, onReturns));
      case 'new':
        return escapeMarkdown(getNewOrder(data, onReturns));
      default:
        return escapeMarkdown(getCharOrder(data, onReturns));
    }
  }

  return type === 'char' ? escapeMarkdown(getCharUser(data)) : escapeMarkdown(getHelloUser(data));
}
