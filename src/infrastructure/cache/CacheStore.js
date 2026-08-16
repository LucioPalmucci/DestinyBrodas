const CACHE_PREFIX = 'cmp_cache_';

// Antes vivía como funciones sueltas en Components/Cache/componentsCache.js
// (que ahora es un wrapper fino sobre esta clase, para no romper los ~9
// componentes que ya importan loadCache/saveCache desde ahí).
export class CacheStore {
    constructor(prefix = CACHE_PREFIX) {
        this.prefix = prefix;
    }

    load(key, ttl) {
        try {
            const fullKey = this.prefix + key;
            const raw = localStorage.getItem(fullKey);
            if (!raw) {
                console.log('[CACHE][UTIL] miss', fullKey);
                return null;
            }

            const { ts, data } = JSON.parse(raw);
            // The ttl might be null because we may want stale cache on failures
            if (ttl != null && Date.now() - ts > ttl) {
                console.log('[CACHE][UTIL] expired', fullKey);
                return null;
            }

            console.log('[CACHE][UTIL] hit', fullKey);
            return data;
        } catch (e) {
            console.error('[CACHE][UTIL] load failed', e);
            return null;
        }
    }

    save(key, data) {
        try {
            localStorage.setItem(
                this.prefix + key,
                JSON.stringify({ ts: Date.now(), data })
            );
            const payload = JSON.stringify({ ts: Date.now(), data });
            console.log('CACHE SIZE:', (payload.length / 1024).toFixed(2), 'KB', key);
        } catch (e) {
            console.error('[CACHE][UTIL] save failed', e);
            throw e;
        }
    }
}
