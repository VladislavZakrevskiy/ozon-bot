import { Order } from '@prisma/client';

export interface UpdateOrderDto
  extends Partial<Omit<Order, 'id' | 'user' | 'user_id' | 'is_send' | 'date'>> {
  date: string;
}
