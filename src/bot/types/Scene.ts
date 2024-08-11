import { User } from '@prisma/client';
import { Context as ContextTelegraf, Scenes } from 'telegraf';
import { SceneSessionData } from 'telegraf/typings/scenes';

export interface SessionContext extends ContextTelegraf {
  session: {
    user_id?: string;
    user?: User;
  };
}

interface SessionState extends SceneSessionData {}

export type SessionSceneContext = SessionContext &
  Scenes.SceneContext<SessionState>;
