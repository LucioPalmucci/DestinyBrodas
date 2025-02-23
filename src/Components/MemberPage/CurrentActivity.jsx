import axios from "axios";
import { useEffect, useState } from "react";
import circleSolid from "../../assets/circle-solid.svg";
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

                const currentActivityHash = activityResponse.data.Response.activities.data.currentActivityHash;
                const currentActivityMode = activityResponse.data.Response.activities.data.currentActivityModeHash;
                const currentActivityPlaylist = activityResponse.data.Response.activities.data.currentPlaylistActivityHash;
                const fecha = partyResponse.data.Response.profileTransitoryData.data.currentActivity.startTime;
                const oponentes = partyResponse.data.Response.profileTransitoryData.data.currentActivity.numberOfOpponents;
                const jugadores = partyResponse.data.Response.profileTransitoryData.data.currentActivity.numberOfPlayers;
                const puntosAliados = partyResponse.data.Response.profileTransitoryData.data.currentActivity.score;
                const puntosOponentes = partyResponse.data.Response.profileTransitoryData.data.currentActivity.highestOpposingFactionScore;
                const slots = partyResponse.data.Response.profileTransitoryData.data.joinability.openSlots;
                const name = await fetchActivityDetails(currentActivityHash, "DestinyActivityDefinition");
                const tipo = await fetchActivityDetails(currentActivityMode, "DestinyActivityTypeDefinition");
                const playlist = await fetchActivityDetails(currentActivityPlaylist, "DestinyActivityDefinition");
                const now = new Date();
                const activityDate = new Date(fecha);
                const minutesAgo = Math.floor((now - activityDate) / 60000);

                let aliados = jugadores - oponentes;
                if (oponentes > 6) aliados = 6;
                if (aliados > 6) aliados = 6;

                setActivity({
                    date: minutesAgo,
                    name: name,
                    type: tipo,
                    playlist: playlist,
                    oponentes: oponentes,
                    jugadores: aliados,
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
    }, [activity]);

    return (
        <div className="container w-fit font-Inter mt-10 ">
            {activity ? (
                <div className="bg-gray-800 text-white p-6 rounded-lg shadow-lg space-x-6 content-fit">
                    {activity.name ? (
                        <div>
                            <p className="flex items-center">
                                Parida en curso
                                <div className="relative ml-2">
                                    <img src={circleSolid} width={16} height={16} className="animate-ping" style={{ filter: 'invert(34%) sepia(100%) saturate(748%) hue-rotate(185deg) brightness(96%) contrast(101%)' }} />
                                    <img src={circleSolid} width={15} height={15} className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" style={{ filter: 'invert(34%) sepia(100%) saturate(748%) hue-rotate(185deg) brightness(96%) contrast(101%)' }} />
                                </div>
                            </p>
                            <div>
                            {activity.type && activity.type !== activity.name && <p className="text-4xl font-semibold mb-0">{activity.type}</p>}
                            {activity.playlist && activity.playlist !== activity.name && <p className="text-3xl font-semibold mb-0"> {activity.playlist}</p>}
                                <p className="mb-0 font-semibold text-xl"> {activity.name}</p>
                                <p className="mb-2 mt-2 font-semibold">Desde hace {activity.date} minutos</p>
                                <div className="flex justify-between">
                                    {activity.jugadores ? <p className="mb-2"><span className="font-semibold">Aliados:</span> {activity.jugadores}</p> : null}
                                    {activity.oponentes ? <p className="mb-2"><span className="font-semibold">Oponentes:</span> {activity.oponentes}</p> : null}
                                </div>
                                <div className="flex justify-between">
                                    {activity.puntosAliados ? <p className="mb-2"><span className="font-semibold">Puntos:</span> {activity.puntosAliados}</p> : null}
                                    {activity.puntosOponentes ? <p className="mb-2"><span className="font-semibold">Puntos:</span> {activity.puntosOponentes}</p> : null}
                                </div>
                            </div>
                        </div>
                    ) : (
                        <p className="text-center text-3xl font-semibold">En órbita</p>
                    )}
                    <div className="mt-4">
                        <h4 className="text-xl font-bold mb-1">Escuadra:</h4>
                        <ul className="space-x-6 flex">
                            {partyMembers.map(member => (
                                <li key={member.id} className="flex items-center space-x-1">
                                    <img src={`/api${member.emblemPath}`} width={40} height={40} alt="Emblem" />
                                    <div className="flex flex-col">
                                        <span title={member.uniqueName}>{member.displayName}</span>
                                        <span className="text-gray-400">{member.clase} <i className={`icon-prismatico`} style={{ fontStyle: "normal" }} /> - {member.light}</span>
                                    </div>
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

        // Obtener el uniqueName usando el endpoint adecuado
        const userResponse = await axios.get(`/api/Platform/User/GetMembershipsById/${member.membershipId}/${successfulPlatform}/`, {
            headers: {
                'X-API-Key': 'f83a251bf2274914ab739f4781b5e710',
            },
        });

        const displayName = profileResponse.data.Response.profile.data.userInfo.displayName;
        const uniqueName = userResponse.data.Response.bungieNetUser.uniqueName;
        const emblemPath = await getPartyEmblem(member.membershipId, successfulPlatform);
        //console.log(`Data of member ${member.membershipId} on platform ${successfulPlatform}:`, displayName);

        return {
            id: member.membershipId,
            emblemPath: emblemPath.emblemPath,
            clase: emblemPath.clase,
            light: emblemPath.light,
            subclass: emblemPath.subclass,
            displayName: displayName,
            uniqueName: uniqueName,
            platform: successfulPlatform, // Agregar la plataforma exitosa al objeto de miembro
        };
    }));
};
const getPartyEmblem = async (id, type) => {
    try {
        // Hacer una sola llamada a la API para obtener el perfil completo del miembro
        const response = await axios.get(`/api/Platform/Destiny2/${type}/Profile/${id}/?components=Characters,CharacterEquipment&lc=es`, {
            headers: {
                'X-API-Key': 'f83a251bf2274914ab739f4781b5e710',
            },
        });

        const characters = response.data.Response.characters.data;
        const equipment = response.data.Response.characterEquipment.data;

        const mostRecentCharacter = Object.values(characters).reduce((latest, current) => {
            return new Date(current.dateLastPlayed) > new Date(latest.dateLastPlayed) ? current : latest;
        });

        let clase;
        switch (mostRecentCharacter.classType) {
            case 1:
                clase = "Cazador";
                break;
            case 0:
                clase = "Titán";
                break;
            case 2:
                clase = "Hechicero";
                break;
            default:
                clase = "Desconocido";
        }

        const equippedSubclass = equipment[mostRecentCharacter.characterId].items.find(item => item.bucketHash === 3284755031);
        let subclass = equippedSubclass ? await fetchActivityDetails(equippedSubclass.itemHash, "DestinyInventoryItemDefinition", "sub") : "Desconocido";

        if (subclass.includes("arc")) {
            subclass = "arco";
        } else if (subclass.includes("void")) {
            subclass = "vacío";
        } else if (subclass.includes("solar")) {
            subclass = "solar";
        } else if (subclass.includes("stasis")) {
            subclass = "estasis";
        } else if (subclass.includes("strand")) {
            subclass = "cuerda";
        } else if (subclass.includes("prism")) {
            subclass = "prismatico";
        } else {
            subclass = "Desconocido";
        }

        return { clase: clase, emblemPath: mostRecentCharacter.emblemPath, light: mostRecentCharacter.light, subclass: subclass };

    } catch (error) {
        console.error('Error fetching equipped emblem:', error);
        return null;
    }
};