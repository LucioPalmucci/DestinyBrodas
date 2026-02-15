import { useEffect, useRef, useState } from 'react';
import circleEmpty from "../../../../assets/circle-empty.svg";
import circleSolid from "../../../../assets/circle-solid.svg";
import medal from "../../../../assets/medal-solid.svg";
import skull from "../../../../assets/skull-solid.svg";
import { API_CONFIG } from '../../../../config';
import PopUp from './Player';

export default function Crucible({ activity, userId }) {
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
                                                <PopUp jugador={person} setIsOpen={setJugadorSelected} />
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
                                                <PopUp jugador={person} setIsOpen={setJugadorSelected} />
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
    )
}