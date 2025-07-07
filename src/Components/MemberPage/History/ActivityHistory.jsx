import { useEffect, useState } from 'react';
import circleEmpty from "../../../assets/circle-empty.svg";
import circleSolid from "../../../assets/circle-solid.svg";
import Completed from "../../../assets/Completed.png";
import medal from "../../../assets/medal-solid.svg";
import NotCompleted from "../../../assets/notCompleted.png";
import skull from "../../../assets/skull-solid.svg";
//import "../../../index.css";
import { useBungieAPI } from '../../APIservices/BungieAPIcache';
import Spinner from '../../Spinner';
import '../../Tab.css';
import PopUp from './PopUp';


const ActivityHistory = ({ userId, membershipType }) => {
    const [activityDetails, setActivityDetails] = useState([]);
    const [expandedIndex, setExpandedIndex] = useState(null);
    const [filteredActivities, setFilteredActivities] = useState([]);
    const [currentActivityType, setCurrentActivityType] = useState('Todas');
    const [weaponDetails, setWeaponDetails] = useState([]);
    const [isOpen, setIsOpen] = useState(false);
    const { getCompsProfile, getCarnageReport, getItemManifest, getCharacterActivities } = useBungieAPI();

    useEffect(() => {
        const fetchActivityHistory = async () => {
            try {
                const characterIds = await getCompsProfile(membershipType, userId);
                const allActivities = [];

                //Todos los personajes del usuario
                for (const characterId of characterIds.profile.data.characterIds) {
                    try {
                        const responseActs = await getCharacterActivities(membershipType, userId, characterId);
                        allActivities.push(...responseActs);
                    } catch (error) {
                        console.error(`Error fetching activities for character ${characterId}:`, error);
                    }
                }

                const sortedActivities = allActivities.sort((a, b) => new Date(b.period) - new Date(a.period));
                const recentActivities = sortedActivities.slice(0, 25);


                const details = await Promise.all(recentActivities.map(async (activity) => {
                    const activityMain = await fetchActivityDetails(activity.activityDetails.referenceId, "DestinyActivityDefinition");
                    const date = new Date(activity.period).toLocaleString('es-ES', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit',
                        hour12: false
                    }).replace(/(\d+)\/(\d+)\/(\d+)/, '$1/$2/$3');
                    const duration = formatDuration(activity.values.activityDurationSeconds.basic.value);
                    const carnageReport = await fetchCarnageReport(activity.activityDetails.instanceId);
                    const activityMode = await fetchActivityDetails(activity.activityDetails.directorActivityHash, "DestinyActivityDefinition");
                    let datosDelModo;
                    let modeHash = activityMode.directActivityModeHash || activityMode.activityTypeHash;
                    if (!modeHash) datosDelModo = null;
                    else datosDelModo = await fetchActivityDetails(modeHash, "DestinyActivityModeDefinition");

                    const clase = getUserClass(carnageReport)
                    let activityType;
                    if (activity.activityDetails.modes.includes(7)) {
                        activityType = "PvE";
                    } else if (activity.activityDetails.modes.includes(5) || activity.activityDetails.modes.includes(32)) {
                        activityType = "PvP";
                    } else if (activity.activityDetails.modes.includes(63)) {
                        activityType = "Gambito";
                    } else activityType = "PvE";
                    return {
                        activityName: activityMode?.displayProperties?.name || null,
                        activityIcon: datosDelModo?.displayProperties?.icon || null,
                        clase: clase || null,
                        pgcrImage: activityMain?.pgcrImage || null,
                        instanceId: activity.activityDetails.instanceId,
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
        const h = String(Math.floor(seconds / 3600)).padStart(2, '0');
        const m = String(Math.floor((seconds % 3600) / 60)).padStart(2, '0');
        const s = String(seconds % 60).padStart(2, '0');
        return `${h}:${m}:${s}`;
    }

    const getUserClass = (carnageReport) => {
        const user = carnageReport.people.find(person => person.membershipId == userId);

        if (!user) return null;

        console.log("User: ", user.class, carnageReport);

        const classIcons = {
            "Hechicero": "/api/common/destiny2_content/icons/571dd4d71022cbef932b9be873d431a9.png",
            "Hechicera": "/api/common/destiny2_content/icons/571dd4d71022cbef932b9be873d431a9.png",
            "Titán": "/api/common/destiny2_content/icons/707adc0d9b7b1fb858c16db7895d80cf.png",
            "Cazador": "/api/common/destiny2_content/icons/9bb43f897531bb6395bfefc82f2ec267.png",
            "Cazadora": "/api/common/destiny2_content/icons/9bb43f897531bb6395bfefc82f2ec267.png"
        };

        return {
            icon: classIcons[user.class] || null,
            name: user.class || null,
        };
    }

    const fetchCarnageReport = async (instanceId) => {
        try {
            const carnageReportResponse = await getCarnageReport(instanceId);
            const people = await Promise.all(carnageReportResponse.entries.map(async (entry) => ({
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
            const teams = carnageReportResponse.teams;

            return { people, teams };
        } catch (error) {
            console.error('Error fetching carnage report:', error);
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
                const weaponInfo = await fetchActivityDetails(weapon.referenceId, "DestinyInventoryItemDefinition");
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
    const fetchActivityDetails = async (activityHash, type, Subclase) => {
        try {
            const response = await getItemManifest(activityHash, type);
            if (response == null) return null;
            else return response;

        } catch (error) {
            console.error(`Error fetching activity details for hash ${activityHash}:`, error);
            return null;
        }
    };

    return (
        <div>
            <h2 className='text-2xl font-bold mt-8'>Historial de actividades</h2>
            <div className="flex mb-4">
                <button onClick={() => filterActivities(activityDetails, 'Todas')} className={`hover:bg-blue-400 hover:text-white px-4 py-2 cursor-pointer rounded-s-md ${currentActivityType === 'Todas' ? 'bg-blue-500 text-white' : 'bg-gray-300'}`}>Todas</button>
                <button onClick={() => filterActivities(activityDetails, 'PvE')} className={`hover:bg-blue-400 hover:text-white px-4 py-2 cursor-pointer  ${currentActivityType === 'PvE' ? 'bg-blue-500 text-white' : 'bg-gray-300'}`}>PvE</button>
                <button onClick={() => filterActivities(activityDetails, 'PvP')} className={`hover:bg-blue-400 hover:text-white px-4 py-2 cursor-pointer ${currentActivityType === 'PvP' ? 'bg-blue-500 text-white' : 'bg-gray-300'}`}>PvP</button>
                <button onClick={() => filterActivities(activityDetails, 'Gambito')} className={`hover:bg-blue-400 hover:text-white px-4 py-2 cursor-pointer rounded-e-md ${currentActivityType === 'Gambito' ? 'bg-blue-500 text-white' : 'bg-gray-300'}`}>Gambito</button>
            </div>
            {filteredActivities.length > 0 && (
                <div className={`py-2 px-10 text-sm text-start font-semibold justify-between flex items-center border-1`}>
                    <p className='w-[15%]'>Fecha/Hora</p>
                    <p className='w-[12%]'>Clase</p>
                    <p className='w-[28%]'>Actividad</p>
                    <p className='w-[10.5%]'>Duración</p>
                    <p className='w-[8%]'>Completado</p>
                </div>
            )}
            <div>
                {filteredActivities.length > 0 ? filteredActivities.map((activity, index) => {
                    const hasPoints = activity.people.some(person => person.points > 0);
                    const hasMedals = activity.people.some(person => person.medals > 0);

                    const team0 = activity.people.filter(person => person.standing === 0);
                    const team1 = activity.people.filter(person => person.standing === 1);

                    const uniqueId = activity.instanceId;

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
                        <div className={`bg-gray-300 hover:bg-white border-1`} key={uniqueId}>
                            <button onClick={() => toggleExpand(uniqueId)} className='cursor-pointer w-full h-[45px]'>
                                <div key={uniqueId} className={`py-2 px-10 text-sm text-start justify-between flex items-center`}>
                                    <p className='w-[15%]'>{activity.date}</p>
                                    <div className='w-[10%] flex items-center'>
                                        <img className='w-6 h-6' src={activity.clase.icon} style={{ filter: "brightness(0) contrast(100%)" }} />
                                        <p>{activity.clase.name}</p>
                                    </div> 
                                    <p className='w-[30%] flex items-center'>
                                        {activity.activityIcon && <img src={`/api${activity.activityIcon}`} className='w-6 h-6' style={{ filter: "brightness(0) contrast(100%)" }} />}
                                        {activity.activityName}
                                    </p>
                                    <p className='w-[10%]'>{activity.duration}</p>
                                    <div className='w-[8%] flex justify-center mr-1'>
                                        <img src={symbol} className='w-6 h-6' />
                                    </div>
                                </div>
                            </button>
                            <div className={`transition-all duration-500 ease-in-out overflow-hidden ${expandedIndex === (uniqueId) ? 'max-h-screen' : 'max-h-0'}`}>
                                {expandedIndex === (uniqueId) && (
                                    <div className='mt-2 p-6 bg-center bg-cover' style={{ backgroundImage: `url(/api${activity.pgcrImage})` }}>
                                        {activity.teams.length > 0 ? (
                                            <div className='justify-between space-y-4 w-full text-black'>
                                                <div>
                                                    <h3 className='text-lg font-bold flex items-center justify-between'>
                                                        <p className='px-1 rounded' style={{ backgroundColor: "rgba(255, 255, 255, 0.7)" }}>Equipo 1</p>
                                                        <span className='flex items-center px-1 rounded' style={{ backgroundColor: "rgba(255, 255, 255, 0.7)" }}>
                                                            {winnerPoints}
                                                            <img className='w-4 h-4 ml-2' src={userInTeam0 ? circleSolid : circleEmpty} style={{ filter: "invert(35%) sepia(92%) saturate(749%) hue-rotate(90deg) brightness(92%) contrast(92%)" }} />
                                                        </span>
                                                    </h3>
                                                    <table className='tablapartida'>
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
                                                                    {hasPoints && <td className='py-2' >{person.points}</td>}
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
                                                        <p className='px-1 rounded' style={{ backgroundColor: "rgba(255, 255, 255, 0.7)" }}>Equipo 2</p>
                                                        <span className='flex items-center px-1 rounded' style={{ backgroundColor: "rgba(255, 255, 255, 0.7)" }}>
                                                            {loserPoints}
                                                            <img className='w-4 h-4 ml-2' src={userInTeam1 ? circleSolid : circleEmpty} style={{ filter: "invert(12%) sepia(100%) saturate(7481%) hue-rotate(1deg) brightness(92%) contrast(92%)" }} />
                                                        </span>
                                                    </h3>
                                                    <table className='tablapartida'>
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
                                            <table className='min-w-full tablapartida text-black'>
                                                <thead >
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
            </div>
        </div>
    );
};

export default ActivityHistory;