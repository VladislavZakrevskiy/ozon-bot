import { UseGuards } from '@nestjs/common';
import { Roles, RolesGuard } from 'src/core/decorators/Roles.guard';
import { EmployeeLevel, User } from '@prisma/client';
import { Command, Update } from 'nestjs-telegraf';
import { Context } from 'telegraf';
import { SessionContext } from './types/Scene';
import { RedisService } from 'src/core/redis/redis.service';
import { getRedisKeys } from 'src/core/redis/redisKeys';
import { AuthGuard } from 'src/core/decorators/Auth.guard';

const helpMessage: Record<EmployeeLevel, string> = {
  [EmployeeLevel.ADMIN]: `Привет, Админ!
Тебе доступны следующие команды:
Админ: /admin_help
Сотрудник: /employee_help`,
  [EmployeeLevel.BOSS]: `Привет, Начальник!
Тебе доступны следующие команды:
Начальник: /boss_help
Админ: /admin_help
Сотрудник: /employee_help`,
  [EmployeeLevel.EMPLOYEE]: '** в разработке **',
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

  @Command('admin_help')
  @UseGuards(RolesGuard)
  @Roles(EmployeeLevel.ADMIN, EmployeeLevel.BOSS)
  adminHelp(ctx: Context) {
    ctx.reply(`Команды Начальника:
** в разработке **`);
  }

  @Command('super_admin_help')
  @UseGuards(RolesGuard)
  @Roles(EmployeeLevel.ADMIN, EmployeeLevel.BOSS)
  superAdminHelp(ctx: Context) {
    ctx.reply(`Команды Начальника:
** в разработке **`);
  }

  @Command('boss_help')
  @UseGuards(RolesGuard)
  @Roles(EmployeeLevel.ADMIN, EmployeeLevel.BOSS)
  bossHelp(ctx: Context) {
    ctx.reply(`Команды Начальника:
** в разработке **`);
  }

  @Command('employee_help')
  @UseGuards(RolesGuard)
  @Roles(EmployeeLevel.ADMIN, EmployeeLevel.BOSS)
  employeeHelp(ctx: Context) {
    ctx.reply('** в разработке **');
  }
}
