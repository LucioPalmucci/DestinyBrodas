import axios from "axios";
import { useEffect, useState } from "react";
import { fetchActivityDetails } from "../RecentActivity";

export default function ClanTeammates({ userId, membershipType }) {
    const [activityClan, setActivity] = useState(null);
    const [jClan, setJugadoresClan] = useState([]);
    const [numColumns, setColumns] = useState(3);

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

            clan.data.Response.results.forEach(member => { // Recolectar los IDs de los miembros del clan
                if (member.destinyUserInfo.membershipId === userId) return;
                clanMemmbersIDs.push(member.destinyUserInfo.membershipId);
            })

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
            console.log("Actividades recientes: ", activity);
            let foundClanMate = false, jugadoresClan = [], addedPlayers = [], matchingActivity;

            for (const act of activity) {
                const carnageReportResponse = await axios.get(`/reporte/Platform/Destiny2/Stats/PostGameCarnageReport/${act.activityDetails.instanceId}/?lc=es`, {
                    headers: {
                        'X-API-Key': 'f83a251bf2274914ab739f4781b5e710',
                    },
                });

                for (const entry of carnageReportResponse.data.Response.entries) {
                    if (clanMemmbersIDs.includes(entry.player.destinyUserInfo.membershipId) && !addedPlayers.includes(entry.player.destinyUserInfo.membershipId)) {
                        foundClanMate = true;
                        console.log("Compañero de clan encontrado ", entry);
                        matchingActivity = act; // Guardar la actividad que contiene al compañero de clan
                        const partyEmblem = await getPartyEmblem(entry.player.destinyUserInfo.membershipId, entry.player.destinyUserInfo.membershipType, entry);
                        console.log("a: ", partyEmblem);
                        jugadoresClan.push({
                            name: entry.player.destinyUserInfo.displayName,
                            uniqueName: entry.player.destinyUserInfo.uniqueName,
                            icon: entry.player.destinyUserInfo.iconPath,
                            membershipId: entry.player.destinyUserInfo.membershipId,
                            membershipType: entry.player.destinyUserInfo.membershipType,
                            class: partyEmblem,
                        });
                        addedPlayers.push(entry.player.destinyUserInfo.membershipId);
                    }
                }
                if (foundClanMate) break; // Si encuentra un compañero de clan, salw del bucle
            }

            if (!foundClanMate) {
                console.log("No se encontraron compañeros de clan en las actividades recientes.");
            } else {
                const carnageReport = await fetchCarnageReport(matchingActivity.activityDetails.instanceId);
                const activityName = await axios.get(`/api/Platform/Destiny2/Manifest/DestinyActivityDefinition/${matchingActivity.activityDetails.directorActivityHash}/?lc=es`, {
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

                console.log("Actividad encontrada: ", matchingActivity);
                // Buscar la métrica que coincida con el numero del modo
                const matchingMetric = Object.values(metricsData.data).find(metric =>
                    metric.modeType == matchingActivity.activityDetails.mode
                );

                setActivity({
                    mode: matchingMetric.displayProperties.name,
                    activityName: activityName.data.Response.displayProperties.name,
                    date: new Date(matchingActivity.period).toLocaleString(),
                    duration: formatDuration(matchingActivity.values.activityDurationSeconds.basic.value),
                    icon: matchingMetric.displayProperties.icon,
                    bgImg: activityName.data.Response?.pgcrImage || null,
                    ...carnageReport,
                });
                setJugadoresClan(jugadoresClan);

                if (jugadoresClan.length > 3) {
                    setColumns(2)
                } else if (jugadoresClan.length > 6) {
                    setColumns(3)
                }
                else setColumns(1);
            }
        }
        fectchClanTeammates();
    }, []);

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
                name: entry.player.destinyUserInfo.displayName,
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
            console.log("Most recent character: ", charPlayed);
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
        activityClan && (
            <div className="text-white p-6 rounded-lg space-x-6 content-fit justify-between shadow-lg object-fill bg-center bg-cover w-fit" style={{ backgroundImage: `url(/api${activityClan.bgImg})` }}>
                <div className="bg-black/25 p-2 rounded-lg w-fit">
                    <p className="flex items-center text-xl font-semibold mb-0 p-0 leading-tight">
                        Actividades con el clan
                    </p>
                    <p className="italic text-xs leading-tight">Últimos 7 días</p>
                </div>
                {jClan.length > 0 && (
                    <div className="bg-black/25 p-2 rounded-lg w-fit mt-4">
                        <ul className={`space-x-6 grid ${numColumns == 3 ? "grid-cols-3 text-sm" : numColumns == 2 ? "grid-cols-2" : "grid-cols-1"}  gap-2`}>
                            {jClan.map((jugador, index) => (
                                <a key={index} className="flex items-center space-x-1" href={`/DestinyBrodas/member/${jugador.membershipType}/${jugador.membershipId}`} target='_blank' rel='noreferrer noopener'>
                                    <img width={40} height={40} alt="Emblem" src={`/api${jugador.icon}`} />
                                    <div className="flex flex-col">
                                        <span title={jugador.uniqueName}>{jugador.name}</span>
                                        <span>{jugador.class.clase} <i className={`icon-${jugador.class.subclass}`} style={{ fontStyle: "normal" }} /> - {jugador.class.light}</span>
                                    </div>
                                </a>
                            ))}
                        </ul>
                    </div>
                )}
            </div>)
    );
}