import axios from "axios";
import { useEffect, useRef, useState } from "react";
import "../../../Index.css"; // Importar estilos globales
import PopUpClanTeammates from "./PopUpClanTeammates";


export default function ClanTeammates({ userId, membershipType }) {
    const [playersClan, setJugadoresClan] = useState([]);
    const [jugadorSelected, setJugadorSelected] = useState(null);
    const popupRef = useRef(null);

    useEffect(() => {
        const fectchClanTeammates = async () => {
            const userData = await axios.get(`/api/Platform/Destiny2/${membershipType}/Profile/${userId}/?components=Characters&lc=es`, {
                headers: {
                    'X-API-Key': 'f83a251bf2274914ab739f4781b5e710',
                },
            });

            const characterIds = userData.data.Response.characters.data;
            let clanMemmbersIDs = [];

            const clan = await axios.get('/api/Platform/GroupV2/3942032/Members/', {
                headers: {
                    'X-API-Key': 'f83a251bf2274914ab739f4781b5e710',
                },
            });

            clan.data.Response.results.forEach(member => {
                if (member.destinyUserInfo.membershipId === userId) return;
                clanMemmbersIDs.push(member.destinyUserInfo.membershipId);
            });

            let activity = [];
            for (const character of Object.values(characterIds)) {
                let activityChar = await axios.get(`/api/Platform/Destiny2/${membershipType}/Account/${userId}/Character/${character.characterId}/Stats/Activities/?lc=es`, {
                    headers: {
                        'X-API-Key': 'f83a251bf2274914ab739f4781b5e710',
                    },
                });
                activity = activity.concat(activityChar.data.Response.activities || []);
            }

            activity.sort((a, b) => new Date(b.period) - new Date(a.period)); // Más recientes primero
            let jugadoresClan = [], peopleLimit = 8;

            for (const act of activity) {
                if (jugadoresClan.length >= peopleLimit) break;
                const carnageReportResponse = await axios.get(`/reporte/Platform/Destiny2/Stats/PostGameCarnageReport/${act.activityDetails.instanceId}/?lc=es`, {
                    headers: {
                        'X-API-Key': 'f83a251bf2274914ab739f4781b5e710',
                    },
                });

                for (const entry of carnageReportResponse.data.Response.entries) {
                    if (
                        clanMemmbersIDs.includes(entry.player.destinyUserInfo.membershipId)
                    ) {
                        // Obtener detalles de la actividad para este jugador
                        const activityName = await axios.get(`/api/Platform/Destiny2/Manifest/DestinyActivityDefinition/${act.activityDetails.directorActivityHash}/?lc=es`, {
                            headers: {
                                'X-API-Key': 'f83a251bf2274914ab739f4781b5e710',
                            },
                        });
                        const manifest = await axios.get('/api/Platform/Destiny2/Manifest/', {
                            headers: {
                                'X-API-Key': 'f83a251bf2274914ab739f4781b5e710',
                            },
                        });
                        const manifestUrl = manifest.data.Response.jsonWorldComponentContentPaths.es.DestinyActivityModeDefinition;
                        const metricsData = await axios.get(`/api${manifestUrl}`);
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
                            activityName: activityName.data.Response.displayProperties.name,
                            date: new Date(act.period).toLocaleDateString('es-ES', {
                                day: '2-digit',
                                month: '2-digit',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                            }),
                            duration: formatDuration(act.values.activityDurationSeconds.basic.value),
                            iconActivity: matchingMetric ? matchingMetric.displayProperties.icon : '',
                            pgcrImg: activityName.data.Response.pgcrImage,
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
        };
        fectchClanTeammates();
    }, [userId, membershipType]);

    const fetchCommendations = async (id, type) => {
        try {
            const commendation = await axios.get(`/api/Platform/Destiny2/${type}/Profile/${id}/?components=1400`, {
                headers: {
                    "X-API-Key": "f83a251bf2274914ab739f4781b5e710",
                }
            });
            const dataHonor = commendation.data.Response.profileCommendations.data;
            return ({
                totalScore: dataHonor.totalScore.toLocaleString('en-US'),
                recibidas: dataHonor.scoreDetailValues[1],
                enviadas: dataHonor.scoreDetailValues[0],
                verdes: dataHonor.commendationNodePercentagesByHash[154475713],
                rosas: dataHonor.commendationNodePercentagesByHash[1341823550],
                azules: dataHonor.commendationNodePercentagesByHash[1390663518],
                naranjas: dataHonor.commendationNodePercentagesByHash[4180748446],
                verdesPuntos: dataHonor.commendationNodeScoresByHash[154475713],
                rosasPuntos: dataHonor.commendationNodeScoresByHash[1341823550],
                azulesPuntos: dataHonor.commendationNodeScoresByHash[1390663518],
                naranjasPuntos: dataHonor.commendationNodeScoresByHash[4180748446],
            })
        } catch (error) {
            console.error('Error al cargar gonor del jugador:', error);
        }
    }

    const fetchEmblema = async (emblem) => {
        const emblemaResponse = await axios.get(`/api/Platform/Destiny2/Manifest/DestinyInventoryItemDefinition/${emblem}/?lc=es`, {
            headers: {
                'X-API-Key': 'f83a251bf2274914ab739f4781b5e710',
            },
        });
        return emblemaResponse.data.Response.secondaryIcon;
    }

    const fetchGuardianRank = async (id, type) => {
        try {
            const responseProfile = await axios.get(`/api/Platform/Destiny2/${type}/Profile/${id}/?components=100`, {
                headers: {
                    'X-API-Key': 'f83a251bf2274914ab739f4781b5e710',
                },
            });
            const RankNum = responseProfile.data.Response.profile.data.currentGuardianRank;
            const guardianRankResponse = await axios.get(`/api/Platform/Destiny2/Manifest/DestinyGuardianRankDefinition/${RankNum}/?lc=es`, {
                headers: {
                    'X-API-Key': 'f83a251bf2274914ab739f4781b5e710',
                },
            });
            return ({
                title: guardianRankResponse.data.Response.displayProperties.name,
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
        playersClan && playersClan.length > 0 && (
            <div className="text-white p-6 rounded-lg space-x-6 content-fit justify-between shadow-lg object-fill bg-center bg-cover w-fit bg-neutral-900" style={{ backgroundImage: `url('/api${playersClan[0]?.pgcrImg}')` }}>
                <div className="bg-black/25 p-2 rounded-lg w-fit">
                    <p className="flex items-center text-xl font-semibold mb-0 p-0 leading-tight">
                        Actividades con miembros del clan
                    </p>
                    <p className="italic text-xs leading-tight">Últimos 7 días</p>
                </div>
                <div className={`gap-3 grid grid-cols-2 w-fit mt-4`}>
                    {playersClan.map((jugador, idx) => (
                        <div key={idx} className="relative w-full">
                            <a
                                key={idx}
                                className="flex items-center gap-2 bg-black/25 p-2 rounded-lg w-full cursor-pointer transition-all duration-200 shadow-inner hover:scale-105 hover:shadow-lg hover:bg-black/40 clan-member-idle clan-member-shimmer"
                                onClick={() => setJugadorSelected(idx)}
                            >
                                <p className="text-lg font-semibold min-w-[2ch] text-center">{jugador.numero}.</p>
                                <img width={40} height={40} alt="Emblem" src={`/api${jugador.icon}`} />
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
        )
    );
}