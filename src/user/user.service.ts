import { Injectable } from '@nestjs/common';
import { EmployeeLevel, Prisma, User } from '@prisma/client';
import { PrismaService } from 'src/prisma.service';
import { compareSync } from 'bcrypt';
import { RegisterDto } from './dto/registerDto';
import { JwtService } from 'src/auth/jwt/jwt.service';

@Injectable()
export class UserService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  // Auth operations
  async saveToken(
    id: string,
    token: string,
    type: 'register' | 'login' = 'login',
  ) {
    if (type == 'login') {
      const updatedToken = await this.prisma.refreshToken.update({
        where: { user_id: id },
        data: { token },
      });
      return updatedToken;
    } else {
      const createdToken = await this.prisma.refreshToken.create({
        data: { token, user: { connect: { id } } },
      });

      return createdToken;
    }
  }

  async createUser(registerData: Prisma.UserCreateInput) {
    const user = await this.prisma.user.create({
      data: {
        ...registerData,
      },
    });

    const access_token = this.jwtService.generateAccessToken({ user });
    const refresh_token = this.jwtService.generateRefreshToken({ user });

    this.saveToken(user.id, refresh_token, 'register');

    return { user, access_token, refresh_token };
  }

  async registerUser(registerData: RegisterDto) {
    const user = await this.prisma.user.create({
      data: {
        ...registerData,
        employee_level: EmployeeLevel.ENEMY,
        isApproved: false,
        money: 0,
        post: '',
      },
    });

    const access_token = this.jwtService.generateAccessToken({ user });
    const refresh_token = this.jwtService.generateRefreshToken({ user });

    this.saveToken(user.id, refresh_token, 'register');

    return { user, access_token, refresh_token };
  }

  async validateUser(login: string, password: string) {
    const candidate = await this.prisma.user.findUnique({
      where: { login },
    });

    if (candidate && compareSync(password, candidate.password)) {
      const access_token = this.jwtService.generateAccessToken({
        user: candidate,
      });
      const refresh_token = this.jwtService.generateRefreshToken({
        user: candidate,
      });

      this.saveToken(candidate.id, refresh_token, 'login');

      return { candidate, access_token, refresh_token };
    } else return null;
  }

  // CRUD
  async getUserById(id: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { id },
    });
  }

  async updateUser(id: string, data: Partial<Omit<User, 'id'>>): Promise<User> {
    return this.prisma.user.update({
      where: { id },
      data,
    });
  }

  async deleteUser(id: string): Promise<User> {
    return this.prisma.user.delete({
      where: { id },
    });
  }

  // Find
  async findUserByRole(
    role: EmployeeLevel | EmployeeLevel[],
    withOrders: boolean = false,
  ) {
    const users = await this.prisma.user.findMany({
      where: { employee_level: typeof role === 'object' ? { in: role } : role },
      include: { orders: withOrders },
    });

    return users;
  }

  async findUserByLogin(login: string, withOrders: boolean = false) {
    const user = await this.prisma.user.findUnique({
      where: { login },
      include: { orders: withOrders },
    });
    return user;
  }

  async findUserById(id: string, withOrders: boolean = false) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: { orders: withOrders },
    });
    return user;
  }

  async findUserByTgChat({
    tg_chat_id,
    tg_user_id,
  }: {
    tg_chat_id?: number;
    tg_user_id?: number;
  }) {
    const user = await this.prisma.user.findUnique({
      where: { tg_chat_id, tg_user_id },
    });

    return user;
  }
}
