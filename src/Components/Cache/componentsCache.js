import { CacheStore } from '../../infrastructure/cache/CacheStore';

const store = new CacheStore();

export const loadCache = (key, ttl) => store.load(key, ttl);
export const saveCache = (key, data) => store.save(key, data);
