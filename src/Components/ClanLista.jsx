import axios from 'axios';
import { useEffect, useState } from 'react';
import MemberCard from './MemberCard';
import './Tabla.css';
export default function ClanLista() {
    const [members, setMembers] = useState([]);
    const [error, setError] = useState(null);

    useEffect(() => {

        const fetchClanMembers = async () => {
            try {
                const response = await axios.get('/api/Platform/GroupV2/3942032/Members/', {
                    headers: {
                        'X-API-Key': 'f83a251bf2274914ab739f4781b5e710',
                    },
                });
                setMembers(response.data.Response.results);
                console.log('Response:', response.data.Response.results);
            } catch (error) {
                if (error.response) {
                    console.error('Response data:', error.response.data);
                    setError(`Server Error: ${error.response.status} - ${error.response.statusText}`);
                } else if (error.request) {
                    console.error('No response received:', error.request);
                    setError('No response received from the server. Please try again later.');
                } else {
                    console.error('Error setting up the request:', error.message);
                    setError('Error setting up the request. Please try again later.');
                }
            }
        };

        fetchClanMembers();
    }, []);

    return (
        <div>
            <h1 className='text-2xl p-4'>Clan BRODAS</h1>
            <div className='justify-center flex items-center flex-col'>
                {error && <p>{error}</p>}
                <table className='text-center'>
                    <thead>
                        <tr>
                            <th>Emblema</th>
                            <th>Nombre</th>
                            <th>Rol</th>
                            <th>Última Conexión</th>
                            <th>Fecha de Ingreso</th>
                            <th>Mejor Arma PVE</th>
                            <th>Mejor Arma PVP</th>
                            <th>Máximo Poder</th>
                        </tr>
                    </thead>
                    <tbody>
                        {members
                            .sort((a, b) => b.lastOnlineStatusChange - a.lastOnlineStatusChange)
                            .map(member => (
                                <MemberCard member={member} key={member.destinyUserInfo.membershipId}/>
                            ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

