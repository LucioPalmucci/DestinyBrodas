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
                console.log('Members:', response.data.Response.results);
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
        /*
        const fetchManifest = async () => {
            try {
                const manifestResponse = await axios.get(`/api/Platform/Destiny2/Manifest/`, {
                    headers: {
                        'X-API-Key': 'f83a251bf2274914ab739f4781b5e710',
                    }
                });
                const jsonWorldComponentContentPaths = manifestResponse.data.Response.jsonWorldComponentContentPaths;
                console.log('Manifest:', jsonWorldComponentContentPaths);
                const destinyActivityDefinitionPath = jsonWorldComponentContentPaths.es.DestinyActivityTypeDefinition;
                const activityDefinitionResponse = await axios.get("/api/" + destinyActivityDefinitionPath);

                const activityDefinitions = activityDefinitionResponse.data;
                const activitiesInSpanish = Object.keys(activityDefinitions).map(hash => ({
                    hash,
                    name: activityDefinitions[hash].displayProperties.name
                }));

                console.log("Activities in Spanish: ", activitiesInSpanish);
                setActivities(activitiesInSpanish);
            } catch (error) {
                console.error('Error fetching manifest:', error);
            }
        };
        
        fetchManifest();*/
        fetchClanMembers();
    }, []);

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
                            <th>Mejor arma <br/> PVE/PVP</th>
                            <th>Ingreso</th>
                        </tr>
                    </thead>
                    <tbody>
                        {members
                            .sort((a, b) => { //Primero ordena por estado de conexión, luego por última conexión
                                if (a.isOnline === b.isOnline) {
                                  return b.lastOnlineStatusChange - a.lastOnlineStatusChange;
                                }
                                return a.isOnline ? -1 : 1;
                            })
                            .map(member => (
                                <MemberCard member={member} key={member.destinyUserInfo.membershipId}/>
                            ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

