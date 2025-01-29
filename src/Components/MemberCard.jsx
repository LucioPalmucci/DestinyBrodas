import axios from 'axios';
import React, { useEffect, useState } from 'react';
export default function MemberCard({ member }) {
    const [pveWeapon, setPveWeapon] = useState(null);
    const [pvpWeapon, setPvpWeapon] = useState(null);

    const weaponTranslations = {
        'AutoRifle': 'Fusil Automático',
        'BeamRifle': 'Fusion de rastreo',
        'Bow': 'Arco',
        'FusionRifle': 'Fusil de fusion',
        'Glaive': 'Guja',
        'GrenadeLauncher': 'Lanzagranadas',
        'HandCannon': 'Cañón de Mano',
        'MachineGun': 'Ametralladora',
        'PulseRifle': 'Fusil de pulsos',
        'RocketLauncher': 'Lanzacohetes',
        'ScoutRifle': 'Fusil de Explorador',
        'Shotgun': 'Escopeta',
        'SideArm': 'Pistola',
        'Sniper': 'Francotirador',
        'Submachinegun': 'Subfusil',
        'Sword': 'Espada',
        'TraceRifle': 'Fusion de rastreo'
    };

    const getMaxWeaponKill = (AllTime) => {
        const excludedWeapons = ['Grenade', 'Melee', 'Super'];
        let mostKills = {statId: 'weaponKills', basic: {value: 0}};

        for (let atribute in AllTime) {
            if(AllTime[atribute].statId.includes('weaponKills') && !excludedWeapons.some(weapon => AllTime[atribute].statId.includes(weapon))) {
                if(AllTime[atribute].basic.value > mostKills.basic.value) {
                    mostKills = AllTime[atribute];
                }
            }

        };
        const weaponType = mostKills.statId.replace('weaponKills', '');
        return weaponTranslations[weaponType] || "No se ha encontrado el arma";
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
            <li>PVP arma : {pvpWeapon}</li>
            <li>PVE arma : {pveWeapon}</li>
            <br />
        </div>
    )

}