import { useEffect, useRef, useState } from 'react';
import medal from "../../../../assets/medal-solid.svg";
import skull from "../../../../assets/skull-solid.svg";
import { API_CONFIG } from '../../../../config';
import PopUp from './Player';
import usePlayersBasicData from './playersBasicData';

export default function Rumble({ activity, userId }) {
    const [jugadorSelected, setJugadorSelected] = useState(null);
    const popupRef = useRef(null);
    const [actComplete, setActComplete] = useState(null);
    const fetchPlayersBasicData = usePlayersBasicData();

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

    return (
        !actComplete ? (
            <div className="h-[400px] bg-gray-300 flex w-4xl justify-center items-center p-2 text-xl font-semibold text-black rounded-lg animate-pulse"/>
        ) : (
            <div className='bg-center flex bg-cover rounded-lg w-4xl max-h-screen p-6 overflow-y-auto justify-center' style={{ backgroundImage: `url(${API_CONFIG.BUNGIE_API}${activity.pgcrImage})` }} onClick={(e) => e.stopPropagation()}>
                <div className='flex flex-col justify-center space-y-4 text-black'>
                    <div className='flex justify-center items-center w-full'>
                        {actComplete.firstPlace && (
                            <div className='flex flex-col items-center'>
                                <p>{actComplete.firstPlace.name}</p>
                                <p>{actComplete.firstPlace.score}</p>
                            </div>)}
                        {actComplete.activityIcon && <img src={`${API_CONFIG.BUNGIE_API}${actComplete.activityIcon}`} className='w-20 h-20 mx-8' style={{ filter: "brightness(0) contrast(100%)" }} />}
                        {actComplete.secondPlace && (
                            <div className='flex flex-col items-center'>
                                <p>{actComplete.secondPlace.name}</p>
                                <p>{actComplete.secondPlace.score}</p>
                            </div>)}
                    </div>
                    <div className='flex justify-center items-center w-full space-x-10'>
                        <div className='flex flex-col items-center'>
                            <p>{actComplete.activityTypePVP}: {actComplete.activityName}</p>
                        </div>
                        <div className='flex flex-col items-center'>
                            <p>{actComplete.date}, {actComplete.duration}</p>
                        </div>
                        <div className='w-10 flex items-center mr-1'>
                            <img src={actComplete.completed} className='w-7 h-7' />
                        </div>
                    </div>
                    <div className='w-170 tablapartida text-black'>
                        <div className='w-full'>
                            <div className='flex items-center text-center  pb-1'>
                                <div className='w-50'></div>
                                {actComplete.hasPoints && <div className='w-20'>Puntos</div>}
                                <div className='w-20' title='Bajas'><i className='icon-kills2' style={{ filter: "invert(100%)" }}></i></div>
                                <div className='w-20 flex justify-center items-center' title='Muertes'><img src={skull} width={15} height={15} /></div>
                                <div className='w-20'>KD</div>
                                {actComplete.hasMedals && <div className='w-20 flex justify-center items-center' title='medallas'><img src={medal} className="" width={15} height={15} /></div>}
                            </div>
                        </div>
                        <div className='w-full'>
                            {actComplete.people.map((person, idx) => {
                                const personIndex = `single-${idx}`;
                                return (
                                    <div key={idx} className={`flex items-center text-start text-sm ${person.membershipId == actComplete.mvp.membershipId ? "font-bold " : ""} relative`}>
                                        <div className='py-2 text-xs w-50'>
                                            <button onClick={(e) => {
                                                e.stopPropagation();
                                                handlePlayerClick(person, personIndex);
                                            }} className='flex items-center text-start cursor-pointer'>
                                                <img src={`${API_CONFIG.BUNGIE_API}/${person.emblem}`} width={30} height={30} alt="Emblem" className='rounded' />
                                                <div className='flex flex-col justify-center ml-1'>
                                                    <p>{person.name}</p>
                                                    <div className='flex items-center'><img src={person.classSymbol} className="w-4 h-4 mr-1" style={{ filter: 'brightness(0) saturate(100%)' }} alt="class" />{person.class} - {person.power}</div>
                                                </div>
                                            </button>
                                            {jugadorSelected === personIndex && (
                                                <div ref={popupRef} className="absolute left-30 top-0 z-50 ml-2 overflow-hidden">
                                                    <PopUp jugador={person} setIsOpen={setJugadorSelected} />
                                                </div>
                                            )}
                                        </div>
                                        {actComplete.hasPoints && <div className='w-20 text-center'>{person.score}</div>}
                                        <div className='w-20 text-center'>{person.kills}</div>
                                        <div className='w-20 text-center'>{person.deaths}</div>
                                        <div className='w-20 text-center'>{person.kd}</div>
                                        {actComplete.hasMedals && <div className='w-20 text-center'>{person.medals}</div>}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>
        ))
}