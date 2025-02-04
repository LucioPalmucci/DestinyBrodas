import axios from 'axios';
import { useEffect, useState } from 'react';
import MemberCard from './MemberCard';
import Spinner from './Spinner';
import './Tabla.css';

export default function ClanLista() {
    const [members, setMembers] = useState([]);
    const [error, setError] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchClanMembers = async () => {
            try {
                const response = await axios.get('/api/Platform/GroupV2/3942032/Members/', {
                    headers: {
                        'X-API-Key': 'f83a251bf2274914ab739f4781b5e710',
                    },
                });

                const unSorted = response.data.Response.results;
                unSorted.sort((a, b) => {
                    if (a.isOnline === b.isOnline) {
                        return b.lastOnlineStatusChange - a.lastOnlineStatusChange;
                    }
                    return a.isOnline ? -1 : 1;
                });
                setMembers(unSorted);
                console.log('Response:', unSorted);

            } catch (error) {
                console.error(error);
                setError('Error al cargar los miembros.');
            } finally {
                setIsLoading(false);
            }
        };
        fetchClanMembers();
    }, []);

    if (isLoading ) {
        return <Spinner />;
    }

    return (
        <div>
            <h1 className='text-2xl p-4'>Clan BRODAS</h1>
            <div className='justify-center items-center flex flex-col font-Inter'>
                {error && <p>{error}</p>}
                <table className='text-start'>
                    <thead>
                        <tr>
                            <th>Nombre</th>
                            <th>Última Conexión</th>
                            <th>Rol</th>
                            <th>Poder</th>
                            <th>Mejor Arma <br /> PVE/PVP</th>
                            <th>Ingreso</th>
                        </tr>
                    </thead>
                    <tbody>
                        {members ? (
                            members

                                .map(member => (
                                    <MemberCard
                                        member={member}
                                        key={member.destinyUserInfo.membershipId}
                                    />
                                ))
                        ) : (
                            <tr>
                                <td colSpan="6" className='mb-10'>
                                    <Spinner />
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );



}
