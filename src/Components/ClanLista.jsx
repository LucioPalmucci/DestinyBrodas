import axios from 'axios';
import { useEffect, useState } from 'react';

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
                console.log(response.data.Response);
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

    const formatDate = (timestamp) => {
        const date = new Date(timestamp * 1000);
        return date.toLocaleString();
    };

    const getMemberType = (type) => {
        switch (type) {
            case 2:
                return 'Miembro';
            case 3:
                return 'Moderador';
            case 5:
                return 'Admin';
            default:
                return 'Desconocido';
        }
    };

    return (
        <div>
            {error && <p>{error}</p>}
            <ul>
                {members.map(member => (
                    <div>
                        <li>{member.bungieNetUserInfo.supplementalDisplayName}</li>
                        <li>{getMemberType(member.memberType)}</li>
                        <li>{member.isOnline ? "En linea" : "Desconectado"}</li>
                        <li>Última conexión: {formatDate(member.lastOnlineStatusChange)}</li>
                        <br/>
                    </div>
                    
                ))}
            </ul>
        </div>
    );
}