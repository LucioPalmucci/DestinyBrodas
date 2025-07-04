import axios from 'axios';
import { useCallback, useRef, useState } from 'react';

// Cache global para compartir entre todos los componentes
const globalCache = new Map();
const globalLoading = new Set();

// TTL por tipo de dato (en millisegundos)
const TTL_CONFIG = 2 * 60 * 1000; // 2 minutos
    /*compChars: 5 * 60 * 1000,        // 5 minutos
    clanMembers: 10 * 60 * 1000,    // 10 minutos
    activities: 2 * 60 * 1000,      // 2 minutos
    commendations: 15 * 60 * 1000,  // 15 minutos
    emblem: 60 * 60 * 1000,         // 1 hora
    guardianRank: 30 * 60 * 1000,   // 30 minutos
    manifest: 60 * 60 * 1000,       // 1 hora
    carnageReport: 30 * 60 * 1000,  // 30 minutos
    activityDefinition: 60 * 60 * 1000, // 1 hora
    default: 5 * 60 * 1000          // Default 5 minutos*/

const API_KEY = 'f83a251bf2274914ab739f4781b5e710';

export const useBungieAPI = () => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [cacheStats, setCacheStats] = useState({ size: 0, loading: 0 });
    
    // Para cancelar requests si el componente se desmonta
    const abortControllerRef = useRef(new AbortController());

    // Generar clave de cache
    const generateCacheKey = useCallback((type, ...params) => {
        return `${type}:${params.join(':')}`;
    }, []);

    // Verificar si el cache es válido
    const isCacheValid = useCallback((cacheKey, type) => {
        const cached = globalCache.get(cacheKey);
        if (!cached) return false;
        
        const now = Date.now();
        const ttl = TTL_CONFIG;
        
        return (now - cached.timestamp) < ttl;
    }, []);

    // Función genérica para hacer requests con cache
    const apiRequest = useCallback(async (type, url, params = [], customConfig = {}) => {
        const cacheKey = generateCacheKey(type, url, ...params);
        
        // Verificar cache
        if (isCacheValid(cacheKey, type)) {
            return globalCache.get(cacheKey).data;
        }

        // Verificar si ya se está cargando
        if (globalLoading.has(cacheKey)) {
            return new Promise((resolve, reject) => {
                const checkLoading = () => {
                    if (!globalLoading.has(cacheKey)) {
                        if (isCacheValid(cacheKey, type)) {
                            resolve(globalCache.get(cacheKey).data);
                        } else {
                            reject(new Error('Request failed'));
                        }
                    } else {
                        setTimeout(checkLoading, 100);
                    }
                };
                checkLoading();
            });
        }

        // Marcar como cargando
        globalLoading.add(cacheKey);
        setLoading(true);

        try {
            const config = {
                headers: {
                    'X-API-Key': API_KEY,
                },
                signal: abortControllerRef.current.signal,
                ...customConfig
            };

            const response = await axios.get(url, config);
            const data = response.data;

            // Guardar en cache
            globalCache.set(cacheKey, {
                data,
                timestamp: Date.now()
            });

            // Actualizar stats
            setCacheStats({
                size: globalCache.size,
                loading: globalLoading.size
            });

            return data;
        } catch (error) {
            if (error.name === 'AbortError') {
                console.log('Request cancelled');
                return null;
            }
            console.error(`Error fetching ${type}:`, error);
            setError(error);
            throw error;
        } finally {
            globalLoading.delete(cacheKey);
            setLoading(false);
        }
    }, [generateCacheKey, isCacheValid]);

    // ========== MÉTODOS ESPECÍFICOS PARA DESTINY API ==========

    // Obtener datos del usuario
    const getCompChars = useCallback(async (membershipType, userId) => {
        const url = `/api/Platform/Destiny2/${membershipType}/Profile/${userId}/?components=Characters&lc=es`;
        const response = await apiRequest('compChars', url, [membershipType, userId]);
        return response?.data?.Response?.characters?.data;
    }, [apiRequest]);

    // Obtener actividades de un personaje
    const getCompCharsActs = useCallback(async (membershipType, userId, charId) => {
        const url = `/api/Platform/Destiny2/${membershipType}/Profile/${userId}/Character/${charId}/?components=CharacterActivities`;
        const response = await apiRequest('CompCharsActs', url, [membershipType, userId, charId]);
        return response?.Response?.activities?.data;
    }, [apiRequest]);

    // Obtener datos de fireteam/party
    const getParty = useCallback(async (membershipType, userId) => {
        const url = `/api/Platform/Destiny2/${membershipType}/Profile/${userId}/?components=1000`;
        const response = await apiRequest('party', url, [membershipType, userId]);
        return response?.Response?.profileTransitoryData?.data;
    }, [apiRequest]);

    // Obtener personajes y su equipamiento
    const getCharsAndEquipment = useCallback(async (membershipType, userId) => {
        const url = `/api/Platform/Destiny2/${membershipType}/Profile/${userId}/?components=Characters,CharacterEquipment&lc=es`;
        const response = await apiRequest('charsAndEquipment', url, [membershipType, userId]);
        return response?.Response;
    }, [apiRequest]);

    // Obtener miembros del clan
    const getClanMembers = useCallback(async (groupId = '3942032') => {
        const url = `/api/Platform/GroupV2/${groupId}/Members/`;
        const response = await apiRequest('clanMembers', url, [groupId]);
        return response?.Response?.results;
    }, [apiRequest]);

    // Obtener perfil de un usuario con componentes específicos
    const getCompsProfile = useCallback(async (membershipType, userId) => {
        const url = `/api/Platform/Destiny2/${membershipType}/Profile/${userId}/?components=100,104`;
        const response = await apiRequest('charsIDs', url, [membershipType, userId]);
        return response?.Response;
    }, [apiRequest]);

    // Obtener membresías de usuario por ID y plataforma
    const getUserMembershipsById = useCallback(async (membershipId, platform) => {
        const url = `/api/Platform/User/GetMembershipsById/${membershipId}/${platform}/`;
        const response = await apiRequest('userMembershipsById', url, [membershipId, platform]);
        return response?.Response;
    }, [apiRequest]);

    // Obtener actividades de un personaje
    const getCharacterActivities = useCallback(async (membershipType, userId, characterId) => {
        const url = `/api/Platform/Destiny2/${membershipType}/Account/${userId}/Character/${characterId}/Stats/Activities/?lc=es`;
        const response = await apiRequest('activities', url, [membershipType, userId, characterId]);
        return response?.Response?.activities || [];
    }, [apiRequest]);

    // Obtener commendaciones/honor
    const getCommendations = useCallback(async (membershipType, userId) => {
        const url = `/api/Platform/Destiny2/${membershipType}/Profile/${userId}/?components=1400`;
        const response = await apiRequest('commendations', url, [membershipType, userId]);
        const dataHonor = response?.Response?.profileCommendations?.data;
        
        if (!dataHonor) return null;

        return {
            totalScore: dataHonor.totalScore.toLocaleString('en-US'),
            recibidas: dataHonor.scoreDetailValues[1],
            enviadas: dataHonor.scoreDetailValues[0],
            verdes: dataHonor.commendationNodePercentagesByHash[154475713],
            rosas: dataHonor.commendationNodePercentagesByHash[1341823550],
            azules: dataHonor.commendationNodePercentagesByHash[1390663518],
            naranjas: dataHonor.commendationNodePercentagesByHash[4180748446],
            verdesPuntos: dataHonor.commendationNodeScoresByHash[154475713],
            rosasPuntos: dataHonor.commendationNodeScoresByHash[1341823550],
            azulesPuntos: dataHonor.commendationNodeScoresByHash[1390663518],
            naranjasPuntos: dataHonor.commendationNodeScoresByHash[4180748446],
        };
    }, [apiRequest]);

    // Obtener emblema
    const getEmblem = useCallback(async (emblemHash) => {
        const url = `/api/Platform/Destiny2/Manifest/DestinyInventoryItemDefinition/${emblemHash}/?lc=es`;
        const response = await apiRequest('emblem', url, [emblemHash]);
        return response?.Response?.secondaryIcon;
    }, [apiRequest]);

    // Obtener rango de guardián
    const getGuardianRank = useCallback(async (membershipType, userId) => {
        const url = `/api/Platform/Destiny2/${membershipType}/Profile/${userId}/?components=100`;
        const response = await apiRequest('guardianRank', url, [membershipType, userId]);
        const rankNum = response?.Response?.profile?.data?.currentGuardianRank;
        
        if (!rankNum) return null;
        
        const rankUrl = `/api/Platform/Destiny2/Manifest/DestinyGuardianRankDefinition/${rankNum}/?lc=es`;
        const rankResponse = await apiRequest('guardianRank', rankUrl, [rankNum]);
        
        return {
            title: rankResponse?.Response?.displayProperties?.name,
            num: rankNum,
        };
    }, [apiRequest]);

    // Obtener reporte de carnage
    const getCarnageReport = useCallback(async (instanceId) => {
        const url = `/reporte/Platform/Destiny2/Stats/PostGameCarnageReport/${instanceId}/?lc=es`;
        const response = await apiRequest('carnageReport', url, [instanceId]);
        return response?.Response;
    }, [apiRequest]);

    // Obtener definición de un item en el manifest
    const getItemManifest = useCallback(async (activityHash, type) => {
        const url = `/api/Platform/Destiny2/Manifest/${type}/${activityHash}/?lc=es`;
        const response = await apiRequest('activityDefinition', url, [activityHash, type]);
        return response?.Response;
    }, [apiRequest]);

    // Obtener manifest
    const getManifest = useCallback(async () => {
        const url = '/api/Platform/Destiny2/Manifest/';
        const response = await apiRequest('manifest', url);
        return response?.Response;
    }, [apiRequest]);

    // Obtener datos de manifest específicos
    const getManifestData = useCallback(async (manifestUrl) => {
        const url = `/api${manifestUrl}`;
        const response = await apiRequest('manifest', url, [manifestUrl]);
        return response;
    }, [apiRequest]);

    // ========== UTILIDADES ==========

    // Limpiar cache
    const clearCache = useCallback((type = null) => {
        if (type) {
            // Limpiar solo un tipo específico
            for (const [key] of globalCache) {
                if (key.startsWith(`${type}:`)) {
                    globalCache.delete(key);
                }
            }
        } else {
            // Limpiar todo el cache
            globalCache.clear();
        }
        setCacheStats({
            size: globalCache.size,
            loading: globalLoading.size
        });
    }, []);

    // Obtener estadísticas del cache
    const getCacheStatsDetailed = useCallback(() => {
        const stats = {};
        for (const [key] of globalCache) {
            const type = key.split(':')[0];
            stats[type] = (stats[type] || 0) + 1;
        }
        return {
            totalEntries: globalCache.size,
            byType: stats,
            currentlyLoading: globalLoading.size
        };
    }, []);

    // Limpiar al desmontar componente
    const cleanup = useCallback(() => {
        abortControllerRef.current.abort();
        abortControllerRef.current = new AbortController();
    }, []);

    return {
        // Estados
        loading,
        error,
        cacheStats,
        
        // Métodos de API
        getCompChars,
        getCompCharsActs,
        getCompsProfile,
        getParty,
        getUserMembershipsById,
        getCharsAndEquipment,
        getClanMembers,
        getCharacterActivities,
        getCommendations,
        getEmblem,
        getGuardianRank,
        getCarnageReport,
        getItemManifest,
        getManifest,
        getManifestData,
        
        // Método genérico
        apiRequest,
        
        // Utilidades
        clearCache,
        getCacheStatsDetailed,
        cleanup,
        
        // Estados del cache
        isCached: (type, ...params) => {
            const cacheKey = generateCacheKey(type, ...params);
            return isCacheValid(cacheKey, type);
        },
        isLoading: (type, ...params) => {
            const cacheKey = generateCacheKey(type, ...params);
            return globalLoading.has(cacheKey);
        }
    };
};

// Hook simplificado para casos básicos
export const useBungieAPISimple = () => {
    const api = useBungieAPI();
    
    return {
        loading: api.loading,
        error: api.error,
        getCompChars: api.getCompChars,
        getClanMembers: api.getClanMembers,
        getCommendations: api.getCommendations,
        clearCache: api.clearCache
    };
};

// Exportar también funciones standalone para casos específicos
export const BungieAPIUtils = {
    clearAllCache: () => {
        globalCache.clear();
        globalLoading.clear();
    },
    getCacheSize: () => globalCache.size,
    getLoadingCount: () => globalLoading.size
};