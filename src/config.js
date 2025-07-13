export const API_CONFIG = {
    BUNGIE_API: import.meta.env.PROD ? 'https://www.bungie.net' : '/api',
    BUNGIE_STATS: import.meta.env.PROD ? 'https://stats.bungie.net' : '/reporte'
};