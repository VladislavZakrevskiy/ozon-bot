import { UseGuards } from '@nestjs/common';
import { Roles, RolesGuard } from 'src/core/decorators/Roles.guard';
import { EmployeeLevel, User } from '@prisma/client';
import { Command, Update } from 'nestjs-telegraf';
import { Context } from 'telegraf';
import { SessionContext } from './types/Scene';
import { RedisService } from 'src/core/redis/redis.service';
import { getRedisKeys } from 'src/core/redis/redisKeys';
import { AuthGuard } from 'src/core/decorators/Auth.guard';
import { escapeMarkdown } from 'src/core/helpers/escapeMarkdown';

const helpMessage: Record<EmployeeLevel, string> = {
  [EmployeeLevel.ADMIN]: `Привет, Админ!
Тебе доступны следующие команды:
Админ: /admin_help
Сотрудник: /employee_help`,
  [EmployeeLevel.BOSS]: `Привет, Босс!
Тебе доступны следующие команды:
Начальник: /boss_help
Админ: /admin_help
Сотрудник: /employee_help`,
  [EmployeeLevel.EMPLOYEE]: `Привет, Сотрудник!
Тебе доступны следующие команды:
Сотрудник: /employee_help`,
  [EmployeeLevel.ENEMY]: 'Нет доступа!',
};

@Update()
export class BotHelpService {
  constructor(private redis: RedisService) {}

  @UseGuards(AuthGuard)
  @Command('help')
  async help(ctx: SessionContext) {
    const user = await this.redis.get<User>(getRedisKeys('user', ctx.chat.id));

    await ctx.reply(helpMessage[user.employee_level]);
  }

  @Command('boss_help')
  @UseGuards(RolesGuard)
  @Roles(EmployeeLevel.BOSS)
  bossHelp(ctx: Context) {
    ctx.replyWithMarkdownV2(
      escapeMarkdown(`*Команды и возможности Босса:*
/profile
- Можно узнать свои данные
- Можно просматривать и редактировать админов, сотрудников и неавторизованных
- Можно просматривать и редактировать выполненые заказы, заказы в работе и возвраты

/table
- Можно получить Excel таблицу всех заказов

/last_orders n
- Можно получить все заказы за последние n дней (n по умолчанию равно 3)

*Возможности:*
- Подтверждение пользователей после их регистрации
- Любые операции над заказами и пользователями системы
- Делать перерасчет сотрудникам
- Увольнять сотрудников`),
    );
  }

  @Command('admin_help')
  @UseGuards(RolesGuard)
  @Roles(EmployeeLevel.ADMIN, EmployeeLevel.BOSS)
  adminHelp(ctx: Context) {
    ctx.replyWithMarkdownV2(
      escapeMarkdown(`*Команды и возможности Админа:*
/profile
- Можно узнать свои данные
- Возможность следить за рабочим процессом
- Можно добавить возврат`),
    );
  }

  @Command('employee_help')
  @UseGuards(RolesGuard)
  @Roles(EmployeeLevel.ADMIN, EmployeeLevel.BOSS, EmployeeLevel.EMPLOYEE)
  employeeHelp(ctx: Context) {
    ctx.replyWithMarkdownV2(
  `\\*Команды и возможности сотрудника:\\*\n` +
  `/profile \n` +
  `\\- Можно узнать свои данные\n` +
  `\\- Можно просмотреть свои выполенные заказы и заказы в работе\n\n` +

  `\\*Возможности:\\*\n` +
  `\\- Получение, принятие и отдача заказа с Ozon\n` +
  `\\- Забрать со склада товар\n` +
  `\\* Если товар есть на складе, то выплата не производится`,
);
  }
}
