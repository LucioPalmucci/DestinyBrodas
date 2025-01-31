import axios from 'axios';
import React, { useEffect, useState } from 'react';
import { getEquippedEmblem } from './EquippedEmblem';
import { fetchCharacterIds } from './RecentActivity';

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

        if(mode === 'PVE') setKillsPvE(mostKills.basic.value);
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

                if (member.isOnline == true) { //Si esta en linea, llama al metodo del .js
                    setActivity(await fetchCharacterIds(member));
                }

                //console.log('Response General:', responseGeneral.data.Response);
                const AllTimePVE = responseGeneral.data.Response.mergedAllCharacters.results.allPvE.allTime;
                const AllTimePVP = responseGeneral.data.Response.mergedAllCharacters.results.allPvP.allTime;
                const lightlevel = responseGeneral.data.Response.mergedAllCharacters.merged.allTime.highestLightLevel.basic.value;

                setPveWeapon(getMaxWeaponKill(AllTimePVE, "PVE"));
                setPvpWeapon(getMaxWeaponKill(AllTimePVP, "PVP"));
                setEquippedEmblem(await getEquippedEmblem(member));
                setLight(lightlevel);

            } catch (error) {
                console.error('Error fetching play time:', error);
            }

        };

        fetchUserInfo();
    }, [member.destinyUserInfo.membershipId, member.destinyUserInfo.membershipType, member.isOnline]);

    //Ultima conexión
    const getTimeSinceLastConnection = (lastOnlineStatusChange) => {
        const now = new Date();
        const lastOnline = new Date(lastOnlineStatusChange * 1000);
        const diff = now - lastOnline;

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
                return 'Moderador';
            case 5:
                return 'Admin';
            default:
                return 'Desconocido';
        }
    };



    return (
        <div>
            {equippedEmblem && (
                <li>
                    <img src={"/api/" + equippedEmblem} width={50} height={50} title='aasaas' />
                </li>
            )}
            <li>{member.bungieNetUserInfo.supplementalDisplayName}</li>
            <li>{getMemberType(member.memberType)}</li>
            <li>Ultima conexión:
                {member.isOnline ? (
                    pveWeapon ? ` Jugando ahora ${activity.name} hace ${activity.timeSinceLastPlayed} minutos` : ' En línea'
                ) : ` Hace ${getTimeSinceLastConnection(member.lastOnlineStatusChange)}`}
            </li>
            <li>Se unió:  {new Date(member.joinDate).toLocaleDateString()}</li>
            {pveWeapon &&(
                <li>
                    Mejor arma PVE:
                    <i className={pveWeapon.icon} title={killsPvE}></i> {pveWeapon.name}
                </li>
            )}
            {pvpWeapon &&(
                <li>
                    Mejor arma PVP:
                    <i className={pvpWeapon.icon} title={killsPvP}></i> {pvpWeapon.name}
                </li>
            )}
            <li>Maxima luz: {maxLight}</li>
            <br />
        </div>
    )

}