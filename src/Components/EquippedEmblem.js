import axios from "axios";
import { fetchActivities } from "./RecentActivity";
export const getEquippedEmblem = async (member) => {
    try {
        // Obtener los personajes del miembro
        const response = await axios.get(`/api/Platform/Destiny2/${member.destinyUserInfo.membershipType}/Profile/${member.destinyUserInfo.membershipId}/?components=Characters&lc=es`, {
            headers: {
                'X-API-Key': 'f83a251bf2274914ab739f4781b5e710',
            },
        });

        const charactersIds = Object.keys(response.data.Response.characters.data);

        const activities = await Promise.all(charactersIds.map(async id => {
            const activity = await fetchActivities(id, member);
            return { characterId: id, ...activity };
        }));
        
        const mostRecentActivity = activities.reduce((latest, current) => {
            return new Date(current.period) > new Date(latest.period) ? current : latest;
        }, activities[0]);

        console.log('Most Recent Activity:', mostRecentActivity);
        console.log('Character ID of Most Recent Activity:', mostRecentActivity.characterId);

        const emblema = await axios.get(`/api/Platform/Destiny2/${member.destinyUserInfo.membershipType}/Profile/${member.destinyUserInfo.membershipId}/Character/${mostRecentActivity.characterId}/?components=200`, {
            headers: {
                'X-API-Key': 'f83a251bf2274914ab739f4781b5e710',
            },
        });
        console.log('Emblema:', emblema.data.Response.character.data.emblemPath);
        return emblema.data.Response.character.data.emblemPath;
    } catch (error) {
        console.error('Error al obtener el emblema:', error);
        throw error;
    }
};

