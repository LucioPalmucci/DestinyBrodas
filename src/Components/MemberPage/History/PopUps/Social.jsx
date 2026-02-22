
import { faCalendar, faClock } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useEffect, useRef, useState } from 'react';
import skull from "../../../../assets/skull-solid.svg";
import suitcase from "../../../../assets/suitcase-medical-solid.svg";
import { API_CONFIG } from '../../../../config';
import { useBungieAPI } from '../../../APIservices/BungieAPIcalls';
import '../../../CSS/mvp.css';
import { useCountUp } from './Hooks/countUp';
import PopUp from './Player';
import usePlayersBasicData from './playersBasicData';

export default function Social({ activity, userId, membershipType }) {
    const [jugadorSelected, setJugadorSelected] = useState(null);
    const popupRef = useRef(null);
    const [actComplete, setActComplete] = useState(null);
    const [leftWidth, setLeftWidth] = useState(null);
    const fetchPlayersBasicData = usePlayersBasicData();
    const scoreMVP = useCountUp(actComplete?.firstPlace?.score ?? 0, 1000);
    const { getCompsProfile } = useBungieAPI();
    const r = 6.5;
    const circunference = 2 * Math.PI * r;

    useEffect(() => {
        (async () => {
            const player = await fetchPlayersBasicData(activity, userId, membershipType);
            setActComplete({ ...activity, player });
            console.log("Datos completos de la actividad social: ", { ...activity, player });
        })();
    }, [activity, userId]);

    const handlePlayerClick = (person, open) => {
        if (open === false) {
            setJugadorSelected(null); // Cerrar si ya está abierto
        } else {
            setJugadorSelected(person); // Abrir el popup para este jugador
        }
    };

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

    return !actComplete ? (
        <div className="h-[500px] bg-center flex bg-cover rounded-lg min-w-4xl text-white max-h-screen p-6 overflow-y-auto justify-center font-light" style={{ backgroundImage: `url(${API_CONFIG.BUNGIE_API}${activity.pgcrImage})` }} />
    ) : (
        <div
            className='min-h-[500px] bg-center flex bg-cover rounded-lg min-w-4xl text-white max-h-screen p-6 overflow-y-auto justify-center font-light'
            style={{ backgroundImage: `url(${API_CONFIG.BUNGIE_API}${activity.pgcrImage})` }}
        >
            <div className='flex flex-col justify-center space-y-4 items-center'>
                <div className='flex items-center w-full justify-center text-xl'>
                    <div className='w-[28%] justify-end flex'>
                        <div className='flex flex-col items-center bg-black/25 p-2 rounded-lg px-3.5 w-fit' title='fecha y hora de inicio'>
                            <div className='flex items-center'><FontAwesomeIcon icon={faCalendar} className='mr-1' /><p>{actComplete.date}</p> </div>
                        </div>
                    </div>
                    {actComplete.activityIcon && (
                        <div className='w-30 h-30 mx-8 bg-black/25 rounded-lg p-1'>
                            <img
                                src={`${API_CONFIG.BUNGIE_API}${actComplete.activityIcon}`}
                                className='pop-in'
                            />
                        </div>
                    )}
                    <div className='w-[28%]'>
                        <div className='flex flex-col items-center bg-black/25 p-2 rounded-lg px-3.5 w-fit' title='fecha y hora de inicio'>
                            <div className='flex items-center'><FontAwesomeIcon icon={faClock} className='mr-1' /><p>{actComplete.duration}</p></div>
                        </div>
                    </div>
                </div>

                <div className='flex justify-center items-center w-fit space-x-7 text-sm'>
                    <div className='flex flex-col items-center bg-black/25 p-2 rounded-lg'>
                        <p>{actComplete.activityMode}: {actComplete.activityName}</p>
                    </div>
                </div>

                <div className='w-fit'>
                    <div className='w-full'>
                        {actComplete.player && (
                            <div className='flex items-center text-center space-x-4 justify-end'>
                                <div className=''></div>
                                <div className='flex bg-black/25 py-2 px-0 rounded-lg items-center text-[0.72rem] w-[320px]'>
                                    <div className='w-20' title='Bajas'><i className='icon-kills2'></i></div>
                                    <div className='w-20 flex justify-center items-center' title='Muertes'>
                                        <img src={skull} width={15} height={15} style={{ filter: 'brightness(0) invert(1)' }} />
                                    </div>
                                    <div className='w-20 flex justify-center items-center' title='Asistencias'>
                                        <img src={suitcase} width={15} height={15} style={{ filter: 'brightness(0) invert(1)' }} />
                                    </div>
                                    <div className='w-20'>KD</div>
                                </div>
                                <div className='w-[95px] flex bg-black/25 p-2 rounded-lg justify-center items-center text-[0.72rem]' title='Tiempo de juego'>
                                    <i className='icon-clock' />
                                </div>
                            </div>
                        )}
                    </div>

                    <div className='w-full'>
                        {actComplete.player && (
                            <div className={`flex items-end text-start space-x-4 text-sm py-2 relative`}>
                                <div className={`text-xs min-w-max w-full whitespace-nowrap`}>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handlePlayerClick(actComplete.player, true);
                                        }}
                                        className={`bg-black/25 flex text-start p-2 gap-1.5 rounded-lg w-full transition-all duration-200 hover:scale-105 clan-member-shimmer clan-member-idle`}
                                    >
                                        <img src={`${API_CONFIG.BUNGIE_API}/${actComplete.player.emblem}`} width={30} height={30} alt="Emblem" />
                                        <div className='flex flex-col justify-center'>
                                            <div className='flex items-center'>
                                                <p>{actComplete.player.uniqueName}</p>
                                                <p style={{ color: '#479ce4' }}>{actComplete.player.uniqueNameCode}</p>
                                            </div>
                                            <div className='flex items-center'>
                                                <img src={actComplete.player.classSymbol} className="w-4 h-4 mr-1" alt="class" />
                                                {actComplete.player.classe} - {actComplete.player.power}
                                            </div>
                                        </div>
                                    </button>

                                    {jugadorSelected && (
                                        <div ref={popupRef} className="absolute left-30 top-0 z-50 ml-2">
                                            <PopUp jugador={actComplete.player} setIsOpen={setJugadorSelected} />
                                        </div>
                                    )}
                                </div>
                                <div className='flex bg-black/25 py-3.5 h-[50px] px-0 rounded-lg text-center'>
                                    <div className='w-20'>{actComplete.player.kills}</div>
                                    <div className='w-20'>{actComplete.player.deaths}</div>
                                    <div className='w-20'>{actComplete.player.assists}</div>
                                    <div className='w-20'>{actComplete.player.kd}</div>
                                </div>
                                <div className='flex bg-black/25 py-3.5 h-[50px] px-0 rounded-lg text-center justify-center items-center'>
                                    <div className='w-24 flex items-center justify-center space-x-1' title={"Presente en el " + actComplete.player.percentagePlayed + "% de la actividad"}>
                                        <svg width="16" height="16" viewBox="0 0 16 16" className='-rotate-90 transform hidden md:block'>
                                            <circle cx="8" cy="8" r={r} fill="none" stroke="currentColor" strokeWidth="3" className='text-zinc-800' strokeLinecap="round" strokeDasharray={circunference} strokeDashoffset={0} />
                                            <circle cx="8" cy="8" r={r} fill="none" stroke="currentColor" strokeWidth="3" className='text-green-500' strokeLinecap="round" strokeDasharray={circunference} strokeDashoffset={actComplete.player.dashoffset} />
                                        </svg>
                                        <p>{actComplete.player.timePlayed}</p>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}