import { Injectable } from '@nestjs/common';
import { Action, Update } from 'nestjs-telegraf';
import { Context } from 'telegraf';
import { UserService } from '../../user/user.service';
import { EmployeeLevel } from '@prisma/client';

@Injectable()
@Update()
export class BotAdminApproveService {
  constructor(private userService: UserService) {}

  @Action('admin')
  async approveAdminRole(ctx: Context) {
    const email = ctx.text.split(' ')?.[7]?.split('\n')?.[0];
    const user = await this.userService.findUserByLogin(email);
    if (!user) {
      await ctx.reply('Какая-то ошиибка(');
      return;
    }

    const userWithoutId = { ...user };
    delete userWithoutId.id;

    const updatedUser = await this.userService.updateUser(user.id, {
      ...userWithoutId,
      employee_level: EmployeeLevel.ADMIN,
      isApproved: true,
    });

    await ctx.reply('Пользователь авторизован как админ!');

    await ctx.telegram.sendMessage(
      updatedUser.tg_chat_id,
      `Привет! Вы теперь админ! Список своих возможностей можно узнать в разделе /help`,
    );
  }

  @Action('boss')
  async approveBossRole(ctx: Context) {
    const email = ctx.text.split(' ')?.[7]?.split('\n')?.[0];
    const user = await this.userService.findUserByLogin(email);
    if (!user) {
      await ctx.reply('Какая-то ошиибка(');
      return;
    }

    const userWithoutId = { ...user };
    delete userWithoutId.id;

    const updatedUser = await this.userService.updateUser(user.id, {
      ...userWithoutId,
      employee_level: EmployeeLevel.BOSS,
      isApproved: true,
    });

    await ctx.reply('Пользователь авторизован как начальник!');

    await ctx.telegram.sendMessage(
      updatedUser.tg_chat_id,
      `Привет! Вы теперь начальник! Список своих возможностей можно узнать в разделе /help`,
    );
  }

  @Action('employee')
  async approveEmployeeRole(ctx: Context) {
    const email = ctx.text.split(' ')?.[7]?.split('\n')?.[0];
    const user = await this.userService.findUserByLogin(email);
    if (!user) {
      await ctx.reply('Какая-то ошиибка(');
      return;
    }

    const userWithoutId = { ...user };
    delete userWithoutId.id;

    const updatedUser = await this.userService.updateUser(user.id, {
      ...userWithoutId,
      employee_level: EmployeeLevel.EMPLOYEE,
      isApproved: true,
    });

    await ctx.reply('Пользователь авторизован как сотрудник!');

    await ctx.telegram.sendMessage(
      updatedUser.tg_chat_id,
      `Привет! Вы теперь сотрудник! Список своих возможностей можно узнать в разделе /help`,
    );
  }

  @Action('enemy')
  async approveEnemyRole(ctx: Context) {
    const email = ctx.text.split(' ')?.[7]?.split('\n')?.[0];
    const user = await this.userService.findUserByLogin(email);
    if (!user) {
      await ctx.reply('Какая-то ошиибка(');
      return;
    }

    const userWithoutId = { ...user };
    delete userWithoutId.id;

    const updatedUser = await this.userService.updateUser(user.id, {
      ...userWithoutId,
      employee_level: EmployeeLevel.ENEMY,
      isApproved: true,
    });

    await ctx.reply('Пользователь не авторизован!');

    await ctx.telegram.sendMessage(
      updatedUser.tg_chat_id,
      `Прости, админ тебя не одобрил, если возникла ошибка, всегда можно написать сюда: @helpaaaaa`,
    );
  }
}
