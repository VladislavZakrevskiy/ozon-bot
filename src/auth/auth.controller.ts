import { Controller, Post, Body } from '@nestjs/common';
import { JwtService } from './jwt/jwt.service';
import * as crypto from 'crypto';

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

  @Post('/hash')
  getHash(@Body() { dataCheckString }: { dataCheckString: string }) {
    const secretKey = crypto
      .createHmac('sha256', 'WebAppData')
      .update(process.env.TELEGRAM_BOT_TOKEN)
      .digest();
    const calculatedHash = crypto
      .createHmac('sha256', secretKey)
      .update(dataCheckString)
      .digest('hex');

    return { hash: calculatedHash };
  }
}
