import { Injectable } from '@nestjs/common';
import { EmployeeLevel, Prisma, User } from '@prisma/client';
import { PrismaService } from 'src/prisma.service';
import { compareSync } from 'bcrypt';
import { RegisterDto } from './dto/registerDto';

@Injectable()
export class UserService {
  constructor(private prisma: PrismaService) {}

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

    return user;
  }

  async validateUser(login: string, password: string) {
    const candidate = await this.prisma.user.findUnique({
      where: { login },
    });
    console.log(candidate, compareSync(String(password), candidate.password));

    if (candidate && compareSync(password, candidate.password)) {
      return candidate;
    } else return null;
  }

  // CRUD
  async getUserById(id: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { id },
    });
  }

  async updateUser(id: string, data: Prisma.UserUpdateInput): Promise<User> {
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
  async findUserByRole(role: EmployeeLevel) {
    const users = await this.prisma.user.findMany({
      where: { employee_level: role },
    });

    return users;
  }

  async findUserByLogin(login: string) {
    const user = await this.prisma.user.findUnique({ where: { login } });
    return user;
  }
}
