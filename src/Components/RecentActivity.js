//Obtener los IDs de los personajes
import axios from 'axios';

/*
export const fetchCharacterIds = async (member) => {
    try {
        const response = await axios.get(`/api/Platform/Destiny2/${member.destinyUserInfo.membershipType}/Profile/${member.destinyUserInfo.membershipId}/?components=Characters&lc=es`, {
            headers: {
                'X-API-Key': 'f83a251bf2274914ab739f4781b5e710',
            },
        });

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


        activities.forEach(async (activity) => {
            let nombre = await fetchActivityDetails(activity.activityDetails.directorActivityHash);
            console.log("Nombre " + nombre.displayProperties.name, "| Pariodo " + activity.period, "| Completado " + activity.values.completed.basic.value);
        });

        // Encontrar la actividad más reciente
        const mostRecentActivity = activities.reduce((latest, current) => {
            return new Date(current.period) > new Date(latest.period) ? current : latest;
        }, activities[0]);

        // Calcular el tiempo transcurrido desde la última actividad
        const lastPlayedDate = new Date(mostRecentActivity.period);
        const timeSinceLastPlayed = Math.floor((Date.now() - lastPlayedDate) / (1000 * 60)); // en minutos

        // Obtener el nombre de la actividad usando el directorActivityHash
        const activityDetails = await fetchActivityDetails(mostRecentActivity.activityDetails.directorActivityHash);
        console.log("ActivityDetails", activityDetails);

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
        const response = await axios.get(`/api/Platform/Destiny2/${member.destinyUserInfo.membershipType}/Account/${member.destinyUserInfo.membershipId}/Character/${characterId}/Stats/Activities/?components=204&lc=es`, {
            headers: {
                'X-API-Key': 'f83a251bf2274914ab739f4781b5e710',
            },
        });
        //console.log(response.data.Response.activities[0]);
        console.log(`Activities for character https://www.bungie.net/Platform/Destiny2/${member.destinyUserInfo.membershipType}/Account/${member.destinyUserInfo.membershipId}/Character/${characterId}/Stats/Activities/?lc=es`);
        return response.data.Response.activities[0];
    } catch (error) {
        console.error(`Error fetching activities for character ${characterId}, ${member.destinyUserInfo.membershipType}, ${member.destinyUserInfo.membershipId}:`, error);
        return null;
    }
};
*/
//Obtiene los detalles de las actividades

export const fetchCharacterIds = async (member) => {
    try {
        const response = await axios.get(`/api/Platform/Destiny2/${member.destinyUserInfo.membershipType}/Profile/${member.destinyUserInfo.membershipId}/?components=Characters&lc=es`, {
            headers: {
                'X-API-Key': 'f83a251bf2274914ab739f4781b5e710',
            },
        });

        const characterIds = response.data.Response.characters.data;
        const mostRecentCharacter = Object.values(characterIds).reduce((latest, current) => {
            return new Date(current.dateLastPlayed) > new Date(latest.dateLastPlayed) ? current : latest;
        });
        console.log("MostRecentCharachter:",  mostRecentCharacter.characterId );

        // Obtener la actividad actual para cada personaje
        const activities = await (async function fetchCurrentActivity(mostRecentCharacter) {
            try {
                const activityResponse = await axios.get(`/api/Platform/Destiny2/${member.destinyUserInfo.membershipType}/Profile/${member.destinyUserInfo.membershipId}/Character/${mostRecentCharacter.characterId}/?components=CharacterActivities`, {
                    headers: {
                        'X-API-Key': 'f83a251bf2274914ab739f4781b5e710',
                    },
                });

                const currentActivityHash = activityResponse.data.Response.activities.data.currentActivityHash;
                const currentActivityMode = activityResponse.data.Response.activities.data.currentActivityModeHash;
                console.log("CurrentActivityHash: ", activityResponse.data.Response.activities.data.currentActivityHash);
                const name = await fetchActivityDetails(currentActivityHash, "DestinyActivityDefinition");
                const type = await fetchActivityDetails(currentActivityMode, "DestinyActivityTypeDefinition");

                return {
                    name: name,
                    type: type,
                };

            }
            catch (error) {
                console.error(`Error fetching current activity for character ${mostRecentCharacter.characterId}:`, error);
                return null;
            }
        })(mostRecentCharacter);

        /*// La actividad mas reciente
        activities.forEach(activity => {
            if (activity.type != null) {
                console.log("Activity: ", activity);
                return {
                    name: activity.name,
                    type: activity.type,
                };
            }
        });*/
        if (activities.type == null && activities.name == "") return "En línea";
        else if (activities.type == null && activities.name != "") return activities.name;
        else if (activities.type != null && activities.name == "") return activities.type;
        else return activities.name + " - " + activities.type;

    } catch (error) {
        console.error('Error fetching character IDs:', error);
    }
};
const fetchActivityDetails = async (activityHash, type) => {
    try {
        const response = await axios.get(`/api/Platform/Destiny2/Manifest/${type}/${activityHash}/?lc=es`, {
            headers: {
                'X-API-Key': 'f83a251bf2274914ab739f4781b5e710',
            },
        });
        if(response.data.Response == null) return null;
        else return response.data.Response.displayProperties.name;

    } catch (error) {
        console.error(`Error fetching activity details for hash ${activityHash}:`, error);
        return null;
    }
};
