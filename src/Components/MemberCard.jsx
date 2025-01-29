import axios from 'axios';
import React, { useEffect, useState } from 'react';
export default function MemberCard({ member }) {
    const [pveWeapon, setPveWeapon] = useState(null);
    const [pvpWeapon, setPvpWeapon] = useState(null);

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
        'N/A': { name: 'N/A', icon: 'icon-na' }
    };

    const getMaxWeaponKill = (AllTime) => {
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
        return weaponTranslations[weaponType]
    }

    useEffect(() => {
        const fetchPlayTime = async () => {
            try {
                const responseGeneral = await axios.get(`/api/Platform/Destiny2/${member.destinyUserInfo.membershipType}/Account/${member.destinyUserInfo.membershipId}/Stats/`, {
                    headers: {
                        'X-API-Key': 'f83a251bf2274914ab739f4781b5e710',
                    },
                });
                console.log(responseGeneral.data.Response);
                const pveWeapon = responseGeneral.data.Response.mergedAllCharacters.results.allPvE.allTime;
                const pvpWeapon = responseGeneral.data.Response.mergedAllCharacters.results.allPvP.allTime;
                setPveWeapon(getMaxWeaponKill(pveWeapon));
                setPvpWeapon(getMaxWeaponKill(pvpWeapon));
            } catch (error) {
                console.error('Error fetching play time:', error);
            }
        };

        fetchPlayTime();
    }, [member.destinyUserInfo.membershipId]);

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
            <li>{member.bungieNetUserInfo.supplementalDisplayName}</li>
            <li>{getMemberType(member.memberType)}</li>
            <li>{member.isOnline ? "En linea" : "Desconectado"}</li>
            <li>Última conexión: {formatDate(member.lastOnlineStatusChange)}</li>
            <li>Se unió:  {new Date(member.joinDate).toLocaleDateString()}</li>
            {pveWeapon && (
                <li>
                    Mejor arma PVE:
                    <i class={pveWeapon.icon} title={pveWeapon.name}></i>
                </li>
            )}
            {pvpWeapon && (
                <li>
                    Mejor arma PVP:
                    <i class={pvpWeapon.icon} title={pvpWeapon.name}></i>
                </li>
            )}
            <br />
        </div>
    )

}