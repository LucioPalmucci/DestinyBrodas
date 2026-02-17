import { useEffect, useRef, useState } from "react";
import circleSolid from "../../../assets/circle-solid.svg";
import orbit from "../../../assets/orbit.png";
import { API_CONFIG } from "../../../config";
import { useBungieAPI } from "../../APIservices/BungieAPIcalls";
import { loadCache, saveCache } from "../../Cache/componentsCache";
import "../../CSS/Index.css";
import CaruselTemmate from "./CaruselTemmate";
import PopUpTeammate from "./PopUpTeammate";

export default function CurrentActivity({ type, id, isOnline }) {
    const [activity, setActivity] = useState(null);
    const [partyMembers, setPartyMembers] = useState([]);
    const [online, setOnline] = useState(isOnline);
    const [jugadorSelected, setJugadorSelected] = useState(null);
    const popupRef = useRef(null);
    const [numColumns, setColums] = useState(0);
    const { getCompCharsActs, getParty, getItemManifest, getUserMembershipsById, getCharsAndEquipment, getCommendations, getClanUser, getCompChars, getCompsProfile } = useBungieAPI();

    const cacheKey = `CurrentActivity_${type}_${id}`;
    const CACHE_TTL = 150 * 60 * 1000; // 5 minutes
    useEffect(() => {
        const fetchActivity = async () => {
            const cached = loadCache(cacheKey, CACHE_TTL);
            if (cached) {
                setUpCache(cached);
                return;
            }
            try {
                const characterIds = await getCompChars(type, id);
                const mostRecentCharacter = Object.values(characterIds).reduce((latest, current) => {
                    return new Date(current.dateLastPlayed) > new Date(latest.dateLastPlayed) ? current : latest;
                });

                const activityResponse = await getCompCharsActs(type, id, mostRecentCharacter.characterId);
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

                const activity = {
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
                    imagen: actividadImg && actividadImg.includes(orbit) ? actividadImg : API_CONFIG.BUNGIE_API + actividadImg,
                    logo: actividadLogo,
                    tieneIcono: tieneIcono,
                };

                setActivity(activity);

                const partyMembersDetails = await fetchPartyMembersDetails(partyResponse.partyMembers, activity);
                console.log("Miembros de la party con detalles:", partyMembersDetails);
                setPartyMembers(partyMembersDetails);

                let cols = 1;
                if (partyMembers.length > 1) cols = 2;
                setColums(cols);

                saveCache(cacheKey, {
                    activity: activity,
                    partyMembers: partyMembersDetails,
                    numColumns: numColumns
                });

            } catch (error) {
                const staleCached = loadCache(cacheKey, null);
                if (staleCached) setUpCache(staleCached);
            }
        };

        fetchActivity();
        const interval = setInterval(() => {
            fetchActivity();
        }, 120000);
        return () => clearInterval(interval);

    }, [partyMembers.length]);

    const setUpCache = (cached) => {
        setActivity(cached.activity);
        setPartyMembers(cached.partyMembers);
        setColums(cached.numColumns);
    }

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
        const filteredMembers = Array(3).fill(partyMembersData).flat().filter(member => member.membershipId !== id); //Filtra el usuario de la pagina
        return await Promise.all(filteredMembers.map(async member => {
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
                    // console.error("No es de la plataforma", plataforma);
                }
            }

            if (!profileResponse || !successfulPlatform) {
                throw new Error(`No se pudo obtener el perfil para el miembro con ID ${member.membershipId}`);
            }

            // Obtener el uniqueName usando el endpoint adecuado
            const displayName = profileResponse.profile.data.userInfo.displayName;
            const uniqueName = profileResponse.profile.data.userInfo.bungieGlobalDisplayName;
            const nameNums = profileResponse.profile.data.userInfo.bungieGlobalDisplayNameCode;
            const emblemPath = await getPartyEmblem(member.membershipId, successfulPlatform);

            console.log("Emblema del jugador:", activity2?.logo);
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
                iconActivity: activity2?.logo || "/common/destiny2_content/icons/DestinyActivityModeDefinition_f6de6d95f600f199c9a674c73cbefbcc.png",
                activityName: activity2?.name || "En órbita",
                mode: activity2?.type || null,
                name: displayName,
                uniqueName: uniqueName,
                nameNums: nameNums,
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
                <div className="h-[300px] text-white px-3 p-6 rounded-lg shadow-lg flex bg-center bg-cover w-full" style={{ backgroundImage: `url(${activity.imagen})` }}>
                    <div className={`w-full h-fit flex justify-between`}>
                        {activity.name ? (
                            <div className="justify-between flex flex-col h-fit w-full">
                                <div className={`flex items-center justify-between relative mb-0.5 ${partyMembers.length === 0 ? "mb-2" : "mb-0.5"}`}>
                                    <div className="bg-black/25 p-2 rounded-lg w-fit h-fit">
                                        <div className="flex items-center text-lg font-semibold leading-tight">
                                            Actividad en curso
                                            <div className="relative ml-2">
                                                <img src={circleSolid} width={16} height={16} className="animate-ping" style={{ filter: 'invert(34%) sepia(100%) saturate(748%) hue-rotate(185deg) brightness(96%) contrast(101%)' }} />
                                                <img src={circleSolid} width={15} height={15} className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" style={{ filter: 'invert(34%) sepia(100%) saturate(748%) hue-rotate(185deg) brightness(96%) contrast(101%)' }} />
                                            </div>
                                        </div>
                                        <p className="italic text-xs leading-tight">Desde hace {activity.date} minutos</p>
                                    </div>
                                    {activity.logo &&
                                        <div className="opacity-50 absolute right-0">
                                            <img src={`${API_CONFIG.BUNGIE_API}${activity.logo}`} className="w-16 h-16 mb-1" />
                                        </div>
                                    }
                                </div>
                                <div className={`${activity.PVPoPVE === "PVP" ? "flex-row" : "flex-col"} w-full flex gap-3 h-full`}>
                                    <div className={`bg-black/25 rounded-lg ${activity.PVPoPVE === "PVP" ? "w-70" : "w-fit"} flex flex-col`}>
                                        <div className="p-2">
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
                                        </div>
                                        {activity.PVPoPVE === "PVP" && activity.oponentes != null ? (
                                            <div className="flex justify-between mx-10 mt-1 mb-1">
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
                                    {partyMembers.length > 0 && <div className={`bg-black/25 p-1 py-0.5 rounded-lg px-1.5 ${activity?.PVPoPVE === "PVP" ? "w-55" : "w-[500px]"}`} >
                                        <h4 className="text-lg font-bold mb-0.5">Escuadra:</h4>
                                        {(activity?.PVPoPVE != "PVP" && partyMembers.length > 2) || (activity?.PVPoPVE === "PVP" && partyMembers.length > 3) ? (
                                            <div className="relative">
                                                <CaruselTemmate
                                                    members={partyMembers}
                                                    onMemberClick={setJugadorSelected}
                                                    selectedMember={jugadorSelected}
                                                    mode={activity?.PVPoPVE}
                                                />
                                            </div>
                                        ) : (
                                            <ul className={`grid gap-1 text-start w-full ${activity.PVPoPVE == "PVP" ? "grid-cols-1" : "grid-cols-3"}`}>
                                                {partyMembers.map((member, idx) => (
                                                    <li key={member.membershipId} className="relative">
                                                        <a
                                                            className="flex items-center gap-2 bg-black/25 p-2 rounded-lg cursor-pointer transition-all duration-200 clan-member-shimmer-hover w-50"
                                                            onClick={() => setJugadorSelected(idx)}
                                                        >
                                                            <>
                                                                <img src={`${API_CONFIG.BUNGIE_API}${member.emblemPath}`} width={33} height={33} alt="Emblem" />
                                                                <div className="flex flex-col text-sm">
                                                                    <span>{member.uniqueName}</span>
                                                                    <span>{member.clase} <i className={`icon-${member.subclass}`} style={{ fontStyle: "normal" }} /> - {member.light}</span>
                                                                </div>
                                                            </>
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
                                    </div>}
                                </div>
                            </div>
                        ) : (
                            <p className="text-4xl font-semibold items-center bg-black/25 p-2 rounded-lg w-fit">En órbita </p>
                        )}
                    </div>
                </div>
            ) : (
                <div
                    className="text-white p-6 rounded-lg content-fit shadow-lg h-[300px] flex flex-col bg-center bg-cover relative"
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
