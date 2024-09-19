import { User } from '@prisma/client';

export type UpdateUserDTO = Omit<
  User,
  'id' | 'password' | 'tg_chat_id' | 'tg_user_id'
>;
