import { Order } from '@prisma/client';

export type CreateOrder = Omit<Order, 'id'>;
