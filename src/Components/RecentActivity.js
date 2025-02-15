import axios from 'axios';

export const fetchCharacterIds = async (member, info, num) => {
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

        if (info == "activity") return fetchCurrentActivity(member, mostRecentCharacter, num);
        else if (info == "total") {
            return response.data.Response.characters.data[mostRecentCharacter.characterId].light;
        }
        else return null;

    } catch (error) {
        console.error('Error fetching character IDs:', error);
    }
};

export const fetchCurrentActivity = async (member, mostRecentCharacter, num) => {
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
            //console.log("CurrentActivityHash: ", activityResponse.data.Response.activities.data.currentActivityHash);
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

    const onlineText = num === 'MemberDetail' ? 'En línea -' : 'En línea:';

    if (activities.type == null && activities.name == "") return onlineText;
    else if (activities.type == null && activities.name != "") return onlineText + "\n" + activities.name;
    else if (activities.type != null && activities.name == "") return onlineText + "\n" + activities.type;
    else return onlineText + "\n" + activities.name + " - " + activities.type;
}

const fetchActivityDetails = async (activityHash, type) => {
    try {
        const response = await axios.get(`/api/Platform/Destiny2/Manifest/${type}/${activityHash}/?lc=es`, {
            headers: {
                'X-API-Key': 'f83a251bf2274914ab739f4781b5e710',
            },
        });
        if (response.data.Response == null) return null;
        else return response.data.Response.displayProperties.name;

    } catch (error) {
        console.error(`Error fetching activity details for hash ${activityHash}:`, error);
        return null;
    }
};
