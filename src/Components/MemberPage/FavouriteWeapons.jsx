import axios from "axios";
import React, { useEffect, useState } from "react";

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

                for (const characterId of characterIds) {
                    const activitiesRes = await axios.get(
                        `/api/Platform/Destiny2/${membershipType}/Account/${userId}/Character/${characterId}/Stats/Activities/?count=15`,
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
                            for (const weapon of playerEntry.extended.weapons) {
                                const weaponId = weapon.referenceId;
                                weaponKills[weaponId] =
                                    (weaponKills[weaponId] || 0) + weapon.values.uniqueWeaponKills.basic.value;
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
                        return {
                            name: itemData.displayProperties.name,
                            icon: `/api${itemData.displayProperties.icon}`,
                            kills: weaponKills[weaponId],
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
        <div className="p-4 bg-gray-800 text-white rounded-lg shadow-md">
            <h2 className="text-xl font-bold mb-3">Top 5 Weapons</h2>
            {loading ? (
                <p>Loading...</p>
            ) : (
                <ul className="space-y-3">
                    {weapons.map((weapon, index) => (
                        <li key={index} className="flex items-center space-x-3">
                            <img src={weapon.icon} alt={weapon.name} className="w-12 h-12 rounded-md" />
                            <span className="font-semibold">{weapon.name}</span>
                            <span className="ml-auto text-yellow-300">{weapon.kills} Kills</span>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
};

export default DestinyTopWeapons;

