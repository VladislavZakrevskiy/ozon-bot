import { Injectable } from '@nestjs/common';
import { RedisService } from 'src/core/redis/redis.service';
import { getRedisKeys } from 'src/core/redis/redisKeys';
import { SessionSceneContext } from '../types/Scene';

interface ListManagerOptions<T> {
  getText: (data: T) => string;
  getImage?: (data: T) => Promise<string>;
  extraButtons?: {
    text: string;
    callback_data: string;
    web_app?: (data: T) => { url: string };
  }[][];
}

@Injectable()
export class ListManager<T> {
  current_index: number = 0;

  constructor(
    private redis: RedisService,
    private list: T[],
    private options: ListManagerOptions<T>,
    private ctx: SessionSceneContext,
    public prefix: string,
    public key: string,
  ) {}

  public async currentItem() {
    const currentIndex = Number(
      await this.redis.get(getRedisKeys(this.key, this.prefix, this.ctx.chat.id)),
    );
    this.current_index = currentIndex;

    return this.list[currentIndex];
  }

  public async getText() {
    const current_item = await this.currentItem();
    return this.options.getText(current_item);
  }

  public async getImage() {
    const current_item = await this.currentItem();
    const image = await this.options.getImage(current_item);

    return image || 'https://cdn-icons-png.flaticon.com/512/2830/2830524.png';
  }
  private async getButtons() {
    const buttons = [];

    if (this.current_index > 0) {
      buttons.push({ text: '⬅ Назад', callback_data: `prev__${this.key}_${this.prefix}` });
    }

    if (this.current_index < this.list.length - 1) {
      buttons.push({ text: 'Вперед ➡', callback_data: `next__${this.key}_${this.prefix}` });
    }

    return buttons as {
      text: string;
      callback_data: string;
    }[];
  }

  public async sendInitialMessage(): Promise<void> {
    const text = await this.getText();
    const buttons = await this.getButtons();
    const image = await this.getImage();
    const current_item = await this.currentItem();

    await this.redis.set(getRedisKeys(this.key, this.prefix, this.ctx.chat.id), 0);

    const inlineKeyboard = {
      inline_keyboard: [
        buttons.map((btn) => ({
          text: btn.text,
          callback_data: btn.callback_data,
        })),
        [{ text: `${this.current_index + 1}/${this.list.length}`, callback_data: 'number string' }],
        ...(this.options?.extraButtons?.map((value) =>
          value.map(({ callback_data, text, web_app }) => ({
            callback_data,
            text,
            web_app: web_app?.(current_item),
          })),
        ) || []),
      ],
    };

    if (image) {
      await this.ctx.replyWithPhoto(
        { url: image },
        {
          caption: text,
          parse_mode: 'MarkdownV2',
          reply_markup: inlineKeyboard,
        },
      );
    } else {
      await this.ctx.reply(text, {
        reply_markup: inlineKeyboard,
        parse_mode: 'MarkdownV2',
      });
    }
  }

  public async editMessage(): Promise<void> {
    const text = await this.getText();
    const buttons = await this.getButtons();
    const image = await this.getImage();
    const current_item = await this.currentItem();

    const inlineKeyboard = {
      inline_keyboard: [
        buttons.map((btn) => ({
          text: btn.text,
          callback_data: btn.callback_data,
        })),
        [{ text: `${this.current_index + 1}/${this.list.length}`, callback_data: 'number string' }],
        ...(this.options?.extraButtons?.map((value) =>
          value.map(({ callback_data, text, web_app }) => ({
            callback_data,
            text,
            web_app: web_app?.(current_item),
          })),
        ) || []),
      ],
    };

    try {
      if (image) {
        await this.ctx.editMessageMedia(
          {
            type: 'photo',
            media: image,
            caption: text,
            parse_mode: 'MarkdownV2',
          },
          {
            reply_markup: inlineKeyboard,
          },
        );
      } else {
        await this.ctx.editMessageText(text, {
          parse_mode: 'MarkdownV2',
          reply_markup: inlineKeyboard,
        });
      }
    } catch (error) {}
  }
}
