import { useEffect, useRef, useState } from "react";
import circleSolid from "../../../assets/circle-solid.svg";
import orbit from "../../../assets/orbit.png";
import "../../../Index.css";
import { useBungieAPI } from "../../APIservices/BungieAPIcache";
import CaruselTemmate from "./CaruselTemmate";
import PopUpTeammate from "./PopUpTeammate";

export default function CurrentActivity({ type, id, isOnline }) {
    const [activity, setActivity] = useState(null);
    const [partyMembers, setPartyMembers] = useState([]);
    const [online, setOnline] = useState(isOnline);
    const [jugadorSelected, setJugadorSelected] = useState(null);
    const popupRef = useRef(null);
    const [numColumns, setColums] = useState(0);
    const { getCompsProfile, getCompCharsActs, getParty, getItemManifest, getUserMembershipsById, getCharsAndEquipment, getCommendations, getClanUser } = useBungieAPI();

    useEffect(() => {
        const fetchActivity = async () => {
            try {
                const characterIds = await getCompsProfile(type, id);
                const mostRecentCharacter = Object.values(characterIds.profile.data.characterIds).reduce((latest, current) => {
                    return new Date(current.dateLastPlayed) > new Date(latest.dateLastPlayed) ? current : latest;
                });

                const activityResponse = await getCompCharsActs(type, id, mostRecentCharacter);
                console.log("activityResponse", activityResponse, online);
                const partyResponse = await getParty(type, id);

                const currentActivityHash = activityResponse.currentActivityHash;
                const currentActivityMode = activityResponse.currentActivityModeHash;
                const currentActivityPlaylist = activityResponse.currentPlaylistActivityHash;
                const fecha = partyResponse.currentActivity.startTime;
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
                if (activityResponse.currentActivityModeTypes == null) {
                    PVPoPVE = "PVE";
                } else if (activityResponse.currentActivityModeTypes.some(mode => mode === 5)) {
                    PVPoPVE = "PVP"
                } else if (activityResponse.currentActivityModeTypes.some(mode => mode === 63)) {
                    PVPoPVE = "PVP"; // Gambito
                } else if (activityResponse.currentActivityModeTypes.some(mode => mode === 6)) {
                    PVPoPVE = "PVP"; // Patrulla
                    oponentes = null;
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

                const partyMembersDetails = await fetchPartyMembersDetails(partyResponse.partyMembers, activity);
                setPartyMembers(partyMembersDetails);

                if (partyMembers.length > 2) {
                    setColums(2)
                } else setColums(1);

            } catch (error) {
                //console.error(`Error fetching current activity:`, error);
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
            const response = await getItemManifest(activityHash, type);
            if (response == null) return null;
            else if (Subclase === "general") return response;
            else if (Subclase === "sub") return response.talentGrid.buildName;
            else return response.displayProperties.name;

        } catch (error) {
            //console.error(`Error fetching activity details for hash ${activityHash}:`, error);
            return null;
        }
    };

    const fetchPartyMembersDetails = async (partyMembersData, activity2) => {
        return await Promise.all(partyMembersData.map(async member => {
            const plataformas = [3, 1, 2, 10, 6];
            let profileResponse;
            let successfulPlatform = null;
            for (const plataforma of plataformas) {
                try {
                    profileResponse = await getCompsProfile(plataforma, member.membershipId);
                    if (profileResponse && profileResponse.profile?.data) {
                        successfulPlatform = plataforma;
                        break;
                    }
                } catch (error) {
                    //console.error("No es de la plataforma", plataforma);
                }
            }

            if (!profileResponse || !successfulPlatform) {
                throw new Error(`No se pudo obtener el perfil para el miembro con ID ${member.membershipId}`);
            }

            // Obtener el uniqueName usando el endpoint adecuado
            const userResponse = await getUserMembershipsById(member.membershipId, successfulPlatform);
            const displayName = profileResponse.profile.data.userInfo.displayName;
            const uniqueName = userResponse.bungieNetUser.uniqueName;
            const emblemPath = await getPartyEmblem(member.membershipId, successfulPlatform);

            return {
                membershipId: member.membershipId,
                membershipType: successfulPlatform,
                guardianRank: await fetchGuardianRank(member.membershipId, successfulPlatform),
                honor: await getCommendations(successfulPlatform, member.membershipId),
                emblemaBig: await fetchEmblema(emblemPath.emblemHash),
                clan: await fetchClan(member.membershipId, successfulPlatform),
                emblemPath: emblemPath.emblemPath,
                clase: emblemPath.clase,
                light: emblemPath.light,
                subclass: emblemPath.subclass,
                iconActivity: activity2?.logo || null,
                activityName: activity2?.name || null,
                mode: activity2?.type || null,
                name: displayName,
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

            return { clase: clase, emblemPath: mostRecentCharacter.emblemPath, light: mostRecentCharacter.light, subclass: subclass, emblemHash: mostRecentCharacter.emblemHash };

        } catch (error) {
            //console.error('Error fetching equipped emblem:', error);
            return null;
        }
    };

    const fetchGuardianRank = async (id, type) => {
        try {
            const responseProfile = await getCompsProfile(type, id);
            const RankNum = responseProfile.profile.data.currentGuardianRank;
            const guardianRankResponse = await getItemManifest(RankNum, "DestinyGuardianRankDefinition");
            return ({
                title: guardianRankResponse.displayProperties.name,
                num: RankNum,
            });
        } catch (error) {
            //console.error('Error al cargar datos del popup del jugador:', error);
        }
    }

    const fetchEmblema = async (emblem) => {
        const emblemaResponse = await getItemManifest(emblem, "DestinyInventoryItemDefinition");
        return emblemaResponse.secondaryIcon;
    }

    const fetchClan = async (id, type) => {
        try {
            const userClan = await getClanUser(type, id);
            if (userClan?.results && userClan.results.length > 0 && userClan.results[0]?.group?.name) {
                return userClan.results[0].group.name;
            } else {
                return "No pertenece a ningún clan";
            }
        } catch (error) {
            console.error('Error al cargar el clan del usuario:', error);
            return "No pertenece a ningún clan";
        }
    }

    useEffect(() => {
        if (jugadorSelected === null) return;
        function handleClickOutside(event) {
            if (popupRef.current && !popupRef.current.contains(event.target)) {
                setJugadorSelected(null);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [jugadorSelected]);

    return (
        <div className="w-full">
            {activity ? (
                <div className="h-[450px] text-white p-6 py-1.5 rounded-lg shadow-lg flex bg-center bg-cover w-full" style={{ backgroundImage: `url(${activity.imagen})` }}>
                    <div className="w-full h-full justify-evenly flex flex-col">
                        {activity.name ? (
                            <div className="gap-0">
                                <div className="flex items-center justify-between">
                                    <div className="bg-black/25 p-2 rounded-lg w-fit">
                                        <div className="flex items-center text-lg font-semibold mb-0 p-0 leading-tight">
                                            Actividad en curso
                                            <div className="relative ml-2">
                                                <img src={circleSolid} width={16} height={16} className="animate-ping" style={{ filter: 'invert(34%) sepia(100%) saturate(748%) hue-rotate(185deg) brightness(96%) contrast(101%)' }} />
                                                <img src={circleSolid} width={15} height={15} className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" style={{ filter: 'invert(34%) sepia(100%) saturate(748%) hue-rotate(185deg) brightness(96%) contrast(101%)' }} />
                                            </div>
                                        </div>
                                        <p className="italic text-xs leading-tight">Desde hace {activity.date} minutos</p>
                                    </div>
                                    {activity.logo && !activity.logo.includes("missing") ?
                                        <div className="opacity-50">
                                            <img src={`/api${activity.logo}`} width={80} height={80} />
                                        </div>
                                        : null}
                                </div>
                                <div className="bg-black/25 p-2 rounded-lg w-fit">
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
                            <p className="text-4xl font-semibold items-center bg-black/25 p-2 rounded-lg w-fit">En órbita </p>
                        )}
                        <div className="bg-black/25 p-2 rounded-lg w-full">
                            <h4 className="text-xl font-bold mb-1">Escuadra:</h4>
                            {partyMembers.length > 4 || (activity?.PVPoPVE === "PVP" && partyMembers.length > 2) ? (
                                <div className="relative">
                                    <CaruselTemmate
                                        members={partyMembers}
                                        onMemberClick={setJugadorSelected}
                                        selectedMember={jugadorSelected}
                                        mode={activity?.PVPoPVE}
                                    />
                                </div>
                            ) : (
                                <ul className={`grid ${numColumns == 3 ? "grid-cols-3 text-sm" : numColumns == 2 ? "grid-cols-2" : "grid-cols-1"} gap-2`}>
                                    {partyMembers.map((member, idx) => (
                                        <li key={member.membershipId} className="relative">
                                            <a
                                                className="flex items-center gap-2 bg-black/25 p-2 rounded-lg w-full cursor-pointer transition-all duration-200 hover:scale-105 hover:shadow-lg  clan-member-shimmer-hover"
                                                onClick={() => setJugadorSelected(idx)}
                                            >
                                                <img src={`/api${member.emblemPath}`} width={40} height={40} alt="Emblem" />
                                                <div className="flex flex-col">
                                                    <span>{member.name}</span>
                                                    <span>{member.clase} <i className={`icon-${member.subclass}`} style={{ fontStyle: "normal" }} /> - {member.light}</span>
                                                </div>
                                            </a>
                                            {jugadorSelected === idx && (
                                                <div ref={popupRef} className="absolute left-full top-0 z-50 ml-2">
                                                    <PopUpTeammate jugador={member} />
                                                </div>
                                            )}
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    </div>
                </div>
            ) : (
                <div
                    className="text-white p-6 rounded-lg content-fit shadow-lg h-[450px] flex flex-col bg-center bg-cover relative"
                    style={{ backgroundImage: `url(${orbit})` }}
                >
                    {/* Overlay de transparencia */}
                    <div className="absolute inset-0 bg-black opacity-80 rounded-lg"></div>

                    {/* Contenido por encima del overlay */}
                    <div className="relative z-10 flex flex-col h-full">
                        <div className="bg-black/25 p-2 rounded-lg w-fit mb-4">
                            <p className="flex text-lg font-semibold mb-0 p-0 leading-tight">
                                Actividad en curso
                            </p>
                        </div>
                        <div className="flex-1 flex items-center justify-center">
                            <p className="text-2xl bg-black/25 p-2 rounded text-center uppercase">
                                {online ? "Actividad no registrada" : "No está en línea"}
                            </p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
