import { useEffect, useRef, useState } from 'react';
import circleEmpty from "../../../assets/circle-empty.svg";
import circleSolid from "../../../assets/circle-solid.svg";
import Completed from "../../../assets/Completed.png";
import medal from "../../../assets/medal-solid.svg";
import NotCompleted from "../../../assets/notCompleted.png";
import skull from "../../../assets/skull-solid.svg";
//import "../../../index.css";
import { API_CONFIG } from '../../../config';
import { useBungieAPI } from '../../APIservices/BungieAPIcache';
import '../../Tab.css';
import PopUp from './PopUp';


const ActivityHistory = ({ userId, membershipType }) => {
    const [activityDetails, setActivityDetails] = useState([]);
    const [expandedIndex, setExpandedIndex] = useState(null);
    const [filteredActivities, setFilteredActivities] = useState([]);
    const [currentActivityType, setCurrentActivityType] = useState('Todas');
    const [weaponDetails, setWeaponDetails] = useState([]);
    const [isOpen, setIsOpen] = useState(false);
    const [popupPosition, setPopupPosition] = useState({ top: 0, left: 0 });
    const [isLoading, setIsLoading] = useState(false);
    const [jugadorSelected, setJugadorSelected] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [activitiesPerPage] = useState(10);
    const popupRef = useRef(null);
    const { getCompsProfile, getCarnageReport, getItemManifest, getRecentActivities, getCommendations, getClanUser } = useBungieAPI();
    useEffect(() => {
        const fetchActivityHistory = async () => {
            if (isLoading) return; // Prevenir múltiples ejecuciones
            setIsLoading(true);
            try {
                const characterIds = await getCompsProfile(membershipType, userId);
                const allActivities = [];

                //Todos los personajes del usuario
                for (const characterId of characterIds.profile.data.characterIds) {
                    try {
                        const responseActs = await getRecentActivities(membershipType, userId, characterId, 50);
                        allActivities.push(...responseActs);
                    } catch (error) {
                        console.error(`Error fetching activities for character ${characterId}:`, error);
                    }
                }

                const sortedActivities = allActivities.sort((a, b) => new Date(b.period) - new Date(a.period));
                const recentActivities = sortedActivities.slice(0, 50);

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
                        activityName: activityMain?.displayProperties?.name || null,
                        activityIcon: !activityMode?.displayProperties?.icon.includes("missing_icon") ? activityMode?.displayProperties?.icon : datosDelModo?.displayProperties?.icon,
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
                setFilteredActivities(details);
                setCurrentActivityType('Todas');
                setCurrentPage(1);
            } catch (error) {
                console.error('Error fetching activity history:', error);
            } finally {
                setIsLoading(false);
            }
        };
        if (userId && membershipType) {
            fetchActivityHistory();
        }
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

        const classIcons = {
            "Hechicero": `${API_CONFIG.BUNGIE_API}/common/destiny2_content/icons/571dd4d71022cbef932b9be873d431a9.png`,
            "Hechicera": `${API_CONFIG.BUNGIE_API}/common/destiny2_content/icons/571dd4d71022cbef932b9be873d431a9.png`,
            "Warlock": `${API_CONFIG.BUNGIE_API}/common/destiny2_content/icons/571dd4d71022cbef932b9be873d431a9.png`,
            "Titán": `${API_CONFIG.BUNGIE_API}/common/destiny2_content/icons/707adc0d9b7b1fb858c16db7895d80cf.png`,
            "Titan": `${API_CONFIG.BUNGIE_API}/common/destiny2_content/icons/707adc0d9b7b1fb858c16db7895d80cf.png`,
            "Cazador": `${API_CONFIG.BUNGIE_API}/common/destiny2_content/icons/9bb43f897531bb6395bfefc82f2ec267.png`,
            "Cazadora": `${API_CONFIG.BUNGIE_API}/common/destiny2_content/icons/9bb43f897531bb6395bfefc82f2ec267.png`,
            "Hunter": `${API_CONFIG.BUNGIE_API}/common/destiny2_content/icons/9bb43f897531bb6395bfefc82f2ec267.png`,
        };

        return {
            icon: classIcons[user.class] || null,
            name: user.class || null,
        };
    }

    const fetchCarnageReport = async (instanceId) => {
        try {
            const carnageReportResponse = await getCarnageReport(instanceId);
            const filteredEntries = carnageReportResponse.entries.filter(entry =>
                entry.player.destinyUserInfo.membershipType !== 0 //Filtra las personas con platraforma 0 (?)
            );
            const people = await Promise.all(filteredEntries.map(async (entry) => ({
                kills: entry.values.kills.basic.value,
                kd: entry.values.killsDeathsRatio.basic.value.toFixed(1),
                deaths: entry.values.deaths.basic.value,
                medals: entry.extended?.values?.allMedalsEarned?.basic?.value || 0,
                points: entry.values.score.basic.value,
                name: entry.player.destinyUserInfo.bungieGlobalDisplayName,
                emblem: entry.player.destinyUserInfo.iconPath,
                class: entry.player.characterClass,
                power: entry.player.lightLevel,
                membershipId: entry.player.destinyUserInfo.membershipId,
                membershipType: entry.player.destinyUserInfo.membershipType,
                uniqueName: entry.player.destinyUserInfo.bungieGlobalDisplayName + "#" + entry.player.destinyUserInfo.bungieGlobalDisplayNameCode,
                honor: await getCommendations(entry.player.destinyUserInfo.membershipType, entry.player.destinyUserInfo.membershipId),
                guardinRank: await fetchGuardianRank(entry.player.destinyUserInfo.membershipId, entry.player.destinyUserInfo.membershipType),
                emblemBig: await fetchEmblema(entry.player.emblemHash),
                clan: await fetchClan(entry.player.destinyUserInfo.membershipId, entry.player.destinyUserInfo.membershipType),
                standing: entry.standing,
                completed: entry.values.completed.basic.value,
                values: entry.extended?.values,
                weapons: await getWeaponDetails(entry.extended?.weapons) || null,
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
        let filtered;
        if (type === "Todas") {
            filtered = activities;
        } else {
            filtered = activities.filter(activity => activity.activityType === type);
        }
        setFilteredActivities(filtered);
        setCurrentActivityType(type);
        setCurrentPage(1); // Reset to first page when filtering
    };

    const toggleExpand = (index) => {
        setExpandedIndex(expandedIndex === index ? null : index);
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
            console.error('Error al cargar datos del popup del jugador:', error);
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

    const getWeaponDetails = async (weapons) => {
        if (!weapons || !Array.isArray(weapons)) {
            return [];
        }
        const weaponD = await Promise.all(weapons.map(async (weapon) => {
            const weaponInfo = await fetchActivityDetails(weapon.referenceId, "DestinyInventoryItemDefinition");
            return {
                name: weaponInfo.displayProperties.name,
                icon: weaponInfo.displayProperties.icon,
                archetype: weaponInfo.itemTypeDisplayName,
                kills: weapon.values.uniqueWeaponKills.basic.value,
                precisionKills: weapon.values.uniqueWeaponPrecisionKills.basic.value,
                precisionKillsPercentage: weapon.values.uniqueWeaponKillsPrecisionKills.basic.displayValue,
            };
        }));
        return weaponD;
    }

    const fetchActivityDetails = async (activityHash, type) => {
        try {
            const response = await getItemManifest(activityHash, type);
            if (response == null) return null;
            else return response;

        } catch (error) {
            console.error(`Error fetching activity details for hash ${activityHash}:`, error);
            return null;
        }
    };

    const handlePlayerClick = (person, personIndex) => {
        if (jugadorSelected === personIndex) {

            setJugadorSelected(null); // Cerrar si ya está abierto
        } else {
            setJugadorSelected(personIndex); // Abrir el popup para este jugador
        }
    };

    // Cerrar popup al hacer click fuera
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (popupRef.current && !popupRef.current.contains(event.target)) {
                setJugadorSelected(null);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const indexOfLastActivity = currentPage * activitiesPerPage;
    const indexOfFirstActivity = indexOfLastActivity - activitiesPerPage;
    const currentActivities = filteredActivities.slice(indexOfFirstActivity, indexOfLastActivity);

    // Calcular número total de páginas
    const totalPages = Math.ceil(filteredActivities.length / activitiesPerPage);

    const handlePageChange = (pageNumber) => {
        setCurrentPage(pageNumber);
        setExpandedIndex(null); // Cerrar actividades expandidas al cambiar página
    };

    const getPageNumbers = () => {
        const pageNumbers = [];
        const maxVisiblePages = 5;

        if (totalPages <= maxVisiblePages) {
            for (let i = 1; i <= totalPages; i++) {
                pageNumbers.push(i);
            }
        } else {
            // Lógica para mostrar ... entre páginas
            if (currentPage <= 3) {
                for (let i = 1; i <= 4; i++) {
                    pageNumbers.push(i);
                }
                pageNumbers.push('...');
                pageNumbers.push(totalPages);
            } else if (currentPage >= totalPages - 2) {
                pageNumbers.push(1);
                pageNumbers.push('...');
                for (let i = totalPages - 3; i <= totalPages; i++) {
                    pageNumbers.push(i);
                }
            } else {
                pageNumbers.push(1);
                pageNumbers.push('...');
                for (let i = currentPage - 1; i <= currentPage + 1; i++) {
                    pageNumbers.push(i);
                }
                pageNumbers.push('...');
                pageNumbers.push(totalPages);
            }
        }
        return pageNumbers;
    };

    return (
        <div>
            <h2 className='text-2xl font-bold'>Historial de actividades</h2>
            <div className="flex mb-4">
                <button onClick={() => filterActivities(activityDetails, 'Todas')} className={`hover:bg-blue-400 hover:text-white px-4 py-2 cursor-pointer rounded-s-md ${currentActivityType === 'Todas' ? 'bg-blue-500 text-white' : 'bg-gray-300'}`}>Todas</button>
                <button onClick={() => filterActivities(activityDetails, 'PvE')} className={`hover:bg-blue-400 hover:text-white px-4 py-2 cursor-pointer  ${currentActivityType === 'PvE' ? 'bg-blue-500 text-white' : 'bg-gray-300'}`}>PvE</button>
                <button onClick={() => filterActivities(activityDetails, 'PvP')} className={`hover:bg-blue-400 hover:text-white px-4 py-2 cursor-pointer ${currentActivityType === 'PvP' ? 'bg-blue-500 text-white' : 'bg-gray-300'}`}>PvP</button>
                <button onClick={() => filterActivities(activityDetails, 'Gambito')} className={`hover:bg-blue-400 hover:text-white px-4 py-2 cursor-pointer rounded-e-md ${currentActivityType === 'Gambito' ? 'bg-blue-500 text-white' : 'bg-gray-300'}`}>Gambito</button>
            </div>
            {isLoading ? (
                <div className="h-[450px] bg-gray-300 flex justify-center items-center p-2 text-xl font-semibold w-full text-black rounded-lg animate-pulse"></div>
            ) : (
                <>
                    {currentActivities.length > 0 && (
                        <div className={`py-2 px-10 text-sm text-start font-semibold justify-between flex items-center border-1`}>
                            <p className='w-[15%]'>Fecha/Hora</p>
                            <p className='w-[12%]'>Clase</p>
                            <p className='w-[26%] '>Actividad</p>
                            <p className='w-[9.5%]'>Duración</p>
                            <p className='w-[8%]'>Completado</p>
                        </div>
                    )}
                    <div>
                        {currentActivities.length > 0 ? currentActivities.map((activity, index) => {
                            const hasPoints = activity.people.some(person => person.points > 0);
                            const hasMedals = activity.people.some(person => person.medals > 0);

                            const team0 = activity.people.filter(person => person.standing === 0);
                            const team1 = activity.people.filter(person => person.standing === 1);

                            const uniqueId = activity.instanceId + index; // Unique ID for each activity

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
                                        <div key={uniqueId} className={`px-10 text-sm text-start justify-between flex items-center`}>
                                            <p className='w-[15%]'>{activity.date}</p>
                                            <div className='w-[11%] flex items-center'>
                                                <img className='w-6 h-6' src={activity.clase?.icon} style={{ filter: "brightness(0) contrast(100%)" }} />
                                                <div className='w-1'></div>
                                                <p>{activity.clase?.name}</p>
                                            </div>
                                            <div className='w-[30%] flex items-center'>
                                                {activity.activityIcon && <img src={`${API_CONFIG.BUNGIE_API}${activity.activityIcon}`} className='w-6 h-6' style={{ filter: "brightness(0) contrast(100%)" }} />}
                                                <div className='w-1.5'></div>
                                                {activity.activityName}
                                            </div>
                                            <p className='w-[10%]'>{activity.duration}</p>
                                            <div className='w-[8%] flex justify-center mr-1'>
                                                <img src={symbol} className='w-6 h-6' />
                                            </div>
                                        </div>
                                    </button>
                                    <div className={`transition-all duration-500 ease-in-out overflow-visible ${expandedIndex === (uniqueId) ? 'max-h-screen' : 'max-h-0'}`}>
                                        {expandedIndex === (uniqueId) && (
                                            <div className='mt-2 p-6 bg-center bg-cover' style={{ backgroundImage: `url(${API_CONFIG.BUNGIE_API}${activity.pgcrImage})` }}>
                                                {activity.teams.length > 0 ? (
                                                    <div className='justify-between space-y-4 w-full text-black '>
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
                                                                    {team0.map((person, idx) => {
                                                                        const personIndex = `team0-${idx}`;
                                                                        return (
                                                                            <tr key={idx} className={`text-start ${person.membershipId === userId ? "font-bold" : ""} relative`}>
                                                                                <td className='py-2 text-xs w-fit'>
                                                                                    <button onClick={(e) => {
                                                                                        e.stopPropagation();
                                                                                        handlePlayerClick(person, personIndex);
                                                                                    }} className='flex items-center text-start cursor-pointer'>
                                                                                        <img src={`${API_CONFIG.BUNGIE_API}/${person.emblem}`} width={30} height={30} alt="Emblem" className='rounded' />
                                                                                        <div className='flex flex-col justify-start ml-1'>
                                                                                            <p>{person.name}</p>
                                                                                            <p>{person.class} - {person.power}</p>
                                                                                        </div>
                                                                                    </button>
                                                                                    {jugadorSelected === personIndex && (
                                                                                        <div ref={popupRef} className="absolute left-30 top-0 z-50 ml-2 overflow-visible">
                                                                                            <PopUp jugador={person} weaponDetails={weaponDetails} setIsOpen={setJugadorSelected} />
                                                                                        </div>
                                                                                    )}
                                                                                </td>
                                                                                {hasPoints && <td className='py-2' >{person.points}</td>}
                                                                                <td className='py-2'>{person.kills}</td>
                                                                                <td className='py-2'>{person.deaths}</td>
                                                                                <td className='py-2'>{person.kd}</td>
                                                                                {hasMedals && <td className='py-2'>{person.medals}</td>}
                                                                            </tr>
                                                                        );
                                                                    })}
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
                                                                    {team1.map((person, idx) => {
                                                                        const personIndex = `team1-${idx}`;
                                                                        return (
                                                                            <tr key={idx} className={`text-start ${person.membershipId === userId ? "font-bold" : ""} relative`}>
                                                                                <td className='py-2 text-xs w-fit'>
                                                                                    <button onClick={(e) => {
                                                                                        e.stopPropagation();
                                                                                        handlePlayerClick(person, personIndex);
                                                                                    }} className='flex items-center text-start cursor-pointer'>
                                                                                        <img src={`${API_CONFIG.BUNGIE_API}/${person.emblem}`} width={30} height={30} alt="Emblem" className='rounded' />
                                                                                        <div className='flex flex-col justify-center ml-1'>
                                                                                            <p>{person.name}</p>
                                                                                            <p>{person.class} - {person.power}</p>
                                                                                        </div>
                                                                                    </button>
                                                                                    {jugadorSelected === personIndex && (
                                                                                        <div ref={popupRef} className="absolute left-30 top-0 z-50 ml-2 overflow-visible">
                                                                                            <PopUp jugador={person} weaponDetails={weaponDetails} setIsOpen={setJugadorSelected} />
                                                                                        </div>
                                                                                    )}
                                                                                </td>
                                                                                {hasPoints && <td className='py-2'>{person.points}</td>}
                                                                                <td className='py-2'>{person.kills}</td>
                                                                                <td className='py-2'>{person.deaths}</td>
                                                                                <td className='py-2'>{person.kd}</td>
                                                                                {hasMedals && <td className='py-2'>{person.medals}</td>}
                                                                            </tr>
                                                                        );
                                                                    })}
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
                                                            {activity.people.map((person, idx) => {
                                                                const personIndex = `single-${idx}`;
                                                                return (
                                                                    <tr key={idx} className={`text-start text-sm ${person.membershipId == userId ? "font-bold" : ""} relative`}>
                                                                        <td className='py-2 text-xs w-fit'>
                                                                            <button onClick={(e) => {
                                                                                e.stopPropagation();
                                                                                handlePlayerClick(person, personIndex);
                                                                            }} className='flex items-center text-start cursor-pointer'>
                                                                                <img src={`${API_CONFIG.BUNGIE_API}/${person.emblem}`} width={30} height={30} alt="Emblem" className='rounded' />
                                                                                <div className='flex flex-col justify-center ml-1'>
                                                                                    <p>{person.name}</p>
                                                                                    <p>{person.class} - {person.power}</p>
                                                                                </div>
                                                                            </button>
                                                                            {jugadorSelected === personIndex && (
                                                                                <div ref={popupRef} className="absolute left-30 top-0 z-50 ml-2 overflow-hidden">
                                                                                    <PopUp jugador={person} weaponDetails={weaponDetails} setIsOpen={setJugadorSelected} />
                                                                                </div>
                                                                            )}
                                                                        </td>
                                                                        {hasPoints && <td>{person.points}</td>}
                                                                        <td>{person.kills}</td>
                                                                        <td>{person.deaths}</td>
                                                                        <td>{person.kd}</td>
                                                                        {hasMedals && <td>{person.medals}</td>}
                                                                    </tr>
                                                                );
                                                            })}
                                                        </tbody>
                                                    </table>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        }) : (
                            <div className='top-0 text-xl font-bold'>No hay actividades para este filtro</div>
                        )}
                    </div>
                </>)}
            {totalPages > 1 && (
                <div className="flex justify-center items-center mt-6 space-x-1">
                    <button
                        onClick={() => handlePageChange(currentPage - 1)}
                        disabled={currentPage === 1}
                        className={`px-3 py-1 rounded cursor-pointer ${currentPage === 1
                            ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                            : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                            }`}
                    >
                        {"<"}
                    </button>

                    {getPageNumbers().map((pageNumber, index) => (
                        <button
                            key={index}
                            onClick={() => typeof pageNumber === 'number' && handlePageChange(pageNumber)}
                            disabled={pageNumber === '...'}
                            className={`px-3 py-1 rounded cursor-pointer ${pageNumber === currentPage
                                ? 'bg-blue-500 text-white'
                                : pageNumber === '...'
                                    ? 'bg-white text-gray-400 cursor-default'
                                    : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                                }`}
                        >
                            {pageNumber}
                        </button>
                    ))}

                    <button
                        onClick={() => handlePageChange(currentPage + 1)}
                        disabled={currentPage === totalPages}
                        className={`px-3 py-1 rounded cursor-pointer ${currentPage === totalPages
                            ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                            : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                            }`}
                    >
                        {">"}
                    </button>
                </div>
            )}
        </div>
    );
};

export default ActivityHistory;