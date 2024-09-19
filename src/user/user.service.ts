import { Injectable } from '@nestjs/common';
import { EmployeeLevel, User } from '@prisma/client';
import { PrismaService } from 'src/prisma.service';
import { compareSync } from 'bcrypt';
import { RegisterDto } from './dto/registerDto';

@Injectable()
export class UserService {
  constructor(private prisma: PrismaService) {}

  // Auth operations
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
}
