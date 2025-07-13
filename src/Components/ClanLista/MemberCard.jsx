import { useEffect, useState } from 'react';
import { API_CONFIG } from '../../config';
import { useBungieAPI } from '../APIservices/BungieAPIcache';
import { getTimeSinceLastConnection } from '../LastConexion';
import '../Tabla.css';
export default function MemberCard({ member }) {
    const [pveWeapon, setPveWeapon] = useState(null);
    const [pvpWeapon, setPvpWeapon] = useState(null);
    const [maxLight, setLight] = useState(null);
    const [baseLight, setBaseLight] = useState(null);
    const [artifactLight, setArtifactLight] = useState(null);
    const [activity, setActivity] = useState(null);
    const [equippedEmblem, setEquippedEmblem] = useState(null);
    const [killsPvE, setKillsPvE] = useState(null);
    const [killsPvP, setKillsPvP] = useState(null);
    const [showBaseLight, setShowBaseLight] = useState(false);
    const { getGeneralStats, getCompChars, getCompCharsActs, getItemManifest, getFullCharacterProfile } = useBungieAPI();

    //Armas e iconos
    const weaponTranslations = {
        'AutoRifle': { name: 'Fusil Automático', icon: 'icon-AutoRifle' },
        'BeamRifle': { name: 'Fusil de Rastreo', icon: 'icon-BeamRifle' },
        'Bow': { name: 'Arco', icon: 'icon-Bow' },
        'FusionRifle': { name: 'Fusil de Fusion', icon: 'icon-FusionRifle' },
        'Glaive': { name: 'Guja', icon: 'icon-Glaive' },
        'GrenadeLauncher': { name: 'Lanzagranadas', icon: 'icon-GrenadeLauncher' },
        'HandCannon': { name: 'Cañón de Mano', icon: 'icon-HandCannon' },
        'MachineGun': { name: 'Ametralladora', icon: 'icon-MachineGun' },
        'PulseRifle': { name: 'Fusil de Pulsos', icon: 'icon-PulseRifle' },
        'RocketLauncher': { name: 'Lanzacohetes', icon: 'icon-RocketLauncher' },
        'ScoutRifle': { name: 'Fusil de Explorador', icon: 'icon-ScoutRifle' },
        'Shotgun': { name: 'Escopeta', icon: 'icon-Shotgun' },
        'SideArm': { name: 'Pistola', icon: 'icon-SideArm' },
        'Sniper': { name: 'Francotirador', icon: 'icon-Sniper' },
        'Submachinegun': { name: 'Subfusil', icon: 'icon-Submachinegun' },
        'Sword': { name: 'Espada', icon: 'icon-Sword' },
        'TraceRifle': { name: 'Fusil de Rastreo', icon: 'icon-TraceRifle' },
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
                const responseGeneral = await getGeneralStats(member.destinyUserInfo.membershipType, member.destinyUserInfo.membershipId);
                const characters = await getCompChars(member.destinyUserInfo.membershipType, member.destinyUserInfo.membershipId);
                const mostRecentCharacter = Object.values(characters).reduce((latest, current) => {
                    return new Date(current.dateLastPlayed) > new Date(latest.dateLastPlayed) ? current : latest;
                });

                let totalLight = characters[mostRecentCharacter.characterId].light;
                setArtifactLight(await getAritfactBonusLevel())
                setLight(totalLight);

                const AllTimePVE = responseGeneral.mergedAllCharacters.results.allPvE.allTime;
                const AllTimePVP = responseGeneral.mergedAllCharacters.results.allPvP.allTime;
                setPveWeapon(getMaxWeaponKill(AllTimePVE, "PVE"));
                setPvpWeapon(getMaxWeaponKill(AllTimePVP, "PVP"));
                setEquippedEmblem(mostRecentCharacter.emblemPath);

                if (member.isOnline) { //Si esta en linea, llama al metodo del RecentActivity.js
                    setActivity(await fetchActivity(member));
                }

            } catch (error) {
                console.error('Error fetching play time:', error);
            }
        };
        fetchUserInfo();
    }, [member.destinyUserInfo.membershipId, member.destinyUserInfo.membershipType, member.isOnline]);

    useEffect(() => {
        if (maxLight !== null && artifactLight !== null) {
            setBaseLight(maxLight - artifactLight);
        }
    }, [maxLight, artifactLight]);
    //Ultima conexión


    const fetchActivity = async (member) => {
        try {
            const characterIds = await getCompChars(member.destinyUserInfo.membershipType, member.destinyUserInfo.membershipId);
            const mostRecentCharacter = Object.values(characterIds).reduce((latest, current) => {
                return new Date(current.dateLastPlayed) > new Date(latest.dateLastPlayed) ? current : latest;
            });

            const activityResponse = await getCompCharsActs(member.destinyUserInfo.membershipType, member.destinyUserInfo.membershipId, mostRecentCharacter.characterId);
            console.log("activityResponse ", characterIds);
            const currentActivityHash = activityResponse.currentActivityHash;
            const currentActivityMode = activityResponse.currentActivityModeHash;
            const currentPlaylist = activityResponse.currentPlaylistActivityHash;
            const responseMode = await getItemManifest(currentActivityMode, "DestinyActivityModeDefinition");
            const responseName = await getItemManifest(currentActivityHash, "DestinyActivityDefinition");
            const responsePlaylist = await getItemManifest(currentPlaylist, "DestinyActivityDefinition");
            const name = responseName?.displayProperties?.name;
            const type = responseMode?.displayProperties?.name;
            const playlist = responsePlaylist?.displayProperties?.name;

            return {
                name: name,
                type: type,
                playlist: playlist,
            };
        } catch (error) {
            console.error('Error fetching current activity:', error);
            return null;
        }
    }

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

    if (member.bungieNetUserInfo.supplementalDisplayName == "20209201") {
        member.bungieNetUserInfo.supplementalDisplayName = "GerSeGa#0536";
    } else if (member.bungieNetUserInfo.supplementalDisplayName == "25750147") {
        member.bungieNetUserInfo.supplementalDisplayName = "TheVagrantChaff#5160";
    }

    async function getAritfactBonusLevel() {
        try {
            const response = await getFullCharacterProfile(member.destinyUserInfo.membershipType, member.destinyUserInfo.membershipId);
            return response.profileProgression.data.seasonalArtifact.powerBonus;
        } catch (error) {
            console.error('Error fetching artifact bonus level:', error);
            return null;
        }
    }

    const toggleLightDisplay = () => {
        setShowBaseLight(!showBaseLight);
    };

    return (
        <>
            {equippedEmblem && (
                <tr className='font-Inter'>
                    <td title={member.bungieNetUserInfo.supplementalDisplayName}>
                        <a className='flex items-center' href={`/DestinyBrodas/member/${member.destinyUserInfo.membershipType}/${member.destinyUserInfo.membershipId}`} target='_blank' rel='noreferrer noopener'>
                            <img src={API_CONFIG.BUNGIE_API + "/" + equippedEmblem} width={40} height={40} className='mr-2' />
                            {member.destinyUserInfo.bungieGlobalDisplayName}
                        </a>
                    </td>
                    <td>
                        {member.isOnline ?
                            (activity ? (
                                <div style={{ whiteSpace: 'pre-line' }}>
                                    <div>{activity.name}</div>
                                    <div className="text-sm text-gray-600">{activity.type}</div>
                                    {activity.playlist && activity.playlist !== activity.name && activity.playlist !== activity.type && (
                                        <div className="text-xs text-gray-500">{activity.playlist}</div>
                                    )}
                                </div>
                            ) : ' En línea'
                            ) : ` Hace ${getTimeSinceLastConnection(member.lastOnlineStatusChange, member.isOnline)}`}
                    </td>
                    <td>{getMemberType(member.memberType)}</td>
                    <td onClick={toggleLightDisplay}>
                        {showBaseLight ? (
                            <>
                                <span className='text-blue-500 font-semibold cursor-pointer'>{baseLight} +{artifactLight}</span>
                            </>
                        ) : <span className='hover:text-blue-500 cursor-pointer'>{maxLight}</span>}
                    </td>
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