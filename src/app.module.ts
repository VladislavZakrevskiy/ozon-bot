import { Module } from '@nestjs/common';
import { TelegrafModule } from 'nestjs-telegraf';
import { PrismaService } from './prisma.service';
import { UserService } from './user/user.service';
import { HttpModule } from '@nestjs/axios';
import { OzonService } from './ozon/ozon.new_order.service';
import { OrderService } from './order/order.service';
import { OzonReturnService } from './ozon/ozon.return.service';
import { UserModule } from './user/user.module';
import { OrderModule } from './order/order.module';
import { AuthModule } from './auth/auth.module';
import { OzonImagesService } from './ozon/ozon.images.service';
import { JwtService } from './auth/jwt/jwt.service';
import { ScheduleModule } from '@nestjs/schedule';
import { RedisModule } from '@nestjs-modules/ioredis';
import { RedisService } from './core/redis/redis.service';
import { session } from 'telegraf';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { CategoryService } from './order/category.service';
import { AppController } from './app.controller';
import { ExcelService } from './order/excel.service';
import { BotModule } from './bot/bot.module';

@Module({
  controllers: [AppController],
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
    BotModule,
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
    CategoryService,
    ExcelService,
  ],
})
export class AppModule {}
