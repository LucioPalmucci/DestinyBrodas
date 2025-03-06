import axios from "axios";
import { AnimatePresence, motion } from "framer-motion";
import React, { useEffect, useState } from "react";
import crownIcon from "../../assets/crown-solid.svg";
import Spinner from "../Spinner";

const API_KEY = "f83a251bf2274914ab739f4781b5e710";

const DestinyTopWeapons = ({ userId, membershipType }) => {
    const [weapons, setWeapons] = useState({ pve: [], pvp: [] });
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState("pve");

    useEffect(() => {
        const fetchTopWeapons = async () => {
            setLoading(true);

            try {
                const profileRes = await axios.get(
                    `/api/Platform/Destiny2/${membershipType}/Profile/${userId}/?components=100`,
                    { headers: { "X-API-Key": API_KEY } }
                );
                const characterIds = profileRes.data.Response.profile.data.characterIds;

                let weaponKills = { pve: {}, pvp: {} };
                let precisionKills = { pve: {}, pvp: {} };
                let precisionPro = { pve: {}, pvp: {} };

                for (const characterId of characterIds) {
                    const activitiesRes = await axios.get(
                        `/api/Platform/Destiny2/${membershipType}/Account/${userId}/Character/${characterId}/Stats/Activities/?count=5`,
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
                            const mode = activity.activityDetails.modes.includes(5) ? "pvp" : "pve";
                            for (const weapon of playerEntry.extended.weapons) {
                                const weaponId = weapon.referenceId;
                                weaponKills[mode][weaponId] = (weaponKills[mode][weaponId] || 0) + weapon.values.uniqueWeaponKills.basic.value;
                                precisionKills[mode][weaponId] = (precisionKills[mode][weaponId] || 0) + weapon.values.uniqueWeaponPrecisionKills.basic.value;
                                precisionPro[mode][weaponId] = (precisionKills[mode][weaponId] / weaponKills[mode][weaponId]) || 0;
                            }
                        }
                    }
                }

                const getWeaponDetails = async (mode) => {
                    return await Promise.all(
                        Object.keys(weaponKills[mode]).map(async (weaponId) => {
                            const itemRes = await axios.get(
                                `/api/Platform/Destiny2/Manifest/DestinyInventoryItemDefinition/${weaponId}/?lc=es`,
                                { headers: { "X-API-Key": API_KEY } }
                            );
                            const itemData = itemRes.data.Response;
                            return {
                                name: itemData.displayProperties.name,
                                icon: `/api${itemData.displayProperties.icon}`,
                                kills: weaponKills[mode][weaponId],
                                precisionKills: precisionKills[mode][weaponId],
                                precisionPro: (precisionPro[mode][weaponId] * 100).toFixed(0),
                            };
                        })
                    );
                };

                const pveWeapons = await getWeaponDetails("pve");
                const pvpWeapons = await getWeaponDetails("pvp");

                setWeapons({
                    pve: pveWeapons.sort((a, b) => b.kills - a.kills).slice(0, 5),
                    pvp: pvpWeapons.sort((a, b) => b.kills - a.kills).slice(0, 5),
                });
            } catch (error) {
                console.error("Error fetching weapons:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchTopWeapons();
    }, [userId, membershipType]);

    return (
        <div className="p-4 bg-neutral-300 rounded-lg shadow-md w-2xs">
            <h2 className="text-xl font-bold">Armas más usadas</h2>
            <p className="text-xs italic">Últimos 7 días</p>
            <div className="flex justify-center mb-4 mt-1">
                <button onClick={() => setPage("pve")} className={`cursor-pointer text-sm p-2 py-1 ${page === "pve" ? "bg-gray-400" : ""} rounded-lg`}>PvE</button>
                <button onClick={() => setPage("pvp")} className={`cursor-pointer text-sm p-2 py-1 ${page === "pvp" ? "bg-gray-400" : ""} rounded-lg`}>PvP</button>
            </div>
            {loading ? (
                <Spinner small={true} />
            ) : (
                <AnimatePresence mode="wait">
                    <motion.ul
                        key={page}
                        initial={{ opacity: 0, x: page === "pve" ? -10 : 10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 0 }}
                        className="space-y-3 mt-4"
                    >
                        {weapons[page].map((weapon, index) => (
                            <li
                                key={index}
                                className={`flex text-start`}
                            >
                                <div className="flex items-center">
                                    <div className="relative flex-shrink-0">
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
                                                        ? { filter: "drop-shadow(0 0 5px rgb(119, 119, 119))" }
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
                                        <p className="text-sm">{weapon.name}</p>
                                        <p className="text-xs flex space-x-2">
                                            <p>
                                                <i className="icon-kills-black" />{weapon.kills}
                                            </p>
                                            <p title={`${weapon.precisionKills} bajas`} className="flex">
                                                <i className="icon-precision" style={{ fontStyle: "normal" }} />
                                                {weapon.precisionPro}%
                                            </p>
                                        </p>
                                    </div>
                                </div>
                            </li>
                        ))}
                    </motion.ul>
                </AnimatePresence>
            )}
        </div>
    );
};

export default DestinyTopWeapons;

