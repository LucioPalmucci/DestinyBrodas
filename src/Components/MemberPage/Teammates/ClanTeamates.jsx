import { useEffect, useRef, useState } from "react";
import tower from "../../../assets/tower.webp";
import { API_CONFIG } from "../../../config";
import { bungieApiClient, useBungieAPI } from '../../APIservices/BungieAPIcalls';
import { loadCache, saveCache } from "../../Cache/componentsCache";
import "../../CSS/index.css"; // Importar estilos globales
import "../../CSS/player.css";
import PopUpClanTeammates from "./PopUpClanTeammates";
import { formatDurationVerbose } from "../../../utils/formatDuration";
import { fetchEmblema, fetchGuardianRank } from "../../../utils/playerInfoFetchers";

export default function ClanTeammates({ userId, membershipType }) {
    const [playersClan, setJugadoresClan] = useState([]);
    const [jugadorSelected, setJugadorSelected] = useState(null);
    const [loading, setLoading] = useState(true);
    const popupRef = useRef(null);
    const { getCompChars, getClanMembers, getRecentActivities, getCarnageReport, getItemManifest, getManifest, getCommendations, getCompsProfile } = useBungieAPI();

    const CACHE_TTL = 150 * 60 * 1000; // 15 minutes
    const cacheKey = `ClanTeammates_${membershipType}_${userId}`;

    useEffect(() => {
        const cached = loadCache(cacheKey, CACHE_TTL);
        if (cached) {
            setJugadoresClan(cached);
            setLoading(false);
            return;
        }
        const fectchClanTeammates = async () => {
            setLoading(true);
            try {
                const userData = await getCompChars(membershipType, userId);
                let clanMemmbersIDs = [];

                const clan = await getClanMembers();

                clan.forEach(member => {
                    if (member.destinyUserInfo.membershipId === userId) return;
                    clanMemmbersIDs.push(member.destinyUserInfo.membershipId);
                });

                const activityPerCharacter = await Promise.all(
                    Object.values(userData).map(character =>
                        getRecentActivities(membershipType, userId, character.characterId, 30)
                    )
                );
                let activity = activityPerCharacter.flatMap(activityChar => activityChar || []);

                activity.sort((a, b) => new Date(b.period) - new Date(a.period)); // Más recientes primero
                let jugadoresClan = [], peopleLimit = 6;

                for (const act of activity) {
                    if (jugadoresClan.length >= peopleLimit) break;
                    const carnageReportResponse = await getCarnageReport(act.activityDetails.instanceId);
                    for (const entry of carnageReportResponse.entries) {
                        if (
                            clanMemmbersIDs.includes(entry.player.destinyUserInfo.membershipId)
                        ) {
                            const [activityName, metricsData, honor, emblemaBig, guardianRank] = await Promise.all([
                                getItemManifest(act.activityDetails.directorActivityHash, "DestinyActivityDefinition"),
                                (async () => {
                                    const manifest = await getManifest();
                                    const manifestUrl = manifest.jsonWorldComponentContentPaths.es.DestinyActivityModeDefinition;
                                    return bungieApiClient.getPublic(`${API_CONFIG.BUNGIE_API}${manifestUrl}`);
                                })(),
                                fetchCommendations(entry.player.destinyUserInfo.membershipId, entry.player.destinyUserInfo.membershipType),
                                fetchEmblema(entry.player.emblemHash, { getItemManifest }),
                                fetchGuardianRank(entry.player.destinyUserInfo.membershipId, entry.player.destinyUserInfo.membershipType, { getCompsProfile, getItemManifest }),
                            ]);
                            const matchingMetric = Object.values(metricsData).find(metric =>
                                metric.modeType == act.activityDetails.mode
                            );
                            jugadoresClan.push({
                                name: entry.player.destinyUserInfo.displayName,
                                uniqueName: entry.player.destinyUserInfo.bungieGlobalDisplayName,
                                uniqueNameCode: "#" + entry.player.destinyUserInfo.bungieGlobalDisplayNameCode,
                                icon: entry.player.destinyUserInfo.iconPath,
                                emblemHash: entry.player.emblemHash,
                                membershipId: entry.player.destinyUserInfo.membershipId,
                                membershipType: entry.player.destinyUserInfo.membershipType,
                                light: entry.player.lightLevel,
                                honor,
                                emblemaBig,
                                guardianRank,
                                mode: matchingMetric ? matchingMetric.displayProperties.name : '',
                                activityName: activityName.displayProperties.name,
                                date: new Date(act.period).toLocaleDateString('es-ES', {
                                    day: '2-digit',
                                    month: '2-digit',
                                    year: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                }),
                                duration: formatDurationVerbose(act.values.activityDurationSeconds.basic.value),
                                iconActivity: matchingMetric ? matchingMetric.displayProperties.icon : '',
                                pgcrImg: activityName.pgcrImage,
                            });
                        }
                        if (jugadoresClan.length >= peopleLimit) break;
                    }
                }
                // Asignar número global del 1 al 8
                jugadoresClan.forEach((jugador, idx) => {
                    jugador.numero = idx + 1;
                });
                setJugadoresClan(jugadoresClan);
                saveCache(cacheKey, jugadoresClan);
            } catch (error) {
                const staleCached = loadCache(cacheKey, null);
                if (staleCached) setJugadoresClan(staleCached);
            } finally {
                setLoading(false);
            }
        };
        fectchClanTeammates();
    }, [userId, membershipType]);

    const fetchCommendations = async (id, type) => {
        try {
            return await getCommendations(type, id);
        } catch (error) {
            console.error('Error al cargar honor del jugador:', error);
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
        <div>
            {loading ? (
                <div className="h-[300px] bg-gray-300 flex justify-center items-center p-2 text-xl font-semibold w-full text-black rounded-lg animate-pulse"></div>
            ) : playersClan && playersClan.length > 0 ? (
                <div className="h-[300px] text-white p-6 px-3 rounded-lg space-x-6 content-fit justify-between shadow-lg object-fill bg-center bg-cover" style={{ backgroundImage: `url('${API_CONFIG.BUNGIE_API}${playersClan[0]?.pgcrImg}')` }}>
                    <div className="bg-black/25 p-2 rounded-lg w-fit">
                        <p className="flex items-center text-xl font-semibold mb-0 p-0 leading-tight">
                            Actividades con miembros del clan
                        </p>
                    </div>
                    <div className={`gap-3 grid grid-cols-2 w-full mt-4`}>
                        {playersClan.map((jugador, idx) => (
                            <div key={idx} className="relative w-full">
                                <a
                                    key={idx}
                                    className="flex items-center gap-2 bg-black/25 p-2 rounded-lg w-full cursor-pointer transition-all duration-200 shadow-inner hover:scale-105 hover:shadow-lg hover:bg-black/40 clan-member-shimmer clan-member-idle"
                                    onClick={() => setJugadorSelected(idx)}
                                >
                                    <p className="text-lg font-semibold min-w-[2ch] text-center">{jugador.numero}.</p>
                                    <img width={40} height={40} alt="Emblem" src={`${API_CONFIG.BUNGIE_API}${jugador.icon}`} />
                                    <div className="flex flex-col">
                                        <h1>
                                            {jugador?.uniqueName?.length > 12
                                                ? jugador?.uniqueName?.slice(0, 12) + "..."
                                                : jugador?.uniqueName
                                            }
                                            <span style={{ color: '#479ce4' }}>
                                                {jugador?.uniqueNameCode}
                                            </span>
                                        </h1>
                                        <span className="text-xs italic">{jugador.date}</span>
                                    </div>
                                </a>
                                {jugadorSelected === idx && (
                                    <div ref={popupRef} className="absolute left-full top-0 z-50 ml-2">
                                        <PopUpClanTeammates jugador={jugador} />
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            ) : (
                <div className="h-[300px] text-white p-6 px-3 rounded-lg space-x-6 content-fit justify-between shadow-lg object-fill bg-center bg-cover relative" style={{ backgroundImage: `url(${tower})` }}>
                    <div className="absolute inset-0 bg-black/40 rounded-lg w-full"></div>
                    <div className="relative z-10 flex flex-col h-full">
                        <div className="bg-black/25 p-2 rounded-lg w-fit">
                            <p className="flex items-center text-xl font-semibold mb-0 p-0 leading-tight">
                                Actividades con miembros del clan
                            </p>
                        </div>
                        <div className="flex-1 flex items-center justify-center">
                            <p className="text-2xl bg-black/25 p-2 rounded text-center uppercase">
                                No se encontraron actividades con miembros del clan
                            </p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}