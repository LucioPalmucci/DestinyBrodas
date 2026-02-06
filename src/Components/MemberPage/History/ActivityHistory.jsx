import { useEffect, useRef, useState } from 'react';
import circleEmpty from "../../../assets/circle-empty.svg";
import circleSolid from "../../../assets/circle-solid.svg";
import completed from "../../../assets/completed.png";
import medal from "../../../assets/medal-solid.svg";
import NotCompleted from "../../../assets/notCompleted.png";
import skull from "../../../assets/skull-solid.svg";
//import "../../../index.css";
import { API_CONFIG } from '../../../config';
import { useBungieAPI } from '../../APIservices/BungieAPIcalls';
import { loadCache, saveCache } from "../../Cache/componentsCache";
import Spinner from '../../Spinner';
import '../../Tab.css';
import PopUp from './PopUp';


const ActivityHistory = ({ userId, membershipType, currentClass }) => {
    const [activityDetails, setActivityDetails] = useState([]);
    const [expandedIndex, setExpandedIndex] = useState(null);
    const [filteredActivities, setFilteredActivities] = useState([]);
    const [currentActivityType, setCurrentActivityType] = useState([]);
    const [currentActivityClass, setCurrentActivityClass] = useState([]);
    const [weaponDetails, setWeaponDetails] = useState([]);
    const [isOpen, setIsOpen] = useState(false);
    const [popupPosition, setPopupPosition] = useState({ top: 0, left: 0 });
    const [isLoading, setIsLoading] = useState(false);
    const [jugadorSelected, setJugadorSelected] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [activitiesPerPage] = useState(10);
    const [fullLoaded, setFullLoaded] = useState(false);
    const [rawActivities, setRawActivities] = useState([]); // lista completa sin paginar
    const popupRef = useRef(null);
    const CACHE_TTL = 1//00 * 60 * 1000; // 10 minutes
    const cacheKey = `ActHistory_${membershipType}_${userId}`;
    const { getCarnageReport, getItemManifest, getRecentActivities, getCommendations, getClanUser, getCompChars, getCompsProfile } = useBungieAPI();
    const logoHechicero = `${API_CONFIG.BUNGIE_API}/common/destiny2_content/icons/571dd4d71022cbef932b9be873d431a9.png`;
    const logoTitan = `${API_CONFIG.BUNGIE_API}/common/destiny2_content/icons/707adc0d9b7b1fb858c16db7895d80cf.png`;
    const logoCazador = `${API_CONFIG.BUNGIE_API}/common/destiny2_content/icons/9bb43f897531bb6395bfefc82f2ec267.png`;
    const colorTitan = "brightness(0) saturate(100%) invert(21%) sepia(52%) saturate(4147%) hue-rotate(335deg) brightness(83%) contrast(111%)";
    const colorCazador = "brightness(0) saturate(100%) invert(24%) sepia(29%) saturate(5580%) hue-rotate(199deg) brightness(95%) contrast(95%)";
    const colorHechicero = "brightness(0) saturate(100%) invert(82%) sepia(14%) saturate(5494%) hue-rotate(341deg) brightness(105%) contrast(98%)";
    const [hoveredClass, setHoveredClass] = useState(null);
    useEffect(() => {
        const fetchActivityHistory = async () => {
            if (isLoading) return;
            const cached = loadCache(cacheKey, CACHE_TTL);
            if (cached) {
                const cachedData = Array.isArray(cached) ? cached : (cached?.details || []);
                setActivityDetails(cachedData);
                setFilteredActivities(cachedData);
                setCurrentActivityType(null);
                setCurrentActivityClass(currentClass);
                setCurrentPage(1);
                setFullLoaded(false);
                setIsLoading(false);
                console.log('Loaded activity history from cache:', cachedData);
            } else setIsLoading(true);
            try {
                const characters = await getCompChars(membershipType, userId);
                const allActivities = [];
                setCurrentActivityClass(currentClass);
                setCurrentActivityType(null);
                console.log(`Fetching activities for character ..`, characters);

                const characterList = Object.values(characters);
                for (const char of characterList) {
                    try {
                        const responseActs = await getRecentActivities(membershipType, userId, char.characterId, 50);
                        const tagged = (responseActs || []).map(act => ({ ...act, claseHash: char.classHash }));
                        allActivities.push(...tagged);
                    } catch (error) {
                        console.error(`Error fetching activities for character ${char?.characterId}:`, error);
                    }
                }

                const recentActivities = allActivities.sort((a, b) => new Date(b.period) - new Date(a.period));
                setRawActivities(recentActivities);
                setFilteredActivities(recentActivities);
                const details = await getSomeActivities(recentActivities, currentClass, 1, null);
                console.log('Fetched activity details:', details);
                setActivityDetails(details);
                setCurrentPage(1);
                setFullLoaded(true);
                try {
                    saveCache(cacheKey, details);
                } catch (e) {
                    console.error('[CACHE] save error', e);
                }
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

    const getSomeActivities = async (activities, classHash, page, type) => {
        activities = activities.filter(act => act.claseHash === classHash);
        activities = activities.filter(activity => type == null || activity.activityDetails.modes.includes(type));
        activities = activities.slice((page - 1) * 10, page * 10);

        const details = await Promise.all(activities.map(async (activity) => {
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
            const carnageReport = await fetchCarnageReport(activity.activityDetails);
            const activityInfo = await fetchActivityDetails(activity.activityDetails.directorActivityHash, "DestinyActivityDefinition");
            let datosDelModo, datosDelTipo;
            datosDelTipo = await fetchActivityDetails(activityInfo.activityTypeHash, "DestinyActivityTypeDefinition");
            if (activityInfo.directActivityModeHash) datosDelModo = await fetchActivityDetails(activityInfo.directActivityModeHash, "DestinyActivityModeDefinition");

            let activityType;
            if (activity.activityDetails.modes.includes(7)) {
                activityType = "PvE";
            } else if (activity.activityDetails.modes.includes(5) || activity.activityDetails.modes.includes(32)) {
                activityType = "PvP";
            } else if (activity.activityDetails.modes.includes(63)) {
                activityType = "Gambito";
            } else activityType = "PvE";

            let actIcon = null;
            let orden = 2;
            if (orden == 1) {
                if (activityInfo?.displayProperties?.icon != null && !activityInfo?.displayProperties?.icon.includes("missing_icon")) actIcon = activityInfo?.displayProperties?.icon;
                else if (datosDelModo?.displayProperties?.icon != null && !datosDelModo?.displayProperties?.icon.includes("missing_icon")) actIcon = datosDelModo?.displayProperties?.icon;
                else if (datosDelTipo?.displayProperties?.icon != null && !datosDelTipo?.displayProperties?.icon.includes("missing_icon")) actIcon = datosDelTipo?.displayProperties?.icon;
            }
            else if (orden == 2) {
                if (datosDelModo?.displayProperties?.icon != null && !datosDelModo?.displayProperties?.icon.includes("missing_icon")) actIcon = datosDelModo?.displayProperties?.icon;
                else if (activityInfo?.displayProperties?.icon != null && !activityInfo?.displayProperties?.icon.includes("missing_icon")) actIcon = activityInfo?.displayProperties?.icon;

                else if (datosDelTipo?.displayProperties?.icon != null && !datosDelTipo?.displayProperties?.icon.includes("missing_icon")) actIcon = datosDelTipo?.displayProperties?.icon;
            }
            else activityMain?.displayProperties?.icon || null;

            if (actIcon == null || actIcon.includes("missing_icon")) {
                const modoPorTipo = await fetchActivityDetails(datosDelTipo?.hash, "DestinyActivityModeDefinition");
                console.log("Fetching icon from activity type mode:", datosDelTipo?.hash, modoPorTipo);
                actIcon = modoPorTipo?.displayProperties?.icon || null;
            }
            if (actIcon == null) actIcon = "/img/misc/missing_icon_d2.png";

            return {
                activityName: activityType == "PvE" || activityType == "Gambito" ? activityMain?.originalDisplayProperties?.name : activityInfo?.originalDisplayProperties?.name,
                activityMode: datosDelTipo?.displayProperties?.name || datosDelModo?.displayProperties?.name,
                activityIcon: actIcon,
                pgcrImage: activityMain?.pgcrImage || null,
                difficulty: activityType == "PvE" ? activityMain?.selectionScreenDisplayProperties?.name : activityInfo?.selectionScreenDisplayProperties?.name,
                instanceId: activity.activityDetails.instanceId,
                kills: activity.values.kills.basic.value || 0,
                deaths: activity.values.deaths.basic.value || 0,
                kd: activity.values.killsDeathsRatio.basic.value.toFixed(2) || 0,
                symbol: activity.values.completed.basic.value == 1 ? completed : NotCompleted,
                activityType,
                date,
                duration,
                hash: activity.activityDetails.referenceId,
                ...carnageReport,
            };
        }));
        console.log("All activity details fetched: ", details);
        return details;
    }

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
            hash: user.classHash,
        };
    }

    const fetchCarnageReport = async (activityDetails) => {
        try {
            console.log('Fetching carnage report for activity:', activityDetails);
            const carnageReportResponse = await getCarnageReport(activityDetails.instanceId);
            /*const filteredEntries = carnageReportResponse.entries.filter(entry =>
                entry.player.destinyUserInfo.membershipType !== 0 //Filtra las personas con platraforma 0 (?)
            );*/
            console.log('Carnage report response:', carnageReportResponse);
            const filteredEntries = carnageReportResponse.entries;
            if (filteredEntries.length > 30) filteredEntries.splice(30); //limitar a 30 jugadores para no saturar el caché

            const people = await Promise.all(filteredEntries.map(async (entry) => ({
                kills: entry.values.kills.basic.value,
                kd: entry.values.killsDeathsRatio.basic.value.toFixed(1),
                deaths: entry.values.deaths.basic.value,
                medals: entry.extended?.values?.allMedalsEarned?.basic?.value || 0,
                points: entry.values.score.basic.value,
                name: entry.player.destinyUserInfo.bungieGlobalDisplayName,
                emblem: entry.player.destinyUserInfo.iconPath,
                class: entry.player.characterClass,
                classHash: entry.player.classHash,
                power: entry.player.lightLevel,
                membershipId: entry.player.destinyUserInfo.membershipId,
                membershipType: entry.player.destinyUserInfo.membershipType,
                uniqueName: entry.player.destinyUserInfo.bungieGlobalDisplayName,
                uniqueNameCode: "#" + entry.player.destinyUserInfo.bungieGlobalDisplayNameCode,
                honor: entry.player.destinyUserInfo.membershipType != 0 ? await getCommendations(entry.player.destinyUserInfo.membershipType, entry.player.destinyUserInfo.membershipId) : null,
                guardinRank: entry.player.destinyUserInfo.membershipType != 0 ? await fetchGuardianRank(entry.player.destinyUserInfo.membershipId, entry.player.destinyUserInfo.membershipType) : null,
                emblemBig: entry.player.destinyUserInfo.membershipType != 0 ? await fetchEmblema(entry.player.emblemHash) : null,
                clan: entry.player.destinyUserInfo.membershipType != 0 ? await fetchClan(entry.player.destinyUserInfo.membershipId, entry.player.destinyUserInfo.membershipType) : null,
                standing: entry.standing,
                completed: entry.values.completed.basic.value,
                values: entry.extended?.values,
                weapons: await getWeaponDetails(entry.extended?.weapons) || null,
                timePlayedSeconds: entry.values.timePlayedSeconds.basic.displayValue,
                assists: entry.values.assists.basic.value,
            })));

            let teams = [];
            const hasPoints = people.some(person => person.points > 0);
            const hasMedals = people.some(person => person.medals > 0);
            if (activityDetails.modes.includes(5) || activityDetails.modes.includes(63)) { //PvP o gambito
                teams = buildTeamsData(people, carnageReportResponse);
                return { teams, hasPoints, hasMedals };
            } else return { people: people, hasPoints, hasMedals };
        } catch (error) {
            console.error('Error fetching carnage report:', error);
            return { people: [], teams: [] }; // Valores por defecto en caso de error
        }
    };

    const buildTeamsData = (people, carnageReportResponse) => {
        const teamW = people.filter(person => person.standing === 0);
        const teamL = people.filter(person => person.standing === 1);
        const userInTeamW = people.some(person => person.standing === 0 && person.membershipId === userId);
        const userInTeamL = people.some(person => person.standing === 1 && person.membershipId === userId);

        let winnerPoints, loserPoints, winnerName, loserName;
        winnerPoints = carnageReportResponse.teams[0].standing.basic.value == 0 ? carnageReportResponse.teams[0].score.basic.value : carnageReportResponse.teams[1]?.score.basic.value;
        loserPoints = carnageReportResponse.teams[0].standing.basic.value == 1 ? carnageReportResponse.teams[0].score.basic.value : carnageReportResponse.teams[1]?.score.basic.value;
        winnerName = carnageReportResponse.teams[0].standing.basic.value == 0 ? carnageReportResponse.teams[0].teamId : carnageReportResponse.teams[1]?.teamId;
        loserName = carnageReportResponse.teams[0].standing.basic.value == 1 ? carnageReportResponse.teams[0].teamId : carnageReportResponse.teams[1]?.teamId;

        return { teamW: { people: teamW, user: userInTeamW, points: winnerPoints, name: winnerName }, teamL: { people: teamL, user: userInTeamL, points: loserPoints, name: loserName } };
    }

    const filterActivitiesMode = async (activities, type) => {
        setIsLoading(true);
        setFullLoaded(false);
        setCurrentActivityType(type);
        const filtered = (rawActivities || []).filter(activity =>
            (type == null || activity.activityType == type) && activity?.clase?.hash == currentActivityClass
        );
        setFilteredActivities(filtered);
        setCurrentPage(1);
        const details = await getSomeActivities(rawActivities, currentActivityClass, 1, type);
        setActivityDetails(details);
        setIsLoading(false);
        setFullLoaded(true);
    };

    const filterActivitiesClass = async (activities, classHash) => {
        setIsLoading(true);
        setFullLoaded(false);
        setCurrentActivityClass(classHash);
        const filtered = (rawActivities || []).filter(activity =>
            activity?.clase?.hash == classHash && (currentActivityType == null || activity.activityType == currentActivityType)
        );
        setFilteredActivities(filtered);
        setCurrentPage(1);
        const details = await getSomeActivities(rawActivities, classHash, 1, currentActivityType);
        setActivityDetails(details);
        setIsLoading(false);
        setFullLoaded(true);
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
    let currentActivities = activityDetails;
    const totalPages = 5 //Math.max(1, Math.ceil((filteredActivities || []).length / activitiesPerPage));

    const handlePageChange = async (pageNumber) => {
        if (pageNumber < 1 || pageNumber > totalPages) return;
        setCurrentPage(pageNumber);
        setIsLoading(true);
        setFullLoaded(false);
        const details = await getSomeActivities(rawActivities, currentActivityClass, pageNumber, currentActivityType);
        setActivityDetails(details);
        setFullLoaded(true);
        setIsLoading(false);
        setExpandedIndex(null);
    };

    const getPageNumbers = () => {
        const pages = [];
        const maxVisible = 5;

        if (totalPages <= maxVisible) {
            for (let i = 1; i <= totalPages; i++) pages.push(i);
            return pages;
        }

        const side = Math.floor((maxVisible - 1) / 2); // 2
        let start = currentPage - side;
        let end = currentPage + side;

        if (start < 1) { start = 1; end = maxVisible; }
        if (end > totalPages) { end = totalPages; start = totalPages - maxVisible + 1; }

        if (start > 1) pages.push(1);
        if (start > 2) pages.push('...');

        for (let i = start; i <= end; i++) pages.push(i);

        if (end < totalPages - 1) pages.push('...');
        if (end < totalPages) pages.push(totalPages);

        return pages;
    };

    return (
        <div>
            <h2 className='text-2xl font-bold'>Historial de actividades</h2>
            <div className='mb-4 flex'>
                <div className="flex mr-6">
                    <button onClick={() => filterActivitiesMode(activityDetails, null)} className={`hover:bg-blue-400 hover:text-white px-4 py-2 cursor-pointer rounded-s-md ${currentActivityType === null ? 'bg-blue-500 text-white' : 'bg-gray-300'}`}>Todas</button>
                    <button onClick={() => filterActivitiesMode(activityDetails, 7)} className={`hover:bg-blue-400 hover:text-white px-4 py-2 cursor-pointer  ${currentActivityType === 7 ? 'bg-blue-500 text-white' : 'bg-gray-300'}`}>PvE</button>
                    <button onClick={() => filterActivitiesMode(activityDetails, 5)} className={`hover:bg-blue-400 hover:text-white px-4 py-2 cursor-pointer ${currentActivityType === 5 ? 'bg-blue-500 text-white' : 'bg-gray-300'}`}>PvP</button>
                    <button onClick={() => filterActivitiesMode(activityDetails, 63)} className={`hover:bg-blue-400 hover:text-white px-4 py-2 cursor-pointer rounded-e-md ${currentActivityType === 63 ? 'bg-blue-500 text-white' : 'bg-gray-300'}`}>Gambito</button>
                </div>
                <div className='flex'>
                    <button
                        title='Titán'
                        onClick={() => filterActivitiesClass(activityDetails, 3655393761)}
                        onMouseEnter={() => setHoveredClass(3655393761)}
                        onMouseLeave={() => setHoveredClass(null)}
                        className={`px-4 py-2 cursor-pointer rounded-s-md bg-gray-300`}
                    >
                        <img
                            className='w-8 h-8'
                            src={logoTitan}
                            style={{ filter: `${(currentActivityClass == 3655393761 || hoveredClass == 3655393761) ? colorTitan : "brightness(0) contrast(100%)"}` }}
                        />
                    </button>
                    <button
                        title="Cazador"
                        onClick={() => filterActivitiesClass(activityDetails, 671679327)}
                        onMouseEnter={() => setHoveredClass(671679327)}
                        onMouseLeave={() => setHoveredClass(null)}
                        className={`px-4 py-2 cursor-pointer bg-gray-300`}
                    >
                        <img
                            className='w-8 h-8'
                            src={logoCazador}
                            style={{ filter: `${(currentActivityClass == 671679327 || hoveredClass == 671679327) ? colorCazador : "brightness(0) contrast(100%)"}` }}
                        />
                    </button>
                    <button
                        title="Hechicero"
                        onClick={() => filterActivitiesClass(activityDetails, 2271682572)}
                        onMouseEnter={() => setHoveredClass(2271682572)}
                        onMouseLeave={() => setHoveredClass(null)}
                        className={`px-4 py-2 cursor-pointer rounded-e-md bg-gray-300`}
                    >
                        <img
                            className='w-8 h-8'
                            src={logoHechicero}
                            style={{ filter: `${(currentActivityClass == 2271682572 || hoveredClass == 2271682572) ? colorHechicero : "brightness(0) contrast(100%)"}` }}
                        />
                    </button>
                </div>
            </div>
            {isLoading && !fullLoaded ? (
                <div className="h-[900px] bg-gray-300 flex justify-center items-center p-2 text-xl font-semibold w-full text-black rounded-lg animate-pulse"></div>
            ) : (
                <>
                    <div>
                        {currentActivities.length > 0 ? currentActivities.map((activity, index) => {
                            /**/
                            const uniqueId = activity.instanceId + index;

                            return (
                                <div className={`transition-colors cursor-pointer hover:bg-gray-300/50 ${index % 2 === 0 ? 'bg-gray-300' : 'bg-[#C1C7CE]'}`} key={uniqueId}>
                                    <button onClick={() => toggleExpand(uniqueId)} className='cursor-pointer w-full h-[80px]'>
                                        <div key={uniqueId} className={`px-6 text-[1.1rem] text-start justify-between flex items-center`}>
                                            <div className='flex items-center justify-between w-[60%] text-start'>
                                                <div className='flex items-center text-start'>
                                                    {activity.activityIcon && <img src={`${API_CONFIG.BUNGIE_API}${activity.activityIcon}`} className='w-13 h-13' style={{ filter: "brightness(0) contrast(100%)" }} />}
                                                    <div className='w-1.5'></div>
                                                    <div className='flex flex-col leading-6'>
                                                        <p>{activity.activityMode}</p>
                                                        <p className='text-[1.4rem font-semibold'>{activity.activityName}</p>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className='flex items-center justify-between w-[40%] text-start'>
                                                <div>
                                                    <p className='w-fit'>{activity.duration}</p>
                                                </div>
                                                <div className='flex items-center w-fit'>
                                                    <i className='icon-kills3' style={{ filter: "invert(100%)" }}></i>
                                                    <div className='w-1'></div>
                                                    <p>{activity.kills}</p>
                                                </div>
                                                <div className='flex items-center w-fit'>
                                                    <img src={skull} className="mr-2" width={27} height={27} />
                                                    <p>{activity.deaths}</p>
                                                </div>
                                                <div className='flex items-center w-fit'>
                                                    <p className='py-2'>KD</p>
                                                    <div className='w-1'></div>
                                                    <p>{activity.kd}</p>
                                                </div>
                                                <div className='w-10 flex items-center mr-1'>
                                                    <img src={activity.symbol} className='w-10 h-10' />
                                                </div>
                                            </div>
                                        </div>
                                    </button>
                                    <div className={`transition-all duration-500 ease-in-out overflow-visible ${expandedIndex === (uniqueId) ? 'max-h-screen' : 'max-h-0'}`}>
                                        {expandedIndex === (uniqueId) && (
                                            <div className='mt-2 p-6 bg-center bg-cover' style={{ backgroundImage: `url(${API_CONFIG.BUNGIE_API}${activity.pgcrImage})` }}>
                                                {activity.teams != null ? (
                                                    <div className='justify-between space-y-4 w-full text-black '>
                                                        <div>
                                                            <h3 className='text-lg font-bold flex items-center justify-between'>
                                                                <p className='px-1 rounded' style={{ backgroundColor: "rgba(255, 255, 255, 0.7)" }}>Equipo 1</p>
                                                                <span className='flex items-center px-1 rounded' style={{ backgroundColor: "rgba(255, 255, 255, 0.7)" }}>
                                                                    {activity.teams.teamW.points}
                                                                    <img className='w-4 h-4 ml-2' src={activity.teams.teamW.user ? circleSolid : circleEmpty} style={{ filter: "invert(35%) sepia(92%) saturate(749%) hue-rotate(90deg) brightness(92%) contrast(92%)" }} />
                                                                </span>
                                                            </h3>
                                                            <table className='tablapartida'>
                                                                <thead>
                                                                    <tr>
                                                                        <th className='py-2'>Nombre</th>
                                                                        {activity.hasPoints && <th className='py-2'>Puntos</th>}
                                                                        <th className='py-2' title='Bajas'><i className='icon-kills2' style={{ filter: "invert(100%)" }}></i></th>
                                                                        <th className='py-2' title='Muertes'><img src={skull} className="mr-2" width={15} height={15} /></th>
                                                                        <th className='py-2'>KD</th>
                                                                        {activity.hasMedals && <th className='py-2' title='medallas'><img src={medal} className="mr-2" width={15} height={15} /></th>}
                                                                    </tr>
                                                                </thead>
                                                                <tbody>
                                                                    {activity.teams.teamW.people.map((person, idx) => {
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
                                                                                {activity.hasPoints && <td className='py-2' >{person.points}</td>}
                                                                                <td className='py-2'>{person.kills}</td>
                                                                                <td className='py-2'>{person.deaths}</td>
                                                                                <td className='py-2'>{person.kd}</td>
                                                                                {activity.hasMedals && <td className='py-2'>{person.medals}</td>}
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
                                                                    {activity.teams.teamL.points}
                                                                    <img className='w-4 h-4 ml-2' src={activity.teams.teamL.user ? circleSolid : circleEmpty} style={{ filter: "invert(12%) sepia(100%) saturate(7481%) hue-rotate(1deg) brightness(92%) contrast(92%)" }} />
                                                                </span>
                                                            </h3>
                                                            <table className='tablapartida'>
                                                                <thead>
                                                                    <tr>
                                                                        <th className='py-2'>Nombre</th>
                                                                        {activity.hasPoints && <th className='py-2'>Puntos</th>}
                                                                        <th className='py-2' title='Bajas'><i className='icon-kills2' style={{ filter: "invert(100%)" }}></i></th>
                                                                        <th className='py-2' title='Muertes'><img src={skull} className="mr-2" width={15} height={15} /></th>
                                                                        <th className='py-2'>KD</th>
                                                                        {activity.hasMedals && <th className='py-2' title='medallas'><img src={medal} className="mr-2" width={15} height={15} /></th>}
                                                                    </tr>
                                                                </thead>
                                                                <tbody>
                                                                    {activity.teams.teamL.people.map((person, idx) => {
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
                                                                                {activity.hasPoints && <td className='py-2'>{person.points}</td>}
                                                                                <td className='py-2'>{person.kills}</td>
                                                                                <td className='py-2'>{person.deaths}</td>
                                                                                <td className='py-2'>{person.kd}</td>
                                                                                {activity.hasMedals && <td className='py-2'>{person.medals}</td>}
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
                                                                {activity.hasPoints && <th className='py-2'>Puntos</th>}
                                                                <th className='py-2' title='Bajas'><i className='icon-kills2' style={{ filter: "invert(100%)" }}></i></th>
                                                                <th className='py-2' title='Muertes'><img src={skull} className="mr-2" width={15} height={15} /></th>
                                                                <th className='py-2'>KD</th>
                                                                {activity.hasMedals && <th className='py-2' title='medallas'><img src={medal} className="mr-2" width={15} height={15} /></th>}
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
                                                                        {activity.hasPoints && <td>{person.points}</td>}
                                                                        <td>{person.kills}</td>
                                                                        <td>{person.deaths}</td>
                                                                        <td>{person.kd}</td>
                                                                        {activity.hasMedals && <td>{person.medals}</td>}
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
            {fullLoaded ? (
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
            ) : (
                totalPages <= 1 && fullLoaded ? (
                    null
                ) : (
                    <div className='mt-3'>
                        <Spinner small={true} />
                    </div>
                )
            )}
        </div>
    );
};

export default ActivityHistory;