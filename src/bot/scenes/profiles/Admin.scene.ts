import { Injectable } from '@nestjs/common';
import { Ctx, Action, Update } from 'nestjs-telegraf';
import { UserService } from 'src/user/user.service';
import { SessionSceneContext } from 'src/bot/types/Scene';
import { EmployeeLevel } from '@prisma/client';
import { getDefaultText } from 'src/core/helpers/getDefaultText';
import { RedisService } from 'src/core/redis/redis.service';
import { getRedisKeys } from 'src/core/redis/redisKeys';
import { ListManager } from 'src/bot/templates/ListManager';
import { getTelegramImage } from 'src/core/helpers/getTelegramImage';

@Injectable()
@Update()
export class AdminProfileService {
  constructor(
    private readonly userService: UserService,
    private redis: RedisService,
  ) {}

  // ListManager and some data
  async getListManager(ctx: SessionSceneContext) {
    const currentIndex = Number(
      await this.redis.get(getRedisKeys('currentIndex_admin', '', ctx.chat.id)),
    );
    const users = await this.userService.findUserByRole(EmployeeLevel.EMPLOYEE);
    const listManager = new ListManager(
      this.redis,
      users,
      {
        extraButtons: [
          [
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-ignore
            {
              text: 'Редактировать',
              // callback_data: 'admin_edit_employee',
              web_app: { url: `${process.env.WEBAPP_URL}` },
            },
          ],
          [{ text: 'Уволить', callback_data: 'admin_dismiss_employee' }],
          [{ text: 'Расчитать заработную плату', callback_data: 'admin_give_money' }],
        ],
        getText: (order) => getDefaultText(order, 'char'),
        getImage: async (user) => (await getTelegramImage(ctx, user.tg_user_id)).toString(),
      },
      ctx,
      '',
      'currentIndex_admin',
    );

    return { listManager, currentIndex, users };
  }

  // Profile
  async handleProfile(ctx: SessionSceneContext) {
    const user_id = await this.redis.get(getRedisKeys('user_id', ctx.chat.id));
    const user = await this.userService.findUserById(user_id, true);

    const photo_file_id = (await ctx.telegram.getUserProfilePhotos(user.tg_user_id, 0, 1))
      .photos[0][2].file_id;
    const photo_url = await ctx.telegram.getFileLink(photo_file_id);

    ctx.sendPhoto(
      { url: photo_url.toString() },
      {
        caption: getDefaultText(user, 'new'),
        parse_mode: 'MarkdownV2',
        reply_markup: {
          inline_keyboard: [[{ callback_data: 'admin_employees', text: 'Сотрудники' }]],
        },
      },
    );
  }

  // List
  @Action('next_currentIndex_admin_')
  public async handleNext(@Ctx() ctx: SessionSceneContext): Promise<void> {
    const { currentIndex, listManager, users } = await this.getListManager(ctx);

    if (currentIndex < users.length - 1) {
      await this.redis.set(
        getRedisKeys('currentIndex_admin', listManager.prefix, ctx.chat.id),
        currentIndex + 1,
      );
      await listManager.editMessage();
    } else {
      await ctx.answerCbQuery('Нет следующего элемента');
    }
  }

  @Action('prev_currentIndex_admin_')
  public async handlePrev(@Ctx() ctx: SessionSceneContext): Promise<void> {
    const { currentIndex, listManager } = await this.getListManager(ctx);

    if (currentIndex > 0) {
      await this.redis.set(
        getRedisKeys('currentIndex_admin', listManager.prefix, ctx.chat.id),
        currentIndex - 1,
      );
      await listManager.editMessage();
    } else {
      await ctx.answerCbQuery('Нет предыдущего элемента');
    }
  }

  @Action('admin_employees')
  async sendDoneOrders(@Ctx() ctx: SessionSceneContext) {
    const { listManager, users } = await this.getListManager(ctx);

    if (users.length === 0) {
      await ctx.reply('Сотрудников нет(');
      return;
    }

    listManager.sendInitialMessage();
  }

  // Employee Actions
  @Action('admin_dismiss_employee')
  async dismissEmployee(@Ctx() ctx: SessionSceneContext) {
    const { users, currentIndex } = await this.getListManager(ctx);
    const currentUser = users[currentIndex];

    this.userService.deleteUser(currentUser.id);
    await ctx.telegram.sendMessage(
      currentUser.tg_chat_id,
      'К сожалению, вы уволены, расчет будет произведен',
    );
    await ctx.replyWithMarkdownV2(`Уволен данный сотрудник:
${getDefaultText(currentUser, 'char')}`);
  }

  @Action('admin_give_money')
  async giveEmployee(@Ctx() ctx: SessionSceneContext) {
    const { listManager } = await this.getListManager(ctx);
    const currentUser = await listManager.currentItem();

    const updatedUser = await this.userService.countMoney(currentUser.id);
    await ctx.telegram.sendMessage(
      currentUser.tg_user_id,
      'Расчет выплат произведен, в ближайшие дни ожидайте зп',
    );
    await ctx.replyWithMarkdownV2(`Вы сделали перерасчет зп данному сотруднику:
${getDefaultText(updatedUser, 'char')}`);
  }
}
