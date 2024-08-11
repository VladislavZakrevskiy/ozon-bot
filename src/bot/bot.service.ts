import { Injectable, UseGuards } from '@nestjs/common';
import { Start, Command, Ctx, Update } from 'nestjs-telegraf';
import { AuthGuard } from 'src/user/decorators/Auth.guard';
import { Scenes as ScenesEnum } from './types/Scenes';
import { Scenes } from 'telegraf';
import { SessionContext } from './types/Scene';
import { Roles, RolesGuard } from 'src/user/decorators/Roles.guard';
import { EmployeeLevel } from '@prisma/client';

@Injectable()
@Update()
export class BotService {
  @Start()
  async startCommand(@Ctx() ctx: SessionContext) {
    await ctx.reply('Добро пожаловать! Используйте /login для авторизации.');
  }

  @Command('login')
  async loginCommand(@Ctx() ctx: Scenes.SceneContext) {
    await ctx.scene.enter(ScenesEnum.LOGIN);
  }

  @Command('protected_auth')
  @UseGuards(AuthGuard)
  async protectedAuthCommand(@Ctx() ctx: SessionContext) {
    await ctx.reply('Это защищенная команда, вы авторизованы!');
  }

  @UseGuards(RolesGuard)
  @Command('protected_role_1')
  @Roles(EmployeeLevel.EmployeeLevel_1)
  async protectedRole1Command(@Ctx() ctx: SessionContext) {
    await ctx.reply('Это защищенная команда для EmployeeLevel_1');
  }

  @UseGuards(RolesGuard)
  @Command('protected_role_2')
  @Roles(EmployeeLevel.EmployeeLevel_2)
  async protectedRole2Command(@Ctx() ctx: SessionContext) {
    await ctx.reply('Это защищенная команда для EmployeeLevel_2!');
  }

  @UseGuards(RolesGuard)
  @Command('protected_role_3')
  @Roles(EmployeeLevel.EmployeeLevel_3)
  async protectedRole3Command(@Ctx() ctx: SessionContext) {
    await ctx.reply('Это защищенная команда для EmployeeLevel_3');
  }

  @UseGuards(RolesGuard)
  @Command('protected_role_4')
  @Roles(EmployeeLevel.EmployeeLevel_4)
  async protectedRole4Command(@Ctx() ctx: SessionContext) {
    await ctx.reply('Это защищенная команда для EmployeeLevel_4');
  }

  @UseGuards(RolesGuard)
  @Command('protected_role_1_2_3')
  @Roles(
    EmployeeLevel.EmployeeLevel_1,
    EmployeeLevel.EmployeeLevel_2,
    EmployeeLevel.EmployeeLevel_3,
  )
  async protectedRole123Command(@Ctx() ctx: SessionContext) {
    await ctx.reply(
      'Это защищенная команда для EmployeeLevel_1, EmployeeLevel_2, EmployeeLevel_3',
    );
  }
}
