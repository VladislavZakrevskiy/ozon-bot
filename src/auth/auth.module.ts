import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { JwtService } from './jwt/jwt.service';

@Module({
  controllers: [AuthController],
  providers: [JwtService],
})
export class AuthModule {
  constructor() {}
}
