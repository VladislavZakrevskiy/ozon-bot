import { User } from '@prisma/client';
import { Context as ContextTelegraf, Scenes } from 'telegraf';
import { SceneSessionData } from 'telegraf/typings/scenes';
import { EmployeeTgMessageId } from './EmployeeTgMessageId';

export interface SessionContext extends ContextTelegraf {
  session: {
    user_id?: string;
    user?: User;
    orderTgMessagesIds?: EmployeeTgMessageId[];
    bossLastUserId?: string;
    adminLastOrderId?: string;
    employeeLastOrderId?: string;
  };
}

interface SessionState extends SceneSessionData {}

export type SessionSceneContext = SessionContext &
  Scenes.SceneContext<SessionState>;
