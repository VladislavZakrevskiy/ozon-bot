import { Get, Patch, Param, Body } from '@nestjs/common';
import { UserService } from './user.service';
import { UpdateUserDTO } from './dto/api/UpdateUserDTO';
import { Token } from './decorators/Token.decorator';
import { JwtService } from 'src/core/jwt/jwt.service';

export class UserCotroller {
  constructor(
    private userService: UserService,
    private jwtService: JwtService,
  ) {}

  @Patch('/updateOrder/:id')
  async updateUser(
    @Body() updateOrderDto: UpdateUserDTO,
    @Param('id') id: string,
  ) {
    const user = await this.userService.findUserById(id);
    delete user.id;
    const updatedUser = await this.userService.updateUser(id, {
      ...user,
      ...updateOrderDto,
    });

    return updatedUser;
  }

  @Get('/:id')
  async getUserById(@Param('id') id: string) {
    const order = await this.userService.findUserById(id);
    return order;
  }

  @Get('/getMe')
  async getMe(@Token() token: string) {
    const {
      user: { id },
    } = this.jwtService.decodeToken(token);
    const user = await this.userService.findUserById(id);
    return user;
  }
}
