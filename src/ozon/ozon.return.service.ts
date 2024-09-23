import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';
import { Order, OrderProcess } from '@prisma/client';
import { Cron } from '@nestjs/schedule';
import { OzonReturn } from './types/OzonReturn';
import { OzonReturnDTO } from './dto/OzonReturnDTO';

@Injectable()
export class OzonReturnService {
  constructor(
    private prisma: PrismaService,
    private http: HttpService,
  ) {}

  @Cron('*/5 * * * *')
  async pingOzon() {
    const orders = await this.getReturns();
    const uniqueOrders = await this.getUniqueOrders(orders.data);
    await this.updateDBData(uniqueOrders);
  }

  async getReturns() {
    const nowDate = new Date();
    const returns = await this.http.axiosRef.post<OzonReturn>(
      `${process.env.OZON_API}/v3/returns/company/fbs`,
      {
        data: {
          filter: {
            last_free_waiting_day: {
              // пох на локал тайм - не так сильно решает
              // 2592000000 - месяц в миллисекундах, лично гуглил
              time_from: new Date(nowDate.valueOf() - 2592000000).toJSON(),
              time_to: new Date(nowDate.valueOf() + 2592000000).toJSON(),
            },
          },
          limit: 100,
        },
      },
      {
        headers: {
          'Client-Id': process.env.OZON_CLIENT_ID,
          'Api-Key': process.env.OZON_API_KEY,
        },
      },
    );

    return returns;
  }

  async getProdutPic(data: {
    offer_id?: string;
    product_id?: number;
    sku?: number;
  }) {
    const images = await this.http.axiosRef.post<{
      result: { images: string[] };
    }>('https://api-seller.ozon.ru/v2/product/info', data, {
      headers: {
        'Client-Id': process.env.OZON_CLIENT_ID,
        'Api-Key': process.env.OZON_API_KEY,
      },
    });

    return images.data.result.images;
  }

  async getUniqueOrders(newOrder: OzonReturn) {
    const uniqueOrders: Omit<Order, 'id' | 'old_price'>[] = [];

    const newOrders = newOrder.returns.map((ret) => new OzonReturnDTO(ret, []));

    const oldOrders = await this.prisma.order.findMany();

    for (const newOrder of newOrders) {
      let isUnique: boolean = true;
      for (const oldOrder of oldOrders) {
        if (oldOrder.product_id === newOrder.product_id) {
          isUnique = false;
          break;
        }
      }
      if (isUnique) {
        const image_urls = await this.getProdutPic({
          offer_id: newOrder.offer_id,
          product_id: Number(newOrder.product_id),
          sku: newOrder.sku,
        });
        uniqueOrders.push({ ...newOrder, image_urls });
      }
    }

    return uniqueOrders;
  }

  async updateDBData(uniqueOrders: Omit<Order, 'id' | 'old_price'>[]) {
    const products = await this.prisma.order.createMany({
      data: { ...uniqueOrders, proccess: OrderProcess.RETURN },
    });
    return products;
  }
}
