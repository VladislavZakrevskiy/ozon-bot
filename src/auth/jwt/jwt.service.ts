import { Injectable, UnauthorizedException } from '@nestjs/common';
import * as jwt from 'jsonwebtoken';
import { JwtPayload } from './types/JwtPayload';

@Injectable()
export class JwtService {
  private readonly accessSecret = process.env.SECRET_ACCESS_JWT;
  private readonly refreshSecret = process.env.SECRET_REFRESH_JWT;
  private readonly expiresAccess = process.env.EXPIRES_IN_ACCESS_JWT;
  private readonly expiresRefresh = process.env.EXPIRES_IN_REFRESH_JWT;

  generateAccessToken(payload: JwtPayload): string {
    return jwt.sign(payload, this.accessSecret, {
      expiresIn: this.expiresAccess,
    });
  }

  generateRefreshToken(payload: JwtPayload): string {
    return jwt.sign(payload, this.refreshSecret, {
      expiresIn: this.expiresRefresh,
    });
  }

  decodeAccessToken(token: string) {
    try {
      const decoded = jwt.verify(token, this.accessSecret);
      return decoded as JwtPayload;
    } catch (error) {
      throw new UnauthorizedException('Invalid or expired token');
    }
  }

  decodeRefreshToken(token: string) {
    try {
      const decoded = jwt.verify(token, this.refreshSecret);
      return decoded as JwtPayload;
    } catch (error) {
      throw new UnauthorizedException('Invalid or expired token');
    }
  }

  verifyAccessToken(token: string) {
    try {
      return jwt.verify(token, this.accessSecret) as JwtPayload;
    } catch (error) {
      throw new UnauthorizedException('Invalid or expired access token');
    }
  }

  verifyRefreshToken(token: string) {
    try {
      return jwt.verify(token, this.refreshSecret) as JwtPayload;
    } catch (error) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }
  }
}
