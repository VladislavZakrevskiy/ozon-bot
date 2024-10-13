import { Action, Update, Ctx } from 'nestjs-telegraf';
import { Context } from 'telegraf';
import { UserService } from '../../user/user.service';
import { EmployeeLevel } from '@prisma/client';
import { SessionSceneContext } from '../types/Scene';
import { Scenes } from '../types/Scenes';

@Update()
export class BotAdminApproveService {
  constructor(private userService: UserService) {}

  @Action('admin')
  async approveAdminRole(@Ctx() ctx: SessionSceneContext) {
    const email = this.extractEmail(ctx);
    const user = await this.userService.findUserByLogin(email);

    if (!user) {
      await ctx.reply('Какая-то ошибка(');
      return;
    }

    ctx.session.approving_data = {
      userId: user.id,
      role: EmployeeLevel.ADMIN,
    };
    await ctx.scene.enter(Scenes.APPROVE);
  }

  @Action('boss')
  async approveBossRole(@Ctx() ctx: SessionSceneContext) {
    const email = this.extractEmail(ctx);
    const user = await this.userService.findUserByLogin(email);

    if (!user) {
      await ctx.reply('Какая-то ошибка(');
      return;
    }

    ctx.session.approving_data = {
      userId: user.id,
      role: EmployeeLevel.BOSS,
    };
    await ctx.scene.enter(Scenes.APPROVE);
  }

  @Action('employee')
  async approveEmployeeRole(@Ctx() ctx: SessionSceneContext) {
    const email = this.extractEmail(ctx);
    const user = await this.userService.findUserByLogin(email);

    if (!user) {
      await ctx.reply('Какая-то ошибка(');
      return;
    }

    ctx.session.approving_data = {
      userId: user.id,
      role: EmployeeLevel.EMPLOYEE,
    };
    await ctx.scene.enter(Scenes.APPROVE);
  }

  @Action('enemy')
  async approveEnemyRole(@Ctx() ctx: SessionSceneContext) {
    const email = this.extractEmail(ctx);
    const user = await this.userService.findUserByLogin(email);

    if (!user) {
      await ctx.reply('Какая-то ошибка(');
      return;
    }

    ctx.session.approving_data = {
      userId: user.id,
      role: EmployeeLevel.ENEMY,
    };
    await ctx.scene.enter(Scenes.APPROVE);
  }

  extractEmail(ctx: Context): string {
    return ctx?.text?.split(' ')?.[7]?.split('\n')?.[0];
  }
}
