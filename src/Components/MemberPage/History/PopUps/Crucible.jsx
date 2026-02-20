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

export default function Crucible({ activity, userId }) {
    const [jugadorSelected, setJugadorSelected] = useState(null);
    const popupRef = useRef(null);
    const fetchPlayersBasicData = usePlayersBasicData();
    const [actComplete, setActComplete] = useState(null);
    const scoreTeamA = useCountUp(actComplete?.teams?.teamA?.score ?? 0, 1000);
    const scoreTeamB = useCountUp(actComplete?.teams?.teamB?.score ?? 0, 1000);

    useEffect(() => {
        (async () => {
            const data = await fetchPlayersBasicData(activity, userId);
            const completeAct = { ...activity, ...data };
            console.log(completeAct);
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

    return !actComplete ? (
        <div className="h-[600px] bg-center flex bg-cover rounded-lg w-4xl text-white max-h-screen p-6 overflow-y-auto justify-center font-light" style={{ backgroundImage: `url(${API_CONFIG.BUNGIE_API}${activity.pgcrImage})` }} />
    ) : (
        <div
            className='bg-center flex bg-cover rounded-lg w-fit text-white max-h-screen p-6 overflow-y-auto justify-center font-light'
            style={{ backgroundImage: `url(${API_CONFIG.BUNGIE_API}${activity.pgcrImage})` }}
        >
            <div className='flex flex-col justify-center space-y-4 items-center'>
                <div className='flex justify-center items-center w-full text-sm'>
                    {actComplete.teams && (
                        <>
                            {actComplete.teams.teamA && (
                                <div 
                                    className={`flex flex-col justify-center items-center space-y-1 mt-2 rounded-lg ${actComplete.teams.teamA.standing == 0 ? 'shadow-green-500/50' : 'shadow-red-500/50'}`}
                                    style={{
                                        boxShadow: actComplete.teams.teamA.standing == 0
                                            ? '0 0 30px rgba(34, 197, 94, 1)'
                                            : '0 0 30px rgba(239, 68, 68, 1)'
                                    }}
                                >
                                    <button className='flex flex-col items-center w-30 mvp-button bg-black/25 rounded-lg p-2' data-effect="wave">
                                        <p className='text-5xl font-semibold fade-in'>{scoreTeamA}</p>
                                    </button>
                                </div>
                            )}
                            {actComplete.activityIcon && (
                                <div className='w-30 h-30 mx-8 bg-black/25 rounded-lg p-1'>
                                    <img
                                        src={`${API_CONFIG.BUNGIE_API}${actComplete.activityIcon}`}
                                        className='pop-in'
                                    />
                                </div>
                            )}
                            {actComplete.teams.teamB && (
                                <div 
                                    className='flex flex-col items-center justify-center text-center space-y-1 mt-2 rounded-lg'
                                    style={{
                                        boxShadow: actComplete.teams.teamB.standing == 0
                                            ? '0 0 30px rgba(34, 197, 94, 1)'
                                            : '0 0 30px rgba(239, 68, 68, 1)'
                                    }}
                                >
                                    <div className='bg-black/25 rounded-lg p-2 w-30'>
                                        <p className='text-5xl font-semibold fade-in'>{scoreTeamB}</p>
                                    </div>
                                </div>
                            )}
                        </>
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
                    <div className='w-full flex justify-center space-x-8 h-10'>
                        <div className='flex items-center text-center pb-1 w-80'>
                            <div className='flex bg-black/25 p-2 w-full justify-between rounded-lg items-center text-[0.72rem]'>
                                {actComplete.hasPoints && <div className='w-20'>PUNTOS</div>}
                                <div className='w-20' title='Bajas'><i className='icon-kills2'></i></div>
                                <div className='flex justify-center items-center w-20' title='Muertes'>
                                    <img src={skull} width={15} height={15} style={{ filter: 'brightness(0) invert(1)' }} />
                                </div>
                                <div className='w-20'>KD</div>
                                {actComplete.hasMedals && (
                                    <div className=' flex justify-center items-center w-20' title='medallas'>
                                        <img src={medal} style={{ filter: 'brightness(0) invert(1)' }} width={15} height={15} />
                                    </div>
                                )}
                            </div>
                        </div>
                        <div className='flex items-center text-center pb-1 w-80'>
                            <div className='flex flex-row-reverse bg-black/25 p-2 w-full justify-between rounded-lg items-center text-[0.72rem] '>
                                {actComplete.hasPoints && <div className='w-20'>PUNTOS</div>}
                                <div className='w-20' title='Bajas'><i className='icon-kills2'></i></div>
                                <div className='flex justify-center items-center w-20' title='Muertes'>
                                    <img src={skull} width={15} height={15} style={{ filter: 'brightness(0) invert(1)' }} />
                                </div>
                                <div className='w-20'>KD</div>
                                {actComplete.hasMedals && (
                                    <div className='flex justify-center items-center w-20' title='medallas'>
                                        <img src={medal} style={{ filter: 'brightness(0) invert(1)' }} width={15} height={15} />
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className='w-full flex space-x-8'>
                        <div>
                            {actComplete.teams.teamA.people.map((person, idx) => {
                                const personIndex = `single-${idx}`;
                                const isMvp = person.membershipId == actComplete.mvp.membershipId;
                                return (
                                    <div key={idx} className={`flex items-center text-start space-x-4 text-sm ${isMvp ? "font-bold " : ""} relative`}>
                                        <div className='py-2 text-xs w-45 dark whitespace-nowrap dark'>
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
                                                        {person.uniqueName.length > 14
                                                            ? person.uniqueName.slice(0, 14) + "..."
                                                            : person.uniqueName
                                                        }
                                                        <span style={{ color: '#479ce4' }}>
                                                            {person.uniqueNameCode}
                                                        </span>
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
                                        <div className='flex bg-black/25 p-2 h-[50px] text-center rounded-lg w-80 justify-evenly items-center text-[0.72rem]'>
                                            {actComplete.hasPoints && <div className='w-20'>{person.score}</div>}
                                            <div className='w-20'>{person.kills}</div>
                                            <div className='w-20'>{person.deaths}</div>
                                            <div className='w-20'>{person.kd}</div>
                                            {actComplete.hasMedals && <div className='w-20'>{person.medals}</div>}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                        <div>
                            {actComplete.teams.teamB.people.map((person, idx) => {
                                const personIndex = `single-${idx}`;
                                const isMvp = person.membershipId == actComplete.mvp.membershipId;
                                return (
                                    <div key={idx} className={`flex items-center text-start space-x-4 text-sm ${isMvp ? "font-bold " : ""} relative`}>
                                        <div className='flex flex-row-reverse bg-black/25 p-2 h-[50px] text-center rounded-lg w-80 justify-evenly items-center text-[0.72rem]'>
                                            {actComplete.hasPoints && <div className='w-20'>{person.score}</div>}
                                            <div className='w-20'>{person.kills}</div>
                                            <div className='w-20'>{person.deaths}</div>
                                            <div className='w-20'>{person.kd}</div>
                                            {actComplete.hasMedals && <div className='w-20'>{person.medals}</div>}
                                        </div>
                                        <div className='py-2 text-xs w-45 dark whitespace-nowrap flex justify-end dark'>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handlePlayerClick(person, personIndex);
                                                }}
                                                data-effect={`${isMvp ? 'wave' : ''}`}
                                                className={`bg-black/25 flex items-center justify-end text-right gap-1.5 rounded-lg w-full h-[50px] p-2 transition-all duration-200 hover:scale-105 clan-member-shimmer clan-member-idle ${isMvp ? 'mvp-button' : ''}`}
                                            >
                                                {isMvp && <span className="shimmer"></span>}
                                                <div className='flex flex-col justify-end items-end'>
                                                    <div className='flex'>
                                                        {person.uniqueName.length > 12
                                                            ? person.uniqueName.slice(0, 12) + "..."
                                                            : person.uniqueName
                                                        }
                                                        <span style={{ color: '#479ce4' }}>
                                                            {person.uniqueNameCode}
                                                        </span>
                                                    </div>
                                                    <div className='flex items-center justify-end'>
                                                        <img src={person.classSymbol} className="w-4 h-4 mr-1" alt="class" />
                                                        {person.class} - {person.power}
                                                    </div>
                                                </div>
                                                <img src={`${API_CONFIG.BUNGIE_API}/${person.emblem}`} width={30} height={30} alt="Emblem" />
                                            </button>

                                            {jugadorSelected === personIndex && (
                                                <div ref={popupRef} className="absolute left-30 top-0 z-50 ml-2 overflow-hidden">
                                                    <PopUp jugador={person} setIsOpen={setJugadorSelected} />
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}