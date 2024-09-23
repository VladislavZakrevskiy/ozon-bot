import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';

@Injectable()
export class OzonImagesService {
  constructor(private http: HttpService) {}

  async getImage({
    offer_id = '',
    product_id = 0,
    sku = 0,
  }: {
    offer_id?: string;
    product_id?: number;
    sku?: number;
  }) {
    const response = await this.http.axiosRef.post(
      `${process.env.OZON_API}/v2/product/info`,
      { offer_id, product_id, sku },
      {
        headers: {
          'Client-Id': process.env.OZON_CLIENT_ID,
          'Api-Key': process.env.OZON_API_KEY,
          'Content-Type': 'application/json',
        },
      },
    );

    return response.data.result.images as string[];
  }
}
