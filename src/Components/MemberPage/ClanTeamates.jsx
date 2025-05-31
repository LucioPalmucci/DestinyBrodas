import axios from "axios";
import { useEffect, useRef, useState } from "react";
import circleEmpty from "../../assets/circle-empty.svg";
import circleSolid from "../../assets/circle-solid.svg";
import Completed from "../../assets/completed.png";
import medal from "../../assets/medal-solid.svg";
import NotCompleted from "../../assets/notCompleted.png";
import skull from "../../assets/skull-solid.svg";

export default function ClanTeammates({ userId, membershipType }) {
    const [activityClan, setActivity] = useState(null);
    const [jClan, setJugadoresClan] = useState([]);
    const [expandedIndex, setExpandedIndex] = useState(null);
    const [isOpen, setIsOpen] = useState(null);
    const [hasPoints, setHasPoints] = useState(false);
    const [hasMedals, setHasMedals] = useState(false);
    const [team0, setTeam0] = useState([]);
    const [team1, setTeam1] = useState([]);
    const [userInTeam0, setUserInTeam0] = useState(false);
    const [userInTeam1, setUserInTeam1] = useState(false);
    const [userCompleted, setUserCompleted] = useState(false);
    const [winnerPoints, setWinnerPoints] = useState(0);
    const [loserPoints, setLoserPoints] = useState(0);
    const [symbol, setSymbolComp] = useState(Completed);
    const containerRef = useRef(null);

    useEffect(() => {
        const fectchClanTeammates = async () => {
            const userData = await axios.get(`/api/Platform/Destiny2/${membershipType}/Profile/${userId}/?components=Characters&lc=es`, {
                headers: {
                    'X-API-Key': 'f83a251bf2274914ab739f4781b5e710',
                },
            });

            const characterIds = userData.data.Response.characters.data;
            const mostRecentCharacter = Object.values(characterIds).reduce((latest, current) => {
                return new Date(current.dateLastPlayed) > new Date(latest.dateLastPlayed) ? current : latest;
            });
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

            const activity = await axios.get(`/api/Platform/Destiny2/${membershipType}/Account/${userId}/Character/${mostRecentCharacter.characterId}/Stats/Activities/?lc=es`, {
                headers: {
                    'X-API-Key': 'f83a251bf2274914ab739f4781b5e710',
                },
            });

            let foundClanMate = false, jugadoresClan = [], addedPlayers = [], matchingActivity;

            for (const act of activity.data.Response.activities) {
                const carnageReportResponse = await axios.get(`/reporte/Platform/Destiny2/Stats/PostGameCarnageReport/${act.activityDetails.instanceId}/?lc=es`, {
                    headers: {
                        'X-API-Key': 'f83a251bf2274914ab739f4781b5e710',
                    },
                });

                carnageReportResponse.data.Response.entries.forEach(entry => {
                    if (clanMemmbersIDs.includes(entry.player.destinyUserInfo.membershipId) && !addedPlayers.includes(entry.player.destinyUserInfo.membershipId)) {
                        foundClanMate = true;
                        console.log("Compañero de clan encontrado ", entry.player.destinyUserInfo.membershipId);
                        matchingActivity = act; // Guardar la actividad que contiene al compañero de clan
                        jugadoresClan.push({
                            name: entry.player.destinyUserInfo.displayName,
                            icon: entry.player.destinyUserInfo.iconPath,
                            membershipId: entry.player.destinyUserInfo.membershipId,
                            membershipType: entry.player.destinyUserInfo.membershipType,
                        });
                        addedPlayers.push(entry.player.destinyUserInfo.membershipId);
                    }
                });
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
                    ...carnageReport,
                });
                setJugadoresClan(jugadoresClan);

                const allPeople = (matchingActivity.people || []);
                setHasPoints(allPeople.some(person => person.points > 0));
                setHasMedals(allPeople.some(person => person.medals > 0));
                setTeam0(allPeople.filter(person => Number(person.standing) === 0));
                setUserCompleted(allPeople.some(person => person.membershipId === userId && person.completed));
                setTeam1(allPeople.filter(person => Number(person.standing) === 1));
                setUserInTeam0(allPeople.some(person => Number(person.standing) === 0 && person.membershipId === userId));
                setUserInTeam1(allPeople.some(person => Number(person.standing) === 1 && person.membershipId === userId));

                if (userInTeam1 || userCompleted) {
                    setSymbolComp(NotCompleted);
                } else {
                    setSymbolComp(Completed);
                }

                let winnerPoints, loserPoints;
                if (matchingActivity.teams && matchingActivity.teams.length > 0) {
                    winnerPoints = matchingActivity.teams[0].standing.basic.value == 0 ? matchingActivity.teams[0].score.basic.value : matchingActivity.teams[1]?.score.basic.value;
                    loserPoints = matchingActivity.teams[0].standing.basic.value == 1 ? matchingActivity.teams[0].score.basic.value : matchingActivity.teams[1]?.score.basic.value;
                }
                setWinnerPoints(winnerPoints);
                setLoserPoints(loserPoints);
            }
        }
        fectchClanTeammates();
    }, []);


    const toggleExpand = () => {
        setExpandedIndex(prev => !prev);
    };

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

    return (
        <div className="w-2/3 bg-neutral-300 p-4 rounded-lg">
            <p className='text-2xl font-bold'>Actividad mas reciente con compañeros del clan:</p>
            <button onClick={() => toggleExpand()} className='cursor-pointer w-full'>
                {activityClan && (
                    <div>
                        <div className="flex items-center space-x-4">
                            <img className="w-10" src={`/api${activityClan.icon}`} alt={activityClan.mode} />
                            <p className='text-xl font-bold'>{activityClan.activityName}, {activityClan.mode}</p>
                            <img src={symbol} className='w-6 h-6' />
                        </div>
                        <div className="flex flex-col text-lg">
                            <p>Fecha: {activityClan.date}</p>
                            <p>Duración: {activityClan.duration}</p>
                        </div>
                    </div>
                )}
                {jClan.length > 0 && (
                    <div className="justify-start flex flex-col">
                        <p className='text-xl font-bold'>Compañeros del clan:</p>
                        <div className="grid grid-cols-3 grid-rows-2 gap-1">
                            {jClan.map((jugador, index) => (
                                <a key={index} className="flex items-center space-x-2" href={`/DestinyBrodas/member/${jugador.membershipType}/${jugador.membershipId}`} target='_blank' rel='noreferrer noopener'>
                                    <img className="w-10 mb-1" src={`/api${jugador.icon}`} alt={jugador.name} />
                                    <span className="font-Inter">{jugador.name}</span>
                                </a>
                            ))}
                        </div>
                    </div>
                )}
            </button>
            {!activityClan && <p>No se encontraron actividades recientes con compañeros del clan.</p>}
            <div className={`transition-all duration-500 ease-in-out overflow-hidden ${expandedIndex ? 'max-h-screen' : 'max-h-0'}`}>
                {expandedIndex && (
                    <div className='mt-2 p-6 bg-white'>
                        {activityClan.teams.length > 0 ? (
                            <div className='justify-between space-y-4 w-full'>
                                <div>
                                    <h3 className='text-lg font-bold flex items-center justify-between'>
                                        Equipo 1
                                        <span className='flex items-center'>
                                            {winnerPoints}
                                            <img className='w-4 h-4 ml-2' src={userInTeam0 ? circleSolid : circleEmpty} style={{ filter: "invert(35%) sepia(92%) saturate(749%) hue-rotate(90deg) brightness(92%) contrast(92%)" }} />
                                        </span>
                                    </h3>
                                    <table className='bg-white tablapartida'>
                                        <thead>
                                            <tr>
                                                <th className='py-2'>Nombre</th>
                                                {hasPoints && <th className='py-2'>Puntos</th>}
                                                <th className='py-2' title='Bajas'><i className='icon-kills2' style={{ filter: "invert(100%)" }}></i></th>
                                                <th className='py-2' title='Muertes'><img src={skull} className="mr-2" width={15} height={15} /></th>
                                                <th className='py-2'>KD</th>
                                                {hasMedals && <th className='py-2' title='medallas'><img src={medal} className="mr-2" width={15} height={15} /></th>}
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {team0.map((person, idx) => (
                                                <tr key={idx} className={`text-start ${person.membershipId === userId ? "font-bold" : ""}`}>
                                                    <td className='py-2 text-xs w-fit'>
                                                        <button onClick={() => setIsOpen(person)} className='flex items-center text-start '>
                                                            <img src={`/api/${person.emblem}`} width={30} height={30} alt="Emblem" className='rounded' />
                                                            <div className='flex flex-col justify-start ml-1'>
                                                                <p>{person.name}</p>
                                                                <p>{person.class} - {person.power}</p>
                                                            </div>
                                                        </button>
                                                    </td>
                                                    {hasPoints && <td className='py-2'>{person.points}</td>}
                                                    <td className='py-2'>{person.kills}</td>
                                                    <td className='py-2'>{person.deaths}</td>
                                                    <td className='py-2'>{person.kd}</td>
                                                    {hasMedals && <td className='py-2'>{person.medals}</td>}
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                                <div>
                                    <h3 className='text-lg font-bold flex items-center justify-between'>
                                        Equipo 2
                                        <span className='flex items-center'>
                                            {loserPoints}
                                            <img className='w-4 h-4 ml-2' src={userInTeam1 ? circleSolid : circleEmpty} style={{ filter: "invert(12%) sepia(100%) saturate(7481%) hue-rotate(1deg) brightness(92%) contrast(92%)" }} />
                                        </span>
                                    </h3>
                                    <table className='bg-white tablapartida'>
                                        <thead>
                                            <tr>
                                                <th className='py-2'>Nombre</th>
                                                {hasPoints && <th className='py-2'>Puntos</th>}
                                                <th className='py-2' title='Bajas'><i className='icon-kills2' style={{ filter: "invert(100%)" }}></i></th>
                                                <th className='py-2' title='Muertes'><img src={skull} className="mr-2" width={15} height={15} /></th>
                                                <th className='py-2'>KD</th>
                                                {hasMedals && <th className='py-2' title='medallas'><img src={medal} className="mr-2" width={15} height={15} /></th>}
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {team1.map((person, idx) => (
                                                <tr key={idx} className={`text-start ${person.membershipId === userId ? "font-bold" : ""}`}>
                                                    <td className='py-2 text-xs w-fit'>
                                                        <button onClick={() => setIsOpen(person)} className='flex items-center text-start'>
                                                            <img src={`/api/${person.emblem}`} width={30} height={30} alt="Emblem" className='rounded' />
                                                            <div className='flex flex-col justify-center ml-1'>
                                                                <p>{person.name}</p>
                                                                <p>{person.class} - {person.power}</p>
                                                            </div>
                                                        </button>
                                                    </td>
                                                    {hasPoints && <td className='py-2'>{person.points}</td>}
                                                    <td className='py-2'>{person.kills}</td>
                                                    <td className='py-2'>{person.deaths}</td>
                                                    <td className='py-2'>{person.kd}</td>
                                                    {hasMedals && <td className='py-2'>{person.medals}</td>}
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        ) : (
                            <table className='min-w-full bg-white tablapartida'>
                                <thead>
                                    <tr>
                                        <th className='py-2'>Nombre</th>
                                        {hasPoints && <th className='py-2'>Puntos</th>}
                                        <th className='py-2' title='Bajas'><i className='icon-kills2' style={{ filter: "invert(100%)" }}></i></th>
                                        <th className='py-2' title='Muertes'><img src={skull} className="mr-2" width={15} height={15} /></th>
                                        <th className='py-2'>KD</th>
                                        {hasMedals && <th className='py-2' title='medallas'><img src={medal} className="mr-2" width={15} height={15} /></th>}
                                    </tr>
                                </thead>
                                <tbody>
                                    {activityClan.people.map((person, idx) => (
                                        <tr key={idx} className={`text-start text-sm ${person.membershipId == userId ? "font-bold" : ""}`}>
                                            <td className='py-2 text-xs w-fit ' onClick={() => setIsOpen(person)}>
                                                <button onClick={() => setIsOpen(person)} className='flex items-center text-start'>
                                                    <img src={`/api/${person.emblem}`} width={30} height={30} alt="Emblem" className='rounded' />
                                                    <div className='flex flex-col justify-center ml-1'>
                                                        <p>{person.name}</p>
                                                        <p>{person.class} - {person.power}</p>
                                                    </div>
                                                </button>
                                            </td>
                                            {hasPoints && <td>{person.points}</td>}
                                            <td>{person.kills}</td>
                                            <td>{person.deaths}</td>
                                            <td>{person.kd}</td>
                                            {hasMedals && <td>{person.medals}</td>}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}