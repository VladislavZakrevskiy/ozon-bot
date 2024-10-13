import { OrderProcess } from '@prisma/client';

export interface FindManyByParameter {
  process?: OrderProcess[];
  user_id?: string;
  order_by_date?: 'asc' | 'desc';
  is_send?: boolean;
  is_user_include?: boolean;
  date?: {
    gte?: Date;
    lte?: Date;
  };
  q?: string;
}
