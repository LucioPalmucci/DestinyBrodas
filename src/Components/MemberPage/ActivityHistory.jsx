import axios from 'axios';
import React, { useEffect, useState } from 'react';
import circleEmpty from "../../assets/circle-empty.svg";
import circleSolid from "../../assets/circle-solid.svg";
import Completed from "../../assets/Completed.png";
import medal from "../../assets/medal-solid.svg";
import NotCompleted from "../../assets/notCompleted.png";
import skull from "../../assets/skull-solid.svg";
import "../../index.css";
import { fetchActivityDetails } from '../RecentActivity';
import Spinner from '../Spinner';
import '../Tab.css';
import PopUp from './PopUp';


const ActivityHistory = ({ userId, membershipType }) => {
    const [activityDetails, setActivityDetails] = useState([]);
    const [expandedIndex, setExpandedIndex] = useState(null);
    const [filteredActivities, setFilteredActivities] = useState([]);
    const [currentActivityType, setCurrentActivityType] = useState('Todas');
    const [weaponDetails, setWeaponDetails] = useState([]);
    const [isOpen, setIsOpen] = useState(false);

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

                const details = await Promise.all(response.data.Response.activities.map(async (activity) => {
                    const activityName = await fetchActivityDetails(activity.activityDetails.directorActivityHash, "DestinyActivityDefinition");
                    const date = new Date(activity.period).toLocaleString();
                    const duration = formatDuration(activity.values.activityDurationSeconds.basic.value);
                    const carnageReport = await fetchCarnageReport(activity.activityDetails.instanceId);
                    const modoDeLaActividad = await fetchActivityDetails(activity.activityDetails.directorActivityHash, "DestinyActivityDefinition", "general");
                    let datosDelModo;
                    if (!modoDeLaActividad.directActivityModeHash) datosDelModo == null;
                    else datosDelModo = await fetchActivityDetails(modoDeLaActividad.directActivityModeHash, "DestinyActivityModeDefinition", "general");

                    let activityType;
                    if (activity.activityDetails.modes.includes(7)) {
                        activityType = "PvE";
                    } else if (activity.activityDetails.modes.includes(5) || activity.activityDetails.modes.includes(32)) {
                        activityType = "PvP";
                    } else if (activity.activityDetails.modes.includes(63)) {
                        activityType = "Gambito";
                    } else activityType = "PvE";

                    return {
                        activityName,
                        activityIcon: datosDelModo?.displayProperties?.icon || null,
                        activityType,
                        date,
                        duration,
                        ...carnageReport,
                    };
                }));
                setActivityDetails(details);
                filterActivities(details, 'Todas');
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
            return `${h} ${horas} ${m} ${minutos}`;
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

    const filterActivities = (activities, type) => {
        if (type === "Todas") {
            setFilteredActivities(activities);
        } else {
            const filtered = activities.filter(activity => activity.activityType === type);
            setFilteredActivities(filtered);
        }
        setCurrentActivityType(type);
    };

    const toggleExpand = (index) => {
        setExpandedIndex(expandedIndex === index ? null : index);
    };

    useEffect(() => {
        if (isOpen != false) {
            getWeaponDetails();
        }
    }, [isOpen]);

    const getWeaponDetails = async () => {
        if (isOpen != false) {
            const weaponD = await Promise.all(isOpen.weapons.map(async (weapon) => {
                const weaponInfo = await fetchActivityDetails(weapon.referenceId, "DestinyInventoryItemDefinition", "general");
                //console.log("Weapon Info: ", weaponInfo);
                return {
                    name: weaponInfo.displayProperties.name,
                    icon: weaponInfo.displayProperties.icon,
                    archetype: weaponInfo.itemTypeDisplayName,
                    kills: weapon.values.uniqueWeaponKills.basic.value,
                    precisionKills: weapon.values.uniqueWeaponPrecisionKills.basic.value,
                    precisionKillsPercentage: weapon.values.uniqueWeaponKillsPrecisionKills.basic.displayValue,
                };
            }));
            setWeaponDetails(weaponD);
        }
    }
    return (
        <div className='w-2/3'>
            <h2 className='text-2xl font-bold mt-8'>Historial de actividades</h2>
            <div className="flex mb-4">
                <button onClick={() => filterActivities(activityDetails, 'Todas')} className={`hover:bg-blue-400 hover:text-white px-4 py-2 cursor-pointer rounded-s-md ${currentActivityType === 'Todas' ? 'bg-blue-500 text-white' : 'bg-gray-300'}`}>Todas</button>
                <button onClick={() => filterActivities(activityDetails, 'PvE')} className={`hover:bg-blue-400 hover:text-white px-4 py-2 cursor-pointer  ${currentActivityType === 'PvE' ? 'bg-blue-500 text-white' : 'bg-gray-300'}`}>PvE</button>
                <button onClick={() => filterActivities(activityDetails, 'PvP')} className={`hover:bg-blue-400 hover:text-white px-4 py-2 cursor-pointer ${currentActivityType === 'PvP' ? 'bg-blue-500 text-white' : 'bg-gray-300'}`}>PvP</button>
                <button onClick={() => filterActivities(activityDetails, 'Gambito')} className={`hover:bg-blue-400 hover:text-white px-4 py-2 cursor-pointer rounded-e-md ${currentActivityType === 'Gambito' ? 'bg-blue-500 text-white' : 'bg-gray-300'}`}>Gambito</button>
            </div>
            <ul>
                {filteredActivities.length > 0 ? filteredActivities.map((activity, index) => {
                    const hasPoints = activity.people.some(person => person.points > 0);
                    const hasMedals = activity.people.some(person => person.medals > 0);

                    const team0 = activity.people.filter(person => person.standing === 0);
                    const team1 = activity.people.filter(person => person.standing === 1);

                    const userInTeam0 = activity.people.some(person => person.standing === 0 && person.membershipId === userId);
                    const userInTeam1 = activity.people.some(person => person.standing === 1 && person.membershipId === userId);

                    const userCompleted = activity.people.some(person => person.membershipId === userId && person.completed === 1);
                    let symbol;
                    if (!userCompleted || userInTeam1) symbol = NotCompleted;
                    else symbol = Completed;

                    let winnerPoints, loserPoints;
                    if (activity.teams.length > 0) {
                        winnerPoints = activity.teams[0].standing.basic.value == 0 ? activity.teams[0].score.basic.value : activity.teams[1]?.score.basic.value;
                        loserPoints = activity.teams[0].standing.basic.value == 1 ? activity.teams[0].score.basic.value : activity.teams[1]?.score.basic.value;
                    }

                    return (
                        <div className={`w-full bg-gray-300 rounded-lg mt-4 border-1`} key={index}>
                            <button onClick={() => toggleExpand(index)} className='cursor-pointer w-full'>
                                <li key={index} className={`p-2 text-sm justify-evenly flex items-center`}>
                                    <p>{activity.date}</p>
                                    {activity.activityIcon && <img src={`/api${activity.activityIcon}`} className='w-8 h-8' style={{ filter: "brightness(0) contrast(100%)" }} />}
                                    <p>{activity.activityName}</p>
                                    <p>{activity.duration}</p>
                                    <img src={symbol} className='w-6 h-6' />
                                </li>
                            </button>
                            <div className={`transition-all duration-500 ease-in-out overflow-hidden ${expandedIndex === index ? 'max-h-screen' : 'max-h-0'}`}>
                                {expandedIndex === index && (
                                    <div className='mt-2 p-6 bg-white'>
                                        {activity.teams.length > 0 ? (
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
                                                    {activity.people.map((person, idx) => (
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
                            {isOpen && weaponDetails && (
                                <PopUp isOpen={isOpen} weaponDetails={weaponDetails} setIsOpen={setIsOpen} />
                            )}
                        </div>
                    );
                }) : (
                    <div className='top-0'><Spinner /></div>
                )}
            </ul>
        </div>
    );
};

export default ActivityHistory;