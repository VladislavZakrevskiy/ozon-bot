import { Module } from '@nestjs/common';
import { TelegrafModule } from 'nestjs-telegraf';
import { PrismaService } from './prisma.service';
import { BotService } from './bot/bot.service';
import { UserService } from './user/user.service';
import { LoginScene } from './bot/scenes/Login.scene';
import { AuthGuard } from './user/decorators/Auth.guard';
import { session } from 'telegraf/session';
import { RolesGuard } from './user/decorators/Roles.guard';
import { RegisterScene } from './bot/scenes/Register.scene';
import { BotAdminApproveService } from './bot/admin/bot.admin_approve.service';
import { BotHelpService } from './bot/bot.help.service';

@Module({
  imports: [
    TelegrafModule.forRoot({
      token: process.env.TELEGRAM_BOT_TOKEN,
      middlewares: [session()],
    }),
  ],
  providers: [
    PrismaService,
    UserService,
    // Bot Services
    BotService,
    BotAdminApproveService,
    BotHelpService,
    // Guards
    AuthGuard,
    RolesGuard,
    // Scenes
    RegisterScene,
    LoginScene,
  ],
})
export class AppModule {}
