import axios from 'axios';
import React, { useEffect, useState } from 'react';
import circleEmpty from "../../assets/circle-empty.svg";
import circleSolid from "../../assets/circle-solid.svg";
import { fetchActivityDetails } from '../RecentActivity';
import Spinner from '../Spinner';

const ActivityHistory = ({ userId, membershipType }) => {
    const [activityDetails, setActivityDetails] = useState([]);
    const [expandedIndex, setExpandedIndex] = useState(null);

    useEffect(() => {
        const fetchActivityHistory = async () => {
            try {
                const userData = await axios.get(`/api/Platform/Destiny2/${membershipType}/Profile/${userId}/?components=Characters&lc=es`, {
                    headers: {
                        'X-API-Key': 'f83a251bf2274914ab739f4781b5e710',
                    },
                });

                const characterIds = userData.data.Response.characters.data;
                const mostRecentCharacter = Object.values(characterIds).reduce((latest, current) => {
                    return new Date(current.dateLastPlayed) > new Date(latest.dateLastPlayed) ? current : latest;
                });

                const response = await axios.get(`/api/Platform/Destiny2/${membershipType}/Account/${userId}/Character/${mostRecentCharacter.characterId}/Stats/Activities/?lc=es`, {
                    headers: {
                        'X-API-Key': 'f83a251bf2274914ab739f4781b5e710',
                    },
                });
                //console.log("Lista de las actividades: ", response.data.Response.activities);

                const details = await Promise.all(response.data.Response.activities.map(async (activity) => {
                    const activityName = await fetchActivityDetails(activity.activityDetails.directorActivityHash, "DestinyActivityDefinition");
                    const date = new Date(activity.period).toLocaleString();
                    const duration = formatDuration(activity.values.activityDurationSeconds.basic.value);
                    const carnageReport = await fetchCarnageReport(activity.activityDetails.instanceId);

                    return {
                        activityName,
                        date,
                        duration,
                        ...carnageReport,
                    };
                }));
                setActivityDetails(details);
            } catch (error) {
                console.error('Error fetching activity history:', error);
            }
        };
        fetchActivityHistory();
    }, [userId, membershipType]);

    const formatDuration = (seconds) => {
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = seconds % 60;
        let horas = h > 1 ? 'horas' : 'hora';
        let minutos = m != 1 ? 'minutos' : 'minuto';
        let segundos = s != 1 ? 'segundos' : 'segundo';
        if (h > 0) {
            return `${h} ${horas} ${m} ${minutos} ${s} ${segundos}`;
        } else {
            return `${m} ${minutos} ${s} ${segundos}`;
        }
    }

    const fetchCarnageReport = async (instanceId) => {
        try {
            const carnageReportResponse = await axios.get(`/reporte/Platform/Destiny2/Stats/PostGameCarnageReport/${instanceId}/?lc=es`, {
                headers: {
                    'X-API-Key': 'f83a251bf2274914ab739f4781b5e710',
                },
            });
            //console.log("Carnage Report: ", carnageReportResponse.data.Response);
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
            })));
            const teams = carnageReportResponse.data.Response.teams;

            return { people, teams };
        } catch (error) {
            console.error('Error fetching carnage report:', error);
            return { people, teams: [] }; // Valores por defecto en caso de error
        }
    };

    const toggleExpand = (index) => {
        setExpandedIndex(expandedIndex === index ? null : index);
    };

    return (
        <div>
            <h2 className='text-2xl font-bold mt-8'>Historial de actividades</h2>
            <ul>
                {activityDetails.length > 0 ? activityDetails.map((activity, index) => {
                    const hasPoints = activity.people.some(person => person.points > 0);
                    const hasMedals = activity.people.some(person => person.medals > 0);

                    const team0 = activity.people.filter(person => person.standing === 0);
                    const team1 = activity.people.filter(person => person.standing === 1);

                    const userInTeam0 = activity.people.some(person => person.standing === 0 && person.membershipId === userId);
                    const userInTeam1 = activity.people.some(person => person.standing === 1 && person.membershipId === userId);

                    let winnerPoints, loserPoints;
                    if (activity.teams.length > 0) {
                        winnerPoints = activity.teams[0].standing.basic.value == 0 ? activity.teams[0].score.basic.value : activity.teams[1].score.basic.value;
                        loserPoints = activity.teams[0].standing.basic.value == 1 ? activity.teams[0].score.basic.value : activity.teams[1].score.basic.value;
                    }

                    return (
                        <div className='w-full'>
                            <button onClick={() => toggleExpand(index)} className='cursor-pointer'>
                                <li key={index} className='flex space-x-6 p-4 text-xl '>
                                    <p>{activity.activityName}</p>
                                    <p>{activity.date}</p>
                                    <p>{activity.duration}</p>
                                </li>
                            </button>
                            <div className={`transition-all duration-500 ease-in-out overflow-hidden ${expandedIndex === index ? 'max-h-screen' : 'max-h-0'}`}>
                                {expandedIndex === index && (
                                    <div className='mt-2'>
                                        {activity.teams.length > 0 ? (
                                            <div className='flex justify-between'>
                                                <div>
                                                    <h3 className='text-lg font-bold flex items-center justify-between'>
                                                        Equipo 1
                                                        <span className='flex items-center'>
                                                            {winnerPoints}
                                                            <img className='w-4 h-4 ml-2' src={userInTeam0 ? circleSolid : circleEmpty} style={{ filter: "invert(35%) sepia(92%) saturate(749%) hue-rotate(90deg) brightness(92%) contrast(92%)" }} />
                                                        </span>
                                                    </h3>
                                                    <table className='min-w-full bg-white'>
                                                        <thead>
                                                            <tr>
                                                                <th className='py-2'>Nombre</th>
                                                                {hasPoints && <th className='py-2'>Puntos</th>}
                                                                <th className='py-2'>Kills</th>
                                                                <th className='py-2'>Muertes</th>
                                                                <th className='py-2'>KD</th>
                                                                {hasMedals && <th className='py-2'>Medallas</th>}
                                                            </tr>
                                                        </thead>
                                                        <tbody>
                                                            {team0.map((person, idx) => (
                                                                <tr key={idx} className='text-start text-sm'>
                                                                    <td className='py-2 flex items-center'>
                                                                        <img src={`/api/${person.emblem}`} width={40} height={40} alt="Emblem" className='rounded' />
                                                                        <div className='flex flex-col justify-center ml-1'>
                                                                            <p>{person.name}</p>
                                                                            <p>{person.class} - {person.power}</p>
                                                                        </div>
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
                                                        <span className='flex items-center'>
                                                            <img className='w-4 h-4 mr-2' src={userInTeam1 ? circleSolid : circleEmpty} style={{ filter: "invert(12%) sepia(100%) saturate(7481%) hue-rotate(1deg) brightness(92%) contrast(92%)" }} />
                                                            {loserPoints}
                                                        </span>
                                                        Equipo 2
                                                    </h3>
                                                    <table className='min-w-full bg-white'>
                                                        <thead>
                                                            <tr>
                                                                <th className='py-2'>Nombre</th>
                                                                {hasPoints && <th className='py-2'>Puntos</th>}
                                                                <th className='py-2'>Kills</th>
                                                                <th className='py-2'>Muertes</th>
                                                                <th className='py-2'>KD</th>
                                                                {hasMedals && <th className='py-2'>Medallas</th>}
                                                            </tr>
                                                        </thead>
                                                        <tbody>
                                                            {team1.map((person, idx) => (
                                                                <tr key={idx} className='text-start text-sm'>
                                                                    <td className='py-2 flex items-center'>
                                                                        <img src={`/api/${person.emblem}`} width={40} height={40} alt="Emblem" className='rounded' />
                                                                        <div className='flex flex-col justify-center ml-1'>
                                                                            <p>{person.name}</p>
                                                                            <p>{person.class} - {person.power}</p>
                                                                        </div>
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
                                            <table className='min-w-full bg-white'>
                                                <thead>
                                                    <tr>
                                                        <th className='py-2'>Nombre</th>
                                                        {hasPoints && <th className='py-2'>Puntos</th>}
                                                        <th className='py-2'>Kills</th>
                                                        <th className='py-2'>Muertes</th>
                                                        <th className='py-2'>KD</th>
                                                        {hasMedals && <th className='py-2'>Medallas</th>}
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {activity.people.map((person, idx) => (
                                                        <tr key={idx} className='text-start text-sm'>
                                                            <td className='py-2 flex items-center'>
                                                                <img src={`/api/${person.emblem}`} width={40} height={40} alt="Emblem" className='rounded' />
                                                                <div className='flex flex-col justify-center ml-1'>
                                                                    <p>{person.name}</p>
                                                                    <p>{person.class} - {person.power}</p>
                                                                </div>
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
                                        )}
                                    </div>
                                )}
                            </div>
                            <hr />
                        </div>
                    );
                }) : (
                    <div className='top-0'><Spinner/></div>
                )}
            </ul>
        </div>
    );
};

export default ActivityHistory;