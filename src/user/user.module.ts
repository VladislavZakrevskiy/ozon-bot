import { Module } from '@nestjs/common';
import { UserCotroller } from './user.controller';
import { UserService } from './user.service';
import { JwtService } from 'src/auth/jwt/jwt.service';
import { PrismaService } from 'src/prisma.service';

@Module({
  imports: [],
  controllers: [UserCotroller],
  providers: [UserService, JwtService, PrismaService],
})
export class UserModule {}
