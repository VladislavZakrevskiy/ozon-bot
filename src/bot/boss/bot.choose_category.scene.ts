import { Scene, SceneEnter, Action, Ctx, On } from 'nestjs-telegraf';
import { Scenes } from '../types/Scenes';
import { SessionSceneContext } from '../types/Scene';
import { UserService } from '../../user/user.service';
import { EmployeeLevel } from '@prisma/client';
import { Markup } from 'telegraf';
import { Injectable } from '@nestjs/common';
import { CategoryService } from 'src/order/category.service';

@Injectable()
@Scene(Scenes.CATEGORY_SELECTION)
export class CategorySelectionScene {
  constructor(
    private categoryService: CategoryService,
    private userService: UserService,
  ) {}

  @SceneEnter()
  async onSceneEnter(@Ctx() ctx: SessionSceneContext) {
    if (!ctx.session.categories) {
      await this.loadCategories(ctx);
    }
  }

  private async loadCategories(ctx: SessionSceneContext) {
    const categories = await this.categoryService.getAllCategories();

    if (!categories || categories.length === 0) {
      await ctx.reply('Категории не найдены. Продолжаем регистрацию без выбора категорий.');
      await ctx.scene.enter(Scenes.APPROVE);
      return;
    }

    ctx.session.categories = categories;
    ctx.session.selectedCategoryIds = [];

    const admins: EmployeeLevel[] = [EmployeeLevel.ADMIN, EmployeeLevel.BOSS];

    if (admins.includes(ctx.session.approving_data.role)) {
      ctx.session.selectedCategoryIds = categories.map((cat) => cat.id);
      await ctx.reply(
        'Вы получили доступ ко всем категориям в соответствии с вашей ролью',
        Markup.inlineKeyboard([Markup.button.callback('Продолжить', 'confirm_categories')]),
      );
    } else {
      await this.renderCategorySelectionKeyboard(ctx);
    }
  }

  private async renderCategorySelectionKeyboard(ctx: SessionSceneContext) {
    const categories = ctx.session.categories || [];
    const selectedIds = ctx.session.selectedCategoryIds || [];

    const categoryButtons = categories.map((category) => {
      const isSelected = selectedIds.includes(category.id);
      const buttonText = isSelected ? `✅ ${category.name}` : category.name;
      return Markup.button.callback(buttonText, `category_${category.id}`);
    });

    const buttons = [];
    for (let i = 0; i < categoryButtons.length; i += 2) {
      if (i + 1 < categoryButtons.length) {
        buttons.push([categoryButtons[i], categoryButtons[i + 1]]);
      } else {
        buttons.push([categoryButtons[i]]);
      }
    }

    buttons.push([Markup.button.callback('Подтвердить выбор', 'confirm_categories')]);

    const message = 'Выберите категории, с которыми вы будете работать:';

    if (ctx.session.categoryMessageId) {
      try {
        await ctx.telegram.editMessageText(
          ctx.chat.id,
          ctx.session.categoryMessageId,
          undefined,
          message,
          { reply_markup: Markup.inlineKeyboard(buttons).reply_markup },
        );
      } catch (error) {
        // Если сообщение не найдено или не может быть отредактировано, отправляем новое
        const sentMessage = await ctx.reply(message, Markup.inlineKeyboard(buttons));
        ctx.session.categoryMessageId = sentMessage.message_id;
      }
    } else {
      const sentMessage = await ctx.reply(message, Markup.inlineKeyboard(buttons));
      ctx.session.categoryMessageId = sentMessage.message_id;
    }
  }

  @Action(/category_(.+)/)
  async toggleCategory(@Ctx() ctx: SessionSceneContext) {
    if (!ctx.session.selectedCategoryIds) {
      ctx.session.selectedCategoryIds = [];
    }

    const categoryId = (ctx.callbackQuery as { data: string }).data.split('_')[1];

    const index = ctx.session.selectedCategoryIds.indexOf(categoryId);

    if (index === -1) {
      ctx.session.selectedCategoryIds.push(categoryId);
      await ctx.answerCbQuery(`Категория добавлена`);
    } else {
      ctx.session.selectedCategoryIds.splice(index, 1);
      await ctx.answerCbQuery(`Категория удалена`);
    }

    await this.renderCategorySelectionKeyboard(ctx);
  }

  @Action('confirm_categories')
  async confirmCategorySelection(@Ctx() ctx: SessionSceneContext) {
    try {
      if (!ctx.session.selectedCategoryIds || ctx.session.selectedCategoryIds.length === 0) {
        if (EmployeeLevel.EMPLOYEE === ctx.session.approving_data.role) {
          await ctx.answerCbQuery('Пожалуйста, выберите хотя бы одну категорию!', {
            show_alert: true,
          });
          return;
        }
      }

      await this.userService.updateUserCategories(
        ctx.session.approving_data.userId,
        ctx.session.selectedCategoryIds || [],
      );

      const selectedCategoryNames = ctx.session.categories
        .filter((cat) => ctx.session.selectedCategoryIds.includes(cat.id))
        .map((cat) => cat.name);

      // Формируем сообщение об успешном выборе категорий
      let successMessage = 'Выбранные категории успешно сохранены:\n';
      if (selectedCategoryNames.length > 0) {
        successMessage += selectedCategoryNames.map((name) => `• ${name}`).join('\n');
      } else {
        successMessage = 'Вы не выбрали ни одной категории.';
      }

      await ctx.answerCbQuery('Категории успешно сохранены!');
      await ctx.reply(successMessage);

      // Очищаем данные о категориях из сессии
      delete ctx.session.categories;
      delete ctx.session.selectedCategoryIds;
      delete ctx.session.categoryMessageId;

      // Переходим к следующему шагу - подтверждение регистрации
      await ctx.scene.enter(Scenes.APPROVE);
    } catch (error) {
      console.error('Ошибка при сохранении категорий:', error);
      await ctx.reply('Произошла ошибка при сохранении категорий. Пожалуйста, попробуйте еще раз.');
    }
  }

  // Обработка неожиданных сообщений во время выбора категорий
  @On('message')
  async onMessage(@Ctx() ctx: SessionSceneContext) {
    await ctx.reply('Пожалуйста, выберите категории, используя кнопки выше.');
    // Повторно отображаем клавиатуру выбора категорий
    await this.renderCategorySelectionKeyboard(ctx);
  }
}
