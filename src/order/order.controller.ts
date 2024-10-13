import { Post, Get, Patch, Param, Body, Controller, Query } from '@nestjs/common';
import { OrderService } from './order.service';
import { AddOrderDto } from './dto/api/AddOrderDTO';
import { UpdateOrderDto } from './dto/api/UpdateOrderDTO';
import { CategoryService } from './category.service';

@Controller('order')
export class OrderCotroller {
  constructor(
    private orderService: OrderService,
    private categoryService: CategoryService,
  ) {}

  @Get('find')
  async findOrder(@Query('q') searchString: string) {
    const orders = await this.orderService.findManyByParameter({
      q: searchString,
    });

    return orders;
  }

  @Post('add')
  async addOrder(@Body() createOrderDto: AddOrderDto) {
    const order = await this.orderService.createOrder({
      ...createOrderDto,
      is_send: false,
    });

    return order;
  }

  @Patch('/:id')
  async updateOrder(@Body() updateOrderDto: UpdateOrderDto, @Param('id') id: string) {
    updateOrderDto.date = new Date().toISOString();
    updateOrderDto.price = Number(updateOrderDto.price);
    updateOrderDto.sku = Number(updateOrderDto.sku);
    updateOrderDto.quantity = Number(updateOrderDto.quantity);
    const updatedOrder = await this.orderService.updateOrder(id, {
      ...updateOrderDto,
    });

    return updatedOrder;
  }

  @Get('/:id')
  async getOrderById(@Param('id') id: string) {
    const order = await this.orderService.findOneByParameter({ id });
    return order;
  }

  @Post('/category')
  async updateCategory() {
    const categories = await this.categoryService.addAllCategories();
    return categories;
  }
}
