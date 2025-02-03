import axios from 'axios';
import React, { useEffect, useState } from 'react';
import { getEquippedEmblem } from './EquippedEmblem';
import { fetchCharacterIds } from './RecentActivity';
import './Tabla.css';

export default function MemberCard({ member }) {
    const [pveWeapon, setPveWeapon] = useState(null);
    const [pvpWeapon, setPvpWeapon] = useState(null);
    const [maxLight, setLight] = useState(null);
    const [activity, setActivity] = useState(null);
    const [equippedEmblem, setEquippedEmblem] = useState(null);
    const [killsPvE, setKillsPvE] = useState(null);
    const [killsPvP, setKillsPvP] = useState(null);

    //Armas e iconos
    const weaponTranslations = {
        'AutoRifle': { name: 'Fusil Automático', icon: 'icon-AutoRifle' },
        'BeamRifle': { name: 'Fusil de rastreo', icon: 'icon-BeamRifle' },
        'Bow': { name: 'Arco', icon: 'icon-Bow' },
        'FusionRifle': { name: 'Fusil de fusion', icon: 'icon-FusionRifle' },
        'Glaive': { name: 'Guja', icon: 'icon-Glaive' },
        'GrenadeLauncher': { name: 'Lanzagranadas', icon: 'icon-GrenadeLauncher' },
        'HandCannon': { name: 'Cañón de Mano', icon: 'icon-HandCannon' },
        'MachineGun': { name: 'Ametralladora', icon: 'icon-MachineGun' },
        'PulseRifle': { name: 'Fusil de pulsos', icon: 'icon-PulseRifle' },
        'RocketLauncher': { name: 'Lanzacohetes', icon: 'icon-RocketLauncher' },
        'ScoutRifle': { name: 'Fusil de Explorador', icon: 'icon-ScoutRifle' },
        'Shotgun': { name: 'Escopeta', icon: 'icon-Shotgun' },
        'SideArm': { name: 'Pistola', icon: 'icon-SideArm' },
        'Sniper': { name: 'Francotirador', icon: 'icon-Sniper' },
        'Submachinegun': { name: 'Subfusil', icon: 'icon-Submachinegun' },
        'Sword': { name: 'Espada', icon: 'icon-Sword' },
        'TraceRifle': { name: 'Fusil de rastreo', icon: 'icon-TraceRifle' },
        'N/A': { name: '', icon: 'icon-na' }
    };

    //Mayor cantidad de kills con arma PVP y PVE
    const getMaxWeaponKill = (AllTime, mode) => {
        const excludedWeapons = ['Grenade', 'Melee', 'Super'];
        let mostKills = { statId: 'weaponKills', basic: { value: 0 } };

        for (let atribute in AllTime) {
            if (AllTime[atribute].statId.includes('weaponKills') && !excludedWeapons.some(weapon => AllTime[atribute].statId.includes(weapon))) {
                if (AllTime[atribute].basic.value > mostKills.basic.value) {
                    mostKills = AllTime[atribute];
                }
            }
        };

        let weaponType = mostKills.statId.replace('weaponKills', '');
        if (mostKills.basic.value === 0) {
            weaponType = 'N/A';
        }

        if (mode === 'PVE') setKillsPvE(mostKills.basic.value);
        else setKillsPvP(mostKills.basic.value);
        return weaponTranslations[weaponType]
        //kills: mostKills.basic.value,
    }

    //Llamada a la API para obtener la informacion de la cuenta
    useEffect(() => {
        const fetchUserInfo = async () => {
            try {
                const responseGeneral = await axios.get(`/api/Platform/Destiny2/${member.destinyUserInfo.membershipType}/Account/${member.destinyUserInfo.membershipId}/Stats/`, {
                    headers: {
                        'X-API-Key': 'f83a251bf2274914ab739f4781b5e710',
                    },
                });
                
                setEquippedEmblem(await getEquippedEmblem(member));
                //console.log('Response General:', responseGeneral.data.Response);
                const AllTimePVE = responseGeneral.data.Response.mergedAllCharacters.results.allPvE.allTime;
                const AllTimePVP = responseGeneral.data.Response.mergedAllCharacters.results.allPvP.allTime;
                const lightlevel = responseGeneral.data.Response.mergedAllCharacters.merged.allTime.highestLightLevel.basic.value;

                setPveWeapon(getMaxWeaponKill(AllTimePVE, "PVE"));
                setPvpWeapon(getMaxWeaponKill(AllTimePVP, "PVP"));
                setLight(lightlevel);
                if (member.isOnline) { //Si esta en linea, llama al metodo del RecentActivity.js
                    setActivity(await fetchCharacterIds(member));
                }


            } catch (error) {
                console.error('Error fetching play time:', error);
            }
        };
        fetchUserInfo();
    }, [member.destinyUserInfo.membershipId, member.destinyUserInfo.membershipType, member.isOnline]);

    //Ultima conexión
    const getTimeSinceLastConnection = (lastOnlineStatusChange) => {
        const now = new Date();
        const lastOnlinene = new Date(lastOnlineStatusChange * 1000);
        const diff = now - lastOnlinene;

        const seconds = Math.floor(diff / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);
        const days = Math.floor(hours / 24);

        if (member.isOnline) {
            return 'Jugando ahora';
        } else if (days > 0 && days == 1) {
            return `${days} día`;
        } else if (days > 0) {
            return `${days} días`;
        } else if (hours > 0 && hours == 1) {
            return `${hours} hora`;
        } else if (hours > 0) {
            return `${hours} horas`;
        } else if (minutes > 0) {
            return `${minutes} minutos`;
        } else if (seconds > 0) {
            return `${seconds} segundos`;
        }
    };


    //Rol dentro del clan
    const getMemberType = (type) => {
        switch (type) {
            case 2:
                return 'Miembro';
            case 3:
                return 'Administrador';
            case 5:
                return 'Fundador';
            default:
                return 'Desconocido';
        }
    };

    //Fecha de ingreso
    const date = new Date(member.joinDate);
    const formattedDate = date.toLocaleDateString('es-ES', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    }).replace(/^0/, '0');

    return (
        <>
            {equippedEmblem &&  (
                <tr className='font-Inter'>
                    <td className='flex items-center' title={member.bungieNetUserInfo.supplementalDisplayName}>
                        <img src={"/api/" + equippedEmblem} width={45} height={45} className='pe-2' />
                        {member.destinyUserInfo.displayName}
                    </td>
                    <td>
                        {member.isOnline ?
                            (activity ? (
                                <>
                                    {activity}
                                </>
                            ) : ' En línea'
                            ) : ` Hace ${getTimeSinceLastConnection(member.lastOnlineStatusChange)}`}
                    </td>
                    <td>{getMemberType(member.memberType)}</td>
                    <td>{maxLight}</td>
                    <td>
                        {pveWeapon && pvpWeapon && (
                            <>
                                <i className={pveWeapon.icon} title={pveWeapon.name + "\n" + killsPvE + " bajas"}></i> /
                                <i className={pvpWeapon.icon} title={pvpWeapon.name + "\n" + killsPvP + " bajas"}></i>
                            </>
                        )}
                    </td>
                    <td>{formattedDate}</td>
                </tr>
            )}
        </>
    )
}