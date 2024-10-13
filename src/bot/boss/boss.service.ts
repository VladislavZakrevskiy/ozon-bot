import { Command, Ctx, Update } from 'nestjs-telegraf';
import { SessionContext } from '../types/Scene';
import { UserService } from 'src/user/user.service';
import { $Enums } from '@prisma/client';
import { hashSync } from 'bcrypt';

@Update()
export class BotBossService {
  constructor(private userService: UserService) {}

  @Command('boss-DONT_GO_THERE_PLEASE')
  async createBoss(@Ctx() ctx: SessionContext) {
    await ctx.reply(
      'Привет, потенциальный босс! Убедись, что ты не вошел. Введи секретный код, пожалуйста после команды /secret_boss. Например, /secret_boss password',
    );
  }

  @Command('secret_boss')
  async onSecretCode(@Ctx() ctx: SessionContext) {
    const secret_code = ctx.text.split(' ')?.[1];

    if (secret_code && secret_code === process.env.SECRET_BOSS_CODE) {
      const candidate = await this.userService.findUserByTgChat({
        tg_chat_id: ctx.chat.id,
      });
      if (candidate) {
        await this.userService.updateUser(candidate.id, {
          ...candidate,
          employee_level: $Enums.EmployeeLevel.BOSS,
        });
      } else {
        await this.userService.registerUser({
          first_name: ctx.from.first_name,
          last_name: ctx.from.last_name || ctx.from.username || 'Босс',
          login: 'boss',
          password: hashSync(process.env.SECRET_BOSS_CODE, 7),
          phone_number: '89999999999',
          tg_chat_id: ctx.chat.id,
          tg_user_id: ctx.from.id,
          tg_username: ctx.from.username,
        });
      }
      await ctx.reply('Приветсвуем, босс!');
    } else {
      await ctx.reply('Простите, неправильно(');
    }
  }
}
