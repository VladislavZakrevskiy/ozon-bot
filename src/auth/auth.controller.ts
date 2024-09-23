import { Controller, Post, Body } from '@nestjs/common';
import { JwtService } from './jwt/jwt.service';

@Controller('auth')
export class AuthController {
  constructor(private readonly jwtService: JwtService) {}

  @Post('refresh')
  async refresh(@Body() body: { refresh_token: string }) {
    const { refresh_token } = body;
    const decoded = this.jwtService.verifyRefreshToken(refresh_token);

    const newAccessToken = this.jwtService.generateAccessToken({
      user: decoded.user,
    });

    return { access_token: newAccessToken };
  }
}
