
export default function Pve({activity, userId}) {
    return (
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
    );
}