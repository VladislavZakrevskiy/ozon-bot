import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { User } from '@prisma/client';
import { SessionContext } from 'src/bot/types/Scene';

export const GetUser = createParamDecorator<void, any, User>(
  (_, context: ExecutionContext) => {
    const ctx = context.switchToHttp().getRequest<SessionContext>();
    return ctx.session.user;
  },
);
