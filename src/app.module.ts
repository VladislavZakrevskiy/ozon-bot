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
import { BotProfileService } from './bot/bot.profile.service';
import { HttpModule } from '@nestjs/axios';
import { OzonService } from './ozon/ozon.new_order.service';
import { OrderService } from './order/order.service';
import { OzonReturnService } from './ozon/ozon.return.service';
import { AdminScene } from './bot/scenes/profiles/Admin.scene';
import { BossScene } from './bot/scenes/profiles/Boss.scene';
import { EmployeeScene } from './bot/scenes/profiles/Employee.scene';
import { UserModule } from './user/user.module';
import { OrderModule } from './order/order.module';

@Module({
  imports: [
    TelegrafModule.forRoot({
      token: process.env.TELEGRAM_BOT_TOKEN,
      middlewares: [session()],
    }),
    HttpModule,
  ],
  providers: [
    // Modules
    UserModule,
    OrderModule,
    // Api Services
    PrismaService,
    OrderService,
    UserService,
    OzonService,
    OzonReturnService,
    // Bot Services
    BotService,
    BotAdminApproveService,
    BotHelpService,
    BotProfileService,
    // Guards
    AuthGuard,
    RolesGuard,
    // Scenes
    RegisterScene,
    LoginScene,
    AdminScene,
    BossScene,
    EmployeeScene,
  ],
})
export class AppModule {}
