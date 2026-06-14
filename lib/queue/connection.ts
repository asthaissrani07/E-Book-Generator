import IORedis from 'ioredis';
import type { ConnectionOptions } from 'bullmq';

export function getRedisUrl(): string {
  return process.env.REDIS_URL || 'redis://127.0.0.1:6379';
}

export function getRedisConnectionOptions(): ConnectionOptions {
  const url = new URL(getRedisUrl());
  return {
    host: url.hostname,
    port: url.port ? Number(url.port) : 6379,
    password: url.password || undefined,
    username: url.username || undefined,
    maxRetriesPerRequest: null,
  };
}

export function createRedisConnection(): IORedis {
  return new IORedis(getRedisUrl(), {
    maxRetriesPerRequest: null,
  });
}

export async function isRedisAvailable(): Promise<boolean> {
  const redis = new IORedis(getRedisUrl(), {
    maxRetriesPerRequest: 1,
    connectTimeout: 2000,
    lazyConnect: true,
  });
  try {
    await redis.connect();
    await redis.ping();
    return true;
  } catch {
    return false;
  } finally {
    redis.disconnect();
  }
}
