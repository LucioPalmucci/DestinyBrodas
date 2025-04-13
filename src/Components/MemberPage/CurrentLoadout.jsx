import axios from "axios";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";
import inventory from "../../assets/inventory.png";
import masterworkHeader from "../../assets/masterworkHeader.png";
import "../../index.css";

export default function CurrentLoadout({ membershipType, userId }) {
    const [items, setItems] = useState([]);
    const [totalStats, setTotalStats] = useState([]);
    const [background, setBackground] = useState(null);
    const [showPopup, setShowPopup] = useState(false);
    const [isVisible, setIsVisible] = useState(false);
    const [animatePopup, setAnimatePopup] = useState(false);
    const [activeTab, setActiveTab] = useState("Equipamiento");
    const [selectedWeapon, setSelectedWeapon] = useState(null);
    const [selectedArmor, setSelectedArmor] = useState(null);
    const [popupPosition, setPopupPosition] = useState({ top: 0, left: 0 });
    const [emblems, setEmblems] = useState(null);
    const [seal, setSeal] = useState(null);
    const [sealGilded, setSealGilded] = useState(null);

    useEffect(() => {
        const fetchCurrentLoadout = async () => {
            try {
                const responseChar = await axios.get(`/api/Platform/Destiny2/${membershipType}/Profile/${userId}/?components=Characters,102&lc=es`, {
                    headers: {
                        'X-API-Key': 'f83a251bf2274914ab739f4781b5e710',
                    },
                });
                const characters = responseChar.data.Response.characters.data;

                //0 masculino, 1 femenino
                const mostRecentCharacter = Object.values(characters).reduce((latest, current) => {
                    return new Date(current.dateLastPlayed) > new Date(latest.dateLastPlayed) ? current : latest;
                });

                const charID = mostRecentCharacter.characterId;

                const response = await axios.get(`/api/Platform/Destiny2/${membershipType}/Profile/${userId}/Character/${charID}/?components=205,202,201`, {
                    headers: {
                        'X-API-Key': 'f83a251bf2274914ab739f4781b5e710',
                    },
                });

                let totalStats = [144602215, 392767087, 1735777505, 1943323491, 2996146975, 4244567218];
                await getTotalStats(totalStats);
                await getOtherEmblems(characters);
                await getSeal(mostRecentCharacter);

                const itemDetails = await Promise.all(response.data.Response.equipment.data.items.map(async (item) => {
                    const itemResponse = await axios.get(`/api/Platform/Destiny2/Manifest/DestinyInventoryItemDefinition/${item.itemHash}/?lc=es`, {
                        headers: {
                            'X-API-Key': 'f83a251bf2274914ab739f4781b5e710',
                        },
                    });

                    const itemD = await axios.get(`/api/Platform/Destiny2/${membershipType}/Profile/${userId}/Item/${item.itemInstanceId}/?components=300,302,304,305,309`, {
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
                        perks = await Promise.all(itemD.data.Response.sockets.data?.sockets?.map(async (perk) => {
                            if (!perk.plugHash) return null;
                            const perkResponse = await axios.get(`/api/Platform/Destiny2/Manifest/DestinyInventoryItemDefinition/${perk.plugHash}/?lc=es`, {
                                headers: {
                                    'X-API-Key': 'f83a251bf2274914ab739f4781b5e710',
                                },
                            });
                            //if(response.data.Response.equipment.data.items.indexOf(item) === 1) console.log(perkResponse.data.Response.plug.plugCategoryIdentifier)
                            return {
                                ...perk,
                                name: perkResponse.data.Response.displayProperties.name,
                                iconPath: perkResponse.data.Response.displayProperties.icon,
                                perkHash: perkResponse.data.Response.perks[0]?.perkHash,
                                perkType: perkResponse.data.Response.plug.plugCategoryIdentifier,
                            };
                        }) || []);
                    }

                    if (response.data.Response.equipment.data.items.indexOf(item) === 11) {
                        const perkAtIndex2 = perks.splice(2, 1)[0];
                        perks.unshift(perkAtIndex2);
                        setBackground(itemResponse.data.Response.screenshot);
                        if (perks.some(perk => perk.name === "Trascendencia")) { //Si es prismatico eliminar granada prismatica y trasendencia
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

                    let tracker, dmgType, ammo, bgColor, bgMasterwork, champmod;
                    if ([3, 4, 5, 6, 7].includes(response.data.Response.equipment.data.items.indexOf(item))) {
                        const { modifierPerks, designPerks } = sortByArtificePerk(perks);
                        perks = {
                            modifierPerks: modifierPerks,
                            cosmeticPerks: designPerks
                        };
                        bgColor = getRarityColor(itemResponse.data.Response.inventory.tierType);
                        bgMasterwork = [8, 5, 4, 9].some(value => item.state && item.state === value) ? masterworkHeader : null;
                    }
                    else if ([0, 1, 2].includes(response.data.Response.equipment.data.items.indexOf(item))) {
                        const { modifierPerks, cosmeticPerks } = sortWeaponPerks(perks);
                        perks = {
                            modifierPerks: modifierPerks,
                            cosmeticPerks: cosmeticPerks
                        };
                        tracker = getTrackerKills(perks.cosmeticPerks?.tracker[0]?.plugHash, itemD.data.Response.plugObjectives?.data?.objectivesPerPlug)
                        dmgType = await getdmgType(itemResponse.data.Response.defaultDamageTypeHash)
                        ammo = await getAmmoType(itemResponse.data.Response.equippingBlock.ammoType)
                        bgColor = getRarityColor(itemResponse.data.Response.inventory.tierType);
                        bgMasterwork = [8, 5, 4, 9].some(value => item.state && item.state === value) ? masterworkHeader : null;
                        champmod = await getChampMod(itemResponse.data.Response, response.data.Response.progressions.data.seasonalArtifact.tiers)
                    }

                    if (response.data.Response.equipment.data.items.indexOf(item) == 1 || response.data.Response.equipment.data.items.indexOf(item) == 2) console.log(itemResponse.data.Response);

                    return {
                        name: itemResponse.data.Response.displayProperties.name,
                        icon: cosmetic || itemResponse.data.Response.displayProperties.icon,
                        rarity: itemResponse.data.Response.inventory.tierType,
                        perks: perks,
                        stats: armorStats,
                        masterwork: item.state,
                        watermark: itemResponse.data.Response.quality?.displayVersionWatermarkIcons?.[0] || itemResponse.data.Response.iconWatermark || null,
                        power: itemD.data.Response.instance?.data?.primaryStat?.value,
                        tracker: tracker,
                        itemHash: item.itemHash,
                        weaponType: itemResponse.data.Response.itemTypeDisplayName,
                        dmgType: dmgType,
                        ammo: ammo,
                        bgColor: bgColor,
                        mwHeader: bgMasterwork,
                        champmod: champmod,
                        craftedenchanced: itemResponse.data.Response.tooltipNotifications[0]?.displayStyle,
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

    const handleWeaponClick = (weapon, event) => {
        const rect = event.target.getBoundingClientRect();
        setPopupPosition({ top: rect.top - 140, left: rect.right - 308 }); // Posición a la derecha de la imagen
        setSelectedWeapon(weapon);
    };
    const closeWeaponDetails = () => {
        setSelectedWeapon(null);
    };

    const handleArmorClick = (armor, event) => {
        const rect = event.target.getBoundingClientRect();
        setPopupPosition({ top: rect.top - 140, left: rect.right - 674 }); // Posición a la izquierda de la imagen
        setSelectedArmor(armor);
    }

    const closeArmorDetails = () => {
        setSelectedArmor(null);
    };

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

    function sortByArtificePerk(perks) {
        const modifiers = [
            "enhancements",
            "intrinsics",
        ]
        const design = [
            "shader",
            "skins",
        ];
        const modifierPerks = perks.filter(perk => modifiers.some(mod => perk?.perkType?.includes(mod)));
        const designPerks = perks.filter(perk => design.some(des => perk?.perkType?.includes(des)));

        for (const mod of modifierPerks) {
            if (mod.name.includes("Forjada con") || mod.name.includes("Modificador vacío")) {
                const index = modifierPerks.indexOf(mod);
                if (index > -1) {
                    modifierPerks.splice(index, 1); // Remove the perk from its current position
                    modifierPerks.splice(1, 0, mod); // Insert it at the second index
                }
            }
        }

        return {
            modifierPerks,
            designPerks,
        };
    }

    function sortWeaponPerks(perks) {
        const modifiers = [
            "barrels",
            "blades",
            "bowstrings",
            "magazines",
            "guards",
            "arrows",
            "batteries",
            "frames",
            "stocks",
            "origins",
            "v400.weapon.mod_",
        ];

        const archetype = [
            "intrinsics",
            "v400.plugs.weapons.masterworks.stat",
        ];

        const design = [
            "mementos",
            "shader",
            "skins",
        ];

        const tracker = [
            "v400.plugs.weapons.masterworks.trackers",
        ];

        const modifierPerks = perks.filter(perk => modifiers.some(mod => perk?.perkType?.includes(mod)));
        const archetypePerks = perks.filter(perk => archetype.some(arch => perk?.perkType?.includes(arch)));
        const designPerks = perks.filter(perk => design.some(des => perk?.perkType?.includes(des)));
        const trackerPerks = perks.filter(perk => tracker.some(trk => perk?.perkType?.includes(trk)));

        return {
            modifierPerks,
            cosmeticPerks: {
                archetype: archetypePerks,
                design: designPerks,
                tracker: trackerPerks,
            }
        };
    }

    function getTrackerKills(trackerHash, perks) {
        if (perks != null) {
            let tracker;
            for (const [key, value] of Object.entries(perks)) {
                if (key == trackerHash) {
                    tracker = value[0].progress;
                    break;
                }
            }
            return tracker;
        } else {
            return null;
        }
    }

    async function getdmgType(dmgType) {
        const response = await axios.get(`/api/Platform/Destiny2/Manifest/DestinyDamageTypeDefinition/${dmgType}/?lc=es`, {
            headers: {
                'X-API-Key': 'f83a251bf2274914ab739f4781b5e710',
            },
        });
        return {
            name: response.data.Response.displayProperties.name,
            iconPath: response.data.Response.displayProperties.icon,
        };
    }

    async function getAmmoType(ammoType) {
        switch (ammoType) {
            case 1: {
                const response = await axios.get(`/api/Platform/Destiny2/Manifest/DestinyPresentationNodeDefinition/1731162900/?lc=es`, {
                    headers: {
                        'X-API-Key': 'f83a251bf2274914ab739f4781b5e710',
                    },
                });
                return {
                    name: response.data.Response.displayProperties.name,
                    iconPath: response.data.Response.displayProperties.icon,
                }
            }
            case 2: {
                const response = await axios.get(`/api/Platform/Destiny2/Manifest/DestinyPresentationNodeDefinition/638914517/?lc=es`, {
                    headers: {
                        'X-API-Key': 'f83a251bf2274914ab739f4781b5e710',
                    },
                });
                return {
                    name: response.data.Response.displayProperties.name,
                    iconPath: response.data.Response.displayProperties.icon,
                }
            }
            case 3: {
                const response = await axios.get(`/api/Platform/Destiny2/Manifest/DestinyPresentationNodeDefinition/3686962409/?lc=es`, {
                    headers: {
                        'X-API-Key': 'f83a251bf2274914ab739f4781b5e710',
                    },
                });
                return {
                    name: response.data.Response.displayProperties.name,
                    iconPath: response.data.Response.displayProperties.icon,
                }
            }
            default: return null;
        }
    }

    async function getChampMod(item, artifactMods) {
        if (item.breakerType != 0) {
            const response = await axios.get(`/api/Platform/Destiny2/Manifest/DestinyBreakerTypeDefinition/${item.breakerTypeHash}/?lc=es`, {
                headers: {
                    'X-API-Key': 'f83a251bf2274914ab739f4781b5e710',
                }
            });
            return {
                name: response.data.Response.displayProperties.name,
                iconPath: response.data.Response.displayProperties.icon,
            }
        } else {
            const activePerks = artifactMods.flatMap(tier =>
                tier.items.filter(perk => perk.isActive && perk.isVisible)
            );

            let perks = await Promise.all(activePerks.map(async (perk) => {
                const perkResponse = await axios.get(`/api/Platform/Destiny2/Manifest/DestinyInventoryItemDefinition/${perk.itemHash}/?lc=es`, {
                    headers: {
                        'X-API-Key': 'f83a251bf2274914ab739f4781b5e710',
                    },
                });
                return perkResponse.data.Response.displayProperties.name;
            })) || [];

            let modActivo;
            for (const perk of perks) {
                let itemWords = item.itemTypeDisplayName.toLowerCase();
                if (itemWords.includes("fusil de")) {
                    itemWords = itemWords.replace("fusil de", "").trim();
                }
                const match = perk.toLowerCase().includes(itemWords);
                if (match) {
                    modActivo = perk;
                }
            }

            if (modActivo) {
                let breakerInfo;
                const text = modActivo.trim().toLowerCase();
                if (text.includes("imparable")) {
                    breakerInfo = await axios.get(`/api/Platform/Destiny2/Manifest/DestinyBreakerTypeDefinition/3178805705/?lc=es`, {
                        headers: {
                            'X-API-Key': 'f83a251bf2274914ab739f4781b5e710',
                        }
                    });
                } else if (text.includes("sobrecarga")) {
                    breakerInfo = await axios.get(`/api/Platform/Destiny2/Manifest/DestinyBreakerTypeDefinition/2611060930/?lc=es`, {
                        headers: {
                            'X-API-Key': 'f83a251bf2274914ab739f4781b5e710',
                        }
                    });
                } else if (text.includes("antibarrera") || text.includes("penetrante")) {
                    breakerInfo = await axios.get(`/api/Platform/Destiny2/Manifest/DestinyBreakerTypeDefinition/485622768/?lc=es`, {
                        headers: {
                            'X-API-Key': 'f83a251bf2274914ab739f4781b5e710',
                        }
                    });
                }

                return {
                    name: breakerInfo?.data.Response.displayProperties.name,
                    iconPath: breakerInfo?.data.Response.displayProperties.icon,
                    backgroundColor: "#3f8e90",
                }
            }
        }
    }

    function getRarityColor(rarity) {
        let color, colorRGBA;
        switch (rarity) {
            case 2:
                color = "rgba(220, 220, 220)";
                colorRGBA = "#050505d9";
                break;
            case 3:
                color = "rgba(54, 110, 66)";
                colorRGBA = "color-mix(in srgb, #081109 60%, #0000)";
                break;
            case 4:
                color = "rgba(80, 118, 163)";
                colorRGBA = "color-mix(in srgb, #0a0f15 60%, #0000)"
                break;
            case 5:
                color = "rgba(81, 48, 101)";
                colorRGBA = "color-mix(in srgb, #0e0811 60%, #0000) ";
                break;
            case 6:
                color = "rgba(195, 160, 25)";
                colorRGBA = "color-mix(in srgb, #161204 50%, #0000) ";
                break;
            default:
                color = "#000000";
                colorRGBA = "rgba(0, 0, 0, 0.3)";
                break;
        }
        return {
            rgb: color,
            rgba: colorRGBA,
        };
    }

    async function getOtherEmblems(characters) {
        let emblems, classe;
        const emblemPromises = Object.values(characters).map(async (char) => {
            const rep = await axios.get(`/api/Platform/Destiny2/${membershipType}/Profile/${userId}/Character/${char.characterId}/?components=205`, {
                headers: {
                    'X-API-Key': 'f83a251bf2274914ab739f4781b5e710',
                },
            });

            const emblem = await axios.get(`/api/Platform/Destiny2/Manifest/DestinyInventoryItemDefinition/${rep.data.Response.equipment.data.items[13].itemHash}/?lc=es`, {
                headers: {
                    'X-API-Key': 'f83a251bf2274914ab739f4781b5e710',
                },
            });

            switch (char.classType) {
                case 0:
                    classe = "Titán";
                    break;
                case 1:
                    classe = char.genderType === 0 ? "Cazador" : "Cazadora";
                    break;
                case 2:
                    classe = char.genderType === 0 ? "Hechicero" : "Hechicera";
                    break;
            }

            return {
                name: emblem.data.Response.displayProperties.name,
                iconPath: emblem.data.Response.displayProperties.icon,
                class: classe,
            };
        });

        emblems = await Promise.all(emblemPromises);
        setEmblems(emblems);
    }

    async function getSeal(char) {
        if (char.titleRecordHash == null) return;
        const sealResponse = await axios.get(`/api/Platform/Destiny2/Manifest/DestinyRecordDefinition/${char.titleRecordHash}/?lc=es`, {
            headers: {
                'X-API-Key': 'f83a251bf2274914ab739f4781b5e710',
            }
        });


        const allseals = await axios.get(`/api/Platform/Destiny2/${membershipType}/Profile/${userId}/?components=900`, {
            headers: {
                'X-API-Key': 'f83a251bf2274914ab739f4781b5e710',
            },
        });
        setSeal({
            name: sealResponse.data.Response.titleInfo.titlesByGender[char.genderType == 0 ? "Male" : "Female"] || sealResponse.data.Response.displayProperties.name,
            iconPath: sealResponse.data.Response.displayProperties.icon,
            timesGilded: allseals.data.Response.profileRecords.data.records[sealResponse.data.Response.titleInfo?.gildingTrackingRecordHash]?.completedCount
        });
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
                        <div className={`p-4 rounded-lg relative bg-neutral-600 text-white overflow-hidden transition-all duration-200 transform ${animatePopup ? "opacity-100 scale-100" : "opacity-0 scale-90"}`} style={{width: '65.28%', height: '77.25%', backgroundImage: `url(${inventory})`, backgroundSize: "cover", backgroundPosition: "center" }} onClick={(e) => e.stopPropagation()}>
                            <button onClick={() => setShowPopup(false)} className="absolute cursor-pointer top-2 right-2 text-gray-500 hover:text-gray-300"> &times; </button>
                            <div className="flex flex-col items-center justify-center space-y-4">
                                <div className="flex justify-center mt-4">
                                    <button onClick={() => setActiveTab("Equipamiento")} className={`cursor-pointer text-md p-2 py-1 ${activeTab === "Equipamiento" ? "bg-gray-400" : ""} rounded-lg`}>Equipamento</button>
                                    <button onClick={() => setActiveTab("Cosmeticos")} className={`cursor-pointer text-md p-2 py-1 ${activeTab === "Cosmeticos" ? "bg-gray-400" : ""} rounded-lg`}>Cosmeticos</button>
                                </div>
                                <AnimatePresence mode="wait">
                                    {activeTab === "Equipamiento" && (
                                        <motion.div
                                            key="Equipamiento"
                                            initial={{ x: "-100%", opacity: 0 }}
                                            animate={{ x: 0, opacity: 1 }}
                                            exit={{ x: "-100%", opacity: 0 }}
                                            transition={{ duration: 0.5 }}
                                            className="absolute w-full justify-center flex"
                                        >
                                            <div className="flex flex-col space-y-4 items-center justify-center w-full">
                                                {items[11] && (
                                                    <div className={`flex justify-center ${items[11].name.includes("prismático") ? "ml-2" : "ml-22"}`}>
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
                                                                    <img key={perkIndex} src={`/api${perk.iconPath}`} className="w-[30px] h-[30px] mx-1" alt={perk.name} title={perk.name} />

                                                                ))}
                                                            </div>
                                                            <div className="flex mb-2">
                                                                {items[11].perks.slice(7).map((perk, perkIndex) => (
                                                                    <img key={perkIndex} src={`/api${perk.iconPath}`} className="w-[30px] h-[30px] mx-1" alt={perk.name} title={perk.name} />

                                                                ))}
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}
                                                <div className="flex h-[400px] justify-center w-full ">
                                                    <div className="flex flex-col justify-between mr-4">
                                                        {[0, 1, 2, 8, 16].map((index) => (
                                                            items[index] && (
                                                                <div key={index} className="flex items-center justify-end">
                                                                    <div dir={index == 16 ? "rtl" : ""} className={index == 16 ? "grid grid-cols-6 gap-2 text-right justify-end rtl mr-4" : "flex space-x-2 mr-4"}>
                                                                        {index == 8 || index == 16 ? (
                                                                            items[index].perks?.map((perk) => (
                                                                                perk.name && (index !== 16 || perk.isVisible) && perk?.iconPath && perk?.name !== "Mejorar Espectro" && perk.name !== "Ranura de modificador de actividad" && (
                                                                                    <img src={`/api${perk.iconPath}`} className={index == 16 ? "w-[25px] h-[25px]" : "w-[35px] h-[35px]"} alt={perk.name} title={perk.name} />
                                                                                )
                                                                            ))
                                                                        ) : (
                                                                            <div className="justify-between flex flex-col">
                                                                                <div className="flex space-x-2 justify-end">
                                                                                    {items[index].perks.modifierPerks.map((perk) => (
                                                                                        perk.name && (index !== 16 || perk.isVisible) && perk?.iconPath && perk.name !== "Ranura de potenciador de nivel de arma vacía" && (
                                                                                            <img src={`/api${perk.iconPath}`} className={"w-[35px] h-[35px]"} alt={perk.name} title={perk.name} />
                                                                                        )
                                                                                    ))}
                                                                                </div>
                                                                                {selectedWeapon &&
                                                                                    <div className="fixed inset-0 flex items-center justify-center w-full z-50" onClick={() => closeWeaponDetails()} >
                                                                                        <div
                                                                                            className={`w-[400px] text-white relative`}
                                                                                            style={{ top: `${popupPosition.top}px`, left: `${popupPosition.left}px`, position: "absolute" }}
                                                                                            onClick={(e) => e.stopPropagation()}
                                                                                        >
                                                                                            <div style={{ backgroundColor: selectedWeapon.bgColor.rgb, backgroundImage: `url(${selectedWeapon.mwHeader})`, backgroundPositionX: "top", backgroundSize: "contain", backgroundRepeat: "no-repeat" }} className="p-2 px-4 rounded-t-lg">
                                                                                                <div className="text-2xl font-semibold flex items-center">
                                                                                                    <a href={`https://www.light.gg/db/items/${selectedWeapon.itemHash}`} target="_blank" rel="noopener noreferrer" className="hover:text-neutral-300" >{selectedWeapon.name}</a>
                                                                                                    <h1 className='lightlevel ml-2' style={{ color: "#E5D163", textShadow: "0px 3px 3px rgba(37, 37, 37, 0.4)" }}>
                                                                                                        <i className="icon-light mr-1" style={{ fontStyle: 'normal', fontSize: '1.1rem', position: 'relative', top: '-0.40rem' }} />{selectedWeapon.power}
                                                                                                    </h1>
                                                                                                </div>
                                                                                                <div className="flex items-center">
                                                                                                    <p>{selectedWeapon.weaponType}</p>
                                                                                                    <img src={"/api" + selectedWeapon.ammo.iconPath} className="w-[25px] h-[25px] ml-0.5 mr-0.5" title={selectedWeapon.ammo.name} />
                                                                                                    <img src={"/api" + selectedWeapon.dmgType.iconPath} className="w-[18px] h-[18px]" title={selectedWeapon.dmgType.name} />
                                                                                                    {selectedWeapon.champmod && (
                                                                                                        <div style={{ backgroundColor: selectedWeapon.champmod.backgroundColor, display: "inline-block", borderRadius: "2px" }} className="ml-1 px-0">
                                                                                                            <img src={"/api" + selectedWeapon.champmod.iconPath} className="w-[17px] h-[17px]" title={selectedWeapon.champmod.name} />
                                                                                                        </div>
                                                                                                    )}
                                                                                                </div>
                                                                                            </div>
                                                                                            <div className="flex space-x-3 p-2 rounded-b-lg" style={{ backgroundColor: selectedWeapon.bgColor.rgba }} >
                                                                                                <div className="space-y-1 flex flex-col justify-top space-y-3 items-center w-[177px]">
                                                                                                    <p className="font-semibold text-md">Armazón</p>
                                                                                                    <div className="flex space-x-2">
                                                                                                        {selectedWeapon.perks.cosmeticPerks.archetype.map((perk) => (
                                                                                                            perk.name && perk?.iconPath && perk.name !== "Ranura de potenciador de nivel de arma vacía" && (
                                                                                                                <img src={`/api${perk.iconPath}`} className={"w-[40px] h-[40px]"} alt={perk.name} title={perk.name} />
                                                                                                            )
                                                                                                        ))}
                                                                                                    </div>
                                                                                                </div>
                                                                                                <div class="border-l border-0.5 border-white/25 h-24 " />
                                                                                                <div className="space-y-1 justify-top flex flex-col justify-top space-y-3 items-center w-[177px]">
                                                                                                    <p className="font-semibold text-md">Diseño</p>
                                                                                                    <div className="flex space-x-2 w-fit mt-1">
                                                                                                        {selectedWeapon.perks.cosmeticPerks.design.map((perk) => (
                                                                                                            perk.name && perk?.iconPath && perk.name !== "Ranura de potenciador de nivel de arma vacía" && (
                                                                                                                <img src={`/api${perk.iconPath}`} className={"max-w-[35px] max-h-[35px]"} alt={perk.name} title={perk.name} />
                                                                                                            )
                                                                                                        ))}
                                                                                                    </div>
                                                                                                </div>
                                                                                                <div class="border-l border-0.5 border-white/25 h-24" />
                                                                                                <div className="space-y-1 justify-top flex flex-col justify-top space-y-3 items-center w-[177px]">
                                                                                                    <p className="font-semibold text-md">Muertes</p>
                                                                                                    <div className="flex space-x-1">
                                                                                                        {selectedWeapon.perks.cosmeticPerks.tracker.map((perk) => (
                                                                                                            perk.name && perk?.iconPath && perk.name !== "Ranura de potenciador de nivel de arma vacía" && (
                                                                                                                <img src={`/api${perk.iconPath}`} className={"w-[40px] h-[40px]"} alt={perk.name} title={perk.name} />
                                                                                                            )
                                                                                                        ))}
                                                                                                        {selectedWeapon.tracker && (
                                                                                                            <p className="flex items-center space-x-2 text-xs"> {selectedWeapon.tracker} {selectedWeapon.perks.cosmeticPerks.tracker[0].name == "Contador de bajas" ? "Enemigos" : "Guardianes"}</p>
                                                                                                        )}
                                                                                                    </div>
                                                                                                </div>
                                                                                            </div>
                                                                                        </div>
                                                                                    </div>}
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                    <div className={`relative ${items[index].masterwork === 8 || items[index].masterwork === 9 || items[index].masterwork === 5 || items[index].masterwork === 4 ? "masterwork item-wrapper" : ""}`}>
                                                                        <img
                                                                            src={`/api${items[index].icon}`}
                                                                            width={60}
                                                                            height={60}
                                                                            alt={items[index].name}
                                                                            title={items[index].name}
                                                                            onClick={(e) => [0, 1, 2].includes(index) && handleWeaponClick(items[index], e)}
                                                                            className={`${[0, 1, 2].includes(index) ? "cursor-pointer" : ""} `}

                                                                        />
                                                                        {(items[index].masterwork === 8 || items[index].masterwork === 9 || items[index].masterwork === 5 || items[index].masterwork === 4) && (
                                                                            <div className="masterwork-overlay" />
                                                                        )}
                                                                        {(items[index].craftedenchanced?.includes("info") || items[index].craftedenchanced?.includes("deepsight")) && (
                                                                            <div className="craftedshadow" />
                                                                        )}
                                                                        {items[index].watermark && (
                                                                            <img
                                                                                src={`/api${items[index].watermark}`}
                                                                                className="absolute bottom-0 right-0 w-[60px] h-[60px] z-40 pointer-events-none"
                                                                            />
                                                                        )}
                                                                        {(items[index].rarity === 6 && (items[index].masterwork == 5 || items[index].masterwork == 4)) && (
                                                                            <div className="exotic-masterwork" />
                                                                        )}
                                                                        {items[index].craftedenchanced?.includes("deepsight") && (
                                                                            <svg width="12" height="12" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg" fill="#d23636" className="absolute bottom-0.5 left-0.5 z-40 pointer-events-none">
                                                                                <path d="M0 17.616h6.517c5.314 0 5.486 5.073 5.486 7.192l-.003 3.288h2.53v3.904H0zm31.997 0h-6.517c-5.314 0-5.486 5.073-5.486 7.192l.003 3.288h-2.53v3.904h14.53zM0.003 14.384h6.517c5.314 0 5.486-5.073 5.486-7.192L12.003 3.904h2.53V0H0zm31.997 0h-6.517c-5.314 0-5.486-5.073-5.486-7.192l.003-3.288h-2.53V0h14.53z" />
                                                                            </svg>
                                                                        )}
                                                                        {items[index].craftedenchanced?.includes("info") && (
                                                                            <svg width="15" height="15" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg" fill="#d23636" className="absolute bottom-0.5 left-0.5 z-40 pointer-events-none">
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
                                                                            onClick={(e) => [3, 4, 5, 6, 7].includes(index) && handleArmorClick(items[index], e)}
                                                                            className="cursor-pointer"
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
                                                                                className="absolute bottom-0 right-0 w-[60px] h-[60px] z-40 pointer-events-none"
                                                                            />
                                                                        )}
                                                                    </div>
                                                                    <div className="ml-4 justify-between flex flex-col">
                                                                        <div className="flex space-x-2 mb-1">
                                                                            {items[index].perks.modifierPerks.map((perk) => (
                                                                                perk && perk.isVisible && perk.name !== "Mejorar armadura" && (
                                                                                    <img src={`/api${perk.iconPath}`} width={32} height={32} alt={perk.name} title={perk.name} />
                                                                                )
                                                                            ))}
                                                                        </div>
                                                                        <div className="flex space-x-2">
                                                                            {items[index].stats?.map((stat) => (
                                                                                stat.iconPath && (
                                                                                    <p className="flex items-center space-x-2 font-lg font-semibold">
                                                                                        <img src={`/api${stat.iconPath}`} width={18} height={18} alt={stat.name} title={stat.name} />
                                                                                        {stat.value}
                                                                                    </p>
                                                                                )
                                                                            ))}
                                                                        </div>
                                                                        {selectedArmor &&
                                                                            <div className="fixed inset-0 flex items-center justify-center w-full z-50" onClick={() => closeArmorDetails()} >
                                                                                <div
                                                                                    className="w-[300px] text-white relative"
                                                                                    style={{ top: `${popupPosition.top}px`, left: `${popupPosition.left}px`, position: "absolute" }}
                                                                                    onClick={(e) => e.stopPropagation()}
                                                                                >
                                                                                    <div className="rounded-t-lg p-2 px-3" style={{ backgroundColor: selectedArmor.bgColor.rgb, backgroundImage: `url(${selectedArmor.mwHeader})`, backgroundPosition: "top", backgroundSize: "contain", backgroundRepeat: "no-repeat" }}>
                                                                                        <h1 className="text-2xl font-semibold flex items-center">
                                                                                            {selectedArmor.name}
                                                                                            <h1 className='lightlevel ml-2' style={{ color: "#E5D163", textShadow: "0px 3px 3px rgba(37, 37, 37, 0.4)" }}>
                                                                                                <i className="icon-light mr-1" style={{ fontStyle: 'normal', fontSize: '1.1rem', position: 'relative', top: '-0.40rem' }} />{selectedArmor.power}
                                                                                            </h1>
                                                                                        </h1>
                                                                                    </div>
                                                                                    <div className="flex space-x-2 p-4 justify-center rounded-b-lg" style={{ backgroundColor: selectedArmor.bgColor.rgba }}>
                                                                                        {selectedArmor.perks?.cosmeticPerks?.map((perk) => (
                                                                                            perk.name && perk?.iconPath && (
                                                                                                <img src={`/api${perk.iconPath}`} className={"w-[40px] h-[40px]"} alt={perk.name} title={perk.name} />
                                                                                            )
                                                                                        ))}
                                                                                    </div>
                                                                                </div>
                                                                            </div>}
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
                                            exit={{ x: "100%", opacity: 0 }}
                                            transition={{ duration: 0.5 }}
                                            className="absolute w-full justify-center flex"
                                        >
                                            <div className=" items-center justify-self-center w-2/3 grid grid-cols-2 gap-10">
                                                <fieldset className="flex flex-col border-2 rounded-lg w-fit z-0 text-start items-center justify-center h-[170px] w-full">
                                                    <legend className="text-white text-sm mb-2 z-10 font-semibold px-2">COLIBRÍ / NAVE</legend>
                                                    <div className="flex justify-center mx-6 space-x-6">
                                                        {[9, 10].map((index) => (
                                                            <div key={index} className="flex mb-4 space-x-2">
                                                                <div className={`relative`}>
                                                                    <img src={`/api${items[index].icon}`} className="w-[50px] h-[50px]" alt={items[index].name} title={items[index].name} />
                                                                    {items[index].watermark && (
                                                                        <img
                                                                            src={`/api${items[index].watermark}`}
                                                                            className="absolute bottom-0 right-0 w-[50px] h-[50px] z-40 pointer-events-none"
                                                                        />
                                                                    )}
                                                                </div>
                                                                <div className="flex justify-center items-center space-x-1">
                                                                    {items[index].perks?.map((perk) => (
                                                                        perk.iconPath && (
                                                                            <div className="relative">
                                                                                <img src={`/api${perk.iconPath}`} width={40} height={40} alt={perk.name} title={perk.name} />
                                                                                {perk.watermark && (
                                                                                    <img src={`/api${perk.watermark}`} className="absolute bottom-0 right-0 w-[40px] h-[40px] z-50 pointer-events-none" />
                                                                                )}
                                                                            </div>
                                                                        )
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </fieldset>
                                                <fieldset className="flex flex-col border-2 px-4 rounded-lg w-fit z-0 text-start items-center justify-center h-[170px] w-full">
                                                    <legend className="text-white text-sm mb-2 z-10 font-semibold px-2">SELLO / TÍTULO</legend>
                                                    <div className="justify-center items-center flex w-full">
                                                        {seal && (
                                                            <div className="flex flex-col justify-center items-center mb-4 w-4/5">
                                                                <img src={`/api${seal.iconPath}`} className="w-[70px] h-[70px]" />
                                                                <div
                                                                    className="flex mt-2 items-center justify-center py-1 w-full border-white/25 border-y-[0.1px] relative"
                                                                    style={{ background: "linear-gradient(to right, rgba(237, 178, 94, 0) 0%, rgba(174, 114, 47, 0.5) 25%, rgba(174, 114, 47, 0.5) 75%, rgba(237, 178, 94, 0) 100%)" }}
                                                                >
                                                                    <p className="tracking-[0.2em] text-xs uppercase titulo">{seal.name}</p>
                                                                    {seal.timesGilded && seal.timesGilded > 0 && (
                                                                        <div className="flex items-center ml-1">
                                                                            <i className="icon-gilded font-[100]" style={{ fontStyle: 'normal', fontSize: '0.8rem' }} />
                                                                            <p style={{ fontStyle: 'normal', fontSize: '0.6rem', position: 'relative', top: '-0.30rem' }}>{seal.timesGilded}</p>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                </fieldset>
                                                <fieldset className="flex flex-col border-2 px-4 rounded-lg w-fit z-0 text-start items-center justify-center h-[170px] w-full">
                                                    <legend className="text-white text-sm mb-2 z-10 font-semibold px-2">GESTOS</legend>
                                                    <div className="flex space-x-8 justify-center mx-6">
                                                        {items[15].perks?.map((perk) => (
                                                            <div className="flex mb-4 ">
                                                                {perk.iconPath && (
                                                                    <div className="relative">
                                                                        <img src={`/api${perk.iconPath}`} className="w-[50px] h-[50px]" alt={perk.name} title={perk.name} />
                                                                        {perk.watermark && (
                                                                            <img src={`/api${perk.watermark}`} className="absolute bottom-0 right-0 w-[50px] h-[50px] z-40 pointer-events-none" />
                                                                        )}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        ))}
                                                    </div>
                                                </fieldset>
                                                <fieldset className="flex flex-col border-2 px-4 rounded-lg w-fit z-0 text-start items-center justify-center h-[170px] w-full">
                                                    <legend className="text-white text-sm mb-2 z-10 font-semibold px-2">EMBLEMAS</legend>
                                                    <div className="flex space-x-10 justify-evenly mx-4 pb-3">
                                                        {emblems.map((emblem) => (
                                                            <div className="flex flex-col mb-5 justify-center items-center">
                                                                <h1 className="font-semibold text-sm mb-1">{emblem.class}</h1>
                                                                {emblem.iconPath && (
                                                                    <div className={`relative ${emblem.name === items[13]?.name ? "shadow-[0_0_6px_4px_rgba(255,215,0,0.8)] w-[50px] h-[50px]" : ""}`}>
                                                                        <img src={`/api${emblem.iconPath}`} className="w-[50px] h-[50px]" alt={emblem.name} title={emblem.name} />
                                                                    </div>
                                                                )}
                                                            </div>
                                                        ))}
                                                    </div>
                                                </fieldset>
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                                <div className="justify-center flex flex-col items-center mt-[540px]">
                                    <p className="font-semibold text-lg">ESTADÍSTICAS TOTALES</p>
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
            </div >
        )
    );
}