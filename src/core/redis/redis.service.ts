import { InjectRedis } from '@nestjs-modules/ioredis';
import { Injectable } from '@nestjs/common';
import Redis from 'ioredis';

@Injectable()
export class RedisService {
  constructor(
    @InjectRedis()
    private readonly redisClient: Redis,
  ) {}

  async set<T>(key: string, value: T, expireTime?: number): Promise<'OK'> {
    const stringValue = JSON.stringify(value);
    if (expireTime) {
      return this.redisClient.set(key, stringValue, 'EX', expireTime);
    }
    return this.redisClient.set(key, stringValue);
  }

  async get<T>(key: string): Promise<T | null> {
    const result = await this.redisClient.get(key);
    if (!result) {
      return null;
    }
    return JSON.parse(result) as T;
  }

  async delete(key: string): Promise<number> {
    return this.redisClient.del(key);
  }

  async increment(key: string): Promise<number> {
    return this.redisClient.incr(key);
  }

  async addToList<T>(key: string, value: T): Promise<number> {
    const stringValue = JSON.stringify(value);
    return this.redisClient.rpush(key, stringValue);
  }

  async getList<T>(key: string): Promise<T[]> {
    const result = await this.redisClient.lrange(key, 0, -1);
    return result.map((item) => JSON.parse(item) as T);
  }

  async removeFromList<T>(key: string, value: T): Promise<number> {
    const stringValue = JSON.stringify(value);
    return this.redisClient.lrem(key, 0, stringValue);
  }
}
