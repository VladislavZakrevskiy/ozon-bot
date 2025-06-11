import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';
import { FindOneByParameter } from './dto/FindOneByParameter';
import { FindManyByParameter } from './dto/FindManyByParameter';
import { CreateOrder } from './dto/CreateOrder';
import { Category, Order, Prisma } from '@prisma/client';
import { UserService } from '../user/user.service';
import { CategoryService } from './category.service';

@Injectable()
export class OrderService {
  constructor(
    private prisma: PrismaService,
    private userService: UserService,
    private categoryService: CategoryService,
  ) {}

  async getOrdersOnReturns(name: string, not_id: string) {
    const return_candidates = await this.prisma.order.findMany({
      where: { AND: { name, process: 'RETURN' }, NOT: { id: not_id } },
    });

    return return_candidates;
  }

  async createOrder(data: CreateOrder) {
    const category = await this.categoryService.findCategory(data.name);
    const order = await this.prisma.order.create({
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      data: { ...data, category: { connect: { id: category.id } } },
      include: { category: true },
    });
    return order;
  }

  async createOrders(data: CreateOrder[]) {
    const orders: Array<Order & { category: Category }> = [];

    for (let i = 0; i < data.length; i++) {
      const order = (await this.createOrder(data[i])) as Order & { category: Category };
      orders.push(order);
    }

    return orders;
  }

  async deleteOrder(id: string) {
    const order = await this.prisma.order.delete({ where: { id }, include: { category: true } });
    return order;
  }

  async updateOrder(
    product_id: number | string,
    data: Prisma.OrderUpdateInput & { category_id?: string },
  ) {
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
    delete data.category_id;
    const newData: Prisma.OrderUpdateInput = { ...data };
    const updatedOrder = await this.prisma.order.update({
      where: { id: toUpdateOrder.id },
      data: { ...newData },
      include: { category: true },
    });
    return updatedOrder;
  }

  async endOrder(order_id: string, user_id: string) {
    const order = await this.findOneByParameter({ id: order_id });
    delete order.id;
    delete order.user_id;

    const user = await this.userService.findUserById(user_id);
    delete user.id;

    const updatedOrder = await this.updateOrder(order_id, {
      ...order,
      user: { connect: { id: user_id } },
      category: { connect: { id: order.category_id } },
      proccess: 'DONE',
    });

    const orderPrice = updatedOrder.price || updatedOrder.category.money;

    await this.userService.updateUser(user_id, {
      ...user,
      money: Number(user.money) + Number(orderPrice),
    });

    return updatedOrder;
  }

  async findOneByParameter({ id, user, product_id }: FindOneByParameter) {
    const order = await this.prisma.order.findUnique({
      where: { id, product_id },
      include: { user, category: true },
    });
    return order;
  }

  async findManyByParameter({
    process,
    user_id,
    order_by_date,
    is_send,
    is_user_include,
    date,
    q,
  }: FindManyByParameter) {
    const whereClause: any = {
      proccess: { in: process },
    };

    if (is_send !== undefined) {
      whereClause.is_send = is_send;
    }

    if (user_id) {
      whereClause.user = { id: user_id };
    }

    if (date) {
      whereClause.date = { ...date };
    }

    if (q) {
      whereClause.OR = [{ name: { contains: q } }, { category: { name: { contains: q } } }];
    }

    const orders = await this.prisma.order.findMany({
      where: whereClause,
      orderBy: { date: order_by_date },
      include: { category: true, user: is_user_include },
    });
    return orders;
  }
}
