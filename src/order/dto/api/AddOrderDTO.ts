import { Order } from '@prisma/client';

export type AddOrderDto = Omit<Order, 'id' | 'user' | 'user_id' | 'is_send'>;
