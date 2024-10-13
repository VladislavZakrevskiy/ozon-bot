import { Order } from '@prisma/client';

export type CreateOrder = Omit<Order, 'id' | 'user_id' | 'category_id' | 'old_price'>;
