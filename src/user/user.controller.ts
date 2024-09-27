import { Get, Patch, Param, Body, Controller } from '@nestjs/common';
import { UserService } from './user.service';
import { UpdateUserDTO } from './dto/api/UpdateUserDTO';
import { Token } from '../core/decorators/Token.decorator';
import { JwtService } from 'src/auth/jwt/jwt.service';

@Controller('user')
export class UserCotroller {
  constructor(
    private userService: UserService,
    private jwtService: JwtService,
  ) {}

  @Patch('/:id')
  async updateUser(@Body() updateOrderDto: UpdateUserDTO, @Param('id') id: string) {
    const user = await this.userService.findUserById(id);
    delete user.id;
    updateOrderDto.money = Number(updateOrderDto.money);
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

  @Get()
  async getMe(@Token() token: string) {
    const {
      user: { id },
    } = this.jwtService.decodeAccessToken(token);
    const user = await this.userService.findUserById(id);
    return user;
  }
}
