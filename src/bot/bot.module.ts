import { Module } from '@nestjs/common';
import { BotService } from './bot.service';
import { BotAdminApproveService } from './boss/bot.admin_approve.service';
import { BotEmployeeService } from './employee/bot.employee.service';
import { BotHelpService } from './bot.help.service';
import { BotProfileService } from './bot.profile.service';
import { EmployeeProdfileService } from './scenes/profiles/Employee.scene';
import { BossUserActions } from './scenes/profiles/Boss/Boss.user_actions';
import { BossOrderActions } from './scenes/profiles/Boss/Boss.order_actions';
import { BossProfileService } from './scenes/profiles/Boss/Boss.scene';
import { AdminProfileService } from './scenes/profiles/Admin.scene';
import { BotBossExcelService } from './boss/boss.excel';
import { BossLastOrdersService } from './boss/boss.last_orders';
import { RegisterScene } from './scenes/Register.scene';
import { LoginScene } from './scenes/Login.scene';
import { UserService } from 'src/user/user.service';
import { OrderService } from 'src/order/order.service';
import { RedisService } from 'src/core/redis/redis.service';
import { PrismaService } from 'src/prisma.service';
import { ExcelService } from 'src/order/excel.service';
import { JwtService } from 'src/auth/jwt/jwt.service';
import { CategoryService } from 'src/order/category.service';
import { AuthGuard } from 'src/core/decorators/Auth.guard';
import { RolesGuard } from 'src/core/decorators/Roles.guard';
import { ApproveScene } from './scenes/Admin.approve';
import { CategorySelectionScene } from './boss/bot.choose_category.scene';
import { ReturnInputScene } from './scenes/ReturnInput.scene';

@Module({
  providers: [
    // Bot Services
    BotService,
    BotAdminApproveService,
    BotEmployeeService,
    BotHelpService,
    BotProfileService,
    EmployeeProdfileService,
    BossUserActions,
    BossOrderActions,
    BossProfileService,
    AdminProfileService,
    BotBossExcelService,
    BossLastOrdersService,

    // Scenes
    RegisterScene,
    LoginScene,
    ApproveScene,
    CategorySelectionScene,
    ReturnInputScene,

    // Guards
    AuthGuard,
    RolesGuard,

    // Deps
    UserService,
    OrderService,
    CategoryService,
    RedisService,
    PrismaService,
    ExcelService,
    JwtService,
  ],
})
export class BotModule {}
// Микшер 527973380 527973380
// Егор 1033949331 1033949331
// Влад 761042250 761042250
// Каня 1361478762 1361478762
// Даниил 1516460432 1516460432
// Владимир 477320901 477320901
// Mr 1003731395 1003731395
