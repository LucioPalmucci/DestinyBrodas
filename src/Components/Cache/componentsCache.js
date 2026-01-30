const CACHE_PREFIX = 'cmp_cache_';

export const loadCache = (key, ttl) => {
  try {
    const fullKey = CACHE_PREFIX + key;
    const raw = localStorage.getItem(fullKey);
    if (!raw) {
      console.log('[CACHE][UTIL] miss', fullKey);
      return null;
    }

    const { ts, data } = JSON.parse(raw);
    if (Date.now() - ts > ttl) {
      console.log('[CACHE][UTIL] expired', fullKey);
      localStorage.removeItem(fullKey);
      return null;
    }

    console.log('[CACHE][UTIL] hit', fullKey);
    return data;
  } catch (e) {
    console.error('[CACHE][UTIL] load failed', e);
    return null;
  }
};

export const saveCache = (key, data) => {
    try {
        localStorage.setItem(
            CACHE_PREFIX + key,
            JSON.stringify({ ts: Date.now(), data })
        );
        const payload = JSON.stringify({ ts: Date.now(), data });
        console.log('CACHE SIZE:', (payload.length / 1024).toFixed(2), 'KB');
    } catch (e) {
        console.error('[CACHE][UTIL] save failed', e);
        throw e;
    }
}
