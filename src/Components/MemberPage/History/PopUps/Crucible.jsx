import { faCalendar, faClock } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useEffect, useRef, useState } from 'react';
import abandonaLeft from '../../../../assets/abandonaLeft.png';
import abandonaRight from '../../../../assets/abandonaRight.png';
import medal from "../../../../assets/medal-solid.svg";
import skull from "../../../../assets/skull-solid.svg";
import { API_CONFIG } from '../../../../config';
import '../../../CSS/circleProgress.css';
import '../../../CSS/mvp.css';
import { useCountUp } from './Hooks/countUp';
import PopUp from './Player';
import usePlayersBasicData from './playersBasicData';

export default function Crucible({ actComplete, userId, onClose }) {
    const [jugadorSelected, setJugadorSelected] = useState(null);
    const popupRef = useRef(null);
    const fetchPlayersBasicData = usePlayersBasicData();
    const [bgLoaded, setBgLoaded] = useState(false);
    const [bgError, setBgError] = useState(false);
    const scoreTeamA = useCountUp(actComplete?.teams?.teamA?.score ?? 0, 1000);
    const scoreTeamB = useCountUp(actComplete?.teams?.teamB?.score ?? 0, 1000);
    const r = 6.5;
    const circunference = 2 * Math.PI * r;

    /*useEffect(() => {
        setBgLoaded(false);
        setBgError(false);

        const img = new Image();
        img.src = activity?.pgcrImage || "";
        img.onload = () => setBgLoaded(true);
        img.onerror = () => {
            setBgError(true);
            setBgLoaded(true); // evita loader infinito
        };
    }, [activity?.pgcrImage]);*/

    /*useEffect(() => {
        (async () => {
            setActComplete(activity);
        })();
    }, [activity, userId, fetchPlayersBasicData]);*/

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

    const renderNameWithBlueCode = (fullName, maxLen = 16) => {
        const text = fullName?.length > maxLen
            ? `${fullName.slice(0, maxLen)}...`
            : (fullName ?? '');

        const hashIndex = text.indexOf('#');
        if (hashIndex === -1) return <>{text}</>;

        return (
            <>
                <span>{text.slice(0, hashIndex)}</span>
                <span className="text-[#479ce4]">{text.slice(hashIndex)}</span>
            </>
        );
    };

    return (
        <div
            className='bg-center flex bg-cover rounded-lg w-fit text-white max-h-screen p-8 justify-center font-light'
            style={{ backgroundImage: bgError ? "none" : `url(${actComplete?.pgcrImage})` }}
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
                    <div className='flex items-center bg-black/25 p-2 rounded-lg space-x-3.5' title='Fecha y hora de la actividad'>
                        <div className='flex items-center'>
                            <FontAwesomeIcon icon={faCalendar} className='mr-1' /><p>{actComplete.date}</p>
                        </div>
                        <div className='flex items-center'>
                            <FontAwesomeIcon icon={faClock} className='mr-1' /><p>{actComplete.hour}</p>
                        </div>
                    </div>
                    <div className='flex flex-col items-center bg-black/25 p-2 rounded-lg' title='Duración de la actividad'>
                        <div className='flex items-center space-x-1'>
                            <svg width="16" height="16" viewBox="0 0 16 16" className='-rotate-90 transform hidden md:block'>
                                <circle cx="8" cy="8" r={r} fill="none" stroke="currentColor" strokeWidth="3" className='text-zinc-800' strokeLinecap="round" strokeDasharray={circunference} strokeDashoffset={0} />
                                <circle cx="8" cy="8" r={r} fill="none" stroke="currentColor" strokeWidth="3" className='text-green-500 circle-progress' strokeLinecap="round" style={{ '--circ': circunference, '--from': circunference, '--to': 0 }} />
                            </svg>
                            <p className='fade-in'>{actComplete.duration}</p>
                        </div>
                    </div>
                    <div className=' flex items-center  bg-black/25 p-2 rounded-lg'>
                        <img title={actComplete.completed} src={actComplete.completedSymbol} className='w-4.5' style={{ filter: 'brightness(0) invert(1)' }} />
                    </div>
                </div>

                <div className='w-fit'>
                    <div className='w-full flex justify-center space-x-8 h-10'>
                        <div className='flex items-center text-center pb-1 w-80'>
                            {actComplete.teams.teamA.people.some(person => person.completed == 1) &&
                                <div className='flex bg-black/25 p-2 rounded-lg w-80 justify-evenly items-center text-[0.72rem]'>
                                    {actComplete.hasPoints && <div className='w-20 mt-0.5'>PUNTOS</div>}
                                    <div className='w-20' title='Bajas'><i className='icon-kills2'></i></div>
                                    <div className='flex justify-center items-center w-20' title='Muertes'>
                                        <img src={skull} width={15} height={15} style={{ filter: 'brightness(0) invert(1)' }} />
                                    </div>
                                    <div className='w-20'>KD</div>
                                    {actComplete.hasMedals && (
                                        <div className=' flex justify-center items-center w-20' title='Medallas'>
                                            <img src={medal} style={{ filter: 'brightness(0) invert(1)' }} width={15} height={15} />
                                        </div>
                                    )}
                                </div>}
                        </div>
                        <div className='flex items-center text-center pb-1 w-80'>
                            {actComplete.teams.teamB.people.some(person => person.completed == 1) &&
                                <div className='flex flex-row-reverse bg-black/25 p-2 text-center rounded-lg w-80 justify-evenly items-center text-[0.72rem]'>
                                    {actComplete.hasPoints && <div className='w-20 mt-0.5'>PUNTOS</div>}
                                    <div className='w-20' title='Bajas'><i className='icon-kills2'></i></div>
                                    <div className='flex justify-center items-center w-20' title='Muertes'>
                                        <img src={skull} width={15} height={15} style={{ filter: 'brightness(0) invert(1)' }} />
                                    </div>
                                    <div className='w-20'>KD</div>
                                    {actComplete.hasMedals && (
                                        <div className='flex justify-center items-center w-20' title='Medallas'>
                                            <img src={medal} style={{ filter: 'brightness(0) invert(1)' }} width={15} height={15} />
                                        </div>
                                    )}
                                </div>
                            }
                        </div>
                    </div>

                    <div className='w-full flex space-x-8'>
                        <div>
                            {actComplete.teams.teamA.people.filter(person => person.completed == 1 || person.membershipId == userId).map((person, idx) => {
                                const personIndex = `single-${idx}-A`;
                                const isMvp = person.membershipId == actComplete.mvp.membershipId;
                                return (
                                    <div key={idx} className={`flex items-center text-start space-x-4 text-sm ${isMvp ? "font-bold " : ""} relative`}>
                                        <div className={`py-2 text-xs w-45 dark whitespace-nowrap ${isMvp ? "theme-shimmer-dorado " : ""}`}>
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
                                                        {renderNameWithBlueCode(person.uniqueCompleteName)}
                                                    </div>
                                                    <div className='flex items-center'>
                                                        <img src={person.classSymbol} className="w-4 h-4 mr-1" alt="class" />
                                                        {person.class} - {person.power}
                                                    </div>
                                                </div>
                                                {isMvp && (
                                                    <div className={`absolute -top-2 -left-2 mvp-tag rounded-md mvp-completed`} title={actComplete.mvp.message}>
                                                        <span>MVP</span>
                                                    </div>
                                                )}
                                            </button>

                                            {jugadorSelected === personIndex && (
                                                <div ref={popupRef} className="absolute left-30 -top-50 z-50 ml-2 overflow-hidden">
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
                            {actComplete.teams.teamB.people.filter(person => person.completed == 1 || person.membershipId == userId).map((person, idx) => {
                                const personIndex = `single-${idx}-B`;
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
                                        <div className={`py-2 text-xs w-45 dark whitespace-nowrap flex justify-end ${isMvp ? "theme-shimmer-dorado " : ""}`}>
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
                                                        {renderNameWithBlueCode(person.uniqueCompleteName)}
                                                    </div>
                                                    <div className='flex items-center justify-end'>
                                                        <img src={person.classSymbol} className="w-4 h-4 mr-1" alt="class" />
                                                        {person.class} - {person.power}
                                                    </div>
                                                </div>
                                                <img src={`${API_CONFIG.BUNGIE_API}/${person.emblem}`} width={30} height={30} alt="Emblem" />
                                                {isMvp && (
                                                    <div className={`absolute -top-2 -right-2 mvp-tag rounded-md mvp-completed`} title={actComplete.mvp.message}>
                                                        <span>MVP</span>
                                                    </div>
                                                )}
                                            </button>

                                            {jugadorSelected === personIndex && (
                                                <div ref={popupRef} className="absolute left-30 -top-50 z-50 ml-2 overflow-hidden">
                                                    <PopUp jugador={person} setIsOpen={setJugadorSelected} />
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                    <div className='w-full flex space-x-8 mt-2'>
                        <div className='w-[50%] mx-6'>
                            {actComplete.teams.teamA.people.some(person => person.completed == 0 && person.membershipId != userId) && (
                                <div className="flex items-center justify-start">
                                    <img src={abandonaLeft} width={25} height={25} title='Dejó la actividad' className='mr-2 opacity-70'></img>
                                    <div className='flex flex-wrap gap-4'>
                                        {actComplete.teams.teamA.people.filter(person => person.completed == 0 && person.membershipId != userId).map((person, idx) => {
                                            return (
                                                <div key={idx} className="flex items-center justify-start w-fit p-2 bg-black/25 rounded-lg text-xs opacity-70">
                                                    <img src={`${API_CONFIG.BUNGIE_API}/${person.emblem}`} width={25} height={25} alt="Emblem" />
                                                    <div className='flex flex-col justify-start items-start ml-2'>
                                                        <div className='flex'>
                                                            {renderNameWithBlueCode(person.uniqueCompleteName)}
                                                        </div>
                                                        <div className='flex items-center justify-start'>
                                                            <img src={person.classSymbol} className="w-4 h-4 mr-1" alt="class" />
                                                            {person.class} - {person.power}
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}
                        </div>
                        <div className='w-[50%] mx-6'>
                            {actComplete.teams.teamB.people.some(person => person.completed == 0 && person.membershipId != userId) && (
                                <div className="flex items-center justify-end">
                                    <div className='flex flex-wrap-reverse gap-4'>
                                        {actComplete.teams.teamB.people.filter(person => person.completed == 0 && person.membershipId != userId).map((person, idx) => {
                                            return (
                                                <div key={idx} className="flex items-center justify-end w-fit p-2 bg-black/25 rounded-lg text-xs opacity-70">
                                                    <div className='flex flex-col justify-end items-end mr-2'>
                                                        <div className='flex'>
                                                            {renderNameWithBlueCode(person.uniqueCompleteName)}
                                                        </div>
                                                        <div className='flex items-center justify-end'>
                                                            <img src={person.classSymbol} className="w-4 h-4 mr-1" alt="class" />
                                                            {person.class} - {person.power}
                                                        </div>
                                                    </div>
                                                    <img src={`${API_CONFIG.BUNGIE_API}/${person.emblem}`} width={25} height={25} alt="Emblem" />
                                                </div>
                                            );
                                        })}
                                    </div>
                                    <img src={abandonaRight} width={25} height={25} title='Dejó la actividad' className='ml-2 opacity-70'></img>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
            <button
                className="absolute -top-8 -right-8 bg-neutral-700 text-white rounded-full w-8 h-8 flex items-center justify-center hover:bg-neutral-800 cursor-pointer shadow-lg"
                onClick={(e) => {
                    e.stopPropagation();
                    onClose?.();
                }}
                aria-label="Cerrar"
            >
                ✕
            </button>
        </div>
    );
}