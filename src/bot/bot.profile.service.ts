import { Injectable, UseGuards } from '@nestjs/common';
import { Command, Ctx, Update } from 'nestjs-telegraf';
import { SessionSceneContext } from './types/Scene';
import { EmployeeLevel } from '@prisma/client';
import { PrismaService } from 'src/prisma.service';
import { AuthGuard } from 'src/core/decorators/Auth.guard';
import { RedisService } from 'src/core/redis/redis.service';
import { getRedisKeys } from 'src/core/redis/redisKeys';
import { EmployeeProdfileService } from './scenes/profiles/Employee.scene';
import { BossProfileService } from './scenes/profiles/Boss/Boss.scene';
import { AdminProfileService } from './scenes/profiles/Admin.scene';

@Injectable()
@Update()
export class BotProfileService {
  constructor(
    private prisma: PrismaService,
    private redis: RedisService,
    private employeeProdfileService: EmployeeProdfileService,
    private bossProfileService: BossProfileService,
    private adminProfileService: AdminProfileService,
  ) {}

  @Command('profile')
  @UseGuards(AuthGuard)
  async profileByRole(@Ctx() ctx: SessionSceneContext) {
    const user_id = await this.redis.get<string>(getRedisKeys('user_id', ctx.chat.id));
    const user = await this.prisma.user.findUnique({
      where: { id: user_id },
      include: { orders: true },
    });

    switch (user.employee_level) {
      case EmployeeLevel.BOSS:
        await this.bossProfileService.handleProfile(ctx);
        return;
      case EmployeeLevel.ADMIN:
        await this.adminProfileService.handleProfile(ctx);
        return;
      case EmployeeLevel.EMPLOYEE:
        await this.employeeProdfileService.handleProfile(ctx);
        return;
      case EmployeeLevel.ENEMY:
        await ctx.reply('Вы не авторизованы! Авторизуйтесь /login или зарегистрируетсь /register');
        return;
    }
  }
}
