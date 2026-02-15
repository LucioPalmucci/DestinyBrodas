import { useEffect, useRef, useState } from 'react';
import medal from "../../../../assets/medal-solid.svg";
import skull from "../../../../assets/skull-solid.svg";
import { API_CONFIG } from '../../../../config';
import PopUp from './Player';

export default function Rumble({ activity, userId }) {
    const [jugadorSelected, setJugadorSelected] = useState(null);
    const popupRef = useRef(null);

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
        <div className='flex flex-col justify-center space-y-4 text-black'>
            <div className='flex justify-center items-center w-full'>
                {activity.firstPlace && (
                    <div className='flex flex-col items-center'>
                        <p>{activity.firstPlace.name}</p>
                        <p>{activity.firstPlace.score}</p>
                    </div>)}
                {activity.activityIcon && <img src={`${API_CONFIG.BUNGIE_API}${activity.activityIcon}`} className='w-20 h-20 mx-8' style={{ filter: "brightness(0) contrast(100%)" }} />}
                {activity.secondPlace && (
                    <div className='flex flex-col items-center'>
                        <p>{activity.secondPlace.name}</p>
                        <p>{activity.secondPlace.score}</p>
                    </div>)}
            </div>
            <div className='flex justify-center items-center w-full space-x-10'>
                <div className='flex flex-col items-center'>
                    <p>{activity.activityTypePVP}: {activity.activityName}</p>
                </div>
                <div className='flex flex-col items-center'>
                    <p>{activity.date}, {activity.duration}</p>
                </div>
                <div className='w-10 flex items-center mr-1'>
                    <img src={activity.completed} className='w-7 h-7' />
                </div>
            </div>
            <table className='w-170 tablapartida text-black'>
                <thead >
                    <tr>
                        <th className='w-50'>Nombre</th>
                        {activity.hasPoints && <th className='w-10'>Puntos</th>}
                        <th className='w-10' title='Bajas'><i className='icon-kills2' style={{ filter: "invert(100%)" }}></i></th>
                        <th className='w-10' title='Muertes'><img src={skull} className="mr-2" width={15} height={15} /></th>
                        <th className='w-10'>KD</th>
                        {activity.hasMedals && <th className='w-10' title='medallas'><img src={medal} className="-translate-x-1" width={15} height={15} /></th>}
                    </tr>
                </thead>
                <tbody>
                    {activity.people.map((person, idx) => {
                        const personIndex = `single-${idx}`;
                        return (
                            <tr key={idx} className={`text-start text-sm ${person.membershipId == activity.mvp.membershipId ? "font-bold shadow-xl shadow-yellow-300 inset-shadow-sm inset-shadow-yellow-300" : ""} relative`}>
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
                                            <PopUp jugador={person} setIsOpen={setJugadorSelected} />
                                        </div>
                                    )}
                                </td>
                                {activity.hasPoints && <td>{person.score}</td>}
                                <td>{person.kills}</td>
                                <td>{person.deaths}</td>
                                <td>{person.kd}</td>
                                {activity.hasMedals && <td>{person.medals}</td>}
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
}