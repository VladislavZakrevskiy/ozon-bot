import { Module } from '@nestjs/common';
import { TelegrafModule } from 'nestjs-telegraf';
import { PrismaService } from './prisma.service';
import { BotService } from './bot/bot.service';
import { UserService } from './user/user.service';
import { LoginScene } from './bot/scenes/Login.scene';
import { AuthGuard } from './user/decorators/Auth.guard';
import { session } from 'telegraf/session';
import { RolesGuard } from './user/decorators/Roles.guard';

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
    BotService,
    LoginScene,
    AuthGuard,
    RolesGuard,
  ],
})
export class AppModule {}
