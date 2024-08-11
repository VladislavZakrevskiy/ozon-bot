import { Injectable } from '@nestjs/common';
import { User } from '@prisma/client';
import { PrismaService } from 'src/prisma.service';
import { compareSync, genSaltSync, hashSync } from 'bcrypt';

@Injectable()
export class UserService {
  constructor(private prisma: PrismaService) {}

  async validateUser(login: string, password: string) {
    const candidate = await this.prisma.user.findUnique({
      where: { login },
    });

    const salt = genSaltSync(7);
    const pass = hashSync(password, salt);
    console.log(pass);

    if (candidate && compareSync(password, candidate.password)) {
      return candidate;
    } else return null;
  }

  // CRUD
  async getUserById(user_id: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { user_id },
    });
  }

  async updateUser(
    user_id: string,
    data: { name?: string; email?: string },
  ): Promise<User> {
    return this.prisma.user.update({
      where: { user_id },
      data,
    });
  }

  async deleteUser(user_id: string): Promise<User> {
    return this.prisma.user.delete({
      where: { user_id },
    });
  }
}
