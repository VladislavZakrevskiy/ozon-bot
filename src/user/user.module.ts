import { Module } from '@nestjs/common';
import { UserCotroller } from './user.controller';
import { UserService } from './user.service';
import { JwtService } from 'src/core/jwt/jwt.service';

@Module({
  imports: [],
  controllers: [UserCotroller],
  providers: [UserService, JwtService],
})
export class UserModule {}
