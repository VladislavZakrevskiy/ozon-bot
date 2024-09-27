import { Module } from '@nestjs/common';
import { TelegrafModule } from 'nestjs-telegraf';
import { PrismaService } from './prisma.service';
import { BotService } from './bot/bot.service';
import { UserService } from './user/user.service';
import { LoginScene } from './bot/scenes/Login.scene';
import { AuthGuard } from './core/decorators/Auth.guard';
import { RolesGuard } from './core/decorators/Roles.guard';
import { RegisterScene } from './bot/scenes/Register.scene';
import { BotAdminApproveService } from './bot/admin/bot.admin_approve.service';
import { BotHelpService } from './bot/bot.help.service';
import { BotProfileService } from './bot/bot.profile.service';
import { HttpModule } from '@nestjs/axios';
import { OzonService } from './ozon/ozon.new_order.service';
import { OrderService } from './order/order.service';
import { OzonReturnService } from './ozon/ozon.return.service';
import { AdminProfileService } from './bot/scenes/profiles/Admin.scene';
import { BossProfileService } from './bot/scenes/profiles/Boss/Boss.scene';
import { EmployeeProdfileService } from './bot/scenes/profiles/Employee.scene';
import { UserModule } from './user/user.module';
import { OrderModule } from './order/order.module';
import { AuthModule } from './auth/auth.module';
import { OzonImagesService } from './ozon/ozon.images.service';
import { JwtService } from './auth/jwt/jwt.service';
import { ScheduleModule } from '@nestjs/schedule';
import { BotEmployeeService } from './bot/employee/bot.employee.service';
import { RedisModule } from '@nestjs-modules/ioredis';
import { RedisService } from './core/redis/redis.service';
import { session } from 'telegraf';
import { BossUserActions } from './bot/scenes/profiles/Boss/Boss.user_actions';
import { BossOrderActions } from './bot/scenes/profiles/Boss/Boss.order_actions';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';

@Module({
  imports: [
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', 'public'),
      serveRoot: '/static',
    }),
    TelegrafModule.forRoot({
      token: process.env.TELEGRAM_BOT_TOKEN,
      middlewares: [session()],
    }),
    HttpModule,
    ScheduleModule.forRoot(),
    RedisModule.forRoot({
      type: 'single',
      url: 'redis://localhost:6379',
    }),
    UserModule,
    OrderModule,
    AuthModule,
  ],
  providers: [
    // Api Services
    PrismaService,
    OrderService,
    UserService,
    OzonService,
    OzonReturnService,
    OzonImagesService,
    JwtService,
    RedisService,
    // Bot Services
    BotService,
    BotAdminApproveService,
    BotEmployeeService,
    BotHelpService,
    BotProfileService,
    EmployeeProdfileService,
    BossUserActions,
    BossOrderActions,
    BossProfileService,
    AdminProfileService,
    // Scenes
    RegisterScene,
    LoginScene,
    // Guards
    AuthGuard,
    RolesGuard,
  ],
})
export class AppModule {}
