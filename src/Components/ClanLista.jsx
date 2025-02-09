import axios from 'axios';
import { useEffect, useState } from 'react';
import MemberCard from './MemberCard';
import { fetchCharacterIds } from './RecentActivity';
import Spinner from './Spinner';
import './Tabla.css';
export default function ClanLista() {
    const [members, setMembers] = useState([]);
    const [error, setError] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isConexionAscending, setConexionAscending] = useState(true);
    const [isRoleAscending, setIsRoleAscending] = useState(true);
    const [isPowerAscending, setIsPowerAscending] = useState(true);
    const [isNameAscending, setIsNameAscending] = useState(true);
    const [isJoinDateAscending, setIsJoinDateAscending] = useState(true);
    const [typeSort, setTypeSort] = useState("LastOnline");

    useEffect(() => {
        const fetchClanMembers = async () => {
            try {
                const response = await axios.get('/api/Platform/GroupV2/3942032/Members/', {
                    headers: {
                        'X-API-Key': 'f83a251bf2274914ab739f4781b5e710',
                    },
                });

                let unSorted = response.data.Response.results;
                console.log('type:', typeSort);

                switch (typeSort) {
                    case "LastOnline":
                        unSorted.sort((a, b) => {
                            if (a.isOnline === b.isOnline) {
                                return isConexionAscending ? b.lastOnlineStatusChange - a.lastOnlineStatusChange : a.lastOnlineStatusChange - b.lastOnlineStatusChange;
                            }
                            return isConexionAscending ? (a.isOnline ? -1 : 1) : (a.isOnline ? 1 : -1);
                        });
                        break;
                    case "Role":
                        unSorted.sort((a, b) => {
                            if (a.memberType === b.memberType) {
                                return 0;
                            }
                            return isRoleAscending ? a.memberType - b.memberType : b.memberType - a.memberType;
                        });
                        console.log('Role');
                        break;
                    case "Power":
                        unSorted = await lightLevel(unSorted);
                        break;
                    case "JoinDate":
                        unSorted.sort((a, b) => {
                            return isJoinDateAscending
                                ? new Date(a.joinDate) - new Date(b.joinDate)
                                : new Date(b.joinDate) - new Date(a.joinDate);
                        });
                        break;
                    case "Name":
                        unSorted.sort((a, b) => {
                            return isNameAscending
                                ? b.destinyUserInfo.displayName.localeCompare(a.destinyUserInfo.displayName)
                                : a.destinyUserInfo.displayName.localeCompare(b.destinyUserInfo.displayName);
                        });
                        break;
                    default:
                        unSorted.sort((a, b) => {
                            if (a.isOnline === b.isOnline) {
                                return isConexionAscending ? b.lastOnlineStatusChange - a.lastOnlineStatusChange : a.lastOnlineStatusChange - b.lastOnlineStatusChange;
                            }
                            return isConexionAscending ? (a.isOnline ? -1 : 1) : (a.isOnline ? 1 : -1);
                        });
                        break;
                }
                setMembers(unSorted);

                console.log('Response:', response.data.Response.results);
            } catch (error) {
                console.error(error);
                setError('Error al cargar los miembros.');
            } finally {
                setIsLoading(false);
            }
        };
        fetchClanMembers();
    }, [isConexionAscending, isRoleAscending, isJoinDateAscending, isPowerAscending, isNameAscending]);

    if (isLoading) {
        return <Spinner />;
    }

    const toggleSortOrder = () => {
        setConexionAscending(!isConexionAscending);
        setTypeSort("LastOnline");
    };
    const toggleRoleSortOrder = () => {
        setIsRoleAscending(!isRoleAscending);
        setTypeSort("Role");
    };
    const togglePowerSortOrder = () => {
        setIsPowerAscending(!isPowerAscending);
        setTypeSort("Power");
    }
    const toggleNameSortOrder = () => {
        setIsNameAscending(!isNameAscending);
        setTypeSort("Name");
    }
    const toggleJoinDateSortOrder = () => {
        setIsJoinDateAscending(!isJoinDateAscending);
        setTypeSort("JoinDate");
    }

    return (
        <div>
            <h1 className='text-2xl p-4'>Clan BRODAS</h1>
            <div className='justify-center items-center flex flex-col font-Inter'>
                {error && <p>{error}</p>}
                <table className='text-start'>
                    <thead>
                        <tr>
                            <th>
                                <button onClick={toggleNameSortOrder} className='hover:text-blue-500'>
                                    Nombre {typeSort === "Name" && (isNameAscending ? '↓' : '↑')}
                                </button>
                            </th>
                            <th>
                                <button onClick={toggleSortOrder} className='hover:text-blue-500'>
                                    Última Conexión {typeSort === "LastOnline" && (isConexionAscending ? '↓' : '↑')}
                                </button>
                            </th>
                            <th>
                                <button onClick={toggleRoleSortOrder} className='hover:text-blue-500'>
                                    Rol {typeSort === "Role" && (isRoleAscending ? '↓' : '↑')}
                                </button>
                            </th>
                            <th>
                                <button onClick={togglePowerSortOrder} className='hover:text-blue-500'>
                                    Poder {typeSort === "Power" && (isPowerAscending ? '↓' : '↑')}
                                </button>
                            </th>
                            <th>Mejor Arma <br /> PVE/PVP</th>
                            <th>
                                <button onClick={toggleJoinDateSortOrder} className='hover:text-blue-500'>
                                    Ingreso {typeSort === "JoinDate" && (isJoinDateAscending ? '↓' : '↑')}
                                </button>
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {members ? (
                            members.map(member => (
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

    async function lightLevel(members) {
        const membersWithLight = await Promise.all(members.map(async (member) => {
            try {
                const characterData = await fetchCharacterIds(member, "artifact");
                return { ...member, light: characterData };
            } catch (error) {
                console.error('Error fetching light level:', error);
                return { ...member, light: 0 };
            }
        }));

        membersWithLight.sort((a, b) => isPowerAscending ? a.light - b.light : b.light - a.light);
        return membersWithLight;
    }
}
