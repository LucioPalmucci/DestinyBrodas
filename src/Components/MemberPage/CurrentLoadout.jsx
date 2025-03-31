import axios from "axios";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";
import inventory from "../../assets/inventory.png";
import "../../index.css";

export default function CurrentLoadout({ membershipType, userId }) {
    const [items, setItems] = useState([]);
    const [totalStats, setTotalStats] = useState([]);
    const [background, setBackground] = useState(null);
    const [showPopup, setShowPopup] = useState(false);
    const [isVisible, setIsVisible] = useState(false);
    const [animatePopup, setAnimatePopup] = useState(false);
    const [activeTab, setActiveTab] = useState("Equipamiento");

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

                const response = await axios.get(`/api/Platform/Destiny2/${membershipType}/Profile/${userId}/Character/${charID}/?components=205,202,201`, {
                    headers: {
                        'X-API-Key': 'f83a251bf2274914ab739f4781b5e710',
                    },
                });
                console.log("dsds",response.data.Response);

                let totalStats = [144602215, 392767087, 1735777505, 1943323491, 2996146975, 4244567218];
                await getTotalStats(totalStats);

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

                    //console.log(itemD.data.Response);

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


                    } else if ([11, 15, 14].includes(response.data.Response.equipment.data.items.indexOf(item))) { //Sublcase, gestos y remates
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
                                watermark: perkResponse.data.Response.iconWatermark || null,
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
                        setBackground(itemResponse.data.Response.screenshot);
                        if (perks.some(perk => perk.name === "Trascendencia")) { //Si es prismatioc eliminar granada prismatica y trasendencia
                            const trascendenciaIndex = perks.findIndex(perk => perk.name === "Trascendencia");
                            if (trascendenciaIndex !== -1) {
                                perks.splice(trascendenciaIndex, 2);
                            }
                        }
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

                    let cosmetic;
                    if (item.overrideStyleItemHash != null) {
                        cosmetic = await getCosmetic(item.overrideStyleItemHash);
                    }

                    if (response.data.Response.equipment.data.items.indexOf(item) === 14) {
                        console.log(itemResponse.data.Response, itemD.data.Response);
                    }
                    return {
                        name: itemResponse.data.Response.displayProperties.name,
                        icon: cosmetic || itemResponse.data.Response.displayProperties.icon,
                        rarity: itemResponse.data.Response.inventory.tierType,
                        perks: perks,
                        stats: armorStats,
                        masterwork: item.state,
                        watermark: itemResponse.data.Response.quality?.displayVersionWatermarkIcons?.[0] || itemResponse.data.Response.iconWatermark || null,
                    };
                }));

                console.log(itemDetails);
                setItems(itemDetails);
                setTotalStats(totalStats);

            } catch (error) {
                console.error(error);
            }
        };
        fetchCurrentLoadout();
    }, [membershipType, userId]);

    useEffect(() => {
        if (showPopup) {
            setIsVisible(true);
            setTimeout(() => setAnimatePopup(true), 100);
        } else {
            setAnimatePopup(false);
            setTimeout(() => setIsVisible(false), 200);
        }
    }, [showPopup]);

    const renderedPerkNames = new Set();

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

    async function getCosmetic(overrideStyleItemHash) {
        const cosmetic = await axios.get(`/api/Platform/Destiny2/Manifest/DestinyInventoryItemDefinition/${overrideStyleItemHash}/?lc=es`, {
            headers: {
                'X-API-Key': 'f83a251bf2274914ab739f4781b5e710',
            },
        });
        return cosmetic.data.Response.displayProperties.icon;
    }

    return (
        totalStats && background && items && (
            <div className="bg-gray-300 p-4 py-4 font-Lato rounded-lg w-1/2 space-y-4 text-white mt-4 h-[475px]" style={{ backgroundImage: `url(/api${background})`, backgroundSize: "cover", backgroundPosition: "calc(50% - 30px) center" }}>
                <h2 className="bg-black/25 p-2 rounded-lg w-fit font-semibold text-2xl">LOADOUT</h2>
                <div className="justify-evenly flex">
                    <div className="bg-black/25 p-2 rounded-lg w-fit space-y-2 font-Lato">
                        {[11, 3, 4, 5, 6, 7, 0, 1, 2].map((index) => (
                            items[index] && (index < 3 || index === 11 || items[index]?.rarity == 6) && (
                                index != 11 ? (
                                    <div key={index} className="flex items-center space-x-2">
                                        <img src={`/api${items[index].icon}`} width={50} height={50} alt={items[index].name} />
                                        <p className="font-semibold">{items[index].name}</p>
                                    </div>
                                ) : (
                                    <div key={index} className="flex items-center space-x-2">
                                        <img src={`/api${items[index].perks[0].iconPath}`} width={50} height={50} alt={items[index].perks[0].name} />
                                        <p className="font-semibold">{items[index].perks[0].name}</p>
                                    </div>
                                )
                            )
                        ))}
                    </div>
                    {totalStats && <div className="bg-black/25 p-2 rounded-lg w-fit flex flex-col space-y-5 h-fit font-Lato" >
                        {totalStats.map((stat) => (
                            stat.iconPath && (
                                <p key={stat.statHash} className="flex items-center space-x-4 font-semibold text-xl">
                                    <img src={`/api${stat.iconPath}`} width={30} height={30} alt={stat.name} title={stat.name} />
                                    {stat.value}
                                </p>
                            )
                        ))}
                    </div>}
                </div>
                <button onClick={() => setShowPopup(true)} className="bg-black/25 py-2 px-4 font-semibold hover:bg-gray-500 rounded text-lg mt-2 cursor-pointer duration-400 ml-12">Ver más</button>
                {isVisible && (
                    <div className="fixed inset-0 flex items-center justify-center w-full z-50 bg-black/50" onClick={() => setShowPopup(false)}>
                        <div className={`p-4 rounded-lg relative bg-neutral-600 text-white w-[1200px] h-[710px] overflow-auto transition-all duration-200 transform ${animatePopup ? "opacity-100 scale-100" : "opacity-0 scale-90"}`} style={{ backgroundImage: `url(${inventory})`, backgroundSize: "cover", backgroundPosition: "center" }} onClick={(e) => e.stopPropagation()}>
                            <button onClick={() => setShowPopup(false)} className="absolute cursor-pointer top-2 right-2 text-gray-500 hover:text-gray-300"> &times; </button>
                            <div>
                                <div className="flex justify-center mt-4">
                                    <button onClick={() => setActiveTab("Equipamiento")} className={`cursor-pointer text-sm p-2 py-1 ${activeTab === "Equipamento" ? "bg-gray-400" : ""} rounded-lg`}>Equipamento</button>
                                    <button onClick={() => setActiveTab("Cosmeticos")} className={`cursor-pointer text-sm p-2 py-1 ${activeTab === "Cosmeticos" ? "bg-gray-400" : ""} rounded-lg`}>Cosmeticos</button>
                                </div>
                                <AnimatePresence mode="wait">
                                    {activeTab === "Equipamiento" && (
                                        <motion.div
                                            key="Equipamiento"
                                            initial={{ x: "-100%", opacity: 0 }}
                                            animate={{ x: 0, opacity: 1 }}
                                            exit={{ x: "100%", opacity: 0 }}
                                            transition={{ duration: 0.5 }}
                                            className="absolute w-full"
                                        >
                                            <div className="flex flex-col space-y-4 items-center justify-center">
                                                {items[11] && (
                                                    <div className={`flex justify-center space-x-4 ${items[11].name.includes("prismático") ? "ml-2" : "mr-[32px]"}`}>
                                                        <div className="flex flex-col justify-center items-end">
                                                            <div className="flex mb-2 rtl">
                                                                {items[11].perks[0] && (
                                                                    <img src={`/api${items[11].perks[0].iconPath}`} className="w-[35px] h-[35px]" alt={items[11].perks[0].name} title={items[11].perks[0].name} />
                                                                )}
                                                            </div>
                                                            <div className="flex mb-2 rtl">
                                                                {items[11].perks.slice(1, 5).map((perk, perkIndex) => (
                                                                    <img key={perkIndex} src={`/api${perk.iconPath}`} className="w-[30px] h-[30px] mx-1" alt={perk.name} title={perk.name} />
                                                                ))}
                                                            </div>
                                                        </div>
                                                        <img src={`/api${items[11].icon}`} width={81} alt={items[11].name} className="rounded-lg" />
                                                        <div className="flex flex-col justify-center">
                                                            <div className="flex mb-2">
                                                                {items[11].perks.slice(5, 7).map((perk, perkIndex) => (
                                                                    perk.name != "Ranura de fragmento vacía" && (
                                                                        <img key={perkIndex} src={`/api${perk.iconPath}`} className="w-[30px] h-[30px] mx-1" alt={perk.name} title={perk.name} />
                                                                    )
                                                                ))}
                                                            </div>
                                                            <div className="flex mb-2">
                                                                {items[11].perks.slice(7).map((perk, perkIndex) => (
                                                                    perk.name != "Ranura de fragmento vacía" && (
                                                                        <img key={perkIndex} src={`/api${perk.iconPath}`} className="w-[30px] h-[30px] mx-1" alt={perk.name} title={perk.name} />
                                                                    )
                                                                ))}
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}
                                                <div className="flex h-[400px] justify-center">
                                                    <div className="flex flex-col justify-between mr-4">
                                                        {[0, 1, 2, 8, 16].map((index) => (
                                                            items[index] && (
                                                                <div key={index} className="flex items-center justify-end">
                                                                    <div dir={index == 16 ? "rtl" : ""} className={index == 16 ? "grid grid-cols-6 gap-2 text-right justify-end rtl mr-4" : "flex space-x-2 mr-4"}>
                                                                        {items[index].perks?.map((perk) => (
                                                                            (index !== 16 || perk.isVisible) && !renderedPerkNames.has(perk.name) && perk.iconPath && !perk.name.includes("Modificadores autorizados") && (
                                                                                renderedPerkNames.add(perk.name), //Alamcena en un registro para no repetir perks
                                                                                <img src={`/api${perk.iconPath}`} className={index == 16 ? "w-[25px] h-[25px] " : "w-[40px] h-[40px]"} alt={perk.name} title={perk.name} />
                                                                            )
                                                                        ))}
                                                                    </div>
                                                                    <div className={`relative ${items[index].masterwork === 8 || items[index].masterwork === 9 || items[index].masterwork === 5 || items[index].masterwork === 4 ? "masterwork item-wrapper" : ""}`}>
                                                                        <img
                                                                            src={`/api${items[index].icon}`}
                                                                            width={60}
                                                                            height={60}
                                                                            alt={items[index].name}
                                                                            title={items[index].name}
                                                                        />
                                                                        {(items[index].masterwork === 8 || items[index].masterwork === 9 || items[index].masterwork === 5 || items[index].masterwork === 4) && (
                                                                            <div className="masterwork-overlay" />
                                                                        )}
                                                                        {(items[index].masterwork === 8 || items[index].masterwork === 9) && (
                                                                            <div className="craftedshadow" />
                                                                        )}
                                                                        {items[index].watermark && (
                                                                            <img
                                                                                src={`/api${items[index].watermark}`}
                                                                                className="absolute bottom-0 right-0 w-[60px] h-[60px] z-50 pointer-events-none"
                                                                            />
                                                                        )}
                                                                        {(items[index].rarity === 6 && (items[index].masterwork == 5 || items[index].masterwork == 4)) && (
                                                                            <div className="exotic-masterwork" />
                                                                        )}
                                                                        {items[index].masterwork === 8 && (
                                                                            <svg width="12" height="12" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg" fill="#d23636" className="absolute bottom-0.5 left-0.5 z-50 pointer-events-none">
                                                                                <path d="M0 17.616h6.517c5.314 0 5.486 5.073 5.486 7.192l-.003 3.288h2.53v3.904H0zm31.997 0h-6.517c-5.314 0-5.486 5.073-5.486 7.192l.003 3.288h-2.53v3.904h14.53zM0.003 14.384h6.517c5.314 0 5.486-5.073 5.486-7.192L12.003 3.904h2.53V0H0zm31.997 0h-6.517c-5.314 0-5.486-5.073-5.486-7.192l.003-3.288h-2.53V0h14.53z" />
                                                                            </svg>
                                                                        )}
                                                                        {items[index].masterwork === 9 && (
                                                                            <svg width="15" height="15" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg" fill="#d23636" className="absolute bottom-0.5 left-0.5 z-50 pointer-events-none">
                                                                                <path d="m0 17.25h7l0 2h4c1 0 3 1 3.75 2v10.75zm32 0h-7l0 2h-4c-1 0-3 1-3.75 2v10.75zm-32-2.5h7l0-2h4c1 0 3-1 3.75-2v-10.75zm32 0h-7l0-2h-4c-1 0-3-1-3.75-2v-10.75z" />
                                                                            </svg>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            )
                                                        ))}
                                                    </div>
                                                    <div className="flex flex-col justify-between ml-4">
                                                        {[3, 4, 5, 6, 7].map((index) => (
                                                            items[index] && (
                                                                <div key={index} className="flex items-center justify-start">
                                                                    <div className={`relative ${items[index].masterwork == 4 || items[index].masterwork === 5 ? "masterwork item-wrapper" : ""}`}>
                                                                        <img
                                                                            src={`/api${items[index].icon}`}
                                                                            width={60}
                                                                            height={60}
                                                                            alt={items[index].name}
                                                                            title={items[index].name}
                                                                        />
                                                                        {(items[index].masterwork == 5 || items[index].masterwork == 4) && (
                                                                            <div className="masterwork-overlay" />
                                                                        )}
                                                                        {(items[index].rarity === 6 && (items[index].masterwork == 5 || items[index].masterwork == 4)) && (
                                                                            <div className="exotic-masterwork" />
                                                                        )}
                                                                        {items[index].watermark && (
                                                                            <img
                                                                                src={`/api${items[index].watermark}`}
                                                                                className="absolute bottom-0 right-0 w-[60px] h-[60px] z-50 pointer-events-none"
                                                                            />
                                                                        )}
                                                                    </div>
                                                                    <div className="ml-4 justify-between flex flex-col">
                                                                        <div className="flex space-x-2">
                                                                            {items[index].perks?.map((perk) => (
                                                                                perk.iconPath && perk.isActive && (
                                                                                    <img src={`/api${perk.iconPath}`} width={32} height={32} alt={perk.name} title={perk.name} />
                                                                                )
                                                                            ))}
                                                                        </div>
                                                                        <div className="flex space-x-2">
                                                                            {items[index].stats?.map((stat) => (
                                                                                stat.iconPath && (
                                                                                    <p className="flex items-center space-x-2 font-xl font-semibold">
                                                                                        <img src={`/api${stat.iconPath}`} width={22} height={22} alt={stat.name} title={stat.name} />
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
                                            </div>
                                        </motion.div>
                                    )}
                                    {activeTab === "Cosmeticos" && (
                                        <motion.div
                                            key="Cosmeticos"
                                            initial={{ x: "100%", opacity: 0 }}
                                            animate={{ x: 0, opacity: 1 }}
                                            exit={{ x: "-100%", opacity: 0 }}
                                            transition={{ duration: 0.5 }}
                                            className="absolute w-full"
                                        >
                                            <div className="flex flex-col space-y-4 items-center justify-center py-8 h-[500px]">
                                                {[9, 10, 12, 13, 14, 15].map((index) => (
                                                    items[index] && (
                                                        <div key={index} className="flex items-center space-x-2">
                                                            <div className={`relative`}>
                                                                <img src={`/api${items[index].icon}`} width={50} height={50} alt={items[index].name} />
                                                                {items[index].watermark && (
                                                                    <img
                                                                        src={`/api${items[index].watermark}`}
                                                                        className="absolute bottom-0 right-0 w-[50px] h-[50px] z-50 pointer-events-none"
                                                                    />
                                                                )}
                                                            </div>
                                                            {items[index].perks?.map((perk) => (
                                                                <>
                                                                    {perk.iconPath && (
                                                                        <div className="relative">
                                                                            <img src={`/api${perk.iconPath}`} width={45} height={45} alt={perk.name} title={perk.name} />
                                                                            {perk.watermark && (
                                                                                <img src={`/api${perk.watermark}`} className="absolute bottom-0 right-0 w-[45px] h-[45px] z-50 pointer-events-none" />
                                                                            )}
                                                                        </div>
                                                                    )}
                                                                </>
                                                            ))}
                                                        </div>
                                                    )
                                                ))}
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                                <div className="justify-center flex flex-col items-center mt-[520px]">
                                    <p className="font-semibold text-lg">ESTADISTICAS TOTALES</p>
                                    <div className="flex space-x-2">
                                        {totalStats && totalStats.map((stat) => (
                                            stat.iconPath && (
                                                <p key={stat.statHash} className="flex items-center space-x-2">
                                                    <img src={`/api${stat.iconPath}`} width={30} height={30} alt={stat.name} title={stat.name} />
                                                    {stat.value}
                                                </p>
                                            )
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        )
    );
}