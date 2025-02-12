import axios from 'axios';
import { useEffect, useState } from 'react';
import { fetchCharacterIds } from '../RecentActivity';
import Spinner from '../Spinner';
import '../Tabla.css';
import MemberCard from './MemberCard';

export default function ClanLista() {
    const [members, setMembers] = useState([]);
    const [originalMembers, setOriginalMembers] = useState([]); // Nuevo estado para almacenar los datos originales
    const [error, setError] = useState(null);
    const [membersWithLight, setMembersLight] = useState([]);
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
                const membersWithLight = await lightLevel(unSorted);
                setMembersLight(membersWithLight);
                setOriginalMembers(membersWithLight); // Almacena los datos originales
                sortMembers(membersWithLight, typeSort, true);
            } catch (error) {
                console.error(error);
                setError('Error al cargar los miembros.');
            } finally {
                setIsLoading(false);
            }
        };
        fetchClanMembers();
    }, []);

    useEffect(() => {
        if (originalMembers.length > 0) {
            sortMembers(originalMembers, typeSort);
        }
    }, [isConexionAscending, isRoleAscending, isJoinDateAscending, isPowerAscending, isNameAscending, typeSort]);

    function sortMembers(members, sortType, isAscending) {
        switch (sortType) {
            case "LastOnline":
                members.sort((a, b) => {
                    if (a.isOnline === b.isOnline) {
                        return isAscending ? b.lastOnlineStatusChange - a.lastOnlineStatusChange : a.lastOnlineStatusChange - b.lastOnlineStatusChange;
                    }
                    return isAscending ? (a.isOnline ? -1 : 1) : (a.isOnline ? 1 : -1);
                });
                break;
            case "Role":
                members.sort((a, b) => {
                    if (a.memberType === b.memberType) {
                        return 0;
                    }
                    return isAscending ? a.memberType - b.memberType : b.memberType - a.memberType;
                });
                break;
            case "Power":
                members.sort((a, b) => isAscending ? a.PowerLevel - b.PowerLevel : b.PowerLevel - a.PowerLevel);
                break;
            case "JoinDate":
                members.sort((a, b) => {
                    return isAscending
                        ? new Date(a.joinDate) - new Date(b.joinDate)
                        : new Date(b.joinDate) - new Date(a.joinDate);
                });
                break;
            case "Name":
                members.sort((a, b) => {
                    return isAscending
                        ? b.destinyUserInfo.displayName.localeCompare(a.destinyUserInfo.displayName)
                        : a.destinyUserInfo.displayName.localeCompare(b.destinyUserInfo.displayName);
                });
                break;
            default:
                members.sort((a, b) => {
                    if (a.isOnline === b.isOnline) {
                        return isAscending ? b.lastOnlineStatusChange - a.lastOnlineStatusChange : a.lastOnlineStatusChange - b.lastOnlineStatusChange;
                    }
                    return isAscending ? (a.isOnline ? -1 : 1) : (a.isOnline ? 1 : -1);
                });
                break;
        }
        setMembers(members);
    };

    if (isLoading) {
        return <Spinner />;
    }

    const toggleSortOrder = () => {
        setConexionAscending(prevState => {
            const newOrder = !prevState;
            setTypeSort("LastOnline");
            sortMembers(members, "LastOnline", newOrder);
            return newOrder;
        });
    }
    
    const toggleRoleSortOrder = () => {
        setIsRoleAscending(prevState => {
            const newOrder = !prevState;
            setTypeSort("Role");
            sortMembers(members, "Role", newOrder);
            return newOrder;
        });
    };
    
    const togglePowerSortOrder = () => {
        setIsPowerAscending(prevState => {
            const newOrder = !prevState;
            setTypeSort("Power");
            sortMembers(members, "Power", newOrder);
            return newOrder;
        });
    };
    
    const toggleNameSortOrder = () => {
        setIsNameAscending(prevState => {
            const newOrder = !prevState;
            setTypeSort("Name");
            sortMembers(members, "Name", newOrder);
            return newOrder;
        });
    };
    
    const toggleJoinDateSortOrder = () => {
        setIsJoinDateAscending(prevState => {
            const newOrder = !prevState;
            setTypeSort("JoinDate");
            sortMembers(members, "JoinDate", newOrder);
            return newOrder;
        });
    };

    return (
        <div>
            <h1 className='text-2xl p-4'>Clan BRODAS</h1>
            <div className='justify-center items-center flex flex-col font-Inter'>
                {error && <p>{error}</p>}
                <table className='text-start'>
                    <thead>
                        <tr>
                            <th>
                                <button onClick={toggleNameSortOrder} className='hover:text-blue-500 cursor-pointer'>
                                    Nombre {typeSort === "Name" && (isNameAscending ? '↓' : '↑')}
                                </button>
                            </th>
                            <th>
                                <button onClick={toggleSortOrder} className='hover:text-blue-500  cursor-pointer'>
                                    Última Conexión {typeSort === "LastOnline" && (isConexionAscending ? '↓' : '↑')}
                                </button>
                            </th>
                            <th>
                                <button onClick={toggleRoleSortOrder} className='hover:text-blue-500  cursor-pointer'>
                                    Rol {typeSort === "Role" && (isRoleAscending ? '↓' : '↑')}
                                </button>
                            </th>
                            <th>
                                <button onClick={togglePowerSortOrder} className='hover:text-blue-500  cursor-pointer'>
                                    Poder {typeSort === "Power" && (isPowerAscending ? '↓' : '↑')}
                                </button>
                            </th>
                            <th>Mejor Arma <br /> PVE/PVP</th>
                            <th>
                                <button onClick={toggleJoinDateSortOrder} className='hover:text-blue-500  cursor-pointer'>
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
                const characterData = await fetchCharacterIds(member, "total", 1);
                return { ...member, PowerLevel: characterData };
            } catch (error) {
                console.error('Error fetching light level:', error);
                return { ...member, PowerLevel: 0 };
            }
        }));
        return membersWithLight;
    }
}