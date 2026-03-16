import { Redis } from "@upstash/redis";

// In-memory Redis-compatible store for local development
class InMemoryRedis {
  private store = new Map<string, unknown>();

  async hset(key: string, values: Record<string, unknown>) {
    const existing = (this.store.get(key) as Record<string, unknown>) || {};
    this.store.set(key, { ...existing, ...values });
    return Object.keys(values).length;
  }

  async hgetall(key: string) {
    return (this.store.get(key) as Record<string, unknown>) || null;
  }

  async hget(key: string, field: string) {
    const hash = (this.store.get(key) as Record<string, unknown>) || {};
    return hash[field] ?? null;
  }

  async hdel(key: string, ...fields: string[]) {
    const hash = (this.store.get(key) as Record<string, unknown>) || {};
    for (const f of fields) delete hash[f];
    this.store.set(key, hash);
    return fields.length;
  }

  async hincrby(key: string, field: string, increment: number) {
    const hash = (this.store.get(key) as Record<string, unknown>) || {};
    hash[field] = (Number(hash[field]) || 0) + increment;
    this.store.set(key, hash);
    return hash[field] as number;
  }

  async set(key: string, value: unknown) {
    this.store.set(key, value);
    return "OK";
  }

  async get(key: string) {
    return this.store.get(key) ?? null;
  }

  async incr(key: string) {
    const val = (Number(this.store.get(key)) || 0) + 1;
    this.store.set(key, val);
    return val;
  }

  async del(...keys: string[]) {
    for (const k of keys) this.store.delete(k);
    return keys.length;
  }

  async sadd(key: string, ...members: string[]) {
    const set = (this.store.get(key) as Set<string>) || new Set<string>();
    for (const m of members) set.add(m);
    this.store.set(key, set);
    return members.length;
  }

  async srem(key: string, ...members: string[]) {
    const set = (this.store.get(key) as Set<string>) || new Set<string>();
    for (const m of members) set.delete(m);
    this.store.set(key, set);
    return members.length;
  }

  async smembers(key: string) {
    const set = (this.store.get(key) as Set<string>) || new Set<string>();
    return Array.from(set);
  }

  async zadd(key: string, ...items: { score: number; member: string }[]) {
    let arr = (this.store.get(key) as { score: number; member: string }[]) || [];
    for (const item of items) {
      arr = arr.filter((a) => a.member !== item.member);
      arr.push(item);
    }
    arr.sort((a, b) => a.score - b.score);
    this.store.set(key, arr);
    return items.length;
  }

  async zrange(key: string, start: number, stop: number) {
    const arr = (this.store.get(key) as { score: number; member: string }[]) || [];
    const end = stop === -1 ? arr.length : stop + 1;
    return arr.slice(start, end).map((a) => a.member);
  }

  async zrem(key: string, ...members: string[]) {
    let arr = (this.store.get(key) as { score: number; member: string }[]) || [];
    arr = arr.filter((a) => !members.includes(a.member));
    this.store.set(key, arr);
    return members.length;
  }

  pipeline() {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const commands: { method: string; args: any[] }[] = [];
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const self = this;

    const pipelineProxy = new Proxy(
      {},
      {
        get(_, prop: string) {
          if (prop === "exec") {
            return async () => {
              const results = [];
              for (const cmd of commands) {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const fn = (self as any)[cmd.method];
                if (fn) {
                  results.push(await fn.apply(self, cmd.args));
                } else {
                  results.push(null);
                }
              }
              return results;
            };
          }
          return (...args: unknown[]) => {
            commands.push({ method: prop, args });
            return pipelineProxy;
          };
        },
      }
    );

    return pipelineProxy;
  }
}

const redisUrl = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL;
const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;

const isLocalDev = !redisUrl || redisUrl === "your_upstash_redis_url_here";

// Singleton for in-memory store (persists across hot reloads in dev)
const globalForDev = globalThis as unknown as { __memoryRedis?: InMemoryRedis };

let _redis: Redis | InMemoryRedis | null = null;

export function getRedis(): Redis | InMemoryRedis {
  if (!_redis) {
    if (isLocalDev) {
      if (!globalForDev.__memoryRedis) {
        globalForDev.__memoryRedis = new InMemoryRedis();
        console.log("[Redirect A/B] Usando armazenamento em memória (modo local)");
      }
      _redis = globalForDev.__memoryRedis;
    } else {
      _redis = new Redis({
        url: redisUrl!,
        token: redisToken!,
      });
    }
  }
  return _redis;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const redis: any = new Proxy(
  {},
  {
    get(_, prop) {
      const instance = getRedis();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const val = (instance as any)[prop];
      if (typeof val === "function") {
        return val.bind(instance);
      }
      return val;
    },
  }
);

export function campaignKey(slug: string) {
  return `campaign:${slug}`;
}

export function destinationsKey(slug: string) {
  return `campaign:${slug}:destinations`;
}

export function clicksKey(slug: string) {
  return `campaign:${slug}:clicks`;
}

export function counterKey(slug: string) {
  return `campaign:${slug}:counter`;
}

export const CAMPAIGNS_INDEX = "campaigns:index";
