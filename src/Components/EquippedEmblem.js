import axios from "axios";

export const getEquippedEmblem = async (member) => {
    try {
        // Hacer una sola llamada a la API para obtener el perfil completo del miembro
        const response = await axios.get(`/api/Platform/Destiny2/${member.destinyUserInfo.membershipType}/Profile/${member.destinyUserInfo.membershipId}/?components=Characters&lc=es`, {
            headers: {
                'X-API-Key': 'f83a251bf2274914ab739f4781b5e710',
            },
        });

        const characters = response.data.Response.characters.data;

        // Encontrar el personaje con la actividad más reciente
        const mostRecentCharacter = Object.values(characters).reduce((latest, current) => {
            return new Date(current.dateLastPlayed) > new Date(latest.dateLastPlayed) ? current : latest;
        });

        //console.log("Most recent charachter id", mostRecentCharacter);
        // Obtener el emblema equipado del personaje más reciente
        const equippedEmblem = mostRecentCharacter.emblemPath;

        return equippedEmblem;
    } catch (error) {
        console.error('Error fetching equipped emblem:', error);
        return null;
    }
};