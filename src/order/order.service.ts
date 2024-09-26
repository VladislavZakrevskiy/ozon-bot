import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';
import { FindOneByParameter } from './dto/FindOneByParameter';
import { FindManyByParameter } from './dto/FindManyByParameter';
import { CreateOrder } from './dto/CreateOrder';
import { Order, Prisma } from '@prisma/client';
import { UserService } from '../user/user.service';

@Injectable()
export class OrderService {
  constructor(
    private prisma: PrismaService,
    private userService: UserService,
  ) {}

  async getOrdersOnReturns(name: string) {
    const return_candidates = await this.prisma.order.findMany({
      where: { name, proccess: 'RETURN' },
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

  async updateOrder(product_id: number | string, data: Prisma.OrderUpdateInput) {
    let toUpdateOrder: Order;

    if (typeof product_id === 'number') {
      toUpdateOrder = await this.prisma.order.findFirst({
        where: { product_id: product_id },
      });
    } else {
      toUpdateOrder = await this.prisma.order.findUnique({
        where: { id: product_id },
      });
    }
    const updatedOrder = await this.prisma.order.update({
      where: { id: toUpdateOrder.id },
      data: { ...data },
    });
    return updatedOrder;
  }

  async endOrder(order_id: string, user_id: string) {
    const order = await this.findOneByParameter({ id: order_id });
    delete order.id;
    delete order.user_id;

    const user = await this.userService.findUserById(user_id);
    delete user.id;

    // Так надо - вопросы не задаем
    const updatedOrder = await this.updateOrder(order_id, {
      ...order,
      user: { connect: { id: user_id } },
      proccess: 'DONE',
    });
    await this.userService.updateUser(user_id, {
      ...user,
      money: Number(user.money) + updatedOrder.price,
    });

    return updatedOrder;
  }

  // Find
  async findOneByParameter({ id, user, product_id }: FindOneByParameter) {
    const order = await this.prisma.order.findUnique({
      where: { id, product_id },
      include: { user },
    });
    return order;
  }

  async findManyByParameter({ process, user_id, order_by_date, is_send }: FindManyByParameter) {
    const orders = await this.prisma.order.findMany({
      where: { proccess: { in: process }, is_send, user: { id: user_id } },
      orderBy: { date: order_by_date },
    });
    return orders;
  }
}
