import { Injectable, UnauthorizedException } from '@nestjs/common';
import * as jwt from 'jsonwebtoken';
import { JwtPayload } from './types/JwtPayload';

@Injectable()
export class JwtService {
  private readonly secret = process.env.SECRET_JWT;

  generateToken(payload: JwtPayload): string {
    const token = jwt.sign(payload, this.secret, {
      expiresIn: process.env.EXPIRES_IN_JWT,
    });
    return token;
  }

  decodeToken(token: string) {
    try {
      const decoded = jwt.verify(token, this.secret);
      return decoded as JwtPayload;
    } catch (error) {
      throw new UnauthorizedException('Invalid or expired token');
    }
  }
}
