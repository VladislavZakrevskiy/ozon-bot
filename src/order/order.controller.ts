import { Post, Get, Patch, Param, Body, Controller } from '@nestjs/common';
import { OrderService } from './order.service';
import { AddOrderDto } from './dto/api/AddOrderDTO';
import { UpdateOrderDto } from './dto/api/UpdateOrderDTO';

@Controller('order')
export class OrderCotroller {
  constructor(private orderService: OrderService) {}

  @Post('add')
  async addOrder(@Body() createOrderDto: AddOrderDto) {
    const order = await this.orderService.createOrder({
      ...createOrderDto,
      is_send: false,
      user_id: undefined,
    });

    return order;
  }

  @Patch('/:id')
  async updateOrder(
    @Body() updateOrderDto: UpdateOrderDto,
    @Param('id') id: string,
  ) {
    const order = await this.orderService.findOneByParameter({ id });
    const updatedOrder = await this.orderService.updateOrder(
      updateOrderDto.product_id,
      {
        id,
        ...order,
        ...updateOrderDto,
      },
    );

    return updatedOrder;
  }

  @Get('/:id')
  async getOrderById(@Param('id') id: string) {
    const order = await this.orderService.findOneByParameter({ id });
    return order;
  }
}
