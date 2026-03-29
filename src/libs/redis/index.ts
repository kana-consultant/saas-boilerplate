import Redis from "ioredis"

const REDIS_URL = process.env.REDIS_URL ?? "redis://127.0.0.1:6379"

// Singleton — reuse across requests in the same process
let _redis: Redis | null = null

export function getRedis(): Redis {
	if (!_redis) {
		_redis = new Redis(REDIS_URL, {
			maxRetriesPerRequest: 2,
			enableOfflineQueue: false,
			lazyConnect: true,
		})
		_redis.on("error", (err) => {
			// Don't crash the server if Redis is unavailable
			console.warn("[redis] error:", err.message)
		})
	}
	return _redis
}

export async function cacheGet<T>(key: string): Promise<T | null> {
	try {
		const val = await getRedis().get(key)
		return val ? (JSON.parse(val) as T) : null
	} catch {
		return null
	}
}

export async function cacheSet(key: string, value: unknown, ttlSeconds: number): Promise<void> {
	try {
		await getRedis().set(key, JSON.stringify(value), "EX", ttlSeconds)
	} catch {
		// Redis unavailable — silently skip, fall through to DB
	}
}

export async function cacheDel(...keys: string[]): Promise<void> {
	try {
		if (keys.length) await getRedis().del(...keys)
	} catch {}
}

export async function cacheDelPattern(pattern: string): Promise<void> {
	try {
		const redis = getRedis()
		let cursor = "0"
		do {
			const [next, keys] = await redis.scan(cursor, "MATCH", pattern, "COUNT", 100)
			cursor = next
			if (keys.length) await redis.del(...keys)
		} while (cursor !== "0")
	} catch {}
}
