import { Module } from '@nestjs/common';
import { OrderCotroller } from './order.controller';
import { OrderService } from './order.service';

@Module({
  imports: [],
  controllers: [OrderCotroller],
  providers: [OrderService],
})
export class OrderModule {}
