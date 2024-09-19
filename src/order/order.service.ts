import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';
import { FindOneByParameter } from './dto/FindOneByParameter';
import { FindManyByParameter } from './dto/FindManyByParameter';
import { CreateOrder } from './dto/CreateOrder';

@Injectable()
export class OrderService {
  constructor(private prisma: PrismaService) {}

  async getOrdersOnReturns(name: string) {
    const return_candidates = await this.prisma.order.findMany({
      where: { name },
    });

    return return_candidates;
  }

  // CRUD
  async createOrder(data: CreateOrder) {
    const order = await this.prisma.order.create({ data });
    return order;
  }

  async deleteOrder(id: string) {
    const order = await this.prisma.order.delete({ where: { id } });
    return order;
  }

  async updateOrder(product_id: string, data: CreateOrder) {
    const order = await this.prisma.order.update({
      data,
      where: { product_id },
    });
    return order;
  }

  // Find
  async findOneByParameter({ id, user, product_id }: FindOneByParameter) {
    const order = await this.prisma.order.findUnique({
      where: { id, product_id },
      include: { user },
    });
    return order;
  }

  async findManyByParameter({
    process,
    user_id,
    order_by_date,
    is_send,
  }: FindManyByParameter) {
    const orders = await this.prisma.order.findMany({
      where: { proccess: { in: process }, is_send, user: { id: user_id } },
      orderBy: { date: order_by_date },
    });
    return orders;
  }
}
