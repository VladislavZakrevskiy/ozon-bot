import { Injectable } from '@nestjs/common';
import { RedisService } from 'src/core/redis/redis.service';
import { getRedisKeys } from 'src/core/redis/redisKeys';
import { SessionSceneContext } from '../types/Scene';

interface ListManagerOptions<T> {
  getText: (data: T) => string;
  getImage?: (data: T) => Promise<string>;
  extraButtons?: {
    text: string;
    callback_data?: string;
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
    const redisIndex = await this.redis.get(getRedisKeys(this.key, this.prefix, this.ctx.chat.id));
    const currentIndex = redisIndex ? Number(redisIndex) : 0;

    if (isNaN(currentIndex) || currentIndex < 0 || currentIndex >= this.list.length) {
      this.current_index = 0;
      await this.redis.set(getRedisKeys(this.key, this.prefix, this.ctx.chat.id), 0);
      return this.list[0];
    }

    this.current_index = currentIndex;
    return this.list[currentIndex];
  }

  public async getText() {
    const current_item = await this.currentItem();
    console.log(current_item);
    return this.options.getText(current_item);
  }

  public async getImage() {
    const current_item = await this.currentItem();

    if (!this.options.getImage) {
      return 'https://cdn-icons-png.flaticon.com/512/2830/2830524.png';
    }

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
      try {
        // Отправляем фото напрямую с URL
        await this.ctx.replyWithPhoto(
          { url: String(image) },
          {
            caption: text,
            parse_mode: 'MarkdownV2',
            reply_markup: inlineKeyboard,
          },
        );
      } catch (uploadError) {
        console.error('Ошибка при отправке изображения:', uploadError);
        // Если не удалось отправить изображение, отправляем текстовое сообщение
        await this.ctx.reply(text, {
          reply_markup: inlineKeyboard,
          parse_mode: 'MarkdownV2',
        });
      }
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
        console.log(image);

        try {
          // Сначала пробуем отправить новое сообщение с фото, чтобы получить file_id
          const sentMessage = await this.ctx.telegram.sendPhoto(
            this.ctx.chat.id,
            { url: String(image) },
            { caption: 'Временное сообщение' },
          );

          // Удаляем временное сообщение
          await this.ctx.telegram.deleteMessage(this.ctx.chat.id, sentMessage.message_id);

          // Используем полученный file_id для редактирования сообщения
          const fileId = sentMessage.photo[sentMessage.photo.length - 1].file_id;

          await this.ctx.editMessageMedia(
            {
              type: 'photo',
              media: fileId, // Используем file_id вместо URL
              caption: text,
              parse_mode: 'MarkdownV2',
            },
            {
              reply_markup: inlineKeyboard,
            },
          );
        } catch (uploadError) {
          console.error('Ошибка при загрузке изображения:', uploadError);
          // Если не удалось загрузить изображение, отправляем текстовое сообщение
          await this.ctx.editMessageText(text, {
            parse_mode: 'MarkdownV2',
            reply_markup: inlineKeyboard,
          });
        }
      } else {
        await this.ctx.editMessageText(text, {
          parse_mode: 'MarkdownV2',
          reply_markup: inlineKeyboard,
        });
      }
    } catch (error) {
      console.error(error);
    }
  }
}
