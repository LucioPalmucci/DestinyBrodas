import { faCalendar, faClock } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useEffect, useRef, useState } from 'react';
import medal from "../../../../assets/medal-solid.svg";
import skull from "../../../../assets/skull-solid.svg";
import { API_CONFIG } from '../../../../config';
import '../../../CSS/mvp.css';
import { useCountUp } from './Hooks/countUp';
import PopUp from './Player';
import usePlayersBasicData from './playersBasicData';

export default function Rumble({ activity, userId }) {
    const [jugadorSelected, setJugadorSelected] = useState(null);
    const popupRef = useRef(null);
    const [actComplete, setActComplete] = useState(null);
    const [leftWidth, setLeftWidth] = useState(null);
    const fetchPlayersBasicData = usePlayersBasicData();
    const scoreFirstPlace = useCountUp(actComplete?.firstPlace?.score ?? 0, 1000);
    const scoreSecondPlace = useCountUp(actComplete?.secondPlace?.score ?? 0, 1000);

    useEffect(() => {
        (async () => {
            const data = await fetchPlayersBasicData(activity, userId);
            const completeAct = { ...activity, ...data };
            setActComplete(completeAct);
        })();
    }, [activity, userId, fetchPlayersBasicData]);

    const handlePlayerClick = (person, personIndex) => {
        if (jugadorSelected === personIndex) {
            setJugadorSelected(null); // Cerrar si ya está abierto
        } else {
            setJugadorSelected(personIndex); // Abrir el popup para este jugador
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
        <div className="h-[600px] bg-center flex bg-cover rounded-lg w-4xl text-white max-h-screen p-6 overflow-y-auto justify-center font-light" style={{ backgroundImage: `url(${API_CONFIG.BUNGIE_API}${activity.pgcrImage})` }} />
    ) : (
        <div
            className='bg-center flex bg-cover rounded-lg w-4xl text-white max-h-screen p-6 overflow-y-auto justify-center font-light'
            style={{ backgroundImage: `url(${API_CONFIG.BUNGIE_API}${activity.pgcrImage})` }}
        >
            <div className='flex flex-col justify-center space-y-4 items-center'>
                <div className='flex justify-center items-center w-full text-sm'>
                    {actComplete.firstPlace && (
                        <div className='dark flex flex-col justify-center items-center space-y-1 mt-2'>
                            <button className='flex flex-col items-center w-30 mvp-button bg-black/25 rounded-lg p-2' data-effect="wave">
                                <span className="shimmer"></span>
                                <p className='text-5xl font-semibold fade-in'>{scoreFirstPlace}</p>
                            </button>
                            <div className='flex bg-black/25 rounded-lg p-1 px-1.5 text-[0.7rem]'>
                                <p>{actComplete.firstPlace.uniqueName}</p>
                                <p style={{ color: '#479ce4' }}>{actComplete.firstPlace.uniqueNameCode}</p>
                            </div>
                        </div>
                    )}
                    {actComplete.activityIcon && (
                        <div className='w-28 h-28 mx-8 bg-black/25 rounded-lg'>
                            <img
                                src={`${API_CONFIG.BUNGIE_API}${actComplete.activityIcon}`}
                                className=' pop-in'
                            />
                        </div>
                    )}
                    {actComplete.secondPlace && (
                        <div className='flex flex-col items-center justify-center text-center space-y-1 mt-2'>
                            <div className='bg-black/25 rounded-lg p-2 w-30'>
                                <p className='text-5xl font-semibold fade-in'>{scoreSecondPlace}</p>
                            </div>
                            <div className='flex bg-black/25 rounded-lg p-1 px-1.5 text-[0.7rem]'>
                                <p>{actComplete.secondPlace.uniqueName}</p>
                                <p style={{ color: '#479ce4' }}>{actComplete.secondPlace.uniqueNameCode}</p>
                            </div>
                        </div>
                    )}
                </div>

                <div className='flex justify-center items-center w-fit space-x-7 text-sm'>
                    <div className='flex flex-col items-center bg-black/25 p-2 rounded-lg'>
                        <p>{actComplete.activityTypePVP}: {actComplete.activityName}</p>
                    </div>
                    <div className='flex items-center bg-black/25 p-2 rounded-lg space-x-3' title='fecha y hora de inicio'>
                        <div className='flex items-center'><FontAwesomeIcon icon={faCalendar} className='mr-1' /><p>{actComplete.date}</p> </div>
                        <div className='flex items-center'><FontAwesomeIcon icon={faClock} className='mr-1' /><p>{actComplete.duration}</p></div>
                    </div>
                    <div className=' flex items-center  bg-black/25 p-2 rounded-lg'>
                        <img title={actComplete.completed} src={actComplete.completedSymbol} className='w-4.5' style={{ filter: 'brightness(0) invert(1)' }} />
                    </div>
                </div>

                <div className='w-fit'>
                    <div className='w-full'>
                        <div className='flex items-center text-center pb-1 space-x-4'>
                            <div className='w-full'></div>
                            <div className='flex bg-black/25 py-2 px-0 rounded-lg items-center text-[0.72rem]'>
                                {actComplete.hasPoints && <div className='w-20'>PUNTOS</div>}
                                <div className='w-20' title='Bajas'><i className='icon-kills2'></i></div>
                                <div className='w-20 flex justify-center items-center' title='Muertes'>
                                    <img src={skull} width={15} height={15} style={{ filter: 'brightness(0) invert(1)' }} />
                                </div>
                                <div className='w-20'>KD</div>
                                {actComplete.hasMedals && (
                                    <div className='w-20 flex justify-center items-center' title='medallas'>
                                        <img src={medal} style={{ filter: 'brightness(0) invert(1)' }} width={15} height={15} />
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className='w-full'>
                        {actComplete.people.map((person, idx) => {
                            const personIndex = `single-${idx}`;
                            const isMvp = person.membershipId == actComplete.mvp.membershipId;
                            return (
                                <div key={idx} className={`flex items-center text-start space-x-4 text-sm ${isMvp ? "font-bold " : ""} relative`}>
                                    <div className='py-2 text-xs min-w-max w-full dark whitespace-nowrap dark'>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handlePlayerClick(person, personIndex);
                                            }}
                                            data-effect={`${isMvp ? 'wave' : ''}`}
                                            className={`bg-black/25 flex items-center text-start gap-1.5 rounded-lg w-full h-[50px] p-2 transition-all duration-200 hover:scale-105 clan-member-shimmer clan-member-idle ${isMvp ? 'mvp-button' : ''}`}
                                        >
                                            {isMvp && <span className="shimmer"></span>}
                                            <img src={`${API_CONFIG.BUNGIE_API}/${person.emblem}`} width={30} height={30} alt="Emblem" />
                                            <div className='flex flex-col justify-center'>
                                                <div className='flex'>
                                                    <p>{person.uniqueName}</p>
                                                    <p style={{ color: '#479ce4' }}>{person.uniqueNameCode}</p>
                                                </div>
                                                <div className='flex items-center'>
                                                    <img src={person.classSymbol} className="w-4 h-4 mr-1" alt="class" />
                                                    {person.class} - {person.power}
                                                </div>
                                            </div>
                                        </button>

                                        {jugadorSelected === personIndex && (
                                            <div ref={popupRef} className="absolute left-30 top-0 z-50 ml-2 overflow-hidden">
                                                <PopUp jugador={person} setIsOpen={setJugadorSelected} />
                                            </div>
                                        )}
                                    </div>
                                    <div className='flex bg-black/25 py-3.5 h-[50px] px-0 rounded-lg'>
                                        {actComplete.hasPoints && <div className='w-20 text-center'>{person.score}</div>}
                                        <div className='w-20 text-center'>{person.kills}</div>
                                        <div className='w-20 text-center'>{person.deaths}</div>
                                        <div className='w-20 text-center'>{person.kd}</div>
                                        {actComplete.hasMedals && <div className='w-20 text-center'>{person.medals}</div>}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
}