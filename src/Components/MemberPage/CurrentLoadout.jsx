import axios from "axios";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";
import inventory from "../../assets/inventory.png";
import masterworkHeader from "../../assets/masterworkHeader.png";
import "../../index.css";

export default function CurrentLoadout({ membershipType, userId, name, seasonHash, rank, light }) {
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
    const [emblemElements, setEmblemElements] = useState(null);
    const [season, setSeason] = useState(null);
    const [Passlevel, setPassLevel] = useState(null);
    const [triumphRecord, setTriumphRecord] = useState(null);
    useEffect(() => {
        const fetchCurrentLoadout = async () => {
            try {
                const responseChar = await axios.get(`/api/Platform/Destiny2/${membershipType}/Profile/${userId}/?components=Characters,102,104,202,900,1100&lc=es`, {
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
                const classType = mostRecentCharacter.classType;

                const response = await axios.get(`/api/Platform/Destiny2/${membershipType}/Profile/${userId}/Character/${charID}/?components=205,202,201`, {
                    headers: {
                        'X-API-Key': 'f83a251bf2274914ab739f4781b5e710',
                    },
                });

                let totalStats = [144602215, 392767087, 1735777505, 1943323491, 2996146975, 4244567218];
                await getTotalStats(totalStats);
                await getOtherEmblems(characters, mostRecentCharacter);
                await getSeal(mostRecentCharacter);
                await getEmblemElements(mostRecentCharacter.emblemHash);
                const seasonProgress = await getCurrentSeason(seasonHash);

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
                                if (perkResponse.data.Response.hash == 2272984671 || perkResponse.data.Response.hash == 1727069360) { //Si es un fragmento de clase
                                    switch (classType) {
                                        case 0: //Titan resto resistencia
                                            totalStats[1].value -= Math.abs(perkResponse.data.Response.investmentStats[3].value);
                                            break;
                                        case 1: //Cazador resto movilidad
                                            totalStats[4].value -= Math.abs(perkResponse.data.Response.investmentStats[2].value);
                                            break;
                                        case 2: //Hechicero resto recuperacion
                                            totalStats[3].value -= Math.abs(perkResponse.data.Response.investmentStats[1].value);
                                            break;
                                    }
                                }
                                else for (const stat of Object.values(perkResponse.data.Response.investmentStats).slice(1)) {
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
                                isEnhanced: perkResponse.data.Response.itemTypeDisplayName,
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

                    let tracker, dmgType, ammo, bgColor, bgMasterwork, champmod, weaponLevel;
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
                        weaponLevel = getWeaponLevel(itemD.data.Response.plugObjectives.data.objectivesPerPlug)
                    }

                    //if (response.data.Response.equipment.data.items.indexOf(item) == 16) console.log(itemResponse.data.Response);

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
                        weaponLevel: weaponLevel,
                    };
                }));

                setPassLevel(responseChar.data.Response.metrics.data.metrics[seasonProgress]?.objectiveProgress?.progress);
                setTriumphRecord(responseChar.data.Response.profileRecords.data.activeScore.toLocaleString('en-US'));
                setItems(itemDetails);
                console.log(itemDetails)
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
        setPopupPosition({ top: rect.top - rect.height * 2.6, left: rect.right - rect.width * 5.1 }); // Posición a la derecha de la imagen
        setSelectedWeapon(weapon);
    };
    const closeWeaponDetails = () => {
        setSelectedWeapon(null);
    };

    const handleArmorClick = (armor, event) => {
        const rect = event.target.getBoundingClientRect();
        setPopupPosition({ top: rect.top - rect.height * 2.6, left: rect.right - rect.width * 11 }); // Posición a la izquierda de la imagen
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
            "scopes",
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

        const excludedModifiers = [
            "plugs.weapons.masterworks",
            "intrinsics",
            "plugs.weapons.masterworks.stats",
            "mementos",
            "shader",
            "skins",
            "v400.plugs.weapons.masterworks.trackers",
            "crafting.plugs",
            "crafting.recipes",
            "repackage",
            "weapon.damage_type.energy",
            "plugs.masterworks"
        ]

        const archetype = [
            "intrinsics",
            "plugs.weapons.masterworks.stats",
        ];

        const design = [
            "mementos",
            "crafting.recipes",
            "shader",
            "skins",
        ];

        const tracker = [
            "plugs.weapons.masterworks.trackers",
        ];

        let modifierPerks = perks.filter(perk =>
            perk && excludedModifiers.every(mod => !perk.perkType?.includes(mod))
        );

        // Mover los perks de tipo "v400.weapon.mod_" al final
        modifierPerks = modifierPerks.sort((a, b) => {
            const isAWeaponMod = a.perkType?.includes("v400.weapon.mod_") ? 1 : 0;
            const isBWeaponMod = b.perkType?.includes("v400.weapon.mod_") ? 1 : 0;
            return isAWeaponMod - isBWeaponMod;
        });

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

    async function getOtherEmblems(characters, mostRecentCharacter) {
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

            let actual;
            if (mostRecentCharacter.classType === char.classType ? actual = true : actual = false);

            return {
                name: emblem.data.Response.displayProperties.name,
                iconPath: emblem.data.Response.displayProperties.icon,
                hash: emblem.data.Response.hash,
                class: classe,
                currentClass: actual,
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

        const manifest = await axios.get('/api/Platform/Destiny2/Manifest/', {
            headers: {
                'X-API-Key': 'f83a251bf2274914ab739f4781b5e710',
            },
        });
        const manifestUrl = manifest.data.Response.jsonWorldComponentContentPaths.es.DestinyPresentationNodeDefinition;
        const metricsData = await axios.get(`/api${manifestUrl}`);

        // Buscar el parentNodeHash que coincida con el hash del título
        const matchingNode = Object.values(metricsData.data).find(node => node.completionRecordHash === char.titleRecordHash);

        setSeal({
            name: sealResponse.data.Response.titleInfo.titlesByGender[char.genderType == 0 ? "Male" : "Female"] || sealResponse.data.Response.displayProperties.name,
            iconPath: sealResponse.data.Response.displayProperties.icon,
            sealHash: matchingNode.hash,
            timesGilded: allseals.data.Response.profileRecords.data.records[sealResponse.data.Response.titleInfo?.gildingTrackingRecordHash]?.completedCount
        });
    }

    function getWeaponLevel(objectivesPerPlug) {
        for (const objective of Object.values(objectivesPerPlug)) {
            const subObjective = objective.find(sub => sub.objectiveHash === 3077315735);
            if (subObjective) {
                return subObjective.progress;
            }
        }
        return null;
    }

    async function getEmblemElements(emblemHash) {
        const emblemResponse = await axios.get(`/api/Platform/Destiny2/Manifest/DestinyInventoryItemDefinition/${emblemHash}/?lc=es`, {
            headers: {
                'X-API-Key': 'f83a251bf2274914ab739f4781b5e710',
            }
        })
        setEmblemElements({
            icon: emblemResponse.data.Response.secondaryOverlay,
            bg: emblemResponse.data.Response.secondarySpecial,
        });
    }

    async function getCurrentSeason(seasonHash) {
        const seasonResponse = await axios.get(`/api/Platform/Destiny2/Manifest/DestinySeasonDefinition/${seasonHash}/?lc=es`, {
            headers: {
                'X-API-Key': 'f83a251bf2274914ab739f4781b5e710',
            }
        })
        const manifest = await axios.get('/api/Platform/Destiny2/Manifest/', {
            headers: {
                'X-API-Key': 'f83a251bf2274914ab739f4781b5e710',
            },
        });
        const manifestUrl = manifest.data.Response.jsonWorldComponentContentPaths.es.DestinyMetricDefinition;
        const metricsData = await axios.get(`/api${manifestUrl}`);

        // Buscar la métrica que coincida con el nombre de la temporada
        const matchingMetric = Object.values(metricsData.data).find(metric =>
            metric.displayProperties.name.toLowerCase().includes(seasonResponse.data.Response.displayProperties.name.toLowerCase())
        );
        setSeason(seasonResponse.data.Response.seasonNumber);
        return matchingMetric.hash;
    }

    useEffect(() => {
        if (isVisible) {
            const handleKeyDown = (event) => {
                if (event.key === "ArrowLeft" || event.key === "a") {
                    setActiveTab((prevTab) => (prevTab === "Cosmeticos" ? "Equipamiento" : prevTab));
                } else if (event.key === "ArrowRight" || event.key === "d") {
                    setActiveTab((prevTab) => (prevTab === "Equipamiento" ? "Cosmeticos" : prevTab));
                }
            };

            window.addEventListener("keydown", handleKeyDown);

            // Cleanup: eliminar el evento cuando isVisible cambie o el componente se desmonte
            return () => {
                window.removeEventListener("keydown", handleKeyDown);
            };
        }
    }, [isVisible]);

    useEffect(() => {
        const handleKeyDown = (event) => {
            if (event.key === "Escape") {
                setShowPopup(false);
            }
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => {
            window.removeEventListener("keydown", handleKeyDown);
        };
    }, []);

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
                <div className="flex">
                    <a onClick={() => setShowPopup(true)} className="cristal transform transition-transform duration-200 hover:scale-105">
                        <span></span>
                        <span></span>
                        <span></span>
                        <span></span>
                        Ver Más</a>
                </div>
                {isVisible && (
                    <div className="fixed inset-0 flex items-center justify-center w-full z-50 bg-black/50" onClick={() => setShowPopup(false)}>
                        <div className={`rounded-lg relative bg-neutral-600 text-white overflow-hidden transition-all duration-200 transform ${animatePopup ? "opacity-100 scale-100" : "opacity-0 scale-90"}`} style={{ width: '65.28%', height: '77.25%', backgroundImage: `url(${inventory})`, backgroundSize: "cover", backgroundPosition: "center" }} onClick={(e) => e.stopPropagation()}>
                            <div className="flex flex-col items-center justify-center h-full">
                                <div className="flex justify-between items-center w-full " style={{ height: "11%", backgroundImage: `url(/api${emblemElements.bg})`, backgroundRepeat: "no-repeat", backgroundSize: 'cover', backgroundPosition: "bottom" }}>
                                    <div className="flex ml-12" style={{ transform: "translateY(20%)" }}>
                                        <img src={`/api${emblemElements.icon}`} style={{ width: "17%" }} />
                                        <div className="flex flex-col items-top ml-4 mt-0.5">
                                            <div style={{ width: "2%", height: "2px", backgroundColor: "white", margin: "0" }} />
                                            <h2 className="text-2xl font-bold tracking-[0.11em]">{name}</h2>
                                            <div className="flex flex-row items-center space-x-2.5 opacity-[0.8] tracking-widest titulo">
                                                <p className="flex flex-row mt-0.5">
                                                    <span>Temporada</span>
                                                    <span className="ml-1">{season}</span>
                                                </p>
                                                <p><i className="icon-pass mr-1" style={{ fontStyle: 'normal', fontSize: '1.1rem' }} /> {Passlevel} </p>
                                                <p><i className="icon-rank mr-1" style={{ fontStyle: 'normal', fontSize: '1.1rem' }} />{rank}</p>
                                                <h1 className='lightlevel'>
                                                    <i className="icon-light mr-1" style={{ fontStyle: 'normal', fontSize: '1.1rem', top: '-0.20rem', position: 'relative' }} />{light}
                                                </h1>
                                                <p><i className="icon-triumph mr-1" style={{ fontStyle: 'normal', fontSize: '1.1rem' }} />{triumphRecord} </p>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center space-x-4 mr-12">
                                        <button onClick={() => setActiveTab("Equipamiento")} style={{ textShadow: "0px 1px 2px rgba(0, 0, 0, 0.5)" }} className="mt-0.5">
                                            <svg xmlns="http://www.w3.org/2000/svg" version="1.1" viewBox="300 -200 700 1200" width="22" height="22" className="cursor-pointer">
                                                <g transform="matrix(1 0 0 -1 0 680)">
                                                    <path fill="black" opacity="0.3" d="M292 -89h616c97 0 182 108 182 188v586c0 93 -93 186 -187 186h-607c-93 0 -186 -93 -186 -186v-586c0 -93 92 -188 182 -188z" />
                                                    <path fill="white" d="M312 -69h576c77 0 162 88 162 168v566c0 83 -83 166 -167 166h-567c-83 0 -166 -83 -166 -166v-566c0 -83 82 -168 162 -168zM894 -119h-588c-101 0 -206 105 -206 206v588c0 101 105 206 206 206h588c101 0 206 -105 206 -206v-588c0 -101 -105 -206 -206 -206zM400 382 l305 -305l51 52l-253 253l253 254l-51 51z" />
                                                </g>
                                            </svg>
                                        </button>
                                        <div className="relative flex space-x-4 items-center">
                                            <button onClick={() => setActiveTab("Equipamiento")} style={{ textShadow: "0px 1px 2px rgba(0, 0, 0, 0.5)" }} className={`titulo text-[0.92rem] cursor-pointer tracking-widest p-2 py-1 uppercase ${activeTab === "Equipamiento" ? "opacity-[.90]" : "opacity-[.70]"}`}>Equipamiento</button>
                                            <button onClick={() => setActiveTab("Cosmeticos")} style={{ textShadow: "0px 1px 2px rgba(0, 0, 0, 0.5)" }} className={`titulo text-[0.92rem] cursor-pointer tracking-widest p-2 py-1 uppercase ${activeTab === "Cosmeticos" ? " opacity-[.90]" : "opacity-[.70]"}`}>Cosméticos</button>
                                            <motion.div className="absolute top-13 h-[2px] bg-white left-0.5" layout initial={false}
                                                animate={{
                                                    x: activeTab === "Equipamiento" ? 0 : 154,
                                                    width: 140,
                                                }}
                                                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                                            />
                                        </div>
                                        <button onClick={() => setActiveTab("Cosmeticos")} style={{ textShadow: "0px 1px 2px rgba(0, 0, 0, 0.5)" }}>
                                            <svg xmlns="http://www.w3.org/2000/svg" version="1.1" viewBox="300 -200 700 1200" width="22" height="22" className="cursor-pointer" >
                                                <g transform="matrix(1 0 0 -1 0 680)">
                                                    <path fill="black" opacity="0.3" d="M292 -89h616c97 0 182 108 182 188v586c0 93 -93 186 -187 186h-607c-93 0 -186 -93 -186 -186v-586c0 -93 92 -188 182 -188z" />
                                                    <path fill="white" d="M312 -69h576c77 0 162 88 162 168v566c0 83 -83 166 -167 166h-567c-83 0 -166 -83 -166 -166v-566c0 -83 82 -168 162 -168zM894 -119h-588c-101 0 -206 105 -206 206v588c0 101 105 206 206 206h588c101 0 206 -105 206 -206v-588c0 -101 -105 -206 -206 -206zM808 382 l-305 -305l-51 52l253 253l-253 254l51 51z" />
                                                </g>
                                            </svg>
                                        </button>
                                    </div>
                                </div>
                                <AnimatePresence mode="wait">
                                    {activeTab === "Equipamiento" && (
                                        <motion.div
                                            key="Equipamiento"
                                            initial={{ x: "-100%", opacity: 0 }}
                                            animate={{ x: 0, opacity: 1 }}
                                            exit={{ x: "-100%", opacity: 0 }}
                                            transition={{ duration: 0.5 }}
                                            className="w-full justify-center flex items-top mt-4"
                                            style={{ height: "100%" }}
                                        >
                                            <div className="flex flex-col space-y-4 justify-center w-full">
                                                {items[11] && (
                                                    <div className={`flex relative w-full justify-center`}>
                                                        <div className="flex flex-col items-end" style={{ width: "26%" }}>
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
                                                        <img src={`/api${items[11].icon}`} style={{ width: "7%" }} alt={items[11].name} className="rounded-lg" />
                                                        <div className="flex flex-col right-0 mt-1" style={{ width: "26%" }}>
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
                                                <div className="flex justify-center w-full" style={{ height: "65%" }}>
                                                    <div className="flex flex-col justify-between mr-4" style={{ width: "40%" }}>
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
                                                                                            !perk.perkType?.includes("v400.weapon.mod_") ?
                                                                                                (<div key={perk.perkHash} title={perk.name}>
                                                                                                    <svg viewBox="0 0 100 100" width="40" height="40" >
                                                                                                        <defs>
                                                                                                            <linearGradient id="mw" x1="0" x2="0" y1="0" y2="1">
                                                                                                                <stop stop-color="#eade8b" offset="50%" stop-opacity="0"></stop>
                                                                                                                <stop stop-color="#eade8b" offset="100%" stop-opacity="1"></stop>
                                                                                                            </linearGradient>
                                                                                                        </defs>
                                                                                                        <mask id="mask">
                                                                                                            <rect x="0" y="0" width="100" height="100" fill="black"></rect>
                                                                                                            <circle cx="50" cy="50" r="46" fill="white"></circle>
                                                                                                        </mask>
                                                                                                        <circle cx="50" cy="50" r="48" style={{ fill: "#4887ba" }}></circle>
                                                                                                        {perk.isEnhanced == "Rasgo mejorado" && (
                                                                                                            <>
                                                                                                                <rect x="0" y="0" width="100" height="100" fill="url(#mw)" mask="url(#mask)"></rect>
                                                                                                                <rect x="5" y="0" width="6" height="100" fill="#eade8b" mask="url(#mask)"></rect>
                                                                                                                <path d="M5,50 l0,-24 l-6,0 l9,-16 l9,16 l-6,0 l0,24 z" fill="#eade8b"></path>
                                                                                                            </>
                                                                                                        )}
                                                                                                        <image href={"/api" + perk.iconPath} x="10" y="10" width="80" height="80" mask="url(#mask)"></image>
                                                                                                        <circle cx="50" cy="50" r="46" stroke="white" fill="transparent" stroke-width="2" class="od45Ah47"></circle>
                                                                                                    </svg>
                                                                                                </div>) : (
                                                                                                    <img src={`/api${perk.iconPath}`} className={"w-[40px] h-[40px]"} alt={perk.name} title={perk.name} />
                                                                                                )
                                                                                        )
                                                                                    ))}
                                                                                </div>
                                                                                {selectedWeapon &&
                                                                                    <div className="fixed inset-0 flex items-center justify-center w-full z-50" onClick={() => closeWeaponDetails()} >
                                                                                        <div
                                                                                            className={`text-white relative`}
                                                                                            style={{ top: `${popupPosition.top}px`, left: `${popupPosition.left}px`, position: "absolute", width: "34%" }}
                                                                                            onClick={(e) => e.stopPropagation()}
                                                                                        >
                                                                                            <div style={{ backgroundColor: selectedWeapon.bgColor.rgb, backgroundImage: `url(${selectedWeapon.mwHeader})`, backgroundPositionX: "top", backgroundSize: "contain", backgroundRepeat: "no-repeat" }} className="p-2 px-4 rounded-t-lg">
                                                                                                <div className="text-2xl font-semibold flex items-center">
                                                                                                    <a href={`https://www.light.gg/db/items/${selectedWeapon.itemHash}`} target="_blank" rel="noopener noreferrer" className="hover:text-neutral-300" >{selectedWeapon.name}</a>
                                                                                                    <h1 className='lightlevel ml-2' style={{ color: "#E5D163", textShadow: "0px 3px 3px rgba(37, 37, 37, 0.4)" }}>
                                                                                                        <i className="icon-light mr-1" style={{ fontStyle: 'normal', fontSize: '1.1rem', position: 'relative', top: '-0.40rem' }} />{selectedWeapon.power}
                                                                                                    </h1>
                                                                                                </div>
                                                                                                <div className="flex items-center justify-between">
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
                                                                                                    {selectedWeapon.weaponLevel && <div className="text-sm mt-[3px] flex items-center">Nv. {selectedWeapon.weaponLevel}</div>}
                                                                                                </div>
                                                                                            </div>
                                                                                            <div className="flex space-x-3 p-2 rounded-b-lg" style={{ backgroundColor: selectedWeapon.bgColor.rgba }} >
                                                                                                <div className="space-y-1 flex flex-col justify-top space-y-3 items-center " style={{ width: "33%" }}>
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
                                                                                                <div className="space-y-1 justify-top flex flex-col justify-top space-y-3 items-center" style={{ width: "33%" }}>
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
                                                                                                <div className="space-y-1 justify-top flex flex-col justify-top space-y-3 items-center" style={{ width: "33%" }}>
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
                                                    <div className="flex flex-col justify-between ml-4" style={{ width: "40%" }}>
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
                                                                                    className="text-white relative"
                                                                                    style={{ top: `${popupPosition.top}px`, left: `${popupPosition.left}px`, position: "absolute", width: "24%" }}
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
                                                <div className="justify-center flex flex-col items-center">
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
                                        </motion.div>
                                    )}
                                    {activeTab === "Cosmeticos" && (
                                        <motion.div
                                            key="Cosmeticos"
                                            initial={{ x: "100%", opacity: 0 }}
                                            animate={{ x: 0, opacity: 1 }}
                                            exit={{ x: "100%", opacity: 0 }}
                                            transition={{ duration: 0.5 }}
                                            className="w-full justify-center flex items-center"
                                            style={{ height: "100%" }}
                                        >
                                            <div className=" items-center justify-self-center w-2/3 grid grid-cols-2 gap-10">
                                                <fieldset className="flex flex-col border-2 rounded-lg w-fit z-0 text-start items-center justify-center w-full py-2 h-full">
                                                    <legend className="text-white text-sm mb-2 z-10 font-semibold px-2 ml-2">COLIBRÍ / NAVE</legend>
                                                    <div className="flex flex-wrap justify-center mx-6 space-x-6">
                                                        {[9, 10].map((index) => (
                                                            <div key={index} className="flex mb-4 space-x-4 mr-0">
                                                                <div className={`relative`}>
                                                                    <a href={`https://www.light.gg/db/items/${items[index].itemHash}`} target="_blank" rel="noopener noreferrer" className="hover:text-neutral-300">
                                                                        <img src={`/api${items[index].icon}`} className="w-[50px] h-[50px]" alt={items[index].name} title={items[index].name} />
                                                                    </a>
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
                                                                                {perk.perkType?.includes("vehicles.mod") ?
                                                                                    (<div key={perk.perkHash} title={perk.name}>
                                                                                        <svg viewBox="0 0 100 100" width="40" height="40" >
                                                                                            <defs>
                                                                                                <linearGradient id="mw" x1="0" x2="0" y1="0" y2="1">
                                                                                                    <stop stop-color="#eade8b" offset="50%" stop-opacity="0"></stop>
                                                                                                    <stop stop-color="#eade8b" offset="100%" stop-opacity="1"></stop>
                                                                                                </linearGradient>
                                                                                            </defs>
                                                                                            <mask id="mask">
                                                                                                <rect x="0" y="0" width="100" height="100" fill="black"></rect>
                                                                                                <circle cx="50" cy="50" r="46" fill="white"></circle>
                                                                                            </mask>
                                                                                            <circle cx="50" cy="50" r="48" style={{ fill: "#4887ba" }}></circle>
                                                                                            {perk.isEnhanced == "Rasgo mejorado" && (
                                                                                                <>
                                                                                                    <rect x="0" y="0" width="100" height="100" fill="url(#mw)" mask="url(#mask)"></rect>
                                                                                                    <rect x="5" y="0" width="6" height="100" fill="#eade8b" mask="url(#mask)"></rect>
                                                                                                    <path d="M5,50 l0,-24 l-6,0 l9,-16 l9,16 l-6,0 l0,24 z" fill="#eade8b"></path>
                                                                                                </>
                                                                                            )}
                                                                                            <image href={"/api" + perk.iconPath} x="10" y="10" width="80" height="80" mask="url(#mask)"></image>
                                                                                            <circle cx="50" cy="50" r="46" stroke="white" fill="transparent" stroke-width="2" class="od45Ah47"></circle>
                                                                                        </svg>
                                                                                    </div>) : (
                                                                                        <img src={`/api${perk.iconPath}`} className={"w-[40px] h-[40px]"} alt={perk.name} title={perk.name} />
                                                                                    )}
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
                                                <fieldset className="flex flex-col border-2 px-4 rounded-lg w-fit z-0 text-start items-center justify-center w-full py-2 h-full">
                                                    <legend className="text-white text-sm mb-2 z-10 font-semibold px-2">SELLO / TÍTULO</legend>
                                                    <div className="justify-center items-center flex w-full">
                                                        {seal && (
                                                            <div className="flex flex-col justify-center items-center mb-4 w-4/5 cursor-pointer" onClick={() => window.open(`https://bray.tech/triumphs/seal/${seal.sealHash}`, '_blank')}>
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
                                                <fieldset className="flex flex-col border-2 px-4 rounded-lg w-fit z-0 text-start items-center justify-center h-full w-full">
                                                    <legend className="text-white text-sm mb-2 z-10 font-semibold px-2">GESTOS</legend>
                                                    <div className="flex space-x-8 justify-center mx-6">
                                                        {items[15].perks?.map((perk) => (
                                                            <div className="flex mb-4 ">
                                                                {perk.iconPath && (
                                                                    <div className="relative">
                                                                        <a href={`https://www.light.gg/db/items/${perk.plugHash}`} target="_blank" rel="noopener noreferrer" className="hover:text-neutral-300">
                                                                            <img src={`/api${perk.iconPath}`} className="w-[50px] h-[50px]" alt={perk.name} title={perk.name} />
                                                                        </a>
                                                                        {perk.watermark && (
                                                                            <img src={`/api${perk.watermark}`} className="absolute bottom-0 right-0 w-[50px] h-[50px] z-40 pointer-events-none" />
                                                                        )}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        ))}
                                                    </div>
                                                </fieldset>
                                                <fieldset className="flex flex-col border-2 px-4 rounded-lg w-fit z-0 text-start items-center justify-center py-4.5 h-full w-full">
                                                    <legend className="text-white text-sm mb-2 z-10 font-semibold px-2">EMBLEMAS</legend>
                                                    <div className="flex space-x-10 justify-evenly mx-4 pb-3">
                                                        {emblems.map((emblem) => (
                                                            <div className="flex flex-col mb-5 justify-center items-center">
                                                                <h1 className="font-semibold text-sm mb-1">{emblem.class}</h1>
                                                                {emblem.iconPath && (
                                                                    <div className={`relative ${emblem.currentClass === true ? "shadow-[0_0_6px_4px_rgba(255,215,0,0.8)] w-[50px] h-[50px]" : ""}`}>
                                                                        <a href={`https://destinyemblemcollector.com/emblem?id=${emblem.hash}`} target="_blank" rel="noopener noreferrer">
                                                                            <img src={`/api${emblem.iconPath}`} className="w-[50px] h-[50px]" alt={emblem.name} title={emblem.name} />
                                                                        </a>
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
                            </div>
                        </div>
                        <button className="bg-neutral-700 text-white rounded-full w-7 h-7 flex items-center self-start justify-center hover:bg-neutral-800 cursor-pointer" style={{ marginTop: "4%" }} onClick={(e) => { e.stopPropagation(); setShowPopup(false); }}>✕</button>
                    </div>
                )}
            </div >
        )
    );
}