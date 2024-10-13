import { Body, Controller, Delete } from '@nestjs/common';
import { PrismaService } from './prisma.service';

@Controller('')
export class AppController {
  constructor(private prisma: PrismaService) {}

  // TODO DELETE THIS METHOD
  @Delete('/resetdb')
  async resetDB(@Body() groups: ('category' | 'refreshToken' | 'order' | 'user')[]) {
    for (const group of groups) {
      switch (group) {
        case 'refreshToken':
          await this.prisma.refreshToken.deleteMany();
          break;
        case 'user':
          await this.prisma.refreshToken.deleteMany();
          await this.prisma.user.deleteMany();
          break;
        case 'category':
          await this.prisma.category.deleteMany();
        case 'order':
          await this.prisma.order.deleteMany();
          break;
      }
    }

    return 'ok';
  }
}
