import axios from "axios";

export const getEquippedEmblem = async (membershipId, membershipType, type) => {
    try {
        // Hacer una sola llamada a la API para obtener el perfil completo del miembro
        const response = await axios.get(`/api/Platform/Destiny2/${membershipType}/Profile/${membershipId}/?components=Characters&lc=es`, {
            headers: {
                'X-API-Key': 'f83a251bf2274914ab739f4781b5e710',
            },
        });

        const characters = response.data.Response.characters.data;

        const mostRecentCharacter = Object.values(characters).reduce((latest, current) => {
            return new Date(current.dateLastPlayed) > new Date(latest.dateLastPlayed) ? current : latest;
        });

        if (type === "Large") return mostRecentCharacter.emblemBackgroundPath;
        else if(type === "CharacterPower") return mostRecentCharacter.light;
        else if(type === "CharacterClass") return mostRecentCharacter.classType;
        else return mostRecentCharacter.emblemPath;

    } catch (error) {
        console.error('Error fetching equipped emblem:', error);
        return null;
    }
};