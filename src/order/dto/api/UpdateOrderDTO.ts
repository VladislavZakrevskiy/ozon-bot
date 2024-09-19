import { Order } from '@prisma/client';

export type UpdateOrderDto = Partial<
  Omit<Order, 'id' | 'user' | 'user_id' | 'is_send'>
>;
