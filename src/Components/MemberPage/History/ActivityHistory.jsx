import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from "react-router-dom";
import completed from "../../../assets/completed.png";
import NotCompleted from "../../../assets/notCompleted.png";
import skull from "../../../assets/skull-solid.svg";
//import "../../../index.css";
import { API_CONFIG } from '../../../config';
import { useBungieAPI } from '../../APIservices/BungieAPIcalls';
import { loadCache, saveCache } from "../../Cache/componentsCache";
import Spinner from '../../CSS/Spinner';
import '../../CSS/Tab.css';
import ActivityPopUp from './PopUps/ActivityPopUp';


const ActivityHistory = ({ userId, membershipType, currentClass }) => {
    const [activityDetails, setActivityDetails] = useState([]);
    const [expandedIndex, setExpandedIndex] = useState(null);
    const [expandedInstanceId, setExpandedInstanceId] = useState(null);
    const [filteredActivities, setFilteredActivities] = useState([]);
    const [currentActivityType, setCurrentActivityType] = useState(0);
    const [currentActivityClass, setCurrentActivityClass] = useState({ hashClass: null, classId: null });
    const [weaponDetails, setWeaponDetails] = useState([]);
    const [isOpen, setIsOpen] = useState(false);
    const goToButtonRef = useRef(null);
    const [popupPosition, setPopupPosition] = useState({ top: 0, left: 0 });
    const [isLoading, setIsLoading] = useState(false);
    const [jugadorSelected, setJugadorSelected] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [activitiesPerPage] = useState(10);
    const [fullLoaded, setFullLoaded] = useState(false);
    const [rawActivities, setRawActivities] = useState([]); // lista completa sin paginar
    const [knownLastPage, setKnownLastPage] = useState(null); // null = aún no conocemos el final
    const [gotoPageInput, setGotoPageInput] = useState("");
    const [goToPageError, setGoToPageError] = useState(false);
    const popupRef = useRef(null);
    const CACHE_TTL = 1//00 * 60 * 1000; // 10 minutes
    const cacheKey = `ActHistory_${membershipType}_${userId}`;
    const { getCarnageReport, getItemManifest, getRecentActivities, getRecentActivitiesPage, getCommendations, getClanUser, getCompChars, getCompsProfile } = useBungieAPI();
    const logoHechicero = `${API_CONFIG.BUNGIE_API}/common/destiny2_content/icons/571dd4d71022cbef932b9be873d431a9.png`;
    const logoTitan = `${API_CONFIG.BUNGIE_API}/common/destiny2_content/icons/707adc0d9b7b1fb858c16db7895d80cf.png`;
    const logoCazador = `${API_CONFIG.BUNGIE_API}/common/destiny2_content/icons/9bb43f897531bb6395bfefc82f2ec267.png`;
    const colorTitan = "brightness(0) saturate(100%) invert(21%) sepia(52%) saturate(4147%) hue-rotate(335deg) brightness(83%) contrast(111%)";
    const colorCazador = "brightness(0) saturate(100%) invert(24%) sepia(29%) saturate(5580%) hue-rotate(199deg) brightness(95%) contrast(95%)";
    const colorHechicero = "brightness(0) saturate(100%) invert(82%) sepia(14%) saturate(5494%) hue-rotate(341deg) brightness(105%) contrast(98%)";
    const [hoveredClass, setHoveredClass] = useState(null);
    const [allCharacters, setAllCharacters] = useState({});

    const navigate = useNavigate();
    const { instanceId } = useParams();

    useEffect(() => {
        const fetchActivityHistory = async () => {
            if (isLoading) return;

            const cached = loadCache(cacheKey, CACHE_TTL);
            if (cached) {
                setUpByCache(cached);
            } else setIsLoading(true);

            console.log("Fetching activity history for userId:", instanceId);
            try {
                const characters = await getCompChars(membershipType, userId);
                const charactersByHash = Object.fromEntries(Object.values(characters).map(char => [char.classHash, char]));
                setAllCharacters(charactersByHash);

                const characterList = Object.values(characters);
                const selectedCharacter = characterList.find(char => char.classHash == currentClass) ?? characterList[0];
                const firstChar = selectedCharacter?.characterId;

                setCurrentActivityClass({
                    hashClass: currentClass ?? null,
                    classId: firstChar ?? null,
                });

                let activities = await getRecentActivitiesPage(membershipType, userId, firstChar, 10, 0, 0); //memebershipType, userId, characterId, count, page, mode

                setRawActivities(activities);
                setFilteredActivities(activities);
                const details = await getSomeActivities(activities, 0);
                setActivityDetails(details);
                setFullLoaded(true);

                try {
                    saveCache(cacheKey, details);
                } catch (e) {
                    console.error('[CACHE] save error', e);
                }
            } catch (error) {
                const staleCache = loadCache(cacheKey, null);
                if (staleCache) setUpByCache(staleCache);
            } finally {
                setIsLoading(false);
            }
        };

        if (userId && membershipType) fetchActivityHistory();
    }, [userId, membershipType]);

    const getSomeActivities = async (activities) => {
        const details = await Promise.all(activities.map(async (activity) => {
            const activityMain = await fetchActivityDetails(activity.activityDetails.referenceId, "DestinyActivityDefinition");
            const activityInfo = await fetchActivityDetails(activity.activityDetails.directorActivityHash, "DestinyActivityDefinition");
            let datosDelModo, datosDelTipo;
            datosDelTipo = await fetchActivityDetails(activityInfo?.activityTypeHash, "DestinyActivityTypeDefinition");
            if (activityInfo.directActivityModeHash) datosDelModo = await fetchActivityDetails(activityInfo?.directActivityModeHash, "DestinyActivityModeDefinition");

            let activityType;
            if (activity.activityDetails.modes.includes(7)) {
                activityType = "PvE";
            } else if (activity.activityDetails.modes.includes(5) || activity.activityDetails.modes.includes(32)) {
                activityType = "PvP";
            } else if (activity.activityDetails.modes.includes(63)) {
                activityType = "Gambito";
            } else activityType = "PvE";

            let actIcon = null;
            if (datosDelModo?.displayProperties?.icon != null && !datosDelModo?.displayProperties?.icon.includes("missing_icon")) actIcon = datosDelModo?.displayProperties?.icon;
            else if (activityInfo?.displayProperties?.icon != null && !activityInfo?.displayProperties?.icon.includes("missing_icon")) actIcon = activityInfo?.displayProperties?.icon;
            else if (datosDelTipo?.displayProperties?.icon != null && !datosDelTipo?.displayProperties?.icon.includes("missing_icon")) actIcon = datosDelTipo?.displayProperties?.icon;
            else activityMain?.displayProperties?.icon || null;

            if (actIcon == null || actIcon.includes("missing_icon")) {
                const modoPorTipo = await fetchActivityDetails(datosDelTipo?.hash, "DestinyActivityModeDefinition");
                actIcon = modoPorTipo?.displayProperties?.icon || null;
            }
            if (actIcon == null) actIcon = "/img/misc/missing_icon_d2.png";

            let modeName = null;
            if(activity.activityDetails.modes.includes(19)) {
                modeName = activityInfo?.originalDisplayProperties?.name;
            }
            else if (activity.activityDetails.modes.includes(5) && !activity.activityDetails.modes.includes(84)) {
                modeName = datosDelModo?.displayProperties?.name + ": " + activityInfo?.originalDisplayProperties?.name;
            } else {
                modeName = datosDelTipo?.displayProperties?.name || datosDelModo?.displayProperties?.name;
            }

            let splitedInTeams = false;
            if (activityType == "PvP") {
                const carnageReport = await getCarnageReport(activity.activityDetails.instanceId);
                splitedInTeams = carnageReport?.teams?.length > 1;
            }
            let finalActivityName = activityMain?.originalDisplayProperties?.name;
            if(activityMain?.originalDisplayProperties?.name.includes(modeName)){
                const cleanedName = activityMain?.originalDisplayProperties?.name.replace(modeName, "").replace(": ", "").trim();
                finalActivityName = cleanedName.charAt(0).toUpperCase() + cleanedName.slice(1);
            }
            return {
                activityName: finalActivityName,
                activityMode: modeName,
                activityIcon: actIcon,
                instanceId: activity.activityDetails.instanceId,
                kills: activity.values.kills.basic.value || 0,
                deaths: activity.values.deaths.basic.value || 0,
                kd: activity.values.killsDeathsRatio.basic.value.toFixed(2) || 0,
                completed: activity.values.completed.basic.value == 1 || activity.activityDetails.modes.includes(6) ? "Completado" : "Abandonado",
                completedSymbol: activity.values.completed.basic.value == 1 || activity.activityDetails.modes.includes(6) ? completed : NotCompleted,
                activityType,
                duration: formatDuration(activity.values.activityDurationSeconds.basic.value || 0),
                hash: activity.activityDetails.referenceId,
                splitedInTeams: splitedInTeams,
            };
        }));
        console.log("All activity details fetched: ", details);
        return details;
    }

    const formatDuration = (seconds) => {
        const h = String(Math.floor(seconds / 3600)).padStart(2, '0');
        const m = String(Math.floor((seconds % 3600) / 60)).padStart(2, '0');
        const s = String(seconds % 60).padStart(2, '0');
        if (h === "00") return `${m}m ${s}s`;
        return `${h}h ${m}m ${s}s`;
    }

    const filterActivitiesMode = async (activities, type) => {
        setIsLoading(true);
        setFullLoaded(false);
        setCurrentActivityType(type);
        setCurrentPage(1);
        setKnownLastPage(null);
        //memebershipType, userId, characterId, count, page, mode
        const acts = await getRecentActivitiesPage(membershipType, userId, currentActivityClass?.classId, 10, 0, type);
        const details = await getSomeActivities(acts, type);
        setActivityDetails(details);
        setIsLoading(false);
        setFullLoaded(true);
    };

    const filterActivitiesClass = async (activities, classData) => {
        setIsLoading(true);
        setFullLoaded(false);
        setCurrentActivityClass(classData);
        setCurrentPage(1);
        setKnownLastPage(null);
        const acts = await getRecentActivitiesPage(membershipType, userId, classData.classId, 10, 0, currentActivityType);
        const details = await getSomeActivities(acts, currentActivityType);
        setActivityDetails(details);
        setIsLoading(false);
        setFullLoaded(true);
    };

    const toggleExpand = (instanceId) => {
        const id = String(instanceId);
        if (expandedInstanceId === id) closePopup();
        else openPopup(id);
    };

    const setUpByCache = (cached) => {
        const cachedData = Array.isArray(cached) ? cached : (cached?.details || []);
        setActivityDetails(cachedData);
        setFilteredActivities(cachedData);
        setCurrentActivityType(null);
        setCurrentActivityClass(currentClass);
        setCurrentPage(1);
        setFullLoaded(false);
        setIsLoading(false);
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

    const indexOfLastActivity = currentPage * activitiesPerPage;
    const indexOfFirstActivity = indexOfLastActivity - activitiesPerPage;
    let currentActivities = activityDetails;

    const handlePageChange = async (pageNumber) => {
        if (pageNumber < 1) return false;
        let acts;
        try {
            acts = await getRecentActivitiesPage(membershipType, userId, currentActivityClass?.classId, activitiesPerPage, pageNumber - 1, currentActivityType);
        } catch (error) {
            return false;
        }
        if (!acts || acts.length === 0) {
            setKnownLastPage((prev) => prev ?? Math.max(1, pageNumber - 1));
            return false
        };

        setIsLoading(true);
        setFullLoaded(false);

        try {

            // Si vino menos que el page size, esta es la última página
            if (acts.length < activitiesPerPage) {
                setKnownLastPage(pageNumber);
            }

            const details = await getSomeActivities(acts, currentActivityType);
            setActivityDetails(details);
            setCurrentPage(pageNumber);
            setExpandedIndex(null);
            setGoToPageError(false);
            return true;
        } finally {
            setFullLoaded(true);
            setIsLoading(false);
        }
    };

    const handleGoToPage = async () => {
        const page = Number(gotoPageInput);

        if (!Number.isInteger(page) || page < 1) {
            triggerGoToPageError();
            return;
        }

        const ok = await handlePageChange(page);
        if (!ok) triggerGoToPageError();
    };

    const shakeGoButton = () => {
        if (!goToButtonRef.current) return;
        goToButtonRef.current.animate(
            [
                { transform: "translateX(0)" },
                { transform: "translateX(-6px)" },
                { transform: "translateX(6px)" },
                { transform: "translateX(-4px)" },
                { transform: "translateX(4px)" },
                { transform: "translateX(0)" },
            ],
            { duration: 280, iterations: 1, easing: "ease-in-out" }
        );
    };

    const triggerGoToPageError = () => {
        setGoToPageError(true);
        shakeGoButton();
        setTimeout(() => setGoToPageError(false), 700);
    };

    const getPageNumbers = () => {
        // Regla:
        // - Inicio: 1 2 3 4 5
        // - Desde 8: 1 2 3 4 ... (actual-2) (actual-1) actual

        // Páginas 1..5
        if (currentPage <= 5) {
            const end = knownLastPage ? Math.min(5, knownLastPage) : 5;
            return Array.from({ length: end }, (_, i) => i + 1);
        }

        // Páginas 6 y 7 (sin puntos suspensivos)
        if (currentPage < 8) {
            const end = knownLastPage ? Math.min(currentPage, knownLastPage) : currentPage;
            return Array.from({ length: end }, (_, i) => i + 1);
        }

        // Desde la 8 en adelante
        const pages = [1, 2, 3, 4, "...", currentPage - 2, currentPage - 1, currentPage];

        const seen = new Set();
        return pages.filter((p) => {
            if (p === "...") return true;
            if (seen.has(p)) return false;
            seen.add(p);
            return true;
        });
    };

    const openPopup = (id) => {
        setExpandedInstanceId(id);
        navigate(`/member/${membershipType}/${userId}/report/${id}`, { replace: false });
    };

    const closePopup = () => {
        setExpandedInstanceId(null);
        navigate(`/member/${membershipType}/${userId}`, { replace: false });
    };

    useEffect(() => {
        if (instanceId) {
            console.log("Opening popup for instanceId from URL:", instanceId);
            setExpandedInstanceId(instanceId);
        }
    }, [instanceId]);

    return (
        <div>
            <h2 className='text-2xl font-bold'>Historial de actividades</h2>
            <div className='mb-4 flex'>
                <div className="flex mr-6">
                    <button onClick={() => filterActivitiesMode(activityDetails, 0)} className={`hover:bg-blue-400 hover:text-white px-4 py-2 cursor-pointer rounded-s-md ${currentActivityType === 0 ? 'bg-blue-500 text-white' : 'bg-gray-300'}`}>Todas</button>
                    <button onClick={() => filterActivitiesMode(activityDetails, 7)} className={`hover:bg-blue-400 hover:text-white px-4 py-2 cursor-pointer  ${currentActivityType === 7 ? 'bg-blue-500 text-white' : 'bg-gray-300'}`}>PvE</button>
                    <button onClick={() => filterActivitiesMode(activityDetails, 5)} className={`hover:bg-blue-400 hover:text-white px-4 py-2 cursor-pointer ${currentActivityType === 5 ? 'bg-blue-500 text-white' : 'bg-gray-300'}`}>PvP</button>
                    <button onClick={() => filterActivitiesMode(activityDetails, 63)} className={`hover:bg-blue-400 hover:text-white px-4 py-2 cursor-pointer rounded-e-md ${currentActivityType === 63 ? 'bg-blue-500 text-white' : 'bg-gray-300'}`}>Gambito</button>
                </div>
                <div className='flex'>
                    <button
                        title='Titán'
                        onClick={() => filterActivitiesClass(activityDetails, { hashClass: 3655393761, classId: allCharacters[3655393761]?.characterId })}
                        onMouseEnter={() => setHoveredClass(3655393761)}
                        onMouseLeave={() => setHoveredClass(null)}
                        className={`px-4 py-2 cursor-pointer rounded-s-md bg-gray-300`}
                    >
                        <img
                            className='w-8 h-8'
                            src={logoTitan}
                            style={{ filter: `${(currentActivityClass?.hashClass == 3655393761 || hoveredClass == 3655393761) ? colorTitan : "brightness(0) contrast(100%)"}` }}
                        />
                    </button>
                    <button
                        title="Cazador"
                        onClick={() => filterActivitiesClass(activityDetails, { hashClass: 671679327, classId: allCharacters[671679327]?.characterId })}
                        onMouseEnter={() => setHoveredClass(671679327)}
                        onMouseLeave={() => setHoveredClass(null)}
                        className={`px-4 py-2 cursor-pointer bg-gray-300`}
                    >
                        <img
                            className='w-8 h-8'
                            src={logoCazador}
                            style={{ filter: `${(currentActivityClass?.hashClass == 671679327 || hoveredClass == 671679327) ? colorCazador : "brightness(0) contrast(100%)"}` }}
                        />
                    </button>
                    <button
                        title="Hechicero"
                        onClick={() => filterActivitiesClass(activityDetails, { hashClass: 2271682572, classId: allCharacters[2271682572]?.characterId })}
                        onMouseEnter={() => setHoveredClass(2271682572)}
                        onMouseLeave={() => setHoveredClass(null)}
                        className={`px-4 py-2 cursor-pointer rounded-e-md bg-gray-300`}
                    >
                        <img
                            className='w-8 h-8'
                            src={logoHechicero}
                            style={{ filter: `${(currentActivityClass?.hashClass == 2271682572 || hoveredClass == 2271682572) ? colorHechicero : "brightness(0) contrast(100%)"}` }}
                        />
                    </button>
                </div>
            </div>
            {isLoading && !fullLoaded ? (
                <div className="h-[800px] bg-gray-300 flex justify-center items-center p-2 text-xl font-semibold w-full text-black rounded-lg animate-pulse">
                    <div className="flex flex-col items-center justify-center h-full">
                        <Spinner medium={true} />
                    </div>
                </div>
            ) : (
                <>
                    <div>
                        {currentActivities.length > 0 ? currentActivities.map((activity, index) => {
                            const uniqueId = activity.instanceId + index;
                            return (
                                <div className={`transition-colors  hover:bg-gray-300/50 ${index % 2 === 0 ? 'bg-gray-300' : 'bg-[#C1C7CE]'}`} key={uniqueId}>
                                    <button onClick={() => toggleExpand(activity.instanceId)} className='cursor-pointer w-full h-[80px]'>
                                        <div key={uniqueId} className={`px-6 text-[1.1rem] text-start justify-between flex items-center`}>
                                            <div className='flex items-center justify-between w-[55%] text-start'>
                                                <div className='flex items-center text-start'>
                                                    {activity.activityIcon && <img src={`${API_CONFIG.BUNGIE_API}${activity.activityIcon}`} className='w-13 h-13' style={{ filter: "brightness(0) contrast(100%)" }} />}
                                                    <div className='w-1.5'></div>
                                                    <div className='flex flex-col leading-6'>
                                                        <p>{activity.activityMode}</p>
                                                        <p className='text-[1.4rem font-semibold'>{activity.activityName}</p>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className='flex items-center justify-end w-[45%] text-start space-x-6'>
                                                <div className='w-35 justify-end flex'>
                                                    <p className='w-fit'>{activity.duration}</p>
                                                </div>
                                                <div className='flex items-center w-20'>
                                                    <i className='icon-kills3' style={{ filter: "invert(100%)" }}></i>
                                                    <div className='w-1'></div>
                                                    <p>{activity.kills}</p>
                                                </div>
                                                <div className='flex items-center w-15'>
                                                    <img src={skull} className="mr-2" width={27} height={27} />
                                                    <p>{activity.deaths}</p>
                                                </div>
                                                <div className='flex items-center w-25 justify-end'>
                                                    <p className='py-2'>KD</p>
                                                    <div className='w-1'></div>
                                                    <p>{activity.kd}</p>
                                                </div>
                                                <div className='w-15 flex items-center mr-1'>
                                                    <img src={activity.completedSymbol} className='w-10 h-10' />
                                                </div>
                                            </div>
                                        </div>
                                    </button>
                                    {expandedInstanceId == uniqueId && (
                                        <div className='fixed inset-0 bg-black/60 flex justify-center items-center z-50 transition duration-300' onClick={closePopup}>
                                            <div className="relative overflow-visible" onClick={(e) => e.stopPropagation()}>
                                                <ActivityPopUp instanceId={activity.instanceId} userId={userId} membershipType={membershipType} onClose={closePopup} />
                                            </div>
                                        </div>
                                    )}
                                </div>
                            );
                        }) : (
                            <div className='top-0 text-xl font-bold'>Ya no hay actividades para este filtro</div>
                        )}
                    </div>
                </>)}
            <div className="flex justify-center items-center mt-6 space-x-8 ">
                <div className="flex items-center space-x-1">
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
                                    ? 'text-gray-400 cursor-default'
                                    : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                                }`}
                        >
                            {pageNumber}
                        </button>
                    ))}

                    <button
                        onClick={() => handlePageChange(currentPage + 1)}
                        disabled={knownLastPage ? currentPage >= knownLastPage : false}
                        className={`px-3 py-1 rounded cursor-pointer ${knownLastPage && currentPage >= knownLastPage
                            ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                            : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                            }`}
                    >
                        {">"}
                    </button>
                </div>

                <div className="flex items-center gap-2">
                    <span className="text-sm">Página:</span>
                    <input
                        type="number"
                        min="1"
                        onChange={(e) => {
                            setGotoPageInput(e.target.value);
                            if (goToPageError) setGoToPageError(false);
                        }}
                        onKeyDown={(e) => e.key === "Enter" && handleGoToPage()}
                        className={`w-18 px-2 py-1 border bg-white rounded ${goToPageError ? "border-red-500" : "border-gray-300"}`}
                    />
                    <button
                        ref={goToButtonRef}
                        onClick={handleGoToPage}
                        className={`px-3 py-1 rounded text-white cursor-pointer transition-colors ${goToPageError ? "bg-red-500 hover:bg-red-600" : "bg-blue-500 hover:bg-blue-600"
                            }`}
                    >
                        Ir
                    </button>
                </div>
            </div>
            {instanceId && (
                <div className='fixed inset-0 bg-black/60 flex justify-center items-center z-50 transition duration-300' onClick={closePopup}>
                    <div className="relative overflow-visible" onClick={(e) => e.stopPropagation()}>
                        <ActivityPopUp instanceId={instanceId} userId={userId} membershipType={membershipType} onClose={closePopup} />
                    </div>
                </div>
            )}
        </div>
    );
};

export default ActivityHistory;