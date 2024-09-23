import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';
import { OzonOrder } from './types/OzonOrder';
import { OzonOrderDTO } from './dto/OzonOrderDTO';
import { Order, OrderProcess } from '@prisma/client';
import { Cron } from '@nestjs/schedule';
import { OzonImagesService } from './ozon.images.service';

@Injectable()
export class OzonService {
  constructor(
    private prisma: PrismaService,
    private http: HttpService,
    private ozonImagesService: OzonImagesService,
  ) {}

  // */30 * * * * *
  // TODO поменять */5 * * * *
  @Cron('*/30 * * * * *')
  async pingOzon() {
    const orders = await this.getOrders();
    const uniqueOrders = await this.getUniqueOrders(orders.data);
    await this.updateDBData(uniqueOrders);
  }

  async getOrders() {
    const nowDate = new Date();
    const newOrders = await this.http.axiosRef.post<OzonOrder>(
      `${process.env.OZON_API}/v3/posting/fbs/unfulfilled/list`,
      {
        data: {
          dir: 'ASC',
          filter: {
            // пох на локал тайм - не так сильно решает
            // 2592000000 - месяц в миллисекундах, лично гуглил
            cutoff_from: new Date(nowDate.valueOf() - 2592000000).toJSON(),
            cutoff_to: new Date(nowDate.valueOf() + 2592000000).toJSON(),
            status: 'awaiting_packaging',
          },
          with: {
            financial_data: true,
            analytics_data: true,
          },
          limit: 500,
          offset: 0,
        },
      },
      {
        headers: {
          'Client-Id': process.env.OZON_CLIENT_ID,
          'Api-Key': process.env.OZON_API_KEY,
        },
      },
    );

    return newOrders;
  }

  async getProdutPic(data: {
    offer_id: string;
    product_id: number;
    sku: number;
  }) {
    const images = await this.http.axiosRef.post<{
      result: { images: string[] };
    }>(`${process.env.OZON_API}/v2/product/info`, data, {
      headers: {
        'Client-Id': process.env.OZON_CLIENT_ID,
        'Api-Key': process.env.OZON_API_KEY,
      },
    });

    return images.data.result.images;
  }

  async getUniqueOrders(newOrder: OzonOrder) {
    const uniqueOrders: Omit<Order, 'id'>[] = [];

    const newOrders = newOrder.result.postings
      .map((posting, i) =>
        posting.products.map(
          (product, j) =>
            new OzonOrderDTO(
              {
                ...newOrder.result.postings[i].financial_data.products[j],
                ...product,
              },
              new Date(posting.analytics_data.delivery_date_begin),
              [],
            ),
        ),
      )
      .flat();

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

  async updateDBData(uniqueOrders: Omit<Order, 'id'>[]) {
    const products = await this.prisma.order.createMany({
      data: uniqueOrders.map((data) => ({
        ...data,
        proccess: OrderProcess.FREE,
      })),
    });
    return products;
  }
}
