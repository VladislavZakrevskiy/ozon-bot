import { Injectable, UseGuards } from '@nestjs/common';
import { Command, Ctx, Update } from 'nestjs-telegraf';
import { SessionSceneContext } from './types/Scene';
import { EmployeeLevel } from '@prisma/client';
import { PrismaService } from 'src/prisma.service';
import { AuthGuard } from 'src/user/decorators/Auth.guard';
import { Scenes } from './types/Scenes';

@Injectable()
@Update()
export class BotProfileService {
  constructor(private prisma: PrismaService) {}

  @Command('profile')
  @UseGuards(AuthGuard)
  async profileByRole(@Ctx() ctx: SessionSceneContext) {
    const user = await this.prisma.user.findUnique({
      where: { id: ctx.session.user_id },
      include: { orders: true },
    });

    switch (user.employee_level) {
      case EmployeeLevel.BOSS:
        await ctx.scene.enter(Scenes.PROFILE_BOSS);
        return;
      case EmployeeLevel.ADMIN:
        await ctx.scene.enter(Scenes.PROFILE_ADMIN);
        return;
      case EmployeeLevel.EMPLOYEE:
        await ctx.scene.enter(Scenes.PROFILE_EMPLOYEE);
        return;
      case EmployeeLevel.ENEMY:
        await ctx.reply(
          'Вы не авторизованы! Авторизуйтесь /login или зарегистрируетсь /register',
        );
        return;
    }
  }
}
