import { useEffect, useState } from "react";
import circleSolid from "../../../assets/circle-solid.svg";
import orbit from "../../../assets/orbit.png";
import { useBungieAPI } from "../../APIservices/BungieAPIcache";

export default function CurrentActivity({ type, id }) {
    const [activity, setActivity] = useState(null);
    const [partyMembers, setPartyMembers] = useState([]);
    const [numColumns, setColums] = useState(0);
    const { getCompsProfile, getCompCharsActs, getParty, getItemManifest, getUserMembershipsById, getCharsAndEquipment } = useBungieAPI();

    useEffect(() => {
        const fetchActivity = async () => {
            try {
                const characterIds = await getCompsProfile(type, id);
                const mostRecentCharacter = Object.values(characterIds.profile.data.characterIds).reduce((latest, current) => {
                    return new Date(current.dateLastPlayed) > new Date(latest.dateLastPlayed) ? current : latest;
                });

                const activityResponse = await getCompCharsActs(type, id, mostRecentCharacter);

                const partyResponse = await getParty(type, id);

                const currentActivityHash = activityResponse.currentActivityHash;
                const currentActivityMode = activityResponse.currentActivityModeHash;
                const currentActivityPlaylist = activityResponse.currentPlaylistActivityHash;
                const fecha =  partyResponse.currentActivity.startTime;
                let oponentes = partyResponse.currentActivity.numberOfOpponents;
                const jugadores = partyResponse.currentActivity.numberOfPlayers;
                const puntosAliados = partyResponse.currentActivity.score;
                const puntosOponentes = partyResponse.currentActivity.highestOpposingFactionScore;
                const slots = partyResponse.joinability.openSlots;

                let datosGenerales = await fetchActivityDetails(currentActivityHash, "DestinyActivityDefinition", "general");
                let planeta = await fetchActivityDetails(datosGenerales.placeHash, "DestinyDestinationDefinition");
                let destinación = await fetchActivityDetails(datosGenerales.destinationHash, "DestinyDestinationDefinition");

                let name = datosGenerales.displayProperties.name;
                let mapaDePVP = datosGenerales.displayProperties.description;
                const actividadImg = datosGenerales.pgcrImage || orbit;
                //console.log("Current activity hash:", actividadImg);

                //console.log("Current activity hash:", datosGenerales);

                let playlist = await fetchActivityDetails(currentActivityPlaylist, "DestinyActivityDefinition");

                let modoDatos = await fetchActivityDetails(currentActivityMode, "DestinyActivityModeDefinition", "general");
                const tipo = modoDatos && modoDatos.displayProperties ? modoDatos.displayProperties.name : null;
                const tieneIcono = modoDatos && modoDatos.displayProperties ? modoDatos.displayProperties.hasIcon : null;
                const actividadLogo = modoDatos && modoDatos.displayProperties ? modoDatos.displayProperties.icon : null;

                const now = new Date();
                const activityDate = new Date(fecha);
                const minutesAgo = Math.floor((now - activityDate) / 60000);

                if (!mapaDePVP.includes(",")) mapaDePVP = null;
                else mapaDePVP = mapaDePVP.substring(mapaDePVP.indexOf(",")).trim();

                if (planeta == "El Crisol") planeta = "Crisol";
                let aliados = jugadores - oponentes;
                if (oponentes > 6) oponentes = 6;
                if (aliados > 6) aliados = 6;

                let PVPoPVE;
                if (activityResponse.data.Response.activities.data.currentActivityModeTypes == null) {
                    PVPoPVE = "PVE";
                } else if (activityResponse.data.Response.activities.data.currentActivityModeTypes.some(mode => mode === 5)) {
                    PVPoPVE = "PVP"
                } else if (activityResponse.data.Response.activities.data.currentActivityModeTypes.some(mode => mode === 63)) {
                    PVPoPVE = "PVP"; // Gambito
                } else if (activityResponse.data.Response.activities.data.currentActivityModeTypes.some(mode => mode === 6)) {
                    PVPoPVE = "PVP"; // Patrulla
                }

                setActivity({
                    date: minutesAgo,
                    name: name,
                    type: tipo,
                    playlist: playlist,
                    planeta: planeta,
                    destinación: destinación,
                    PVPoPVE: PVPoPVE,
                    oponentes: oponentes,
                    jugadores: aliados,
                    puntosAliados: puntosAliados,
                    puntosOponentes: puntosOponentes,
                    slots: slots,
                    mapaDePVP: mapaDePVP,
                    imagen: actividadImg && actividadImg.includes(orbit) ? actividadImg : "/api" + actividadImg,
                    logo: actividadLogo,
                    tieneIcono: tieneIcono,
                });

                const partyMembersData = partyResponse.data.Response.profileTransitoryData.data.partyMembers;
                const partyMembersDetails = await fetchPartyMembersDetails(partyMembersData);
                setPartyMembers(partyMembersDetails);

                if (partyMembers.length > 3) {
                    setColums(2)
                } else if (partyMembers.length > 6) {
                    setColums(3)
                }
                else setColums(1);

            } catch (error) {
                console.error(`Error fetching current activity:`, error);
            }
        };

        fetchActivity();
        const interval = setInterval(() => {
            fetchActivity();
        }, 120000);
        return () => clearInterval(interval);

    }, [partyMembers.length]);

    const fetchActivityDetails = async (activityHash, type, Subclase) => {
        try {
            const response = getItemManifest(activityHash, type);
            console.log("Current activity hash:", response);
            if (response == null) return null;
            else if (Subclase === "general") return response;
            else return response.displayProperties.name;

        } catch (error) {
            console.error(`Error fetching activity details for hash ${activityHash}:`, error);
            return null;
        }
    };

    return (
        <div className="w-fit mt-10">
            {activity ? (
                <div className="text-white p-6 rounded-lg space-x-6 content-fit justify-between shadow-lg flex object-fill bg-center bg-cover min-w-md" style={{ backgroundImage: `url(${activity.imagen})` }}>
                    <div>
                        {activity.name ? (
                            <div className="gap-0">
                                <div className="bg-black/25 p-2 rounded-lg w-fit">
                                    <p className="flex items-center text-lg font-semibold mb-0 p-0 leading-tight">
                                        Actividad en curso
                                        <div className="relative ml-2">
                                            <img src={circleSolid} width={16} height={16} className="animate-ping" style={{ filter: 'invert(34%) sepia(100%) saturate(748%) hue-rotate(185deg) brightness(96%) contrast(101%)' }} />
                                            <img src={circleSolid} width={15} height={15} className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" style={{ filter: 'invert(34%) sepia(100%) saturate(748%) hue-rotate(185deg) brightness(96%) contrast(101%)' }} />
                                        </div>
                                    </p>
                                    <p className="italic text-xs leading-tight">Desde hace {activity.date} minutos</p>
                                </div>
                                <div className="bg-black/25 p-2 rounded-lg w-fit mt-4">
                                    {activity.PVPoPVE === "PVP" ? (
                                        <>
                                            {activity.type && !activity.type.includes(activity.name) && <p className="text-4xl font-semibold mb-0">{activity.type}</p>}
                                            <p className="mb-0 font-semibold text-xl">{activity.planeta}
                                                {activity.planeta && activity.name !== activity.planeta && <span> - {activity.name}{activity.mapaDePVP}</span>}<br />
                                            </p>
                                        </>
                                    ) : <>
                                        {<p className="text-4xl font-semibold">{activity.name}</p>}
                                        {activity.playlist && !activity.name.includes(activity.playlist) && <p className="text-3xl font-semibold">{activity.playlist}</p>}
                                        <p className="mb-0 font-semibold text-xl">
                                            {activity.type && (activity.destinación === activity.name || activity.destinación === null) && <p>{activity.type}</p>}
                                            {activity.destinación && activity.type == null && <p>{activity.destinación}</p>}
                                            {activity.destinación && activity.type && activity.destinación !== activity.name && (
                                                <span> {activity.type} - {activity.destinación}</span>
                                            )}
                                        </p>
                                    </>}
                                    {activity.PVPoPVE === "PVP" ? (
                                        <div className="flex justify-evenly">
                                            <div className="flex flex-col text-center items-center">
                                                {activity.oponentes ? <p className="mb-2"><span className="font-semibold">Aliados:</span> {activity.jugadores}</p> : null}
                                                <div className="w-[50px] py-2 border-1 border-white items-center flex justify-center">
                                                    <p className="text-xl">{activity.puntosAliados || 0}</p>
                                                </div>
                                            </div>
                                            <div className="border-l border-gray-100 mx-4"></div>
                                            <div className="flex flex-col text-center items-center">
                                                {activity.oponentes ? <p className="mb-2"><span className="font-semibold">Rivales:</span> {activity.oponentes}</p> : null}
                                                <div className="w-[50px] py-2 border-1 border-white items-center flex justify-center">
                                                    <p className="text-xl">{activity.puntosOponentes || 0}</p>
                                                </div>
                                            </div>
                                        </div>) : (
                                        <div>
                                            {!activity.puntosAliados || activity.puntosAliados == 0 && <p className="text-start mb-0">Puntos: {activity.puntosAliados}</p>}
                                        </div>
                                    )}

                                </div>
                            </div>
                        ) : (
                            <p className="text-4xl font-semibold items-center">En órbita </p>
                        )}
                        <div className="bg-black/25 p-2 rounded-lg w-fit mt-4">
                            <h4 className="text-xl font-bold mb-1">Escuadra:</h4>
                            <ul className={`space-x-6 grid ${numColumns == 3 ? "grid-cols-3 text-sm" : numColumns == 2 ? "grid-cols-2" : "grid-cols-1"}  gap-4`}>
                                {partyMembers.map(member => (
                                    <li key={member.id} className=" items-center space-x-1 flex">
                                        <img src={`/api${member.emblemPath}`} width={40} height={40} alt="Emblem" />
                                        <div className="flex flex-col">
                                            <span title={member.uniqueName}>{member.displayName}</span>
                                            <span>{member.clase} <i className={`icon-${member.subclass}`} style={{ fontStyle: "normal" }} /> - {member.light}</span>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                    {activity.logo && !activity.logo.includes("missing") ?
                        <div className="opacity-50">
                            <img src={`/api${activity.logo}`} width={80} height={80} />
                        </div>
                        : null}
                </div>
            ) : (
                <p className="text-center text-gray-500">No está jugando ahora</p>
            )}
        </div>
    );
}
const fetchPartyMembersDetails = async (partyMembersData) => {
    return await Promise.all(partyMembersData.map(async member => {
        const plataformas = [3, 1, 2, 10, 6];
        let profileResponse;
        let successfulPlatform = null;
        for (const plataforma of plataformas) {
            try {
                profileResponse = await getCompsProfile(plataforma, member.membershipId);
                successfulPlatform = plataforma;
                break;
            } catch (error) {
                console.error("No es de la plataforma", plataforma);
            }
        }

        if (!profileResponse) {
            throw new Error(`No se pudo obtener el perfil para el miembro con ID ${member.membershipId}`);
        }

        // Obtener el uniqueName usando el endpoint adecuado
        const userResponse = await getUserMembershipsById(member.membershipId, successfulPlatform);
        const displayName = profileResponse.profile.data.userInfo.displayName;
        const uniqueName = userResponse.bungieNetUser.uniqueName;
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
        const response = await getCharsAndEquipment(type, id);

        const characters = response.characters.data;
        const equipment = response.characterEquipment.data;

        const mostRecentCharacter = Object.values(characters).reduce((latest, current) => {
            return new Date(current.dateLastPlayed) > new Date(latest.dateLastPlayed) ? current : latest;
        });

        let clase;
        switch (mostRecentCharacter.classType) {
            case 0: // Titán
                clase = mostRecentCharacter.genderType === 0 ? "Titán" : "Titán";
                break;
            case 1: // Cazador
                clase = mostRecentCharacter.genderType === 0 ? "Cazador" : "Cazadora";
                break;
            case 2: // Hechicero
                clase = mostRecentCharacter.genderType === 0 ? "Hechicero" : "Hechicera";
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
        } else if (subclass.includes("thermal")) {
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