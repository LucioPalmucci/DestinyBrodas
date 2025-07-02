import axios from "axios";
import { useEffect, useState } from "react";
import { fetchActivityDetails } from "../RecentActivity";
import PopUpClanTeammates from "./PopUpClanTeammates";


export default function ClanTeammates({ userId, membershipType }) {
    const [playersClan, setJugadoresClan] = useState([]);
    const [jugadorSelected, setJugadorSelected] = useState(null);

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
                        const partyEmblem = await getPartyEmblem(entry.player.destinyUserInfo.membershipId, entry.player.destinyUserInfo.membershipType, entry);
                        jugadoresClan.push({
                            name: entry.player.destinyUserInfo.displayName,
                            uniqueName: entry.player.destinyUserInfo.bungieGlobalDisplayName + "#" + entry.player.destinyUserInfo.bungieGlobalDisplayNameCode,
                            icon: entry.player.destinyUserInfo.iconPath,
                            emblemHash: entry.player.emblemHash,
                            membershipId: entry.player.destinyUserInfo.membershipId,
                            membershipType: entry.player.destinyUserInfo.membershipType,
                            class: partyEmblem,
                            light: entry.player.lightLevel,
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

    const fetchCarnageReport = async (instanceId) => {
        try {
            const carnageReportResponse = await axios.get(`/reporte/Platform/Destiny2/Stats/PostGameCarnageReport/${instanceId}/?lc=es`, {
                headers: {
                    'X-API-Key': 'f83a251bf2274914ab739f4781b5e710',
                },
            });
            const people = await Promise.all(carnageReportResponse.data.Response.entries.map(async (entry) => ({
                kills: entry.values.kills.basic.value,
                kd: entry.values.killsDeathsRatio.basic.value.toFixed(1),
                deaths: entry.values.deaths.basic.value,
                medals: entry.extended?.values?.allMedalsEarned?.basic?.value || 0,
                points: entry.values.score.basic.value,
                name: entry.player.destinyUserInfo.bungieGlobalDisplayName + "#" + entry.player.destinyUserInfo.bungieGlobalDisplayNameCode,
                emblem: entry.player.destinyUserInfo.iconPath,
                class: entry.player.characterClass,
                power: entry.player.lightLevel,
                membershipId: entry.player.destinyUserInfo.membershipId,
                standing: entry.standing,
                completed: entry.values.completed.basic.value,
                values: entry.extended?.values,
                weapons: entry.extended?.weapons,
                timePlayedSeconds: entry.values.timePlayedSeconds.basic.displayValue,
                assists: entry.values.assists.basic.value,
            })));
            const teams = carnageReportResponse.data.Response.teams;

            return { people, teams };
        } catch (error) {
            //console.error('Error fetching carnage report:', error);
            return { people, teams: [] }; // Valores por defecto en caso de error
        }
    };

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

    const getPartyEmblem = async (id, type, mostRecentCharacter) => {
        try {
            const response = await axios.get(`/api/Platform/Destiny2/${type}/Profile/${id}/?components=Characters,CharacterEquipment&lc=es`, {
                headers: {
                    'X-API-Key': 'f83a251bf2274914ab739f4781b5e710',
                },
            });
            const characters = response.data.Response.characters.data;
            const equipment = response.data.Response.characterEquipment.data;
            const charPlayed = characters[mostRecentCharacter.characterId];
            let clase;
            //console.log("Most recent character: ", charPlayed);
            switch (charPlayed.classType) {
                case 0: // Titán
                    clase = charPlayed.genderType === 0 ? "Titán" : "Titán";
                    break;
                case 1: // Cazador
                    clase = charPlayed.genderType === 0 ? "Cazador" : "Cazadora";
                    break;
                case 2: // Hechicero
                    clase = charPlayed.genderType === 0 ? "Hechicero" : "Hechicera";
                    break;
                default:
                    clase = "Desconocido";
            }

            const equippedSubclass = equipment[charPlayed.characterId].items.find(item => item.bucketHash === 3284755031);
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

            return { clase: clase, light: charPlayed.light, subclass: subclass };

        } catch (error) {
            console.error('Error fetching equipped emblem:', error);
            return null;
        }
    };

    return (
        playersClan && playersClan.length > 0 && (
            <div className="font-Inter text-white p-6 rounded-lg space-x-6 content-fit justify-between shadow-lg object-fill bg-center bg-cover w-fit bg-neutral-900" style={{ backgroundImage: `url('/api${playersClan[0]?.pgcrImg}')` }}>
                <div className="bg-black/25 p-2 rounded-lg w-fit">
                    <p className="flex items-center text-xl font-semibold mb-0 p-0 leading-tight">
                        Actividades con miembros del clan
                    </p>
                    <p className="italic text-xs leading-tight">Últimos 7 días</p>
                </div>
                <div className={`gap-3 grid grid-cols-2 w-fit mt-4`}>
                    {playersClan.map((jugador, idx) => (
                        <div key={idx} className="relative w-full">
                            <a key={idx} className="flex items-center gap-2 bg-black/25 p-2 rounded-lg w-full" onClick={() => setJugadorSelected(idx)}>
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
                                <div className="absolute left-full top-0 z-50 ml-2">
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