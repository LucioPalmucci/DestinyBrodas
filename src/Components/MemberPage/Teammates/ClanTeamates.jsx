import axios from "axios";
import { useEffect, useRef, useState } from "react";
import tower from "../../../assets/tower.webp";
import { API_CONFIG } from "../../../config";
import "../../../Index.css"; // Importar estilos globales
import { useBungieAPI } from '../../APIservices/BungieAPIcache';
import PopUpClanTeammates from "./PopUpClanTeammates";

export default function ClanTeammates({ userId, membershipType }) {
    const [playersClan, setJugadoresClan] = useState([]);
    const [jugadorSelected, setJugadorSelected] = useState(null);
    const [loading, setLoading] = useState(true);
    const popupRef = useRef(null);
    const { getCompChars, getClanMembers, getRecentActivities, getCarnageReport, getItemManifest, getManifest, getCommendations, getCompsProfile } = useBungieAPI();

    useEffect(() => {
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

                let activity = [];
                for (const character of Object.values(userData)) {
                    let activityChar = await getRecentActivities(membershipType, userId, character.characterId, 10);
                    activity = activity.concat(activityChar || []);
                }

                activity.sort((a, b) => new Date(b.period) - new Date(a.period)); // Más recientes primero
                let jugadoresClan = [], peopleLimit = 8;

                for (const act of activity) {
                    if (jugadoresClan.length >= peopleLimit) break;
                    const carnageReportResponse = await getCarnageReport(act.activityDetails.instanceId);

                    for (const entry of carnageReportResponse.entries) {
                        if (
                            clanMemmbersIDs.includes(entry.player.destinyUserInfo.membershipId)
                        ) {
                            // Obtener detalles de la actividad para este jugador
                            //act.activityDetails.directorActivityHash DestinyActivityDefinition
                            const activityName = await getItemManifest(act.activityDetails.directorActivityHash, "DestinyActivityDefinition");
                            const manifest = await getManifest();
                            const manifestUrl = manifest.jsonWorldComponentContentPaths.es.DestinyActivityModeDefinition;
                            const metricsData = await axios.get(`${API_CONFIG.BUNGIE_API}${manifestUrl}`);
                            const matchingMetric = Object.values(metricsData.data).find(metric =>
                                metric.modeType == act.activityDetails.mode
                            );
                            jugadoresClan.push({
                                name: entry.player.destinyUserInfo.displayName,
                                uniqueName: entry.player.destinyUserInfo.bungieGlobalDisplayName + "#" + entry.player.destinyUserInfo.bungieGlobalDisplayNameCode,
                                icon: entry.player.destinyUserInfo.iconPath,
                                emblemHash: entry.player.emblemHash,
                                membershipId: entry.player.destinyUserInfo.membershipId,
                                membershipType: entry.player.destinyUserInfo.membershipType,
                                light: entry.player.lightLevel,
                                honor: await fetchCommendations(entry.player.destinyUserInfo.membershipId, entry.player.destinyUserInfo.membershipType),
                                emblemaBig: await fetchEmblema(entry.player.emblemHash),
                                guardianRank: await fetchGuardianRank(entry.player.destinyUserInfo.membershipId, entry.player.destinyUserInfo.membershipType),
                                mode: matchingMetric ? matchingMetric.displayProperties.name : '',
                                activityName: activityName.displayProperties.name,
                                date: new Date(act.period).toLocaleDateString('es-ES', {
                                    day: '2-digit',
                                    month: '2-digit',
                                    year: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                }),
                                duration: formatDuration(act.values.activityDurationSeconds.basic.value),
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
            } catch (error) {
                console.error('Error al cargar los compañeros de clan:', error);
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

    const fetchEmblema = async (emblem) => {
        const emblemaResponse = await getItemManifest(emblem, "DestinyInventoryItemDefinition");
        return emblemaResponse.secondaryIcon;
    }

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
            console.error('Error al cargar datos del popup del jugador:', error);
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

    const formatDuration = (seconds) => {
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = seconds % 60;
        let horas = h > 1 ? 'horas' : 'hora';
        let minutos = m != 1 ? 'minutos' : 'minuto';
        let segundos = s != 1 ? 'segundos' : 'segundo';
        if (h > 0) {
            return `${h} ${horas} ${m} ${minutos}`;
        } else {
            return `${m} ${minutos} ${s} ${segundos}`;
        }
    }

    return (
        <div>
            {loading ? (
                <div className="h-[370px] bg-gray-300 flex justify-center items-center p-2 text-xl font-semibold w-full text-black rounded-lg animate-pulse"></div>
            ) : playersClan && playersClan.length > 0 ? (
                <div className="h-[370px] text-white p-6 px-3 rounded-lg space-x-6 content-fit justify-between shadow-lg object-fill bg-center bg-cover" style={{ backgroundImage: `url('${API_CONFIG.BUNGIE_API}${playersClan[0]?.pgcrImg}')` }}>
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
                                    className="flex items-center gap-2 bg-black/25 p-2 rounded-lg w-full cursor-pointer transition-all duration-200 shadow-inner hover:scale-105 hover:shadow-lg hover:bg-black/40 clan-member-idle clan-member-shimmer"
                                    onClick={() => setJugadorSelected(idx)}
                                >
                                    <p className="text-lg font-semibold min-w-[2ch] text-center">{jugador.numero}.</p>
                                    <img width={40} height={40} alt="Emblem" src={`${API_CONFIG.BUNGIE_API}${jugador.icon}`} />
                                    <div className="flex flex-col">
                                        <h1>
                                            {jugador.uniqueName.slice(0, -5)}
                                            <span style={{ color: '#479ce4' }}>
                                                {jugador.uniqueName.slice(-5)}
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
                <div className="h-[370px] text-white p-6 px-3 rounded-lg space-x-6 content-fit justify-between shadow-lg object-fill bg-center bg-cover relative" style={{ backgroundImage: `url(${tower})` }}>
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