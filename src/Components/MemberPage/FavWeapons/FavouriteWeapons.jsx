import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";
import crownIcon from "../../../assets/crown-solid.svg";
import { API_CONFIG } from "../../../config";
import { useBungieAPI } from "../../APIservices/BungieAPIcalls";
import { loadCache, saveCache } from "../../Cache/componentsCache";

const DestinyTopWeapons = ({ userId, membershipType }) => {
    const [weapons, setWeapons] = useState({ pve: [], pvp: [] });
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState("pve");
    const { getCompsProfile, getCarnageReport, getItemManifest, getRecentActivities } = useBungieAPI();

    const CACHE_TTL = 100 * 60 * 1000; // 10 minutes
    const cacheKey = `favWeapons_${membershipType}_${userId}`;

    useEffect(() => {
        const fetchTopWeapons = async () => {
            const cached = loadCache(cacheKey, CACHE_TTL);
            if (cached) {
                setWeapons(cached);
                setLoading(false);
                return;
            }
            setLoading(true);

            try {
                const profileRes = await getCompsProfile(membershipType, userId);
                const characterIds = profileRes.profile.data.characterIds;

                let weaponKills = { pve: {}, pvp: {} };
                let precisionKills = { pve: {}, pvp: {} };
                let precisionPro = { pve: {}, pvp: {} };

                for (const characterId of characterIds) {
                    const activitiesRes = await getRecentActivities(membershipType, userId, characterId, 20);

                    for (const activity of activitiesRes) {
                        const pgcrRes = await getCarnageReport(activity.activityDetails.instanceId);

                        const playerEntry = pgcrRes.entries.find(
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
                            const itemRes = await getItemManifest(weaponId, "DestinyInventoryItemDefinition");
                            return {
                                name: itemRes.displayProperties.name,
                                icon: `${API_CONFIG.BUNGIE_API}${itemRes.displayProperties.icon}`,
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
                    pve: pveWeapons.sort((a, b) => b.kills - a.kills).slice(0, 8),
                    pvp: pvpWeapons.sort((a, b) => b.kills - a.kills).slice(0, 8),
                });
                saveCache(cacheKey, { pve: pveWeapons.sort((a, b) => b.kills - a.kills).slice(0, 8), pvp: pvpWeapons.sort((a, b) => b.kills - a.kills).slice(0, 8) });

            } catch (error) {
                const staleCache = loadCache(cacheKey, null);
                if (staleCache) setWeapons(staleCache);
            } finally {
                setLoading(false);
            }
        };

        fetchTopWeapons();
    }, [userId, membershipType]);

    return (
        <div>
            {loading && !weapons ? (
                <div className="py-4 p-6 rounded-lg h-96 flex justify-center bg-gray-300 items-center animate-pulse"></div>
            ) : (
                <div className="py-4 p-6 rounded-lg h-96 bg-gray-300">
                    <h2 className="text-2xl font-bold">Armas más usadas</h2>
                    <p className="text-xs italic">Últimos 7 días</p>
                    <div className="flex justify-center mb-4 mt-1">
                        <button onClick={() => setPage("pve")} className={`cursor-pointer text-sm p-2 py-1 ${page === "pve" ? "bg-gray-400" : ""} rounded-lg`}>PvE</button>
                        <button onClick={() => setPage("pvp")} className={`cursor-pointer text-sm p-2 py-1 ${page === "pvp" ? "bg-gray-400" : ""} rounded-lg`}>PvP</button>
                    </div>
                    <AnimatePresence mode="wait">
                        <motion.ul
                            key={page}
                            initial={{ opacity: 0, x: page === "pve" ? -10 : 10 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 0 }}
                            className={`mt-4 ${weapons?.[page]?.length > 5 ? 'grid grid-cols-2 grid-rows-4 grid-flow-col gap-3.5' : 'space-y-3'}`}
                        >
                            {weapons?.[page]?.map((weapon, index) => (
                                <li
                                    key={index}
                                    className="flex text-start"
                                >
                                    <div className="flex items-start w-full">
                                        <div className="relative flex items-center mr-3 flex-shrink-0">
                                            <p className="font-semibold text-lg w-6">{index + 1}.</p>
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
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm leading-tight break-words">
                                                {weapon.name}
                                            </p>
                                            <div className="text-xs flex space-x-2 mt-1">
                                                <p>
                                                    <i className="icon-kills-black" />{weapon.kills}
                                                </p>
                                                <p title={`${weapon.precisionKills} bajas`} className="flex">
                                                    <i className="icon-precision" style={{ fontStyle: "normal" }} />
                                                    {weapon.precisionPro}%
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </li>
                            ))}
                        </motion.ul>
                    </AnimatePresence>
                </div>
            )}
        </div>
    );
};

export default DestinyTopWeapons;

