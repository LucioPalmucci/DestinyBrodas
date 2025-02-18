import axios from "axios";
import { useEffect, useState } from "react";
import { fetchActivityDetails } from "../RecentActivity";

export default function CurrentActivity({ type, id }) {
    const [activity, setActivity] = useState(null);
    const [partyMembers, setPartyMembers] = useState([]);

    useEffect(() => {
        const fetchActivity = async () => {
            try {
                const response = await axios.get(`/api/Platform/Destiny2/${type}/Profile/${id}/?components=Characters&lc=es`, {
                    headers: {
                        'X-API-Key': 'f83a251bf2274914ab739f4781b5e710',
                    },
                });

                const characterIds = response.data.Response.characters.data;
                const mostRecentCharacter = Object.values(characterIds).reduce((latest, current) => {
                    return new Date(current.dateLastPlayed) > new Date(latest.dateLastPlayed) ? current : latest;
                });

                const activityResponse = await axios.get(`/api/Platform/Destiny2/${type}/Profile/${id}/Character/${mostRecentCharacter.characterId}/?components=CharacterActivities`, {
                    headers: {
                        'X-API-Key': 'f83a251bf2274914ab739f4781b5e710',
                    },
                });

                const partyResponse = await axios.get(`/api/Platform/Destiny2/${type}/Profile/${id}/?components=1000`, {
                    headers: {
                        'X-API-Key': 'f83a251bf2274914ab739f4781b5e710',
                    },
                });

                console.log("PartyResponse: ", partyResponse.data.Response);
                const currentActivityHash = activityResponse.data.Response.activities.data.currentActivityHash;
                const currentActivityMode = activityResponse.data.Response.activities.data.currentActivityModeHash;
                const fecha = partyResponse.data.Response.profileTransitoryData.data.currentActivity.startTime;
                const oponentes = partyResponse.data.Response.profileTransitoryData.data.currentActivity.numberOfOpponents;
                const aliados = partyResponse.data.Response.profileTransitoryData.data.currentActivity.numberOfPlayers;
                const puntosAliados = partyResponse.data.Response.profileTransitoryData.data.currentActivity.score;
                const puntosOponentes = partyResponse.data.Response.profileTransitoryData.data.currentActivity.highestOpposingFactionScore;
                const slots = partyResponse.data.Response.profileTransitoryData.data.joinability.openSlots;
                const name = await fetchActivityDetails(currentActivityHash, "DestinyActivityDefinition");
                const tipo = await fetchActivityDetails(currentActivityMode, "DestinyActivityTypeDefinition");
                const now = new Date();
                const activityDate = new Date(fecha);
                const minutesAgo = Math.floor((now - activityDate) / 60000);

                setActivity({
                    date: minutesAgo,
                    name: name,
                    type: tipo,
                    oponentes: oponentes,
                    aliados: aliados,
                    puntosAliados: puntosAliados,
                    puntosOponentes: puntosOponentes,
                    slots: slots,
                });

                const partyMembersData = partyResponse.data.Response.profileTransitoryData.data.partyMembers;
                const partyMembersDetails = await fetchPartyMembersDetails(partyMembersData);
                setPartyMembers(partyMembersDetails);

            } catch (error) {
                console.error(`Error fetching current activity:`, error);
            }
        };

        fetchActivity();
    }, []);

    return (
        <div className="container w-fit font-Inter mt-10 ">
            {activity ? (
                <div className="bg-gray-800 text-white p-6 rounded-lg shadow-lg space-x-6 content-fit">
                    {activity.name ? (
                        <div>
                            <p className="mb-2 font-semibold text-3xl"> {activity.name}</p>
                            {activity.type ? <p className="mb-2"><span className="font-semibold">Dificultad:</span> {activity.type}</p> : null}
                            <p className="mb-2 font-semibold">Desde hace {activity.date} minutos</p>
                            {activity.aliados ? <p className="mb-2"><span className="font-semibold">Miembros:</span> {activity.aliados}</p> : null}
                            {activity.oponentes ? <p className="mb-2"><span className="font-semibold">Oponentes:</span> {activity.oponentes}</p> : null}
                            {activity.puntosAliados ? <p className="mb-2"><span className="font-semibold">Puntos Aliados:</span> {activity.puntosAliados}</p> : null}
                            {activity.puntosOponentes ? <p className="mb-2"><span className="font-semibold">Puntos Oponentes:</span> {activity.puntosOponentes}</p> : null}
                            <p className="mb-4"><span className="font-semibold">Slots Disponibles:</span> {activity.slots}</p>
                        </div>
                    ) : (
                        <p className="text-center">En órbita</p>
                    )}
                    <div className="">
                        <h4 className="text-xl font-bold mb-4">Escuadra:</h4>
                        <ul className="space-x-6 flex">
                            {partyMembers.map(member => (
                                <li key={member.id} className="flex items-center space-x-1">
                                    <img src={`/api${member.emblemPath}`} width={40} height={40} alt="Emblem" />
                                    <span title={member.uniqueName}>{member.displayName}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            ) : (
                <p className="text-center text-gray-500">No está jugando ahora</p>
            )}
        </div>
    );
}
const fetchPartyMembersDetails = async (partyMembersData) => {
    return await Promise.all(partyMembersData.map(async member => {
        const plataformas = [3, 1, 2, 10];
        let profileResponse;
        let successfulPlatform = null;
        for (const plataforma of plataformas) {
            try {
                profileResponse = await axios.get(`/api/Platform/Destiny2/${plataforma}/Profile/${member.membershipId}/?components=100`, {
                    headers: {
                        'X-API-Key': 'f83a251bf2274914ab739f4781b5e710',
                    },
                });
                successfulPlatform = plataforma;
                break;
            } catch (error) {
                console.error(`Error fetching profile for platform ${plataforma}:`, error);
            }
        }

        if (!profileResponse) {
            throw new Error(`No se pudo obtener el perfil para el miembro con ID ${member.membershipId}`);
        }

        console.log(profileResponse.data.Response);
        const displayName = profileResponse.data.Response.profile.data.userInfo.displayName;
        const uniqueName = profileResponse.data.Response.profile.data.userInfo.uniqueName;
        const emblemPath = await getPartyEmblem(member.membershipId, successfulPlatform);
        console.log(`Data of member ${member.membershipId} on platform ${successfulPlatform}:`, displayName);

        return {
            id: member.membershipId,
            emblemPath: emblemPath,
            displayName: displayName,
            uniqueName: uniqueName,
            platform: successfulPlatform, // Agregar la plataforma exitosa al objeto de miembro
        };
    }));
};
const getPartyEmblem = async (id, type) => {
    try {
        // Hacer una sola llamada a la API para obtener el perfil completo del miembro
        const response = await axios.get(`/api/Platform/Destiny2/${type}/Profile/${id}/?components=Characters&lc=es`, {
            headers: {
                'X-API-Key': 'f83a251bf2274914ab739f4781b5e710',
            },
        });

        const characters = response.data.Response.characters.data;

        const mostRecentCharacter = Object.values(characters).reduce((latest, current) => {
            return new Date(current.dateLastPlayed) > new Date(latest.dateLastPlayed) ? current : latest;
        });

        return mostRecentCharacter.emblemPath;

    } catch (error) {
        console.error('Error fetching equipped emblem:', error);
        return null;
    }
};