import { EmployeeLevel, User } from '@prisma/client';
import { Context as ContextTelegraf, Scenes } from 'telegraf';
import { SceneSessionData } from 'telegraf/typings/scenes';

export interface SessionContext extends ContextTelegraf {
  session: {
    user_id?: string;
    user?: User;
    bossLastUserId?: string;
    adminLastOrderId?: string;
    employeeLastOrderId?: string;

    access_token?: string;
    refresh_token?: string;

    approving_data: { userId: string; role: EmployeeLevel };
  };
}

interface SessionState extends SceneSessionData {}

export type SessionSceneContext = SessionContext & Scenes.SceneContext<SessionState>;
