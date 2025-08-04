// Simple in-memory cache to reduce database reads
class MemoryCache {
  private cache: Map<string, { data: any; expires: number }> = new Map()
  private readonly DEFAULT_TTL = 5 * 60 * 1000 // 5 minutes

  set(key: string, data: any, ttl: number = this.DEFAULT_TTL) {
    this.cache.set(key, {
      data,
      expires: Date.now() + ttl
    })
  }

  get(key: string): any | null {
    const item = this.cache.get(key)
    
    if (!item) {
      return null
    }
    
    if (Date.now() > item.expires) {
      this.cache.delete(key)
      return null
    }
    
    return item.data
  }

  delete(key: string) {
    this.cache.delete(key)
  }

  clear() {
    this.cache.clear()
  }

  // Clear expired items
  cleanup() {
    const now = Date.now()
    for (const [key, item] of this.cache.entries()) {
      if (now > item.expires) {
        this.cache.delete(key)
      }
    }
  }
}

export const cache = new MemoryCache()

// Cache keys
export const CACHE_KEYS = {
  RESOURCES: 'resources:all',
  RESOURCE: (id: string) => `resource:${id}`,
  RESOURCE_HISTORY: (id: string, days: number) => `resource_history:${id}:${days}d`,
  USER_PERMISSIONS: (userId: string) => `user:${userId}:permissions`,
}

// Auto-cleanup every 10 minutes
setInterval(() => {
  cache.cleanup()
}, 10 * 60 * 1000) 