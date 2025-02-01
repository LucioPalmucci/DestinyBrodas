//Obtener los IDs de los personajes
import axios from 'axios';

export const fetchCharacterIds = async (member) => {
    try {
        const response = await axios.get(`/api/Platform/Destiny2/${member.destinyUserInfo.membershipType}/Profile/${member.destinyUserInfo.membershipId}/?components=Characters&lc=es`, {
            headers: {
                'X-API-Key': 'f83a251bf2274914ab739f4781b5e710',
            },
        });

        console.log("Aasass")
        const characterIds = Object.keys(response.data.Response.characters.data);

        // Obtener el historial de actividades para cada personaje
        const activities = await Promise.all(characterIds.map(async (id) => {
            try {
                return await fetchActivities(id, member);
            } catch (error) {
                console.error(`Error fetching activities for character ${id}:`, error);
                return null;
            }
        }));

        // Encontrar la actividad más reciente
        const mostRecentActivity = activities.reduce((latest, current) => {
            return new Date(current.period) > new Date(latest.period) ? current : latest;
        }, activities[0]);

        // Calcular el tiempo transcurrido desde la última actividad
        const lastPlayedDate = new Date(mostRecentActivity.period);
        const timeSinceLastPlayed = Math.floor((Date.now() - lastPlayedDate) / (1000 * 60)); // en minutos

        // Obtener el nombre de la actividad usando el directorActivityHash
        const activityDetails = await fetchActivityDetails(mostRecentActivity.activityDetails.directorActivityHash);

        return {
            characterId: mostRecentActivity.id,
            hash: mostRecentActivity.activityDetails.directorActivityHash,
            name: activityDetails.displayProperties.name,
            timeSinceLastPlayed,
        };

    } catch (error) {
        console.error('Error fetching character IDs or activities:', error);
    }
};

//Obtener las actividades de un personaje
export const fetchActivities = async (characterId, member) => {
    try {
        if(!member.destinyUserInfo.membershipId == "4611686018493156748"){
            const response = await axios.get(`/api/Platform/Destiny2/${member.destinyUserInfo.membershipType}/Account/${member.destinyUserInfo.membershipId}/Character/${characterId}/Stats/Activities/?lc=es`, {
                headers: {
                    'X-API-Key': 'f83a251bf2274914ab739f4781b5e710',
                },
            });
            return activities = response.data.Response?.activities[0];
        }
        else return null;
        //console.log(`Activities for character /api/Platform/Destiny2/${member.destinyUserInfo.membershipType}/Account/${member.destinyUserInfo.membershipId}/Character/${characterId}/Stats/Activities/`);
    } catch (error) {
        console.error(`Error fetching activities for character ${characterId}, ${member.destinyUserInfo.membershipType}, ${member.destinyUserInfo.membershipId}:`, error);
        return null;
    }
};

//Obtiene los detalles de las actividades
const fetchActivityDetails = async (activityHash) => {
    try {
        const response = await axios.get(`/api/Platform/Destiny2/Manifest/DestinyActivityDefinition/${activityHash}/?lc=es`, {
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
