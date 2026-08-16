import axios from 'axios';

// Único punto de entrada HTTP hacia la API de Bungie (y su manifest público).
// Antes, cada componente que necesitaba el manifest hacía su propio axios.get
// suelto (playersBasicData.jsx, ClanTeamates.jsx, FavouriteActivity.jsx),
// sin pasar por la capa de servicios. La API key se inyecta desde afuera
// (BungieAPIcalls.js sigue siendo su único dueño) para no duplicarla.
export class BungieApiClient {
    constructor(apiKey) {
        this.apiKey = apiKey;
    }

    // Llamadas autenticadas a Platform/* (requieren X-API-Key)
    async get(url, config = {}) {
        const response = await axios.get(url, {
            headers: { 'X-API-Key': this.apiKey },
            ...config,
        });
        return response.data;
    }

    // Descargas públicas del manifest (jsonWorldComponentContentPaths), sin header de auth,
    // igual que los axios.get sueltos que reemplaza.
    async getPublic(url) {
        const response = await axios.get(url);
        return response.data;
    }

    static isCancelError(error) {
        return error?.name === 'AbortError' || error?.name === 'CanceledError' || error?.code === 'ERR_CANCELED';
    }

    // Un error de axios trae el status HTTP en error.response.status (no en
    // error.status). Solo 500/503 se consideran "servidor caído" — el resto
    // (404, 401, timeouts puntuales, etc.) son fallos normales de un request
    // individual y no ameritan avisarle al usuario que Bungie está caído.
    static isServiceDownError(error) {
        const status = error?.response?.status;
        return status === 500 || status === 503;
    }
}
