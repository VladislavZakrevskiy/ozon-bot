import { UseGuards } from '@nestjs/common';
import { Ctx, Command, Update } from 'nestjs-telegraf';
import { Context } from 'telegraf';
import * as fs from 'fs';
import { ExcelService } from 'src/order/excel.service';
import { Roles, RolesGuard } from 'src/core/decorators/Roles.guard';
import { EmployeeLevel } from '@prisma/client';

@Update()
export class BotBossExcelService {
  constructor(private readonly excelService: ExcelService) {}

  @Roles(EmployeeLevel.BOSS)
  @UseGuards(RolesGuard)
  @Command('table')
  async onTableCommand(@Ctx() ctx: Context) {
    const now_date = new Date().toISOString().split('T');
    const date_string = `${now_date[0]} ${now_date[1].split('.')[0]}`;
    const { message_id } = await ctx.reply('Подождите, загрузка ⌚');
    const filePath = await this.excelService.generateOrdersExcel();
    await ctx.deleteMessage(message_id);

    await ctx.replyWithDocument(
      {
        source: filePath,
        filename: `orders_${date_string.replaceAll(' ', '_').replaceAll('-', '.').replaceAll(':', '-')}.xlsx`,
      },
      {
        caption: `#excel за ${date_string}
Ваш Excel документ со всеми заказами за все время`,
      },
    );

    fs.unlinkSync(filePath);
  }
}
