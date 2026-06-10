type CacheEntry<T> = {
  expiresAt: number;
  value: T;
};

const cache = new Map<string, CacheEntry<unknown>>();

export function getCachedResponse<T>(key: string) {
  const entry = cache.get(key) as CacheEntry<T> | undefined;

  if (!entry) {
    return null;
  }

  if (entry.expiresAt <= Date.now()) {
    cache.delete(key);
    return null;
  }

  return entry.value;
}

export function setCachedResponse<T>(key: string, value: T, ttlMs: number) {
  cache.set(key, {
    expiresAt: Date.now() + ttlMs,
    value
  });
}

export function deleteCachedResponse(key: string) {
  cache.delete(key);
}

export function deleteCachedResponsesByPrefix(prefix: string) {
  for (const key of cache.keys()) {
    if (key.startsWith(prefix)) {
      cache.delete(key);
    }
  }
}

export function familyDashboardCacheKey(familyId: string) {
  return `family:${familyId}:dashboard`;
}

export function familyGrowthRecordsCacheKey(familyId: string) {
  return `family:${familyId}:growth-records`;
}

export function familyWeeklyPlanCacheKey(familyId: string) {
  return `family:${familyId}:weekly-plan`;
}

export function invalidateFamilyReadCaches(familyId: string) {
  deleteCachedResponsesByPrefix(`family:${familyId}:`);
}
