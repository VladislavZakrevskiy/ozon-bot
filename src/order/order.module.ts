import { Module } from '@nestjs/common';
import { OrderCotroller } from './order.controller';
import { OrderService } from './order.service';
import { PrismaService } from 'src/prisma.service';
import { UserService } from 'src/user/user.service';
import { JwtService } from 'src/auth/jwt/jwt.service';
import { CategoryService } from './category.service';

@Module({
  imports: [],
  controllers: [OrderCotroller],
  providers: [OrderService, PrismaService, UserService, JwtService, CategoryService],
})
export class OrderModule {}
