import axios from "axios";
import React, { useEffect, useState } from "react";
import crownIcon from "../../assets/crown-solid.svg";
import Spinner from "../Spinner";

const API_KEY = "f83a251bf2274914ab739f4781b5e710";

const DestinyTopWeapons = ({ userId, membershipType }) => {
    const [weapons, setWeapons] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchTopWeapons = async () => {
            setLoading(true);

            try {
                const profileRes = await axios.get(
                    `/api/Platform/Destiny2/${membershipType}/Profile/${userId}/?components=100`,
                    { headers: { "X-API-Key": API_KEY } }
                );
                const characterIds = profileRes.data.Response.profile.data.characterIds;

                let weaponKills = {};
                let precisionKills = {};
                let precisionPro = {};

                for (const characterId of characterIds) {
                    const activitiesRes = await axios.get(
                        `/api/Platform/Destiny2/${membershipType}/Account/${userId}/Character/${characterId}/Stats/Activities/?count=10`,
                        { headers: { "X-API-Key": API_KEY } }
                    );
                    const activities = activitiesRes.data.Response?.activities || [];

                    for (const activity of activities) {
                        const pgcrRes = await axios.get(
                            `/reporte/Platform/Destiny2/Stats/PostGameCarnageReport/${activity.activityDetails.instanceId}/`,
                            { headers: { "X-API-Key": API_KEY } }
                        );
                        const pgcrData = pgcrRes.data.Response;

                        const playerEntry = pgcrData.entries.find(
                            (entry) => entry.player.destinyUserInfo.membershipId === userId
                        );

                        if (playerEntry?.extended?.weapons) {
                            console.log(playerEntry.extended.weapons);
                            for (const weapon of playerEntry.extended.weapons) {
                                const weaponId = weapon.referenceId;
                                weaponKills[weaponId] = (weaponKills[weaponId] || 0) + weapon.values.uniqueWeaponKills.basic.value;
                                precisionKills[weaponId] = (precisionKills[weaponId] || 0) + weapon.values.uniqueWeaponPrecisionKills.basic.value;
                                precisionPro[weaponId] = (precisionKills[weaponId] / weaponKills[weaponId]) || 0;
                            }
                        }
                    }
                }

                let weaponDetails = await Promise.all(
                    Object.keys(weaponKills).map(async (weaponId) => {
                        const itemRes = await axios.get(
                            `/api/Platform/Destiny2/Manifest/DestinyInventoryItemDefinition/${weaponId}/?lc=es`,
                            { headers: { "X-API-Key": API_KEY } }
                        );
                        const itemData = itemRes.data.Response;
                        console.log(itemData);
                        return {
                            name: itemData.displayProperties.name,
                            icon: `/api${itemData.displayProperties.icon}`,
                            kills: weaponKills[weaponId],
                            precisionKills: precisionKills[weaponId],
                            precisionPro: (precisionPro[weaponId] * 100).toFixed(0),
                        };
                    })
                );

                weaponDetails = weaponDetails.sort((a, b) => b.kills - a.kills).slice(0, 5);
                setWeapons(weaponDetails);
            } catch (error) {
                console.error("Error fetching weapons:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchTopWeapons();
    }, [userId, membershipType]);

    return (
        <div className="p-4 bg-neutral-800 text-white rounded-lg shadow-md w-fit">
            <h2 className="text-xl font-bold">Armas mas usadas</h2>
            <p className="text-xs italic">Últimos 7 días</p>
            {loading ? (
                <Spinner />
            ) : (
                <ul className="space-y-3 mt-4">
                    {weapons.map((weapon, index) => (
                        console.log(weapon),
                        <li
                            key={index}
                            className={`flex text-start items-center`}
                        >
                            <div className="flex items-center">
                                <div className={`relative`}>
                                    <img
                                        src={weapon.icon}
                                        width={40}
                                        height={40}
                                        alt="Weapon Icon"
                                        className='rounded'
                                        style={
                                            index === 0
                                                ? { filter: "drop-shadow(0 0 5px #f6e05e)" }
                                                : index === 1
                                                ? { filter: "drop-shadow(0 0 5px #c0c0c0)" }
                                                : index === 2
                                                ? { filter: "drop-shadow(0 0 5px #8b4513)" }
                                                : {}
                                        }
                                    />
                                    {index === 0 && (
                                        <img
                                            src={crownIcon}
                                            alt="Crown Icon"
                                            className="absolute -top-0 right-0 transform translate-x-1/2 -translate-y-1/2 w-6 h-6 rotate-35"
                                            style={{ filter: "invert(70%) sepia(90%) saturate(500%) hue-rotate(-10deg) brightness(120%)" }}
                                        />
                                    )}
                                </div>
                                <div className="ml-4 items-center">
                                    <div>
                                        <p className={`text-sm`}>{weapon.name}</p>
                                        <p className={`text-xs flex justify-start`}>
                                            <p className={`mr-1`}><i className="icon-kills" />{weapon.kills}</p>
                                            <p title={`${weapon.precisionKills} bajas`}>
                                                <i className="icon-precision" style={{ fontStyle: "normal" }} />
                                                {weapon.precisionPro}%
                                            </p>
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
};

export default DestinyTopWeapons;

