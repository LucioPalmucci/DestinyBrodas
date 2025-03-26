import axios from "axios";
import { useEffect, useState } from "react";
import "../../index.css";

export default function CurrentLoadout({ membershipType, userId }) {
    const [items, setItems] = useState([]);
    const [isOpen, setIsOpen] = useState(false);
    const [totalStats, setTotalStats] = useState([]);

    useEffect(() => {
        const fetchCurrentLoadout = async () => {
            try {
                const responseChar = await axios.get(`/api/Platform/Destiny2/${membershipType}/Profile/${userId}/?components=Characters,102&lc=es`, {
                    headers: {
                        'X-API-Key': 'f83a251bf2274914ab739f4781b5e710',
                    },
                });
                const characters = responseChar.data.Response.characters.data;

                const mostRecentCharacter = Object.values(characters).reduce((latest, current) => {
                    return new Date(current.dateLastPlayed) > new Date(latest.dateLastPlayed) ? current : latest;
                });

                const charID = mostRecentCharacter.characterId;

                const response = await axios.get(`/api/Platform/Destiny2/${membershipType}/Profile/${userId}/Character/${charID}/?components=205,202`, {
                    headers: {
                        'X-API-Key': 'f83a251bf2274914ab739f4781b5e710',
                    },
                });

                let totalStats = [144602215, 392767087, 1735777505, 1943323491, 2996146975, 4244567218];
                await getTotalStats(totalStats);

                console.log(response.data.Response.equipment.data.items);

                const itemDetails = await Promise.all(response.data.Response.equipment.data.items.map(async (item) => {
                    const itemResponse = await axios.get(`/api/Platform/Destiny2/Manifest/DestinyInventoryItemDefinition/${item.itemHash}/?lc=es`, {
                        headers: {
                            'X-API-Key': 'f83a251bf2274914ab739f4781b5e710',
                        },
                    });

                    const itemD = await axios.get(`/api/Platform/Destiny2/${membershipType}/Profile/${userId}/Item/${item.itemInstanceId}/?components=300,302,304,305`, {
                        headers: {
                            'X-API-Key': 'f83a251bf2274914ab739f4781b5e710',
                        },
                    });

                    let perks = [];
                    if (response.data.Response.equipment.data.items.indexOf(item) === 16) { //Artifact
                        const activePerks = response.data.Response.progressions.data.seasonalArtifact.tiers.flatMap(tier =>
                            tier.items.filter(perk => perk.isActive)
                        );

                        perks = await Promise.all(activePerks.map(async (perk) => {
                            const perkResponse = await axios.get(`/api/Platform/Destiny2/Manifest/DestinyInventoryItemDefinition/${perk.itemHash}/?lc=es`, {
                                headers: {
                                    'X-API-Key': 'f83a251bf2274914ab739f4781b5e710',
                                },
                            });

                            return {
                                ...perk,
                                name: perkResponse.data.Response.displayProperties.name,
                                iconPath: perkResponse.data.Response.displayProperties.icon,
                            };
                        })) || [];


                    } else if (response.data.Response.equipment.data.items.indexOf(item) === 11) { //Sublcase
                        perks = await Promise.all(itemD.data.Response.sockets.data?.sockets?.map(async (perk) => {
                            const perkResponse = await axios.get(`/api/Platform/Destiny2/Manifest/DestinyInventoryItemDefinition/${perk.plugHash}/?lc=es`, {
                                headers: {
                                    'X-API-Key': 'f83a251bf2274914ab739f4781b5e710',
                                },
                            });
                            if (perkResponse.data.Response.investmentStats.length > 0) { //Si el fragmento tiene algun bonus o penalizacion de stats
                                for (const stat of Object.values(perkResponse.data.Response.investmentStats).slice(1)) {
                                    const baseStat = totalStats.find((baseStat) => baseStat.statHash == stat.statTypeHash);
                                    if (stat.value < 0) {
                                        baseStat.value -= Math.abs(stat.value);
                                    } else {
                                        baseStat.value += stat.value;
                                    }
                                }
                            }
                            return {
                                ...perk,
                                name: perkResponse.data.Response.displayProperties.name,
                                iconPath: perkResponse.data.Response.displayProperties.icon,
                            };
                        }
                        ) || []);
                    } else { //Resto de items
                        perks = await Promise.all(itemD.data.Response.perks.data?.perks?.map(async (perk) => {
                            const perkResponse = await axios.get(`/api/Platform/Destiny2/Manifest/DestinySandboxPerkDefinition/${perk.perkHash}/?lc=es`, {
                                headers: {
                                    'X-API-Key': 'f83a251bf2274914ab739f4781b5e710',
                                },
                            });

                            //if(response.data.Response.equipment.data.items.indexOf(item) === 1)console.log(itemD.data.Response, itemResponse.data.Response);

                            return {
                                ...perk,
                                name: perkResponse.data.Response.displayProperties.name,
                                iconPath: perkResponse.data.Response.displayProperties.icon,
                            };
                        }) || []);
                    }

                    if (response.data.Response.equipment.data.items.indexOf(item) === 11) {
                        const perkAtIndex2 = perks.splice(2, 1)[0];
                        perks.unshift(perkAtIndex2);
                    }

                    const statsList = itemD.data.Response.stats.data?.stats;
                    let armorStats = []; //Stats de armadura
                    if ([3, 4, 5, 6, 7].includes(response.data.Response.equipment.data.items.indexOf(item))) {
                        for (const stat of Object.values(statsList)) {
                            try {
                                const statResponse = await axios.get(
                                    `/api/Platform/Destiny2/Manifest/DestinyStatDefinition/${stat.statHash}/?lc=es`,
                                    {
                                        headers: {
                                            'X-API-Key': 'f83a251bf2274914ab739f4781b5e710',
                                        },
                                    }
                                );

                                totalStats.find((baseStat) => baseStat.statHash === stat.statHash).value += stat.value;
                                armorStats.push({
                                    ...stat,
                                    name: statResponse.data.Response.displayProperties.name,
                                    iconPath: statResponse.data.Response.displayProperties.icon,
                                    value: stat.value,
                                });
                            } catch (error) {
                                console.error(`Error fetching stat ${stat.statHash}:`, error);
                            }
                        }
                    }

                    console.log(itemResponse.data.Response.quality?.displayVersionWatermarkIcons?.[0])

                    return {
                        name: itemResponse.data.Response.displayProperties.name,
                        icon: itemResponse.data.Response.displayProperties.icon,
                        rarity: itemResponse.data.Response.inventory.tierType,
                        perks: perks,
                        stats: armorStats,
                        masterwork: item.state,
                        watermark: itemResponse.data.Response.quality?.displayVersionWatermarkIcons?.[0] || null,
                    };
                }));

                setItems(itemDetails);
                setTotalStats(totalStats);

            } catch (error) {
                console.error(error);
            }
        };
        fetchCurrentLoadout();
    }, [membershipType, userId]);

    const [showPopup, setShowPopup] = useState(false);

    const handleButtonClick = () => {
        setShowPopup(true);
    };

    const handleClosePopup = () => {
        setShowPopup(false);
    };

    const renderedPerkNames = new Set();

    useEffect(() => {
        if (isOpen) {
            document.body.classList.add("overflow-hidden");
        } else {
            document.body.classList.remove("overflow-hidden");
        }
        return () => document.body.classList.remove("overflow-hidden");
    }, [isOpen]);

    async function getTotalStats(totalStats) {
        const updatedStats = await Promise.all(totalStats.map(async (statHash) => {
            const statResponse = await axios.get(`/api/Platform/Destiny2/Manifest/DestinyStatDefinition/${statHash}/?lc=es`, {
                headers: {
                    'X-API-Key': 'f83a251bf2274914ab739f4781b5e710',
                },
            });
            return {
                statHash,
                name: statResponse.data.Response.displayProperties.name,
                iconPath: statResponse.data.Response.displayProperties.icon,
                value: 0,
            };
        }));
        totalStats.splice(0, totalStats.length, ...updatedStats);
    }

    return (
        <div className="bg-gray-300 p-6 py-4 font-Lato rounded-lg w-fit space-y-4">
            <h2 className="font-semibold text-2xl">Loadout equipado</h2>
            <div className="space-y-2">
                <div className="space-y-2 font-Lato">
                    {[11, 3, 4, 5, 6, 7, 0, 1, 2].map((index) => (
                        items[index] && (index < 3 || index === 11 || items[index]?.rarity == 6) && (
                            <div key={index} className="flex items-center space-x-2">
                                <img src={`/api${items[index].icon}`} width={50} height={50} alt={items[index].name} />
                                <p className="font-semibold">{items[index].name}</p>
                            </div>
                        )
                    ))}
                </div>
            </div>
            <button onClick={handleButtonClick} className="py-2 px-4 font-semibold bg-gray-400 hover:bg-gray-500 rounded mt-2 cursor-pointer">Ver mas...</button>
            {showPopup && (
                <div className="fixed inset-0 flex items-center justify-center w-full z-50" onClick={() => setShowPopup(false)} >
                    <div className="p-4 rounded-lg relative bg-neutral-600 text-white w-[1000px] max-h-[90vh] overflow-auto" onClick={(e) => e.stopPropagation()}>
                        <button onClick={handleClosePopup} className="absolute cursor-pointer top-2 right-2 text-gray-500 hover:text-gray-300"> &times; </button>
                        <h2></h2>
                        <div className="flex space-x-8 items-center justify-center py-4">
                            <div className="flex flex-col space-y-3">
                                {[11, 0, 1, 2, 8, 16].map((index) => (
                                    items[index] && (
                                        <div key={index} className="flex items-center justify-end">
                                            <div dir={index == 16 || index == 11 ? "rtl" : ""} className={index == 16 ? "grid grid-cols-9 gap-2 text-right justify-end rtl mr-4" : "flex space-x-2 mr-4"}>
                                                {index === 11 ? (
                                                    <div className="flex flex-col justify-end">
                                                        <div className="flex mb-2">
                                                            {items[index].perks[0] && (
                                                                <img src={`/api${items[index].perks[0].iconPath}`} className="w-[30px] h-[30px]" alt={items[index].perks[0].name} title={items[index].perks[0].name} />
                                                            )}
                                                        </div>
                                                        <div className="flex mb-2">
                                                            {items[index].perks.slice(1, 7).map((perk, perkIndex) => (
                                                                <img key={perkIndex} src={`/api${perk.iconPath}`} className="w-[20px] h-[20px] mx-1" alt={perk.name} title={perk.name} />
                                                            ))}
                                                        </div>
                                                        <div className="flex">
                                                            {items[index].perks.slice(7).map((perk, perkIndex) => (
                                                                perk.name != "Ranura de fragmento vacía" && (
                                                                    <img key={perkIndex} src={`/api${perk.iconPath}`} className="w-[20px] h-[20px] mx-1" alt={perk.name} title={perk.name} />
                                                                )
                                                            ))}
                                                        </div>
                                                    </div>
                                                ) : (
                                                    items[index].perks?.map((perk) => (
                                                        (index !== 16 || perk.isVisible) && !renderedPerkNames.has(perk.name) && perk.iconPath && perk.name != "Ranura de fragmento vacía" && !perk.name.includes("Modificadores autorizados") && (
                                                            renderedPerkNames.add(perk.name), //Alamcena en un registro para no repetir perks
                                                            <img src={`/api${perk.iconPath}`} className={index == 16 || index == 11 ? "w-[20px] h-[20px] " : "w-[30px] h-[30px]"} alt={perk.name} title={perk.name} />
                                                        )
                                                    ))
                                                )}
                                            </div>
                                            {/*<img src={`/api${items[index].icon}`} width={50} height={50} alt={items[index].name} title={items[index].name} className={items[index].masterwork === 8 || items[index].masterwork === 9 ? "masterwork" : ""}/>*/}
                                            <div className={`relative ${items[index].masterwork === 8 || items[index].masterwork === 9 ? "masterwork item-wrapper" : ""}`}>
                                                <img
                                                    src={`/api${items[index].icon}`}
                                                    width={50}
                                                    height={50}
                                                    alt={items[index].name}
                                                    title={items[index].name}
                                                />
                                                {(items[index].masterwork === 8 || items[index].masterwork === 9) && (
                                                    <div className="masterwork-overlay masterwork" />
                                                )}
                                                {items[index].watermark && (
                                                    <img
                                                        src={`/api${items[index].watermark}`}
                                                        className="absolute bottom-0 right-0 w-[50px] h-[50px] z-50 pointer-events-none"
                                                    />
                                                )}
                                            </div>
                                        </div>
                                    )
                                ))}
                            </div>
                            <div className="flex flex-col space-y-3">
                                {[3, 4, 5, 6, 7, 9, 10].map((index) => (
                                    items[index] && (
                                        <div key={index} className="flex items-center justify-start space-x-4">
                                            <img src={`/api${items[index].icon}`} width={50} height={50} alt={items[index].name} title={items[index].name} />
                                            <div>
                                                <div className="flex space-x-2">
                                                    {items[index].perks?.map((perk) => (
                                                        perk.iconPath && perk.isActive && (
                                                            <img src={`/api${perk.iconPath}`} width={30} height={30} alt={perk.name} title={perk.name} />
                                                        )
                                                    ))}
                                                </div>
                                                <div className="flex space-x-2">
                                                    {items[index].stats?.map((stat) => (
                                                        stat.iconPath && (
                                                            <p className="flex items-center space-x-2">
                                                                <img src={`/api${stat.iconPath}`} width={20} height={20} alt={stat.name} title={stat.name} />
                                                                {stat.value}
                                                            </p>
                                                        )
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    )
                                ))}
                            </div>
                        </div>
                        <div className="py-4 space-y-2">
                            <p className="font-semibold text-xl">Estadisticas totales:</p>
                            <div className="flex space-x-2">
                                {totalStats && totalStats.map((stat) => (
                                    stat.iconPath && (
                                        <p key={stat.statHash} className="flex items-center space-x-2">
                                            <img src={`/api${stat.iconPath}`} width={20} height={20} alt={stat.name} title={stat.name} />
                                            {stat.value}
                                        </p>
                                    )
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}