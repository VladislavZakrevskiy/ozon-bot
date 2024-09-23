import { Injectable } from '@nestjs/common';
import { Action } from 'nestjs-telegraf';
import { Context } from 'telegraf';

interface ListManagerOptions<T> {
  getText: (data: T) => string;
  getImage?: (data: T) => string | Promise<string>;
  extraButtons?: { text: string; callback_data: string }[][];
}

@Injectable()
export class ListManager<T> {
  private list: T[] = [];
  private options: ListManagerOptions<T>;
  private currentIndex = 0;

  constructor() {}

  public setTemplate(list: T[], options: ListManagerOptions<T>): void {
    this.list = list;
    this.options = options;
  }

  private get currentItem(): T {
    return this.list[this.currentIndex];
  }

  public getText(): string {
    return this.options.getText(this.currentItem);
  }

  public async getImage() {
    return (await this.options.getImage(this.currentItem)) || '';
  }
  private getButtons(): Array<{ text: string; callback_data: string }> {
    const buttons = [];

    if (this.currentIndex > 0) {
      buttons.push({ text: '⬅ Назад', callback_data: 'prev' });
    }

    if (this.currentIndex < this.list.length - 1) {
      buttons.push({ text: 'Вперед ➡', callback_data: 'next' });
    }

    return buttons;
  }

  public async sendInitialMessage(ctx: Context): Promise<void> {
    const text = this.getText();
    const buttons = this.getButtons();
    const image = await this.getImage();

    const inlineKeyboard = {
      inline_keyboard: [
        buttons.map((btn) => ({
          text: btn.text,
          callback_data: btn.callback_data,
        })),
        ...this.options.extraButtons,
      ],
    };

    if (image) {
      await ctx.replyWithPhoto(image, {
        caption: text,
        reply_markup: inlineKeyboard,
      });
    } else {
      await ctx.reply(text, {
        reply_markup: inlineKeyboard,
      });
    }
  }

  private async editMessage(ctx: Context): Promise<void> {
    const text = this.getText();
    const buttons = this.getButtons();
    const image = await this.getImage();

    const inlineKeyboard = {
      inline_keyboard: [
        buttons.map((btn) => ({
          text: btn.text,
          callback_data: btn.callback_data,
        })),
      ],
    };

    try {
      if (image) {
        await ctx.editMessageMedia(
          {
            type: 'photo',
            media: image,
            caption: text,
          },
          {
            reply_markup: inlineKeyboard,
          },
        );
      } else {
        await ctx.editMessageText(text, {
          reply_markup: inlineKeyboard,
        });
      }
    } catch (error) {
      console.log('Ошибка при редактировании сообщения:', error);
    }
  }

  @Action('next')
  public async handleNext(ctx: Context): Promise<void> {
    if (this.currentIndex < this.list.length - 1) {
      this.currentIndex++;
      await this.editMessage(ctx);
    } else {
      await ctx.answerCbQuery('Нет следующего элемента');
    }
  }

  @Action('prev')
  public async handlePrev(ctx: Context): Promise<void> {
    if (this.currentIndex > 0) {
      this.currentIndex--;
      await this.editMessage(ctx);
    } else {
      await ctx.answerCbQuery('Нет предыдущего элемента');
    }
  }
}
