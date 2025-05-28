import { Action, Update, Ctx } from 'nestjs-telegraf';
import { Context } from 'telegraf';
import { UserService } from '../../user/user.service';
import { EmployeeLevel } from '@prisma/client';
import { SessionSceneContext } from '../types/Scene';
import { Scenes } from '../types/Scenes';
import { Markup } from 'telegraf';
import { CategoryService } from 'src/order/category.service';

@Update()
export class BotAdminApproveService {
  constructor(
    private userService: UserService,
    private categoryService: CategoryService,
  ) {}

  @Action('admin')
  async approveAdminRole(@Ctx() ctx: SessionSceneContext) {
    const email = this.extractEmail(ctx);
    const user = await this.userService.findUserByLogin(email);

    if (!user) {
      await ctx.reply('Какая-то ошибка(');
      return;
    }

    ctx.session.approving_data = {
      userId: user.id,
      role: EmployeeLevel.ADMIN,
    };

    await this.showCategoriesSelection(ctx);
  }

  @Action('boss')
  async approveBossRole(@Ctx() ctx: SessionSceneContext) {
    const email = this.extractEmail(ctx);
    const user = await this.userService.findUserByLogin(email);

    if (!user) {
      await ctx.reply('Какая-то ошибка(');
      return;
    }

    ctx.session.approving_data = {
      userId: user.id,
      role: EmployeeLevel.BOSS,
    };

    // Руководителям также доступны все категории
    await this.showCategoriesSelection(ctx);
  }

  @Action('employee')
  async approveEmployeeRole(@Ctx() ctx: SessionSceneContext) {
    const email = this.extractEmail(ctx);
    const user = await this.userService.findUserByLogin(email);

    if (!user) {
      await ctx.reply('Какая-то ошибка(');
      return;
    }

    ctx.session.approving_data = {
      userId: user.id,
      role: EmployeeLevel.EMPLOYEE,
    };

    // Сотрудникам нужно выбрать категории доступа
    await this.showCategoriesSelection(ctx);
  }

  @Action('enemy')
  async approveEnemyRole(@Ctx() ctx: SessionSceneContext) {
    const email = this.extractEmail(ctx);
    const user = await this.userService.findUserByLogin(email);

    if (!user) {
      await ctx.reply('Какая-то ошибка(');
      return;
    }

    ctx.session.approving_data = {
      userId: user.id,
      role: EmployeeLevel.ENEMY,
    };

    // Для врагов категории не назначаются
    await ctx.scene.enter(Scenes.APPROVE);
  }

  async showCategoriesSelection(@Ctx() ctx: SessionSceneContext) {
    // Получаем все доступные категории
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
      // Создаем клавиатуру с категориями для выбора
      const categoryButtons = categories.map((category) =>
        Markup.button.callback(category.name, `category_${category.id}`),
      );

      // Добавляем кнопку подтверждения в конце
      const buttons = [];
      for (let i = 0; i < categoryButtons.length; i += 2) {
        if (i + 1 < categoryButtons.length) {
          buttons.push([categoryButtons[i], categoryButtons[i + 1]]);
        } else {
          buttons.push([categoryButtons[i]]);
        }
      }
      buttons.push([Markup.button.callback('Подтвердить выбор', 'confirm_categories')]);

      await ctx.reply(
        'Выберите категории, с которыми вы будете работать:',
        Markup.inlineKeyboard(buttons),
      );
    }

    ctx.scene.enter(Scenes.CATEGORY_SELECTION);
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

    await this.updateCategorySelectionMessage(ctx);
  }

  @Action('confirm_categories')
  async confirmCategorySelection(@Ctx() ctx: SessionSceneContext) {
    await this.userService.updateUserCategories(
      ctx.session.approving_data.userId,
      ctx.session.selectedCategoryIds || [],
    );

    await ctx.answerCbQuery('Категории успешно сохранены!');
    await ctx.reply('Выбранные категории успешно сохранены.');

    await ctx.scene.enter(Scenes.APPROVE);
  }

  async updateCategorySelectionMessage(ctx: SessionSceneContext) {
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

    await ctx.editMessageReplyMarkup(Markup.inlineKeyboard(buttons).reply_markup);
  }

  extractEmail(ctx: Context): string {
    console.log(ctx?.text?.split(' '));
    return ctx?.text?.split(' ')?.[7]?.split('\n')?.[0];
  }
}
