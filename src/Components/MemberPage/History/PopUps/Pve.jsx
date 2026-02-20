import { faCalendar, faClock } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useEffect, useRef, useState } from 'react';
import check from "../../../../assets/check.png";
import checkpoint from "../../../../assets/checkpoint.png";
import difficultyIcon from "../../../../assets/difficulty.png";
import skull from "../../../../assets/skull-solid.svg";
import suitcase from "../../../../assets/suitcase-medical-solid.svg";
import { API_CONFIG } from '../../../../config';
import '../../../CSS/mvp.css';
import { useCountUp } from './Hooks/countUp';
import PopUp from './Player';
import usePlayersBasicData from './playersBasicData';


export default function Pve({ activity, userId }) {
    const [jugadorSelected, setJugadorSelected] = useState(null);
    const popupRef = useRef(null);
    const [actComplete, setActComplete] = useState(null);
    const [leftWidth, setLeftWidth] = useState(null);
    const fetchPlayersBasicData = usePlayersBasicData();
    const scoreMVP = useCountUp(actComplete?.firstPlace?.score ?? 0, 1000);
    const r = 6.5;
    const circunference = 2 * Math.PI * r;

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
        <div className="h-[500px] bg-center flex bg-cover rounded-lg min-w-4xl text-white max-h-screen p-6 overflow-y-auto justify-center font-light" style={{ backgroundImage: `url(${API_CONFIG.BUNGIE_API}${activity.pgcrImage})` }} />
    ) : (
        <div
            className='min-h-[500px] bg-center flex bg-cover rounded-lg min-w-4xl text-white max-h-screen p-6 overflow-y-auto justify-center font-light'
            style={{ backgroundImage: `url(${API_CONFIG.BUNGIE_API}${activity.pgcrImage})` }}
        >
            <div className='flex flex-col justify-center space-y-4 items-center'>
                <div className='flex items-center w-full justify-center text-xl'>
                    {actComplete.mvp && (
                        <div className='dark flex flex-col justify-end items-end space-y-1 mt-2 w-[28%]'>
                            <button className='flex flex-col items-center mvp-button bg-black/25 rounded-lg p-2 px-3.5' data-effect="wave">
                                <span className="shimmer"></span>
                                <div className='flex'>
                                    <p>{actComplete.mvp.uniqueName}</p>
                                    <p style={{ color: '#479ce4' }}>{actComplete.mvp.uniqueNameCode}</p>
                                </div>
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
                    <div className='w-[28%] text-base'>
                        <div className='flex flex-col items-center bg-black/25 p-2 rounded-lg px-3.5 w-fit' title='fecha y hora de inicio'>
                            <div className='flex items-center'><FontAwesomeIcon icon={faCalendar} className='mr-1' /><p>{actComplete.date}</p> </div>
                            <div className='flex items-center'><FontAwesomeIcon icon={faClock} className='mr-1' /><p>{actComplete.duration}</p></div>
                        </div>
                    </div>
                </div>

                <div className='flex justify-center items-center w-fit space-x-7 text-sm'>
                    <div className='flex flex-col items-center bg-black/25 p-2 rounded-lg'>
                        <p>{actComplete.activityName}</p>
                    </div>
                    <div className='flex items-center bg-black/25 p-1 rounded-lg'>
                        {actComplete.feats && actComplete.feats.length > 0 ? (
                            <div className='flex items-center space-x-2'>
                                {actComplete.feats.map((feat, index) => (
                                    <div key={index} className='flex items-center'>
                                        <img src={`${API_CONFIG.BUNGIE_API}${feat.icon}`} className='w-7' title={feat.name} />
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className='flex items-center px-1'>
                                <img src={difficultyIcon} className='w-6.5' style={{ filter: actComplete.difficultyColor }} />
                                <p style={{ filter: actComplete.difficultyColor }}>{actComplete.difficulty}</p>
                            </div>
                        )}
                    </div>
                    <div className='flex items-center justify-center bg-black/25 p-[7px] rounded-lg px-1.5 pl-2'>
                        <img src={checkpoint} className='w-5 mr-2 translate-y-[0px]' ></img>
                        <p>{actComplete.full ? "Fresh" : "Checkpoint"}</p>
                    </div>
                    <div className=' flex items-center bg-black/25 p-2 rounded-lg'>
                        <img title={actComplete.completed} src={actComplete.completedSymbol} className='w-4.5' style={{ filter: 'brightness(0) invert(1)' }} />
                    </div>
                </div>

                <div className='w-fit'>
                    <div className='w-full'>
                        <div className='flex items-center text-center space-x-4 justify-end'>
                            <div className=''></div>
                            <div className='w-[53px] flex bg-black/25 p-2 rounded-lg justify-center items-center text-[0.72rem]' title='Completadas'>
                                <img src={check} width={15} height={15} />
                            </div>
                            <div className='flex bg-black/25 py-2 px-0 rounded-lg items-center text-[0.72rem] w-[320px]'>
                                {actComplete.hasPoints && <div className='w-20'>PUNTOS</div>}
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
                    </div>

                    <div className='w-full'>
                        {actComplete.people.map((person, idx) => {
                            const personIndex = `single-${idx}`;
                            const isMvp = person.membershipId == actComplete.mvp.membershipId;
                            return (
                                <div key={idx} className={`flex items-end text-start space-x-4 text-sm py-2 ${isMvp ? "font-bold " : ""} relative`}>
                                    <div className=' text-xs min-w-max w-full dark whitespace-nowrap dark'>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handlePlayerClick(person, personIndex);
                                            }}
                                            data-effect={`${isMvp ? 'wave' : ''}`}
                                            className={`bg-black/25 flex text-start p-2 gap-1.5 rounded-lg w-full transition-all duration-200 hover:scale-105 clan-member-shimmer clan-member-idle ${isMvp ? 'mvp-button' : ''}`}
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
                                    <div className='flex bg-black/25 py-3.5 h-[50px] px-0 rounded-lg text-center'>
                                        <div className='w-13'>{person.completions}</div>
                                    </div>
                                    <div className='flex bg-black/25 py-3.5 h-[50px] px-0 rounded-lg text-center'>
                                        {actComplete.hasPoints && <div className='w-20'>{person.score}</div>}
                                        <div className='w-20'>{person.kills}</div>
                                        <div className='w-20'>{person.deaths}</div>
                                        <div className='w-20'>{person.assists}</div>
                                        <div className='w-20'>{person.kd}</div>
                                    </div>
                                    <div className='flex bg-black/25 py-3.5 h-[50px] px-0 rounded-lg text-center justify-center items-center'>
                                        <div className='w-24 flex items-center justify-center space-x-1' title={"Presente en el " + person.percentagePlayed + "% de la actividad"}>
                                            <svg width="16" height="16" viewBox="0 0 16 16" className='-rotate-90 transform hidden md:block'>
                                                <circle cx="8" cy="8" r={r} fill="none" stroke="currentColor" strokeWidth="3" className='text-zinc-800' strokeLinecap="round" strokeDasharray={circunference} strokeDashoffset={0} />
                                                <circle cx="8" cy="8" r={r} fill="none" stroke="currentColor" strokeWidth="3" className='text-green-500' strokeLinecap="round" strokeDasharray={circunference} strokeDashoffset={person.dashoffset} />
                                            </svg>
                                            <p>{person.timePlayed}</p>
                                        </div>
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