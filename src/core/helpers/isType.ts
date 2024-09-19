import { Order, User } from '@prisma/client';

export function isOrder(order: unknown): order is Order {
  if (typeof (order as Order).name === 'string') {
    return true;
  }
  return false;
}

export function isUser(user: unknown): user is User {
  if (typeof (user as User).first_name === 'string') {
    return true;
  }
  return false;
}
