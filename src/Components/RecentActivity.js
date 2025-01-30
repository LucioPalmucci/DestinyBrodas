//Obtener los IDs de los personajes
import axios from 'axios';

export const fetchCharacterIds = async (member) => {
    try {
        const response = await axios.get(`/api/Platform/Destiny2/${member.destinyUserInfo.membershipType}/Profile/${member.destinyUserInfo.membershipId}/?components=Characters`, {
            headers: {
                'X-API-Key': 'f83a251bf2274914ab739f4781b5e710',
            },
        });

        const characterIds = Object.keys(response.data.Response.characters.data);
        console.log('Character IDs:', characterIds);

        // Obtener el historial de actividades para cada personaje
        const activities = await Promise.all(characterIds.map(id => fetchActivities(id, member)));

        // Encontrar la actividad más reciente
        const mostRecentActivity = activities.reduce((latest, current) => {
            return new Date(current.period) > new Date(latest.period) ? current : latest;
        }, activities[0]);

        console.log('Most Recent Activity:', mostRecentActivity);

        // Calcular el tiempo transcurrido desde la última actividad
        const lastPlayedDate = new Date(mostRecentActivity.period);
        const timeSinceLastPlayed = Math.floor((Date.now() - lastPlayedDate) / (1000 * 60 )); // en minutos

        // Obtener el nombre de la actividad usando el directorActivityHash
        const activityDetails = await fetchActivityDetails(mostRecentActivity.activityDetails.directorActivityHash);

        return {
            hash: mostRecentActivity.activityDetails.directorActivityHash,
            name: activityDetails.displayProperties.name,
            timeSinceLastPlayed,
        };

    } catch (error) {
        console.error('Error fetching character IDs or activities:', error);
    }
};

//Obtener las actividades de un personaje
const fetchActivities = async (characterId, member) => {
    try {
        const response = await axios.get(`/api/Platform/Destiny2/${member.destinyUserInfo.membershipType}/Account/${member.destinyUserInfo.membershipId}/Character/${characterId}/Stats/Activities/`, {
            headers: {
                'X-API-Key': 'f83a251bf2274914ab739f4781b5e710',
            },
        });
        return response.data.Response.activities[0];
    } catch (error) {
        console.error(`Error fetching activities for character ${characterId}:`, error);
        return null;
    }
};
const fetchActivityDetails = async (activityHash) => {
    try {
        const response = await axios.get(`/api/Platform/Destiny2/Manifest/DestinyActivityDefinition/${activityHash}/`, {
            headers: {
                'X-API-Key': 'f83a251bf2274914ab739f4781b5e710',
            },
        });
        return response.data.Response;
    } catch (error) {
        console.error(`Error fetching activity details for hash ${activityHash}:`, error);
        return null;
    }
};