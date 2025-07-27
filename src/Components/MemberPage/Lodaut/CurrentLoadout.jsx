import axios from "axios";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";
import emptyMod from "../../../assets/emptyMod.png";
import masterworkBlue from "../../../assets/masterworkBlueHeader.png";
import masterworkHeader from "../../../assets/masterworkHeader.png";
import bgArc from "../../../assets/subClassBg/subclass-arc.png";
import bgKinetic from "../../../assets/subClassBg/subclass-kinetic.png";
import bgSolar from "../../../assets/subClassBg/subclass-solar.png";
import bgStasis from "../../../assets/subClassBg/subclass-stasis.png";
import bgStrand from "../../../assets/subClassBg/subclass-strand.png";
import bgVoid from "../../../assets/subClassBg/subclass-void.png";
import { API_CONFIG } from "../../../config";
import "../../../index.css";
import { useBungieAPI } from "../../APIservices/BungieAPIcache";
import Spinner from "../../Spinner";
import frasesES from "../frases/frasesArtefactoES";
import CaruselArtefacto from "./CaruselArtefacto";
import RecoilStat from "./RecoliStat";
import StatPopup from './StatPopup';


export default function CurrentLoadout({ membershipType, userId, name, seasonHash, rank, light, charStats }) {
    const [items, setItems] = useState([]);
    const [totalStats, setTotalStats] = useState([]);
    const [isVisible, setIsVisible] = useState(false);
    const [activeTab, setActiveTab] = useState("Equipamiento");
    const [selectedWeapon, setSelectedWeapon] = useState(null);
    const [showArtifact, setShowArtifact] = useState(false);
    const [showGhost, setShowGhost] = useState(false);
    const [selectedArmor, setSelectedArmor] = useState(null);
    const [popupPosition, setPopupPosition] = useState({ top: 0, left: 0 });
    const [emblems, setEmblems] = useState(null);
    const [seal, setSeal] = useState(null);
    const [emblemElements, setEmblemElements] = useState(null);
    const [Passlevel, setPassLevel] = useState(null);
    const [triumphRecord, setTriumphRecord] = useState(null);
    const [artifact, setArtifact] = useState(null);
    const [slidesArtifact, setslidesArtifact] = useState(null);
    const [loading, setLoading] = useState(true);
    const [season, setSeason] = useState(null);
    const [selectedStat, setSelectedStat] = useState(null);
    const [statPopupPosition, setStatPopupPosition] = useState({ top: 0, left: 0 });
    const { getProfileGeneralProgressions, getCharacterSimpleInventoryAndEquipment, getManifest, getItemManifest, getFullItemDetails, getAllSeals, getProfileChars } = useBungieAPI();
    useEffect(() => {
        const fetchCurrentLoadout = async () => {
            setLoading(true);
            try {
                const responseChar = await getProfileGeneralProgressions(membershipType, userId);
                const characters = responseChar.characters.data;

                //0 masculino, 1 femenino
                const mostRecentCharacter = Object.values(characters).reduce((latest, current) => {
                    return new Date(current.dateLastPlayed) > new Date(latest.dateLastPlayed) ? current : latest;
                });

                const charID = mostRecentCharacter.characterId;
                const classType = mostRecentCharacter.classType;

                const response = await getCharacterSimpleInventoryAndEquipment(membershipType, userId, charID);
                const manifest = await getManifest();

                await getOtherEmblems(characters, mostRecentCharacter);
                await getSeal(mostRecentCharacter, manifest);
                await getEmblemElements(mostRecentCharacter.emblemHash);
                getArtifactDetails(responseChar.profileProgression?.data?.seasonalArtifact);
                const seasonRank = await getSeasonProgress(seasonHash);

                const itemDetails = await Promise.all(response.equipment.data.items.map(async (item) => {
                    const itemResponse = await getItemManifest(item.itemHash, "DestinyInventoryItemDefinition");
                    const itemD = await getFullItemDetails(membershipType, userId, item.itemInstanceId);

                    let perks = [];
                    if (response.equipment.data.items.indexOf(item) === 16) { //Artifact
                        const activePerks = response.progressions?.data?.seasonalArtifact.tiers.flatMap(tier =>
                            tier.items.filter(perk => perk.isActive && perk.isVisible)
                        );

                        if (activePerks) {
                            perks = await Promise.all(activePerks.map(async (perk) => {
                                const perkResponse = await getItemManifest(perk.itemHash, "DestinyInventoryItemDefinition");
                                const sanbox = await getItemManifest(perkResponse.perks[0]?.perkHash, "DestinySandboxPerkDefinition");
                                return {
                                    ...perk,
                                    name: perkResponse.displayProperties.name,
                                    iconPath: API_CONFIG.BUNGIE_API + perkResponse.displayProperties.icon,
                                    desc: sanbox.displayProperties.description,
                                };
                            })) || [];

                            if (perks.length < 12) {
                                const perksToAdd = 12 - perks.length;
                                for (let i = 0; i < perksToAdd; i++) {
                                    perks.push({
                                        name: "Ranura de artefacto vacía",
                                        iconPath: emptyMod,
                                        desc: "",
                                    });
                                }
                            }
                            setslidesArtifact(perks);
                        }

                    } else if ([11, 15, 14].includes(response.equipment.data.items.indexOf(item))) { //Sublcase, gestos y remates
                        perks = await Promise.all(itemD.sockets.data?.sockets?.map(async (perk) => {
                            const perkResponse = await getItemManifest(perk.plugHash, "DestinyInventoryItemDefinition");
                            if (perkResponse.displayProperties?.description == "") {
                                const sandboxHash = perkResponse.perks[0]?.perkHash;
                                if (sandboxHash) {
                                    const perkResponse2 = await getItemManifest(sandboxHash, "DestinySandboxPerkDefinition");
                                    perkResponse.displayProperties.description = perkResponse2.displayProperties.description;
                                }
                            }
                            let fragmentsStats;

                            if (perkResponse.investmentStats.length >= 2) fragmentsStats = await getFragemtsStats(perkResponse.investmentStats, perkResponse.hash, classType);

                            return {
                                ...perk,
                                name: perkResponse.displayProperties.name,
                                iconPath: perkResponse.displayProperties.icon,
                                watermark: perkResponse.iconWatermark || null,
                                desc: perkResponse.displayProperties?.description || perkResponse.flavorText,
                                gameplayImg: perkResponse.displayProperties?.highResIcon || perkResponse.secondaryIcon,
                                type: perkResponse.itemTypeDisplayName,
                                fragmentsStats: fragmentsStats,
                            };
                        }
                        ) || []);
                    } else { //Resto de items
                        perks = await Promise.all(itemD.sockets.data?.sockets?.map(async (perk) => {
                            if (!perk.plugHash) return null;
                            const perkResponse = await getItemManifest(perk.plugHash, "DestinyInventoryItemDefinition");

                            return {
                                ...perk,
                                name: perkResponse.displayProperties.name,
                                desc: perkResponse.displayProperties.description || await getDescription(perkResponse.perks[0]?.perkHash),
                                iconPath: perkResponse.displayProperties.icon,
                                perkHash: perkResponse.perks[0]?.perkHash,
                                perkType: perkResponse.plug.plugCategoryIdentifier,
                                isEnhanced: perkResponse.itemTypeDisplayName,
                                investmentStats: perkResponse.investmentStats,
                            };
                        }) || []);
                    }

                    if (response.equipment.data.items.indexOf(item) === 11) {
                        const perkAtIndex2 = perks.splice(2, 1)[0];
                        perks.unshift(perkAtIndex2);
                        if (perks.some(perk => perk.name === "Trascendencia")) { //Si es prismatico eliminar granada prismatica y trasendencia
                            const trascendenciaIndex = perks.findIndex(perk => perk.name === "Trascendencia");
                            if (trascendenciaIndex !== -1) {
                                perks.splice(trascendenciaIndex, 2);
                            }
                        }
                    }

                    const statsList = itemD.stats.data?.stats;
                    let armorStats = []; //Stats de armadura
                    if ([3, 4, 5, 6, 7].includes(response.equipment.data.items.indexOf(item))) {
                        let totalStatValue = 0;
                        for (const stat of Object.values(statsList)) {
                            try {
                                const statResponse = await getItemManifest(stat.statHash, "DestinyStatDefinition");
                                armorStats.push({
                                    ...stat,
                                    name: statResponse.displayProperties.name,
                                    iconPath: statResponse.displayProperties.icon,
                                    desc: statResponse.displayProperties.description,
                                    value: stat.value,
                                });
                                totalStatValue += stat.value;
                            } catch (error) {
                                console.error(`Error fetching stat ${stat.statHash}:`, error);
                            }
                        }
                        armorStats.push({
                            statHash: 1,
                            name: "Total",
                            iconPath: null,
                            value: totalStatValue,
                        });
                    }

                    let cosmetic;
                    if (item.overrideStyleItemHash != null) {
                        cosmetic = await getCosmetic(item.overrideStyleItemHash);
                    }
                    let tracker, dmgType, ammo, bgColor, bgMasterwork, champmod, weaponLevel, weaponStats, investmentStats, armorCategory, armorIntrinsic, elementalColor, secondaryBgImg, ghostEnergy;
                    if ([3, 4, 5, 6, 7].includes(response.equipment.data.items.indexOf(item))) {
                        investmentStats = perks.filter(perk => perk != null).map(perk => ({
                            investmentStats: perk.investmentStats,
                            name: perk.name,
                            hash: perk.plugHash,
                            type: perk.perkType,
                        }));
                        armorStats = getArmorStats(itemResponse, investmentStats, armorStats, itemD.instance?.data?.gearTier);
                        const { modifierPerks, designPerks } = sortByArtificePerk(perks);
                        perks = {
                            modifierPerks: modifierPerks,
                            cosmeticPerks: designPerks
                        };
                        bgColor = getRarityColor(itemResponse.inventory.tierType);
                        bgMasterwork = [8, 5, 4, 9].some(value => item.state && item.state === value) ? masterworkHeader : null;
                        armorCategory = getArmorCategory(itemResponse.itemTypeDisplayName, itemResponse.classType);
                        armorIntrinsic = await getArmorIntrinsicDetails(perks.modifierPerks);
                    }
                    else if ([0, 1, 2].includes(response.equipment.data.items.indexOf(item))) {
                        investmentStats = perks.filter(perk => perk != null).map(perk => ({
                            investmentStats: perk.investmentStats,
                            name: perk.name,
                            hash: perk.plugHash,
                        }));
                        weaponStats = await getWeaponStats(itemResponse, investmentStats, getWeaponLevel(itemD.plugObjectives.data.objectivesPerPlug), itemD.stats.data.stats);
                        weaponStats = colorStats(itemResponse, perks.filter(perk => perk != null), weaponStats)
                        const { modifierPerks, cosmeticPerks } = sortWeaponPerks(perks);
                        perks = {
                            modifierPerks: modifierPerks,
                            cosmeticPerks: cosmeticPerks
                        };
                        tracker = getTrackerKills(perks.cosmeticPerks?.tracker[0]?.plugHash, itemD.plugObjectives?.data?.objectivesPerPlug)
                        dmgType = await getdmgType(itemResponse.defaultDamageTypeHash)
                        ammo = await getAmmoType(itemResponse.equippingBlock.ammoType)
                        bgColor = getRarityColor(itemResponse.inventory.tierType);
                        bgMasterwork = [8, 5, 4, 9].some(value => item.state && item.state === value) ? masterworkHeader : null;
                        champmod = await getChampMod(itemResponse, response.progressions?.data?.seasonalArtifact.tiers)
                        weaponLevel = await getWeaponLevelAndProgression(itemD.plugObjectives.data.objectivesPerPlug, itemD.sockets.data.sockets);
                        perks.cosmeticPerks.archetype = await getMwEnchancedWeapons(itemResponse, perks.cosmeticPerks.archetype, manifest);
                        perks.modifierPerks = await getDescriptionPerksWeapons(perks.modifierPerks, itemResponse);
                        perks.cosmeticPerks.archetype = await getDescriptionPerksWeapons(perks.cosmeticPerks.archetype, itemResponse);
                    } else if (response.equipment.data.items.indexOf(item) == 11) {
                        elementalColor = await getElementalColor(itemResponse.talentGrid?.hudDamageType, manifest)
                        secondaryBgImg = getSecondaryBgImg(itemResponse.talentGrid?.hudDamageType);
                    } else if (response.equipment.data.items.indexOf(item) == 16) { //Artifact
                        bgColor = getRarityColor(itemResponse.inventory.tierType);
                        bgMasterwork = showArtifact?.points == 12 ? masterworkBlue : null;
                    } else if (response.equipment.data.items.indexOf(item) == 8) { //Ghost
                        bgColor = getRarityColor(itemResponse.inventory.tierType);
                        bgMasterwork = [8, 5, 4, 9].some(value => item.state && item.state === value) ? masterworkHeader : null;
                        ghostEnergy = getGhostEnergy(item.state, perks);
                    }
                    return {
                        name: itemResponse.displayProperties.name,
                        desc: itemResponse.displayProperties.description || itemResponse.flavorText,
                        icon: cosmetic || itemResponse.displayProperties.icon,
                        rarity: itemResponse.inventory.tierType,
                        rarityName: itemResponse.inventory.tierTypeName,
                        perks: perks,
                        stats: weaponStats != null ? weaponStats : armorStats,
                        masterwork: item.state,
                        watermark: itemResponse.isFeaturedItem ? itemResponse.iconWatermarkFeatured : itemResponse.iconWatermark,
                        power: itemD.instance?.data?.primaryStat?.value,
                        tracker: tracker,
                        itemHash: item.itemHash,
                        weaponType: itemResponse.itemTypeDisplayName,
                        dmgType: dmgType,
                        ammo: ammo,
                        bgColor: bgColor,
                        mwHeader: bgMasterwork,
                        champmod: champmod,
                        craftedenchanced: itemResponse.tooltipNotifications[0]?.displayStyle,
                        weaponLevel: weaponLevel,
                        tier: itemD.instance?.data?.gearTier,
                        armorCategory: armorCategory,
                        armorEnergy: {
                            energyCapacity: itemD.instance?.data?.energy?.energyCapacity,
                            energyUsed: itemD.instance?.data?.energy?.energyUsed || ghostEnergy,
                            energyUnused: itemD.instance?.data?.energy?.energyUnused || 10 - ghostEnergy,
                            energyCapacityUnused: 10 - itemD.instance?.data?.energy?.energyCapacity || 0,
                        },
                        armorIntrinsic: armorIntrinsic,
                        elementalColor: elementalColor,
                        secondaryBgImg: secondaryBgImg,
                    };
                }));
                setPassLevel(response.progressions.data.progressions[seasonRank]?.level || 0);
                setTriumphRecord(responseChar.profileRecords.data?.activeScore?.toLocaleString('en-US'));
                setItems(itemDetails);
                setTotalStats(charStats);

            } catch (error) {
                console.error(error);
            } finally {
                setLoading(false);
            }

        };
        fetchCurrentLoadout();
        const interval = setInterval(() => {
            fetchCurrentLoadout();
        }, 120000);
        return () => clearInterval(interval);

    }, [membershipType, userId]);

    const handleWeaponClick = (weapon, event, index) => {
        const rect = event.target.getBoundingClientRect();
        setPopupPosition({ top: rect.top - rect.height * 2.6, left: rect.right - rect.width * 5.1 }); // Posición a la derecha de la imagen
        switch (index) {
            case 16: setShowArtifact(artifact); break;
            case 8: setShowGhost(true); break;
            default: setSelectedWeapon(weapon); break;
        }
    };
    const closeWeaponDetails = () => {
        setSelectedWeapon(null);
        setShowArtifact(null);
        setShowGhost(false);
    };

    const handleArmorClick = (armor, event) => {
        const rect = event.target.getBoundingClientRect();
        setPopupPosition({ top: rect.top - rect.height * 5, left: rect.right - rect.width * 11.7 }); // Posición a la izquierda de la imagen
        setSelectedArmor(armor);
    }

    const closeArmorDetails = () => {
        setSelectedArmor(null);
    };

    const handleStatHover = (stat, event) => {
        const rect = event.target.getBoundingClientRect();
        setStatPopupPosition({
            top: rect.top - 210,
            left: rect.left + 50
        });
        setSelectedStat(stat);
    };

    const handleStatLeave = () => {
        setSelectedStat(null);
    };

    async function getCosmetic(overrideStyleItemHash) {
        const cosmetic = await getItemManifest(overrideStyleItemHash, "DestinyInventoryItemDefinition");
        return cosmetic.displayProperties.icon;
    }

    async function getSeasonProgress(hash) {
        const season = await getItemManifest(hash, "DestinySeasonDefinition");
        const pass = await getItemManifest(season?.seasonPassList?.[0]?.seasonPassHash, "DestinySeasonPassDefinition");
        return pass?.rewardProgressionHash;
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

    function getArmorStats(item, investmentStats, stats, gearTier) {
        console.log(item.displayProperties.name, stats);
        let sumaBase = 0, sumaAzul = 0, sumaAmarillo = 0;
        stats.forEach((stat) => { //Para cada estat
            let blancobase, azul68a0b7 = 0, azul68a0b7_op8 = 0, amarillo = 0, perkAmarillo, perkAz8, perkAz68;
            investmentStats.forEach((perksinvestmentStat) => { //Para cada mod que afecta la stat
                //console.log(stat.name, perksinvestmentStat.type);
                if (perksinvestmentStat.type == "armor_archetypes" && gearTier == 3 && stat.value == 37) {
                    switch (stat.statHash) {
                        case 392767087: if (perksinvestmentStat.hash == 549468645) stat.value += 3; break; //Salud con bulwark
                        case 4244567218: if (perksinvestmentStat.hash == 3349393475) stat.value += 3; break; //Cuerpo a cuerpo con Brawler
                        case 1943323491: if(perksinvestmentStat.hash == 2230428468) stat.value += 3; break; //Clase con Specialist
                        case 2996146975: if (perksinvestmentStat.hash == 1807652646) stat.value += 3; break; //Armas con Gunslinger
                        case 1735777505: if (perksinvestmentStat.hash == 2937665788) stat.value += 3; break; //Granada con Grenadier
                        case 144602215: if (perksinvestmentStat.hash == 4227065942) stat.value += 3; break; //Super con Paragon
                        default: break;
                    }
                    stats[6].value += 3;
                }
                if (perksinvestmentStat.type == "v460.plugs.armor.masterworks" && ![5, 10, 15].includes(stat.value)) { //Si es el mod de armadura mejorada, solo mejorar las que tienen base 0
                    if (stat.name == "Total") stat.value = stat.value - 15;
                    else stat.value = stat.value - 5;
                }
                const matchingStat = perksinvestmentStat.investmentStats.find(
                    (invStat) => invStat.statTypeHash === stat.statHash
                );
                if (matchingStat) {
                    switch (matchingStat.value) {
                        case 2: //Si es 2 por la obra maestra
                            amarillo += matchingStat.value || 0;
                            perkAmarillo = "+" + matchingStat.value + " Estadística Obra Maestra";
                            break;
                        case 3: //Si es 3 por el mod artificio
                            azul68a0b7_op8 += matchingStat.value || 0;
                            perkAz68 = "+" + matchingStat.value + " " + perksinvestmentStat.name
                            break;
                        case 10: //Si es 10 por el mod insertado
                            azul68a0b7 += matchingStat.value || 0;
                            perkAz8 = "+" + matchingStat.value + " " + perksinvestmentStat.name
                            break;
                        case 5: //Si es 5 por el mod insertado o por mejorar armadura
                        console.log(stat);
                            if (perksinvestmentStat.type == "v460.plugs.armor.masterworks" && (stat.value == 5 || (stat.value == 15 || stat.value == 10 && stat.secciones["azul68a0b7"].value > 0))) {
                                amarillo += matchingStat.value || 0;
                                perkAmarillo = "+" + matchingStat.value + " " + perksinvestmentStat.name
                            }
                            if (perksinvestmentStat.name != "" != perksinvestmentStat.type == "v460.plugs.armor.masterworks") {
                                azul68a0b7 += matchingStat.value || 0;
                                perkAz8 = "+" + matchingStat.value + " " + perksinvestmentStat.name
                            }
                            break;
                        default:
                            break;
                    }
                }
            });
            blancobase = stat.value - (azul68a0b7 + azul68a0b7_op8 + amarillo);
            stat.secciones = {
                base: {
                    value: blancobase,
                    color: "#fff",
                    name: blancobase + " Estadísticas Base",
                },
                azul68a0b7: {
                    value: azul68a0b7,
                    color: "#68a0b7",
                    name: perkAz8 || null,
                },
                azul68a0b7_op8: {
                    value: azul68a0b7_op8,
                    color: "rgba(104, 160, 183, 0.8)",
                    name: perkAz68 || null,
                },
                amarillo: {
                    value: amarillo,
                    color: "#e8a534",
                    name: perkAmarillo || null,
                },
            }
            if (perkAmarillo) stat.isMw = true; //Atributo de obra maestra
            else stat.isMw = false;
            if (stat.name != "Total") {
                sumaBase += blancobase;
                sumaAzul += azul68a0b7 + azul68a0b7_op8;
                sumaAmarillo += amarillo;
            }
        })

        stats.forEach((stat => {
            if (stat.name == "Total") { //Acomodo los valores del total
                stat.secciones.base.value = stat.value - (sumaAzul + sumaAmarillo);
                stat.secciones.base.name = stat.value - (sumaAzul + sumaAmarillo) + " Estadísticas Base";
                stat.secciones.azul68a0b7.value = sumaAzul;
                stat.secciones.amarillo.value = sumaAmarillo;
                delete stat.secciones.azul68a0b7_op8;
            }
        }))
        return stats;
    }

    async function getArmorIntrinsicDetails(perks) {
        let intrinsics = [];
        Object.values(perks).forEach(async (perk) => {
            if (perk.perkType == "intrinsics" && perk.name != "") {
                const perkDets = await getItemManifest(perk.plugHash, "DestinyInventoryItemDefinition");
                intrinsics.push({
                    name: perkDets.displayProperties.name,
                    iconPath: perkDets.displayProperties.icon,
                    desc: perkDets.displayProperties.description,
                });

            }
        })
        return intrinsics;
    }

    function sortWeaponPerks(perks) {

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
            "plugs.masterworks",
            "exotic.weapon.masterwork",
            "masterwork",
            "kill_vfx",
        ]

        const archetype = [
            "intrinsics",
            "masterwork",
        ];

        const design = [
            "mementos",
            "crafting.recipes",
            "kill_vfx",
            "shader",
            "skins",
        ];

        const tracker = [
            "plugs.weapons.masterworks.trackers",
        ];

        let modifierPerks = perks.filter(perk =>
            perk && excludedModifiers.every(mod => !perk.perkType?.includes(mod))
        );

        // Mover los perks de tipo "weapon.mod_" al final
        modifierPerks = modifierPerks.sort((a, b) => {
            const isAWeaponMod = a.perkType?.includes("weapon.mod_") ? 1 : 0;
            const isBWeaponMod = b.perkType?.includes("weapon.mod_") ? 1 : 0;
            return isAWeaponMod - isBWeaponMod;
        });

        const archetypePerks = perks.filter(perk => archetype.some(arch => perk?.perkType?.includes(arch) && !perk?.perkType?.includes("tracker")));
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

    async function getWeaponStats(item, perksinvestmentStats, weaponLevel) {
        const stats = item.investmentStats;
        if (item.itemTypeDisplayName == "Espada") { //Si es espada agregar resistencia de guardia
            stats.push({
                statTypeHash: 3736848092,
                value: 0,
                isConditionallyActive: false,
            })
        }
        const group = item.stats.statGroupHash;
        const name = item.displayProperties.name;
        const response = await getItemManifest(group, "DestinyStatGroupDefinition");
        const interpolatingStats = response.scaledStats;
        const order = response.scaledStats.map(stat => stat.statHash);
        let weaponStats = await Promise.all(Object.values(stats).map(async (stat) => {
            const statResponse = await getItemManifest(stat.statTypeHash, "DestinyStatDefinition");
            // Verificar si algúna perk afecta el valor de la stat
            let modifiedValue = stat.value;
            perksinvestmentStats.forEach((perksinvestmentStat) => {
                const matchingStat = perksinvestmentStat.investmentStats.find(
                    (invStat) => invStat.statTypeHash === stat.statTypeHash
                );
                if (matchingStat && perksinvestmentStat.hash !== 2728416796) { //evitar mejora lvl 3

                    if (perksinvestmentStat.name.includes("Obra Maestra") && weaponLevel == null && matchingStat.value == 3);//Si es una armo obra maestra no crafteada, no sumar stats secundarias de obra maestra
                    else {
                        modifiedValue += matchingStat.value; // Sumar o restar el valor del investmentStat
                    }

                    if (perksinvestmentStats.indexOf(perksinvestmentStat) == 0 && matchingStat.value == 2) { //Obra mestra stats secundarias
                        if (name.includes("(") && name.includes(")")) {
                            modifiedValue += 1; // Si el nivel de la arma es mayor o igual a 20 y se es mejorado sin craftear, sumar 1
                            if (weaponLevel >= 20) modifiedValue += 1;
                        }
                    }
                }
            });
            return {
                statHash: stat.statTypeHash,
                name: statResponse.displayProperties.name == "Disparos por minuto" ? "DPM" : statResponse.displayProperties.name,
                value: modifiedValue,
                desc: statResponse.displayProperties.description || null,
            };
        }));


        // Filtrar los stats que no están en el arreglo "order"
        weaponStats = weaponStats.filter(stat => order.includes(stat.statHash));

        // Ordenar weaponStats según el arreglo "order"
        weaponStats = weaponStats.sort((a, b) => {
            const orderIndexA = order.indexOf(a.statHash);
            const orderIndexB = order.indexOf(b.statHash);

            // Siempre al final "cargador"
            if (a.statHash === 3871231066) return 1;
            if (b.statHash === 3871231066) return -1;

            // Orden principal basado en el índice
            return orderIndexA - orderIndexB;
        });

        // Orden secundario para garantizar que efectividad aire quede detrás de asistencia apountado
        const index = weaponStats.findIndex(stat => stat.statHash === 2714457168);
        if (index > 1) {
            const [element] = weaponStats.splice(index, 1); // Elimina el elemento del arreglo
            weaponStats.splice(index - 2, 0, element); // Inserta el elemento dos índices atrás
        }

        // Mover Generación de munición detrás de "Asistencia de apuntado"
        const generacionMuni = weaponStats.findIndex(stat => stat.statHash === 1931675084);
        if (generacionMuni > 1) {
            const [element] = weaponStats.splice(generacionMuni, 1); // Elimina el elemento del arreglo
            weaponStats.splice(generacionMuni - 3, 0, element); // Inserta el elemento tres índices atrás
        }

        // Orden secundario para colocar Velocidad de golpe al principio
        const velocidadGolpe = weaponStats.findIndex(stat => stat.statHash === 2837207746);
        if (velocidadGolpe > 0) {
            const [element] = weaponStats.splice(velocidadGolpe, 1);
            weaponStats.unshift(element); // Inserta el elemento al principio
        }

        // Orden secundario para colocar Recuperación de carga un índice adelante
        const recuperacionCarga = weaponStats.findIndex(stat => stat.statHash === 3022301683);
        if (recuperacionCarga > -1 && recuperacionCarga + 1 < weaponStats.length) {
            const [element] = weaponStats.splice(recuperacionCarga, 1);
            weaponStats.splice(recuperacionCarga + 1, 0, element); // Inserta el elemento dos índices adelante
        }

        weaponStats = interpoledStats(weaponStats, interpolatingStats);//Se "normalizan" las stats mediante interpolacion
        return weaponStats;
    }

    function interpoledStats(weaponStats, interpolatingStats) {
        const interpolatedStats = weaponStats.map(stat => {
            const interpolatingStat = interpolatingStats.find(interpolatingStat => interpolatingStat.statHash === stat.statHash);
            if (interpolatingStat) {
                const { displayInterpolation } = interpolatingStat;
                const value = stat.value;
                // Ordenar los valores de displayInterpolation por 'value' en caso de que no estén ordenados
                displayInterpolation.sort((a, b) => a.value - b.value);

                // Buscar el rango en el que se encuentra el valor
                for (let i = 0; i < displayInterpolation.length - 1; i++) {
                    const current = displayInterpolation[i];
                    const next = displayInterpolation[i + 1];

                    if (value >= current.value && value <= next.value) {
                        // Calcular el peso interpolado
                        const range = next.value - current.value;
                        const weightRange = next.weight - current.weight;
                        const proportion = (value - current.value) / range;

                        const interpolatedValue = current.weight + proportion * weightRange;

                        return {
                            ...stat,
                            value: Math.round(interpolatedValue),
                        };
                    }
                }

                // Si el valor está fuera del rango, devolver el peso más cercano
                if (value < displayInterpolation[0].value) {
                    return {
                        ...stat,
                        value: displayInterpolation[0].weight,
                    };
                }
                if (value > displayInterpolation[displayInterpolation.length - 1].value) {
                    return {
                        ...stat,
                        value: displayInterpolation[displayInterpolation.length - 1].weight,
                    };
                }
            }
        });
        return interpolatedStats;
    }

    function colorStats(item, perks, stats) {
        stats.forEach((stat) => {
            let blancobase = 0, blancoFFFFFF1F = 0, blancoFFFFFF3D = 0, azul = 0, rojo = 0, amarillo = 0;
            let perk1F, perk3D, perkAzul, perkRojo, perkAmarillo;
            perks.forEach(perk => {
                perk.investmentStats.forEach(invStat => {
                    if (invStat.statTypeHash == stat.statHash) {
                        if (perks[0] === perk || perk.name.includes("Obra Maestra")) { //Si esta en la posicion cero es el arquetipo o tiene obra maestra
                            if (perk.name.includes("Obra Maestra") && invStat.value == 3); //Si es una obra maestra no crafteada, no sumar stats secundarias
                            else if (perk.name.includes("Obra Maestra") && invStat.value == 10) {
                                amarillo += invStat.value;
                                perkAmarillo = invStat.value + " Estadística Obra Maestra";
                            }
                            else {
                                amarillo += invStat.value;
                                perkAmarillo = invStat.value + " Estadística Obra Maestra"; //Gaurdo en un a veriable el nombre de la perk y el valor
                            }
                        }
                        else if (perks[1] === perk) { // cañon
                            if (invStat.value > 0) {//Si el value del cañon es positivo
                                blancoFFFFFF1F += invStat.value;
                                perk1F = invStat.value + " " + perk.name;
                            } else if (invStat.value < 0) { //Si el value del cañon es negativo
                                rojo += invStat.value;
                                perkRojo = invStat.value + " " + perk.name;
                            }
                        }
                        else if (perks[2] === perk || perk.perkType == "grips") { //cargador o empuñadura
                            if (invStat.value > 0) {//Si el value del cargador es positivo
                                blancoFFFFFF3D += invStat.value;
                                perk3D = invStat.value + " " + perk.name;
                            } else if (invStat.value < 0) { //Si el value del cargador es negativo
                                rojo += invStat.value;
                                perkRojo = invStat.value + " " + perk.name;
                            }
                        }
                        else if (perk.perkType.includes("weapon.mod_")) { //Si es un mod insertado
                            azul += invStat.value;
                            perkAzul = invStat.value + " " + perk.name;
                        }
                    }
                })
            })
            let sumaColores = rojo + amarillo + blancoFFFFFF1F + blancoFFFFFF3D + azul;
            if (sumaColores < 0) blancobase = stat.value + Math.abs(sumaColores); //Si la suma de colores es negativa, se le resta al stat base
            else blancobase = stat.value - sumaColores; //Si no, se queda con el valor base

            let valorAbsolutoRojo = Math.abs(rojo);
            let aux = 0;

            if (valorAbsolutoRojo >= azul) { //El valorAbsolutoRojo se come al resto de sumas
                aux += azul;
                azul = 0;
                if (valorAbsolutoRojo >= aux + amarillo) {
                    aux += amarillo;
                    amarillo = 0;
                    if (valorAbsolutoRojo >= aux + blancoFFFFFF1F) {
                        aux += blancoFFFFFF1F;
                        blancoFFFFFF1F = 0;
                        if (valorAbsolutoRojo >= aux + blancoFFFFFF3D) {
                            aux += blancoFFFFFF3D;
                            blancoFFFFFF3D = 0;
                            if (valorAbsolutoRojo > aux + blancoFFFFFF3D) { //Si es mas grande que todas las perks, le empieza a comer al stat base
                                blancobase = blancobase - (valorAbsolutoRojo - aux);
                            }
                        } else blancoFFFFFF3D = blancoFFFFFF3D - (valorAbsolutoRojo - aux); //Si el rojo no es mas que el auxiliar, le saca puntos en donde se quedó
                    } else blancoFFFFFF1F = blancoFFFFFF1F - (valorAbsolutoRojo - aux);
                } else amarillo = amarillo - (valorAbsolutoRojo - aux);
            } else azul = azul - (valorAbsolutoRojo - aux);

            stat.secciones = {
                base: {
                    value: blancobase,
                    color: "#fff",
                    name: stat.value - sumaColores + " Estadística Base",
                },
                blancoFFFFFF1F: {
                    value: blancoFFFFFF1F,
                    color: "rgba(255,255,255, 0.88)",
                    name: perk1F ? "+" + perk1F : null,
                },
                blancoFFFFFF3D: {
                    value: blancoFFFFFF3D,
                    color: "rgba(255,255,255, 0.76)",
                    name: perk3D ? "+" + perk3D : null,
                },
                amarillo: {
                    value: amarillo,
                    color: "#e8a534",
                    name: perkAmarillo ? "+" + perkAmarillo : null,
                },
                azul: {
                    value: azul,
                    color: "#68a0b7",
                    name: azul ? "+" + perkAzul : null,
                },
                rojo: {
                    value: Math.abs(rojo),
                    color: "#7a2727",
                    name: perkRojo ? perkRojo : null,
                },
            }
            if (perkAmarillo) stat.isMw = true; //Atributo de obra maestra
            else stat.isMw = false;
        })
        return stats;
    }

    async function getdmgType(dmgType) {
        const response = await getItemManifest(dmgType, "DestinyDamageTypeDefinition");
        return {
            name: response.displayProperties.name,
            iconPath: response.displayProperties.icon,
        };
    }

    async function getAmmoType(ammoType) {
        switch (ammoType) {
            case 1: {
                const response = await getItemManifest(1731162900, "DestinyPresentationNodeDefinition");
                return {
                    name: response.displayProperties.name,
                    iconPath: response.displayProperties.icon,
                }
            }
            case 2: {
                const response = await getItemManifest(638914517, "DestinyPresentationNodeDefinition");
                return {
                    name: response.displayProperties.name,
                    iconPath: response.displayProperties.icon,
                }
            }
            case 3: {
                const response = await getItemManifest(3686962409, "DestinyPresentationNodeDefinition");
                return {
                    name: response.displayProperties.name,
                    iconPath: response.displayProperties.icon,
                }
            }
            default: return null;
        }
    }

    async function getChampMod(item, artifactMods) {
        if (!artifactMods) return null;
        if (item.breakerType != 0) {
            const response = await getItemManifest(item.breakerType, "DestinyBreakerTypeDefinition");
            return {
                name: response.displayProperties.name,
                iconPath: response.displayProperties.icon,
            }
        } else {
            const activePerks = artifactMods.flatMap(tier =>
                tier.items.filter(perk => perk.isActive && perk.isVisible)
            );

            let perks = await Promise.all(activePerks.map(async (perk) => {
                const perkResponse = await getItemManifest(perk.itemHash, "DestinyInventoryItemDefinition");
                return perkResponse.displayProperties.name;
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
                    breakerInfo = await getItemManifest(3178805705, "DestinyBreakerTypeDefinition");
                } else if (text.includes("sobrecarga")) {
                    breakerInfo = await getItemManifest(2611060930, "DestinyBreakerTypeDefinition");
                } else if (text.includes("antibarrera") || text.includes("penetrante")) {
                    breakerInfo = await getItemManifest(485622768, "DestinyBreakerTypeDefinition");
                }

                return {
                    name: breakerInfo?.displayProperties.name,
                    iconPath: breakerInfo?.displayProperties.icon,
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

    async function getWeaponLevelAndProgression(objectivesPerPlug, sockets) {
        let weaponLvl, levelprogress, levelCompletition, mejora;
        for (const objective of Object.values(objectivesPerPlug)) {
            //Si el obj es que tiene que ver con el crafteo del arma
            const levelPercentage = objective.find(sub => sub.objectiveHash === 325548827 || sub.objectiveHash === 2899837482 || sub.objectiveHash === 2981801242);
            const levelNum = objective.find(sub => sub.objectiveHash === 3077315735);
            if (levelPercentage) {
                levelprogress = levelPercentage.progress;
                levelCompletition = levelPercentage.completionValue;
            }
            if (levelNum) {
                weaponLvl = levelNum.progress;
            }
        }
        for (const socket of Object.values(sockets)) { //Recorre los sockets del arma para ver que nivel de mejora esta
            if (socket.plugHash == 2728416798 || socket.plugHash == 2728416797 || socket.plugHash == 2728416796) { //Si es una mejora de nivel 1 o 3
                const mejoraResponse = await getItemManifest(socket.plugHash, "DestinyInventoryItemDefinition");
                mejora = mejoraResponse.displayProperties.name;
                break;
            }
        }
        return {
            levelprogress: levelprogress,
            levelCompletition: levelCompletition,
            weaponLvl: weaponLvl,
            mejora: mejora,
        };
    }

    async function getOtherEmblems(characters, mostRecentCharacter) {
        let emblems, classe;
        const emblemPromises = Object.values(characters).map(async (char) => {
            const rep = await getCharacterSimpleInventoryAndEquipment(membershipType, userId, char.characterId);
            const emblem = await getItemManifest(rep.equipment.data.items[13].itemHash, "DestinyInventoryItemDefinition");

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
                name: emblem.displayProperties.name,
                iconPath: emblem.displayProperties.icon,
                desc: emblem.displayProperties.description,
                hash: emblem.hash,
                class: classe,
                currentClass: actual,
            };
        });

        emblems = await Promise.all(emblemPromises);
        setEmblems(emblems);
    }

    async function getSeal(char, manifest) {
        if (char.titleRecordHash == null) return;
        const sealResponse = await getItemManifest(char.titleRecordHash, "DestinyRecordDefinition");
        const allseals = await getAllSeals(membershipType, userId);

        const manifestUrl = manifest.jsonWorldComponentContentPaths.es.DestinyPresentationNodeDefinition;
        const metricsData = await axios.get(`${API_CONFIG.BUNGIE_API}${manifestUrl}`);

        // Buscar el parentNodeHash que coincida con el hash del título
        const matchingNode = Object.values(metricsData.data).find(node => node.completionRecordHash === char.titleRecordHash);
        setSeal({
            name: sealResponse.titleInfo.titlesByGender[char.genderType == 0 ? "Male" : "Female"] || sealResponse.displayProperties.name,
            desc: sealResponse.displayProperties.description,
            iconPath: matchingNode.originalIcon || sealResponse.displayProperties.icon,
            sealHash: matchingNode.hash,
            timesGilded: allseals.profileRecords.data?.records?.[sealResponse.titleInfo?.gildingTrackingRecordHash]?.completedCount
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
        const emblemResponse = await getItemManifest(emblemHash, "DestinyInventoryItemDefinition");
        setEmblemElements({
            icon: emblemResponse.secondaryOverlay,
            bg: emblemResponse.secondarySpecial,
        });
    }

    function getArtifactDetails(artifact) {
        if (!artifact) return;
        setArtifact({
            points: artifact?.pointsAcquired,
            pointsCap: artifact.pointProgression.levelCap,
            pointsProgress: artifact.pointProgression.currentProgress,
            pointsProgressNextLvl: artifact.pointProgression.progressToNextLevel,
            powerBonus: artifact?.powerBonus,
            powerProgress: artifact.powerBonusProgression.progressToNextLevel,
            powerProgressNextLvl: artifact.powerBonusProgression.nextLevelAt,
        })
    }

    function getArmorCategory(armorType, classType) {
        switch (classType) {
            case 0:
                if (armorType.includes("titan")) return armorType;
                else return "Titán " + armorType;
            case 1:
                if (armorType.includes("cazador")) return armorType;
                else return "Cazador " + armorType;
            case 2:
                if (armorType.includes("hechicero")) return armorType;
                else return "Hechicero " + armorType;
            default:
                return armorType;
        }
    }

    async function getMwEnchancedWeapons(item, perks, manifest) {
        const enchancedPerk = perks.find(perk => perk.isEnhanced && perk.isEnhanced.toLowerCase().includes("intrínseco"));
        if (enchancedPerk) {
            const statMw = enchancedPerk.investmentStats.find(invStat => invStat.value == 10)
            if (statMw) {
                const statMwResponse = await getItemManifest(statMw.statTypeHash, "DestinyStatDefinition");
                const statName = statMwResponse.displayProperties.name;
                const manifestUrl = manifest.jsonWorldComponentContentPaths.es.DestinyInventoryItemDefinition;
                const metricsData = await axios.get(`${API_CONFIG.BUNGIE_API}${manifestUrl}`);
                const matchingMetric = Object.values(metricsData.data).find(metric =>
                    metric.displayProperties.name.toLowerCase() === "obra maestra: " + statName.toLowerCase()
                );
                perks[1] = {
                    ...perks[1],
                    iconPath: matchingMetric?.displayProperties?.icon,
                    desc: matchingMetric?.displayProperties?.description,
                    name: matchingMetric?.displayProperties?.name,
                    perkHash: matchingMetric?.hash,
                }
                return perks;
            } else return perks;
        } else return perks;
    }

    async function getDescription(hash) {
        if (hash == null) return;
        let color;
        const response = await getItemManifest(hash, "DestinySandboxPerkDefinition");
        if (response.displayProperties.description.includes("+10") || response.displayProperties.description.includes("+5")) {
            color = "#68a0b7";
        } else if (response.displayProperties.description.includes("+3")) {
            color = "rgba(104, 160, 183, 0.8)";
        }
        if (response.displayProperties.description == "") return null;
        else return {
            description: response.displayProperties.description,
            color: color,
        }
    }

    async function getDescriptionPerksWeapons(perks, item) {
        const group = await getItemManifest(item.stats.statGroupHash, "DestinyStatGroupDefinition");
        const statsOfGroup = group.scaledStats;
        perks.forEach((perk) => {
            perk.statDescripton = [];
            perk?.investmentStats?.forEach(async (invStat) => {
                let color, num;
                if (statsOfGroup.find(stat => stat.statHash == invStat.statTypeHash)) {//Si la stat esta en el grupo, conitnuo
                    const statName = await getItemManifest(invStat.statTypeHash, "DestinyStatDefinition");
                    if (invStat.value != 0 && !(perk.perkType.includes("masterworks") && invStat.value === 3)) { //Si la stat no es cero o es una obra maestra de un arma comun
                        if (invStat.value < 0) { //perk negativa
                            color = "#A42323";
                            num = invStat.value;
                        } else if (perks.length == 2) { // Armazón/Obra maestra
                            color = "#e8a534"
                            num = "+" + invStat.value;

                        } else if (perk == perks[0]) { //primera perk o 3/4
                            color = "#bdbdbd";
                            num = "+" + invStat.value;
                        } else if (perk == perks[1] || perk.perkType == "grips") { //segunda perk
                            color = "#9d9e9e";
                            num = "+" + invStat.value;
                        } else if (perk.perkType.includes("weapon.mod_")) { //mod insertado
                            color = "#68a0b7";
                            num = "+" + invStat.value;
                        } else {
                            color = "#FFF";
                            num = "+" + invStat.value;
                        }
                        perk.statDescripton.push({
                            name: `<strong>${num}</strong> ${statName.displayProperties.name}`,
                            color: color,
                        });
                    }
                }
            })
        })
        return perks;
    }

    async function getElementalColor(elementindex, manifest) {
        const manifestUrl = manifest.jsonWorldComponentContentPaths.es.DestinyDamageTypeDefinition;
        const metricsData = await axios.get(`${API_CONFIG.BUNGIE_API}${manifestUrl}`);

        // Buscar la métrica que coincida con el elemento
        const matchingMetric = Object.values(metricsData.data).find(metric =>
            metric.enumValue == elementindex
        );
        let rgbaColor, opacity;
        if (elementindex == 1) {// prismatic
            rgbaColor = "rgba(232, 101, 157, 225)";
            opacity = "rgba(232, 101, 157, 0.7)";
        } else {
            rgbaColor = "rgba(" + matchingMetric?.color.red + ", " + matchingMetric?.color.green + ", " + matchingMetric?.color.blue + ", 255)";
            opacity = "rgba(" + matchingMetric?.color.red + ", " + matchingMetric?.color.green + ", " + matchingMetric?.color.blue + ", 0.7)"
        }
        return {
            color: rgbaColor,
            opacity: opacity,
        };
    }

    async function getFragemtsStats(investmentStats, hash, classType) {
        if (hash == 2272984671 || hash == 1727069360) { //Si es un fragmento de clase
            switch (classType) {
                case 0: //Titan resto resistencia
                    investmentStats.splice(1, 2); //Elimina movilidad y recuperacion
                    break;
                case 1: //Cazador resto movilidad
                    investmentStats.splice(3, 1); // Elimina el elemento en el índice 3
                    investmentStats.splice(1, 1);  //Elimina resistencia y recuperacion
                    break;
                case 2: //Hechicero resto recuperacion
                    investmentStats.splice(2, 3); //Elimina movilidad y resistencia
                    break;
            }
        }
        const stats = await Promise.all(investmentStats.slice(1).map(async (stat) => {
            const statResponse = await getItemManifest(stat.statTypeHash, "DestinyStatDefinition");
            return {
                value: stat.value > 0 ? "+" + stat.value : stat.value,
                iconPath: statResponse.displayProperties.icon,
                name: statResponse.displayProperties.name,
                statHash: stat.statTypeHash,
                color: stat.value < 0 ? "#A42323" : "",
            }
        }));
        return stats;
    }

    function getSecondaryBgImg(subclassIndex) {
        switch (subclassIndex) {
            case 1:
                return bgKinetic;
            case 2:
                return bgArc;
            case 3:
                return bgSolar;
            case 4:
                return bgVoid;
            case 6:
                return bgStasis;
            case 7:
                return bgStrand;
            default:
                return "";
        }
    }

    function getGhostEnergy(isMw, perks) {
        let energyUsed = 0;
        perks.forEach(perk => {
            if (perk.investmentStats?.[0]?.value && perk.investmentStats?.[0]?.statTypeHash == 514071887) {
                energyUsed += perk.investmentStats[0].value;
            }
        })
        return energyUsed;
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

            return () => {
                window.removeEventListener("keydown", handleKeyDown);
            };
        }
    }, [isVisible]);

    // Frases a buscar exactas
    function escapeRegex(str) {
        return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }
    // Ordena de mayor a menor longitud para evitar solapamientos
    const frasesOrdenadas = [...frasesES].sort((a, b) => b.length - a.length);
    // Regex con delimitadores de palabra
    const regex = new RegExp(`\\b(${frasesOrdenadas.map(escapeRegex).join('|')})\\b`, "gi");

    const reemplazos = {
        "cuerpo a cuerpo": '<i class="icon-melee" style="font-style:normal"></i>',
        "granada": '<i class="icon-granada" style="font-style:normal"></i>',
        "estasis": '<i class="icon-estasis" style="font-style:normal"></i>',
        "cuerda": '<i class="icon-cuerda" style="font-style:normal"></i>',
        "atadura": '<i class="icon-cuerda" style="font-style:normal"></i>',
        "solar": '<i class="icon-solar" style="font-style:normal"></i>',
        "vacío": '<i class="icon-vacío" style="font-style:normal"></i>',
        "arco": '<i class="icon-arco" style="font-style:normal"></i>',
        "perturbación": '<i class="icon-perturbacion" style="font-style:normal"></i>',
        "perforación de escudos": '<i class="icon-perforacion" style="font-style:normal"></i>',
        "aturdimiento": '<i class="icon-aturdimiento" style="font-style:normal"></i>',
    }

    // Reemplazar [palabra] por el símbolo/texto correspondiente
    function reemplazarCorchetes(texto) {
        if (typeof texto !== "string") {
            return texto;
        }
        return texto.replace(/\[([^\]]+)\]/gi, (match, palabra) => {
            const clave = palabra.trim().toLowerCase();
            return reemplazos[clave] || match;
        });
    }

    function reemplazarCorchetesYColorear(texto) {
        // Primero reemplaza los corchetes por íconos
        const conIconos = reemplazarCorchetes(texto ?? "");
        // Luego colorea, pero NO dentro de etiquetas <i>
        return conIconos.replace(regex, (match, ...args) => {
            // Si el match está dentro de una etiqueta <i>, no lo colorees
            const offset = args[args.length - 2];
            const before = conIconos.slice(0, offset);
            const openTag = before.lastIndexOf('<i');
            const closeTag = before.lastIndexOf('</i>');
            if (openTag > closeTag) return match; // Está dentro de <i>...</i>
            return `<span style="color:#799AB5;">${match}</span>`;
        });
    }

    return (
        !loading ? (
            <div className="flex flex-col items-center justify-center h-full">
                <div className="flex justify-between items-center w-full " style={{ height: "11%", backgroundImage: `url(${API_CONFIG.BUNGIE_API}${emblemElements.bg})`, backgroundRepeat: "no-repeat", backgroundSize: 'cover', backgroundPosition: "bottom" }}>
                    <div className="flex ml-12" style={{ transform: "translateY(20%)" }}>
                        <img src={`${API_CONFIG.BUNGIE_API}${emblemElements.icon}`} style={{ width: "16%" }} />
                        <div className="flex flex-col items-top ml-4 mt-1.5">
                            <div style={{ width: "2%", height: "2px", backgroundColor: "white", margin: "0" }} />
                            <h2 className="text-2xl font-bold tracking-[0.11em] items-bottom">{name}</h2>
                            <div className="flex flex-row items-top space-x-2.5 opacity-[0.8] tracking-[0.17rem] titulo">
                                <p className="flex flex-row mt-[2px]">
                                    <span>Temporada</span>
                                    <span className="ml-1">{season}</span>
                                </p>
                                <p><i className="icon-pass" style={{ fontStyle: 'normal', fontSize: '1.1rem' }} /> {Passlevel} </p>
                                <p><i className="icon-rank mr-1" style={{ fontStyle: 'normal', fontSize: '1.1rem' }} />{rank}</p>
                                <p className='lightlevel flex mt-[2px]'>
                                    <i className="icon-light" style={{ fontStyle: 'normal', fontSize: '1.6rem', top: '-0.50rem', position: "relative" }} />{light}
                                </p>
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
                {!loading ? (<AnimatePresence mode="wait">
                    {activeTab === "Equipamiento" && (
                        <motion.div
                            key="Equipamiento"
                            initial={{ x: "-100%", opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            exit={{ x: "-100%", opacity: 0 }}
                            transition={{ duration: 0.25 }}
                            className="w-full justify-center flex items-top mt-4"
                            style={{ height: "100%" }}
                        >
                            <div className="flex flex-col space-y-6 justify-center w-full">
                                {items[11] && (
                                    <div className={`flex relative w-full justify-center space-x-4`}>
                                        <div className="flex flex-col items-end justify-center" style={{ width: "26%" }}>
                                            <div className="flex rtl">
                                                {items[11].perks.slice(1, 5).map((perk, perkIndex) => (
                                                    <div className="group relative" key={perkIndex + perk.name}>
                                                        <img key={perkIndex} src={`${API_CONFIG.BUNGIE_API}${perk.iconPath}`} className="w-[30px] h-[30px] mx-1" alt={perk.name} />
                                                        <div className="absolute left-8 top-1 mt-2 w-max max-w-[230px] text-white text-xs shadow-lg opacity-0 group-hover:opacity-100 transition-opacity z-50 pointer-events-none">
                                                            <div className="p-1 pb-2 px-2" style={{ backgroundColor: items[11].elementalColor.color }}>
                                                                <p className="font-semibold text-xl uppercase leading-6">{perk.name}</p>
                                                                <p className="font-[300] opacity-75">{perk.type}</p>
                                                            </div>
                                                            <img src={`${API_CONFIG.BUNGIE_API}${perk.gameplayImg}`} className="w-auto h-[70px]" />
                                                            <p className={`whitespace-pre-line w-fit p-1 px-2 bg-black/80`} dangerouslySetInnerHTML={{
                                                                __html: reemplazarCorchetesYColorear(perk.desc ?? "")
                                                            }} />
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                        <div style={{ width: "7%" }}>
                                            {items[11].perks[0] && (
                                                <div className="group relative">
                                                    <div className="realtive">
                                                        <img src={items[11].secondaryBgImg} className="absolute z-10" />
                                                        <img src={`${API_CONFIG.BUNGIE_API}${items[11].perks[0].iconPath}`} alt={items[11].perks[0].name} className="absolute z-20" />
                                                        {items[11].name.includes("prismático") && <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" className="absolute z-30">
                                                            <rect x="7.74" y="7.74" width="32.53" height="32.53" transform="translate(-9.94 24) rotate(-45)" strokeWidth="1" stroke="#bdbdbd" fill="transparent"></rect>
                                                        </svg>}
                                                    </div>
                                                    <div className="absolute left-18 top-1 mt-2 w-max max-w-[230px] text-white text-xs shadow-lg opacity-0 group-hover:opacity-100 transition-opacity z-50 pointer-events-none">
                                                        <div className="p-1 pb-2 px-2" style={{ backgroundColor: items[11].elementalColor.color }}>
                                                            <p className="font-semibold text-xl uppercase leading-6">{items[11].perks[0].name}</p>
                                                            <p className="font-[300] opacity-75">{items[11].perks[0].type}</p>
                                                        </div>
                                                        <img src={`${API_CONFIG.BUNGIE_API}${items[11].perks[0].gameplayImg}`} className="w-auto h-[70px]" />
                                                        <p className={`whitespace-pre-line w-fit p-1 px-2 bg-black/80`} dangerouslySetInnerHTML={{
                                                            __html: reemplazarCorchetesYColorear(items[11].perks[0].desc ?? "")
                                                        }} />
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex flex-col right-0 mt-1" style={{ width: "26%" }}>
                                            <div className="flex mb-2">
                                                {items[11].perks.slice(5, 7).map((perk, perkIndex) => (
                                                    <div key={perkIndex} className="group relative">
                                                        <img key={perkIndex + perk.name} src={`${API_CONFIG.BUNGIE_API}${perk.iconPath}`} className="w-[30px] h-[30px] mx-1" alt={perk.name} />
                                                        <div className="absolute left-8 top-1 mt-2 w-max max-w-[230px] text-white text-xs shadow-lg opacity-0 group-hover:opacity-100 transition-opacity z-50 pointer-events-none">
                                                            <div className="p-1 pb-2 px-2" style={{ backgroundColor: items[11].elementalColor.color }}>
                                                                <p className="font-semibold text-xl uppercase leading-6">{perk.name}</p>
                                                                <p className="font-[300] opacity-75">{perk.type}</p>
                                                            </div>
                                                            <img src={`${API_CONFIG.BUNGIE_API}${perk.gameplayImg}`} className="w-auto h-[70px]" />
                                                            <p
                                                                className="whitespace-pre-line w-fit p-1 px-2 bg-black/80"
                                                                dangerouslySetInnerHTML={{
                                                                    __html: reemplazarCorchetesYColorear(perk.desc ?? "")
                                                                }}
                                                            />
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                            <div className="flex mb-2">
                                                {items[11].perks.slice(7).map((perk, perkIndex) => (
                                                    perk.name != "Ranura de fragmento vacía" ? (
                                                        <div className="group relative">
                                                            <img key={perkIndex + perk.name} src={`${API_CONFIG.BUNGIE_API}${perk.iconPath}`} className="w-[30px] h-[30px] mx-1" alt={perk.name} />
                                                            <div className="absolute left-8 top-1 mt-2 w-max max-w-[230px] text-white text-xs shadow-lg opacity-0 group-hover:opacity-100 transition-opacity z-50 pointer-events-none">
                                                                <div className="p-1 pb-2 px-2" style={{ backgroundColor: items[11].elementalColor.color }}>
                                                                    <p className="font-semibold text-xl uppercase leading-6">{perk.name}</p>
                                                                    <p className="font-[300] opacity-75">{perk.type}</p>
                                                                </div>
                                                                <img src={`${API_CONFIG.BUNGIE_API}${perk.gameplayImg}`} className="w-auto h-[70px]" />
                                                                <div className="w-fit p-1 px-2 bg-black/80">
                                                                    <p className={`whitespace-pre-line`} dangerouslySetInnerHTML={{
                                                                        __html: (perk.desc ?? "").replace(
                                                                            regex,
                                                                            '<span style="color:#799AB5;">$1</span>'
                                                                        ),
                                                                    }} />
                                                                    {perk.fragmentsStats?.map((stat) => (
                                                                        <div key={stat.statHash} className="flex space-x-0.5 mt-1 items-center opacity-80" style={{ color: stat.color }}>
                                                                            <p>&nbsp;&nbsp;{stat.value}</p>
                                                                            <img src={`${API_CONFIG.BUNGIE_API}${stat.iconPath}`} className="w-[15px] h-[15px] my-0.5" style={{ filter: stat.value < 0 ? "brightness(0) saturate(100%) invert(14%) sepia(90%) saturate(7248%) hue-rotate(356deg) brightness(92%) contrast(121%)" : "" }} alt={stat.name} />
                                                                            <p>{stat.name}</p>
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        </div>) : <img key={perkIndex} src={`${API_CONFIG.BUNGIE_API}${perk.iconPath}`} className="w-[30px] h-[30px] mx-1" alt={perk.name} title={perk.name} />
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
                                                    <div className={"flex space-x-2 mr-4"}>
                                                        {index == 8 || index == 16 ? (
                                                            index == 8 ? (
                                                                items[index].perks?.map((perk) => (
                                                                    perk.name && (index !== 16 || perk.isVisible) && perk?.iconPath && perk?.name !== "Mejorar Espectro" && perk.name !== "Ranura de modificador de actividad" && perk.perkType !== "shader" && perk.perkType !== "hologram" && (
                                                                        <div className="group relative">
                                                                            <img src={`${API_CONFIG.BUNGIE_API}${perk.iconPath}`} className={index == 16 ? "w-[25px] h-[25px]" : "w-[40px] h-[40px] mb-1"} alt={perk.name} />
                                                                            {perk.investmentStats?.[0]?.value && (
                                                                                <span className="absolute top-0.5 right-[0.5px] text-white text-[0.5rem] rounded-full px-1">
                                                                                    {perk.investmentStats[0].value}
                                                                                </span>
                                                                            )}
                                                                            <div dir="ltr" className={`${index == 16 ? "-top-24" : "top-2"} absolute left-8 mt-2 w-max max-w-[230px] bg-neutral-800 text-white text-xs p-1.5 border-1 border-white shadow-lg opacity-0 group-hover:opacity-100 transition-opacity z-50 pointer-events-none`} >
                                                                                <strong>{perk.name}</strong><br />
                                                                                <p className={`w-fit whitespace-pre-line text-[0.7rem]`}>{perk.desc?.description ?? perk.desc ?? ""}</p>
                                                                            </div>
                                                                        </div>
                                                                    )
                                                                ))
                                                            ) : (
                                                                slidesArtifact && (<div className="h-8 mr-4 mb-1" style={{ width: "200px" }}>
                                                                    <CaruselArtefacto elements={slidesArtifact} />
                                                                </div>)
                                                            )
                                                        ) : (
                                                            <div className="justify-between flex flex-col">
                                                                <div className="flex space-x-2 justify-end">
                                                                    {items[index].perks.modifierPerks.map((perk) => (
                                                                        perk.name && (index !== 16 || perk.isVisible) && perk?.iconPath && perk.name !== "Ranura de potenciador de nivel de arma vacía" && (
                                                                            !perk.perkType?.includes("weapon.mod_") && !perk.perkType?.includes("weapon_tiering") ?
                                                                                (<div key={perk.perkHash} className="relative group ">
                                                                                    <svg viewBox="0 0 100 100" width="40" height="40" className="group">
                                                                                        <defs>
                                                                                            <linearGradient id="mw" x1="0" x2="0" y1="0" y2="1">
                                                                                                <stop stopColor="#eade8b" offset="50%" stopOpacity="0"></stop>
                                                                                                <stop stopColor="#eade8b" offset="100%" stopOpacity="1"></stop>
                                                                                            </linearGradient>
                                                                                        </defs>
                                                                                        <mask id="mask">
                                                                                            <rect x="0" y="0" width="100" height="100" fill="black"></rect>
                                                                                            <circle cx="50" cy="50" r="46" fill="white"></circle>
                                                                                        </mask>
                                                                                        <circle cx="50" cy="50" r="48" style={{ fill: "#4887ba" }}></circle>
                                                                                        {perk.isEnhanced.includes("mejorado") && ( //
                                                                                            <>
                                                                                                <rect x="0" y="0" width="100" height="100" fill="url(#mw)" mask="url(#mask)"></rect>
                                                                                                <rect x="5" y="0" width="6" height="100" fill="#eade8b" mask="url(#mask)"></rect>
                                                                                                <path d="M5,50 l0,-24 l-6,0 l9,-16 l9,16 l-6,0 l0,24 z" fill="#eade8b"></path>
                                                                                            </>
                                                                                        )}
                                                                                        <image href={API_CONFIG.BUNGIE_API + perk.iconPath} x="10" y="10" width="80" height="80" mask="url(#mask)"></image>
                                                                                        <circle cx="50" cy="50" r="46" stroke="white" fill="transparent" strokeWidth="2" className="od45Ah47"></circle>
                                                                                    </svg>
                                                                                    <div className="absolute left-10 top-1 mt-2 w-max max-w-[230px] bg-neutral-800 text-white text-xs p-1.5 border-1 border-white shadow-lg opacity-0 group-hover:opacity-100 transition-opacity z-50 pointer-events-none">
                                                                                        <strong>{perk.name}</strong><br /> <p className={`whitespace-pre-line w-fit`}>{perk.desc?.description ?? perk.desc ?? ""}</p>
                                                                                        {perk?.statDescripton?.map((stat) => (
                                                                                            <div className="w-fit">
                                                                                                <p key={stat.name} className="text-xs whitespace-pre-line" style={{ color: stat.color }} dangerouslySetInnerHTML={{ __html: `&nbsp;&nbsp;${stat.name}` }} />
                                                                                            </div>
                                                                                        ))}
                                                                                    </div>
                                                                                </div>) : (
                                                                                    <div key={perk.perkHash} className="relative group ">
                                                                                        <img src={`${API_CONFIG.BUNGIE_API}${perk.iconPath}`} className={"w-[40px] h-[40px]"} alt={perk.name} />
                                                                                        <div className="absolute left-10 top-1 mt-2 w-max max-w-[230px] bg-neutral-800 text-white text-xs p-1.5 border-1 border-white shadow-lg opacity-0 group-hover:opacity-100 transition-opacity z-50 pointer-events-none">
                                                                                            <strong>{perk.name}</strong><br /> <p className={`whitespace-pre-line w-fit`}>{perk.desc?.description ?? perk.desc ?? ""}</p>
                                                                                            {perk?.statDescripton?.map((stat) => (
                                                                                                <div className="w-fit">
                                                                                                    <p key={stat.name} className="text-xs whitespace-pre-line" style={{ color: stat.color }} dangerouslySetInnerHTML={{ __html: `&nbsp;&nbsp;${stat.name}` }} />
                                                                                                </div>
                                                                                            ))}
                                                                                        </div>
                                                                                    </div>
                                                                                )
                                                                        )
                                                                    ))}
                                                                </div>
                                                                {selectedWeapon &&
                                                                    <div className="fixed inset-0 flex items-center justify-center w-full z-50" onClick={() => closeWeaponDetails()} >
                                                                        <div
                                                                            className={`text-white relative`}
                                                                            style={{ top: `${popupPosition.top}px`, left: `${popupPosition.left}px`, position: "absolute", width: "27%" }}
                                                                            onClick={(e) => e.stopPropagation()}
                                                                        >
                                                                            <div style={{ backgroundColor: selectedWeapon.bgColor.rgb, backgroundImage: `url(${selectedWeapon.mwHeader})`, backgroundPositionX: "top", backgroundSize: "cover", backgroundRepeat: "no-repeat" }} className="py-0.5 pb-1 px-2.5 rounded-t-lg relative">
                                                                                <div className={`text-xl font-semibold flex items-center translate-y-1 ${selectedWeapon.tier > 0 ? "pr-4" : ""}`}>
                                                                                    <a href={`https://www.light.gg/db/es/items/${selectedWeapon.itemHash}`} target="_blank" rel="noopener noreferrer" className="hover:text-neutral-300 uppercase" >{selectedWeapon.name}</a>
                                                                                </div>
                                                                                <div className={`flex items-center justify-between text-sm ${selectedWeapon.tier > 0 ? "pr-4" : ""}`}>
                                                                                    <div className="flex items-center">
                                                                                        <p className="opacity-[0.7]">{selectedWeapon.weaponType}</p>
                                                                                        <img src={API_CONFIG.BUNGIE_API + selectedWeapon.ammo.iconPath} className="w-[25px] h-[25px] ml-0.5 mr-0.5" title={selectedWeapon.ammo.name} />
                                                                                        <img src={API_CONFIG.BUNGIE_API + selectedWeapon.dmgType.iconPath} className="w-[14px] h-[14px]" title={selectedWeapon.dmgType.name} />
                                                                                        {selectedWeapon.champmod && (
                                                                                            <div style={{ backgroundColor: selectedWeapon.champmod.backgroundColor, display: "inline-block", borderRadius: "2px" }} className="ml-1 px-0">
                                                                                                <img src={API_CONFIG.BUNGIE_API + selectedWeapon.champmod.iconPath} className="w-[17px] h-[17px]" title={selectedWeapon.champmod.name} />
                                                                                            </div>
                                                                                        )}
                                                                                    </div>
                                                                                    <div className="flex items-center">
                                                                                        <p className='lightlevel text-sm ml-1 flex items-center' style={{ color: "#E5D163", textShadow: "0px 3px 3px rgba(37, 37, 37, 0.4)" }}>
                                                                                            <i className="icon-light mr-1" style={{ fontStyle: 'normal', fontSize: '1.1rem', position: 'relative', top: '-0.1rem' }} />{selectedWeapon.power}
                                                                                        </p>
                                                                                    </div>
                                                                                </div>
                                                                                {selectedWeapon.tier > 0 && <div
                                                                                    style={{
                                                                                        backgroundImage: `url(${API_CONFIG.BUNGIE_API + selectedWeapon.watermark})`,
                                                                                        backgroundPosition: "-1.413px -1.413px",
                                                                                        height: "67.82px",
                                                                                        width: "17px",
                                                                                        paddingTop: "22px",
                                                                                        pointerEvents: "none",
                                                                                    }}
                                                                                    className="flex bg-no-repeat box-border bg-cover items-center right-0 top-0 space-y-1 flex-col absolute items-center">
                                                                                    {Array.from({ length: selectedWeapon.tier }).map((_, index) => (
                                                                                        <div
                                                                                            key={index}
                                                                                            className="w-[6px] h-[6px] transform rotate-45"
                                                                                            style={{
                                                                                                backgroundColor: "#ffffffdd",
                                                                                            }}
                                                                                        />
                                                                                    ))}
                                                                                </div>}
                                                                            </div>
                                                                            <div style={{ backgroundColor: selectedWeapon.bgColor.rgba }} >
                                                                                {selectedWeapon.weaponLevel.weaponLvl && <div className="text-sm flex items-center space-x-1 relative p-2 pb-1">
                                                                                    {selectedWeapon.craftedenchanced?.includes("deepsight") && (
                                                                                        <svg width="13" height="13" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg" fill="#d23636">
                                                                                            <path d="M0 17.616h6.517c5.314 0 5.486 5.073 5.486 7.192l-.003 3.288h2.53v3.904H0zm31.997 0h-6.517c-5.314 0-5.486 5.073-5.486 7.192l.003 3.288h-2.53v3.904h14.53zM0.003 14.384h6.517c5.314 0 5.486-5.073 5.486-7.192L12.003 3.904h2.53V0H0zm31.997 0h-6.517c-5.314 0-5.486-5.073-5.486-7.192l.003-3.288h-2.53V0h14.53z" />
                                                                                        </svg>
                                                                                    )}
                                                                                    {selectedWeapon.craftedenchanced?.includes("info") && (
                                                                                        <svg width="17" height="17" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg" fill="#d23636">
                                                                                            <path d="m0 17.25h7l0 2h4c1 0 3 1 3.75 2v10.75zm32 0h-7l0 2h-4c-1 0-3 1-3.75 2v10.75zm-32-2.5h7l0-2h4c1 0 3-1 3.75-2v-10.75zm32 0h-7l0-2h-4c-1 0-3-1-3.75-2v-10.75z" />
                                                                                        </svg>
                                                                                    )}
                                                                                    <div className="bg-[#222] w-full relative">
                                                                                        <div className="bg-[#d25336] h-full absolute" style={{ width: `${Math.min((selectedWeapon.weaponLevel.levelprogress / selectedWeapon.weaponLevel.levelCompletition) * 100, 100)}%`, }} />
                                                                                        <div className="flex justify-between items-center px-1 relative z-10 text-white text-xs font-[300]">
                                                                                            <span>
                                                                                                Niv. {selectedWeapon.weaponLevel.weaponLvl}
                                                                                                {selectedWeapon.weaponLevel.mejora && " (" + selectedWeapon.weaponLevel.mejora + ")"}
                                                                                            </span>
                                                                                            <span>{((selectedWeapon.weaponLevel.levelprogress / selectedWeapon.weaponLevel.levelCompletition) * 100).toFixed(0)}%</span>
                                                                                        </div>
                                                                                    </div>
                                                                                </div>}
                                                                                <div className="flex flex-col py-1.5">
                                                                                    {selectedWeapon.stats.map((stat) => (
                                                                                        <div key={stat.statHash} className="flex items-center text-xs" style={{ width: "100%", justifyContent: "center" }} title={stat.desc || ""}>
                                                                                            <p style={{ width: "42%", textAlign: "right", fontWeight: "300" }} className={stat.isMw ? "text-[#e8a534]" : ""}>{stat.name}</p>
                                                                                            <p style={{ width: "10%", textAlign: "right", fontWeight: "300", marginRight: "2%" }} className={stat.isMw ? "text-[#e8a534]" : ""}>{stat.value}</p>
                                                                                            {stat.statHash === 2715839340 ? (
                                                                                                <div style={{ width: "34%" }}>
                                                                                                    <RecoilStat value={stat.value} />
                                                                                                </div>
                                                                                            ) : (
                                                                                                <div className="bg-[#333] h-3 overflow-hidden flex" style={{ width: "34%", visibility: [4284893193, 2715839340, 3871231066, 925767036, 2961396640].includes(stat.statHash) ? "hidden" : "visible" }}>
                                                                                                    {!([4284893193, 2715839340, 3871231066, 2961396640].includes(stat.statHash)) && (
                                                                                                        Object.entries(stat.secciones || {}).map(([key, section]) => (
                                                                                                            <div key={key} className="h-full" style={{ width: `${Math.min(section.value, 100)}%`, backgroundColor: section.color }} title={section.name || null} />
                                                                                                        )
                                                                                                        ))}
                                                                                                </div>
                                                                                            )}
                                                                                        </div>
                                                                                    ))}
                                                                                </div>
                                                                                <div className="flex space-x-1 rounded-b-lg p-2 justify-center" >
                                                                                    <div className="space-y-1 flex flex-col justify-top items-center " style={{ width: "28%" }}>
                                                                                        <p className="font-semibold text-sm">Armazón</p>
                                                                                        <div className="flex items-center space-x-2 w-fit">
                                                                                            {selectedWeapon.perks.cosmeticPerks.archetype.map((perk, index) => (
                                                                                                <div key={index} className="relative w-fit group">
                                                                                                    <img src={`${API_CONFIG.BUNGIE_API}${perk.iconPath}`} className="w-[30.5px] h-[30.5px] group" alt={perk.name} />
                                                                                                    <div className="absolute left-8 -top-12 mt-2 w-max max-w-[230px] bg-neutral-800 text-white text-xs p-1.5 border-1 border-white shadow-lg opacity-0 group-hover:opacity-100 transition-opacity z-10 pointer-events-none">
                                                                                                        <strong>{perk.name}</strong><br /> <p className={`whitespace-pre-line w-fit`}>{perk.desc?.description ?? perk.desc ?? ""}</p>
                                                                                                        {perk?.statDescripton?.map((stat) => (
                                                                                                            <div className="w-fit">
                                                                                                                <p key={stat.name} className="text-xs whitespace-pre-line" style={{ color: stat.color }} dangerouslySetInnerHTML={{ __html: `&nbsp;&nbsp;${stat.name}` }} />
                                                                                                            </div>
                                                                                                        ))}
                                                                                                    </div>
                                                                                                </div>
                                                                                            ))}
                                                                                        </div>
                                                                                    </div>
                                                                                    <div className="border-l border-0.5 border-white/25 " style={{ height: "67px" }} />
                                                                                    <div className="space-y-1 flex flex-col justify-top items-center" style={{ width: "28%" }}>
                                                                                        <p className="font-semibold text-sm">Diseño</p>
                                                                                        <div className="flex flex-wrap space-x-1.5 w-fit mt-1">
                                                                                            {selectedWeapon.perks.cosmeticPerks.design.map((perk, index) => (
                                                                                                perk.name && perk?.iconPath && perk.name !== "Ranura de potenciador de nivel de arma vacía" && (
                                                                                                    <img key={index} src={`${API_CONFIG.BUNGIE_API}${perk.iconPath}`} className={"max-w-[25px] max-h-[25px]"} alt={perk.name} title={perk.name} />
                                                                                                )
                                                                                            ))}
                                                                                        </div>
                                                                                    </div>
                                                                                    <div className="border-l border-0.5 border-white/25 " style={{ height: "67px" }} />
                                                                                    <div className="space-y-1 flex flex-col justify-top items-center ml-1" style={{ width: "28%" }}>
                                                                                        <p className="font-semibold text-sm">Muertes</p>
                                                                                        <div className="flex space-x-1 items-center">
                                                                                            {selectedWeapon.perks.cosmeticPerks.tracker.map((perk, index) => (
                                                                                                perk.name && perk?.iconPath && perk.name !== "Ranura de potenciador de nivel de arma vacía" && (
                                                                                                    <img key={index} src={`${API_CONFIG.BUNGIE_API}${perk.iconPath}`} className={"w-[30px] h-[30px]"} alt={perk.name} title={perk.name} />
                                                                                                )
                                                                                            ))}
                                                                                            {selectedWeapon.tracker && (
                                                                                                <div className="flex flex-col items-start space-x-2 text-[0.68rem]" style={{ fontWeight: "300" }}>
                                                                                                    <p>{selectedWeapon.tracker}</p>
                                                                                                    <p>{selectedWeapon.perks.cosmeticPerks.tracker[0].name == "Contador de bajas" ? "Enemigos" : "Guardianes"}</p>
                                                                                                </div>
                                                                                            )}
                                                                                        </div>
                                                                                    </div>
                                                                                </div>
                                                                            </div>
                                                                        </div>
                                                                    </div>}
                                                                {showArtifact && (
                                                                    <div className="fixed inset-0 flex items-center justify-center z-50 w-full" onClick={() => closeWeaponDetails()}>
                                                                        <div
                                                                            className={`text-white relative`}
                                                                            style={{
                                                                                top: `${popupPosition.top}px`,
                                                                                left: `${popupPosition.left - 12}px`,
                                                                                position: "absolute",
                                                                                width: "27%",
                                                                            }}
                                                                            onClick={(e) => e.stopPropagation()}
                                                                        >
                                                                            <div className="p-2 px-4 rounded-lg">
                                                                                <div style={{ backgroundColor: items[16].bgColor.rgb, backgroundImage: `url(${items[16].mwHeader})`, backgroundPositionX: "top", backgroundSize: "cover", backgroundRepeat: "no-repeat" }} className="py-0.5 pb-1 px-2.5 rounded-t-lg">
                                                                                    <div className="text-xl font-semibold flex items-center translate-y-1">
                                                                                        <a href={`https://www.light.gg/db/es/items/${items[16].itemHash}`} target="_blank" rel="noopener noreferrer" className="hover:text-neutral-300 uppercase" >{items[16].name}</a>
                                                                                    </div>
                                                                                    <div className="flex items-center justify-between text-sm">
                                                                                        <p className="opacity-75">{items[16].weaponType}</p>
                                                                                        <p className="opacity-25">Leyenda</p>
                                                                                    </div>
                                                                                </div>
                                                                                <div style={{ backgroundColor: items[16].bgColor.rgba }} className="pt-2 px-2.5 rounded-b-lg">
                                                                                    <p className=" text-xs font-[300]">{items[16].desc}</p>
                                                                                    <div className="flex space-x-2 items-center">
                                                                                        <div className="space-x-2 flex">
                                                                                            <p className="opacity-[0.90] tracking-wide">Disponibles</p>
                                                                                            <span className="font-bold">{showArtifact.points}/{showArtifact.pointsCap}</span>
                                                                                        </div>
                                                                                        <svg viewBox="-10 -10 140 140" style={{ padding: "5px", width: "60px" }} className="relative">
                                                                                            <polygon
                                                                                                points="60,0 120,60 60,120 0,60"
                                                                                                fill="transparent"
                                                                                                stroke="rgba(0, 0, 0, 0.4)"
                                                                                                strokeWidth="7.5"
                                                                                            />
                                                                                            <polygon
                                                                                                points="60,0 120,60 60,120 0,60"
                                                                                                fill="none"
                                                                                                stroke="#00d4d4"
                                                                                                strokeWidth="7.5"
                                                                                                strokeDasharray="360"
                                                                                                strokeDashoffset={370 * (1 - showArtifact.powerProgress / showArtifact.powerProgressNextLvl)}
                                                                                            />
                                                                                            <polygon
                                                                                                points="60,28 92,60 60,92 28,60"
                                                                                                fill="transparent"
                                                                                                stroke="white"
                                                                                                strokeWidth="15"
                                                                                                strokeDasharray="191"
                                                                                                strokeLinecap="square"
                                                                                                strokeDashoffset={211 * (1 - showArtifact.pointsProgress / showArtifact.pointsProgressNextLvl)}
                                                                                            />
                                                                                        </svg>
                                                                                        <p style={{ color: "#00d4d4" }} className="text-xl font-extrabold">+{showArtifact.powerBonus}</p>
                                                                                    </div>
                                                                                </div>
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                )}
                                                                {showGhost && (
                                                                    <div className="fixed inset-0 flex items-center justify-center z-50 w-full" onClick={() => closeWeaponDetails()}>
                                                                        <div
                                                                            className={`text-white relative`}
                                                                            style={{
                                                                                top: `${popupPosition.top}px`,
                                                                                left: `${popupPosition.left - 12}px`,
                                                                                position: "absolute",
                                                                                width: "27%",
                                                                            }}
                                                                            onClick={(e) => e.stopPropagation()}
                                                                        >
                                                                            <div className="p-2 px-4 rounded-lg">
                                                                                <div style={{ backgroundColor: items[8].bgColor.rgb, backgroundImage: `url(${items[8].mwHeader})`, backgroundPositionX: "top", backgroundSize: "cover", backgroundRepeat: "no-repeat" }} className="py-0.5 pb-1 px-2.5 rounded-t-lg">
                                                                                    <div className="text-xl font-semibold flex items-center translate-y-1">
                                                                                        <a href={`https://www.light.gg/db/es/items/${items[8].itemHash}`} target="_blank" rel="noopener noreferrer" className="hover:text-neutral-300 uppercase" >{items[8].name}</a>
                                                                                    </div>
                                                                                    <div className="flex items-center justify-between text-sm">
                                                                                        <p className="opacity-75">{items[8].weaponType}</p>
                                                                                        <p className="opacity-50">{items[8].rarityName}</p>
                                                                                    </div>
                                                                                </div>
                                                                                <div style={{ backgroundColor: items[8].bgColor.rgba }} className="py-2 px-2.5 rounded-b-lg">
                                                                                    <p className=" text-xs font-[300]">{items[8].desc}</p>
                                                                                    <div className="flex flex-col justify-start font-[200] mt-2">
                                                                                        <span className="text-sm flex"><p className="font-semibold mr-1">10</p> ENERGÍA</span>
                                                                                        <div className="flex w-full space-x-0.5">
                                                                                            {Array.from({ length: items[8].armorEnergy.energyUsed }).map((_, index) => (
                                                                                                <div key={index} style={{ width: "18%", height: "10px", backgroundColor: "white" }} />
                                                                                            ))}
                                                                                            {Array.from({ length: items[8].armorEnergy.energyUnused }).map((_, index) => (
                                                                                                <div key={index} style={{ width: "18%", height: "10px", backgroundColor: "transparent", border: "2px solid white" }} />
                                                                                            ))}
                                                                                        </div>
                                                                                    </div>
                                                                                    <div className="space-y-1 justify-center flex flex-col items-center mt-2">
                                                                                        <p className="text-sm font-semibold">Diseño</p>
                                                                                        <div className="flex space-x-2 items-center mt-1.5">
                                                                                            {items[8].perks.slice(0, 2).map((perk) => (
                                                                                                perk && perk.iconPath && (
                                                                                                    <img src={`${API_CONFIG.BUNGIE_API}${perk.iconPath}`} className={"w-[30.5px] h-[30.5px]"} alt={perk.name} title={perk.name} />)
                                                                                            ))}
                                                                                        </div>
                                                                                    </div>
                                                                                </div>
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div className={`relative ${items[index].masterwork === 8 || items[index].masterwork === 9 || items[index].masterwork === 5 || items[index].masterwork === 4 ? "masterwork item-wrapper" : ""}`}>
                                                        <img
                                                            src={`${API_CONFIG.BUNGIE_API}${items[index].icon}`}
                                                            width={60}
                                                            height={60}
                                                            alt={items[index].name}
                                                            title={items[index].name}
                                                            onClick={(e) => [0, 1, 2, 16, 8].includes(index) && handleWeaponClick(items[index], e, index)}
                                                            className={`${[0, 1, 2, 16, 8].includes(index) ? "cursor-pointer" : ""} `}

                                                        />
                                                        {(items[index].masterwork === 8 || items[index].masterwork === 9 || items[index].masterwork === 5 || items[index].masterwork === 4) && (
                                                            <div className="masterwork-overlay" />
                                                        )}
                                                        {(items[index].craftedenchanced?.includes("info") || items[index].craftedenchanced?.includes("deepsight")) && (
                                                            <div className="craftedshadow" />
                                                        )}
                                                        {items[index].watermark && (
                                                            <img
                                                                src={`${API_CONFIG.BUNGIE_API}${items[index].watermark}`}
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
                                                            src={`${API_CONFIG.BUNGIE_API}${items[index].icon}`}
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
                                                                src={`${API_CONFIG.BUNGIE_API}${items[index].watermark}`}
                                                                className="absolute bottom-0 right-0 w-[60px] h-[60px] z-40 pointer-events-none"
                                                            />
                                                        )}
                                                    </div>
                                                    <div className="ml-4 justify-between flex flex-col">
                                                        <div className="flex space-x-2 mb-1">
                                                            {items[index].perks.modifierPerks.map((perk) => (
                                                                perk && perk.isVisible && perk.name !== "Mejorar armadura" && perk.perkType != "intrinsics" && (
                                                                    <div className="relative w-[40px] h-[40px] group">
                                                                        <img
                                                                            src={`${API_CONFIG.BUNGIE_API}${perk.iconPath}`}
                                                                            width={40}
                                                                            height={40}
                                                                            alt={perk.name}
                                                                            className="w-full h-full group"
                                                                        />
                                                                        {perk.investmentStats?.[0]?.value && (
                                                                            <span className="absolute top-0.5 right-[0.5px] text-white text-[0.5rem] rounded-full px-1">
                                                                                {perk.investmentStats[0].value}
                                                                            </span>
                                                                        )}
                                                                        <div className="absolute left-10 top-1 mt-2 w-max max-w-[230px] bg-neutral-800 text-white text-xs p-1.5 border-1 border-white shadow-lg opacity-0 group-hover:opacity-100 transition-opacity z-50 pointer-events-none">
                                                                            <strong>{perk.name}</strong><br />
                                                                            {perk.desc?.description && (<p className={`text-xs whitespace-pre-line w-fit`} style={{ color: perk.desc?.color ?? "#FFF" }} dangerouslySetInnerHTML={{ __html: `${perk.desc?.description}` }} />)}
                                                                        </div>
                                                                    </div>
                                                                )
                                                            ))}
                                                        </div>
                                                        {selectedArmor &&
                                                            <div className="fixed inset-0 flex items-center justify-center w-full z-50" onClick={() => closeArmorDetails()} >
                                                                <div
                                                                    className="text-white relative"
                                                                    style={{ top: `${popupPosition.top}px`, left: `${popupPosition.left}px`, position: "absolute", width: "27%" }}
                                                                    onClick={(e) => e.stopPropagation()}
                                                                >
                                                                    <div className="py-1 px-2.5 rounded-t-lg" style={{ backgroundColor: selectedArmor.bgColor.rgb, backgroundImage: `url(${selectedArmor.mwHeader})`, backgroundPosition: "top", backgroundSize: "contain", backgroundRepeat: "no-repeat" }}>
                                                                        <div className="flex flex-col">
                                                                            <div className={`text-xl font-semibold flex items-center translate-y-1 ${selectedArmor.tier > 0 ? "pr-4" : ""}`}>
                                                                                <a href={`https://www.light.gg/db/es/items/${selectedArmor.itemHash}`} target="_blank" rel="noopener noreferrer" className="hover:text-neutral-300 uppercase" >{selectedArmor.name}</a>
                                                                            </div>
                                                                            <div className={`flex justify-between items-center text-sm ${selectedArmor.tier > 0 ? "pr-4" : ""}`}>
                                                                                <p className="opacity-75">{selectedArmor.armorCategory}</p>
                                                                                <p className='lightlevel text-sm flex items-center' style={{ color: "#E5D163", textShadow: "0px 3px 3px rgba(37, 37, 37, 0.4)" }}>
                                                                                    <i className="icon-light mr-1" style={{ fontStyle: 'normal', fontSize: '1.1rem', position: 'relative', top: '-0.1rem' }} />{selectedArmor.power}
                                                                                </p>
                                                                            </div>
                                                                        </div>
                                                                        {selectedArmor.tier > 0 && <div
                                                                            style={{
                                                                                backgroundImage: `url(${API_CONFIG.BUNGIE_API + selectedArmor.watermark})`,
                                                                                backgroundPosition: "-1.413px -1.413px",
                                                                                height: "67.82px",
                                                                                width: "16.951px",
                                                                                paddingTop: "22px",
                                                                                pointerEvents: "none",
                                                                            }}
                                                                            className="flex bg-no-repeat box-border bg-cover items-center right-0 top-0 space-y-1 flex-col absolute items-center">
                                                                            {Array.from({ length: selectedArmor.tier }).map((_, index) => (
                                                                                <div
                                                                                    key={index}
                                                                                    className="w-[6px] h-[6px] transform rotate-45"
                                                                                    style={{
                                                                                        backgroundColor: "#ffffffdd",
                                                                                    }}
                                                                                />
                                                                            ))}
                                                                        </div>}
                                                                    </div>
                                                                    <div className="rounded-b-lg pb-3 px-2.5 py-0.5 space-y-2" style={{ backgroundColor: selectedArmor.bgColor.rgba }}>
                                                                        <div className="flex flex-col pt-1">
                                                                            {selectedArmor.stats
                                                                                ?.sort((a, b) => {
                                                                                    const order = [392767087, 4244567218, 1735777505, 144602215, 1943323491, 2996146975, 1];
                                                                                    return order.indexOf(a.statHash) - order.indexOf(b.statHash);
                                                                                })
                                                                                .map((stat) => (
                                                                                    <div key={stat.statHash} className="flex items-center text-xs relative w-fit group" style={{ width: "100%", justifyContent: "center" }}>
                                                                                        <div className="absolute left-70 top-1 mt-2 w-max max-w-[230px] bg-neutral-800 text-white text-xs p-1.5 border-1 border-white shadow-lg opacity-0 group-hover:opacity-100 transition-opacity z-50 pointer-events-none">
                                                                                            <p>{stat.desc}</p>
                                                                                        </div>
                                                                                        <p style={{ width: "31%", textAlign: "right", fontWeight: "300", marginRight: "2%" }} className={stat.isMw ? "text-[#e8a534]" : ""}>{stat.name}</p>
                                                                                        <p style={{ width: "8%", textAlign: "right", fontWeight: "300", marginRight: "2%", marginLeft: "1%" }} className={stat.isMw ? "text-[#e8a534]" : "" + stat.statHash == 1 ? "border-t-1 border-white" : ""}>{stat.statHash != 1 && "+"}{stat.value}</p>
                                                                                        {stat.iconPath ? (
                                                                                            <img src={`${API_CONFIG.BUNGIE_API}${stat.iconPath}`} height={12} style={{ marginRight: "3px", width: "3.5%" }} />
                                                                                        ) : (
                                                                                            <div style={{ width: "3.5%" }} />
                                                                                        )
                                                                                        }
                                                                                        {stat.statHash === 1 ? (
                                                                                            <div style={{ width: "38%" }} className={`h-[15.5px] overflow-hidden flex font-[300] items-center  ${stat.secciones.base.value != 0 ? "" : "invisible"}`}>
                                                                                                {Object.entries(stat.secciones || {}).map(([key, section]) => (
                                                                                                    <p key={key} className="h-full" style={{ color: section.color, marginRight: "4px" }}>{section.color !== "#fff" && "+"} {section.value}</p>
                                                                                                ))}
                                                                                            </div>
                                                                                        ) : (
                                                                                            <div className="bg-[#333] h-3 overflow-hidden flex" style={{ width: "38%" }}>
                                                                                                {Object.entries(stat.secciones || {}).map(([key, section]) => (
                                                                                                    <div key={key} className="h-full" style={{ width: `${(section.value / 42) * 100}%`, backgroundColor: section.color }} title={section.name || null} />
                                                                                                ))}
                                                                                            </div>
                                                                                        )}
                                                                                    </div>
                                                                                ))}
                                                                        </div>
                                                                        <div className="flex flex-col justify-start font-[200]">
                                                                            <span className="text-sm flex"><p className="font-semibold mr-1">{selectedArmor.armorEnergy.energyCapacity}</p> ENERGÍA</span>
                                                                            <div className="flex w-full space-x-0.5" >
                                                                                {Array.from({ length: selectedArmor.armorEnergy.energyUsed }).map((_, index) => (
                                                                                    <div key={index} style={{ width: "18%", height: "10px", backgroundColor: "white" }} />
                                                                                ))}
                                                                                {Array.from({ length: selectedArmor.armorEnergy.energyUnused }).map((_, index) => (
                                                                                    <div key={index} style={{ width: "18%", height: "10px", backgroundColor: "transparent", border: "2px solid white" }} />
                                                                                ))}
                                                                                {Array.from({ length: selectedArmor.armorEnergy.energyCapacityUnused }).map((_, index) => (
                                                                                    <div key={index} style={{ width: "18%", height: "6px", backgroundColor: "#888", marginTop: "2px", marginBottom: "2px" }} />
                                                                                ))}
                                                                            </div>
                                                                        </div>
                                                                        <div className="flex space-x-4 justify-center">
                                                                            {selectedArmor.armorIntrinsic.length > 0 && (
                                                                                <>
                                                                                    <div className="space-y-1 flex flex-col justify-center items-center" style={{ width: "27%" }}>
                                                                                        <p className="text-sm font-semibold">Ventajas</p>
                                                                                        <div className="flex flex space-x-2">
                                                                                            {selectedArmor.armorIntrinsic?.map((intrinsic, index) => (
                                                                                                <div key={index} className="relative w-fit group">
                                                                                                    <img src={`${API_CONFIG.BUNGIE_API}${intrinsic.iconPath}`} className="w-[30.5px] h-[30.5px] group" alt={intrinsic.name} />
                                                                                                    <div className="absolute left-8 -top-14 mt-2 w-max max-w-[230px] bg-neutral-800 text-white text-xs p-1.5 border-1 border-white shadow-lg opacity-0 group-hover:opacity-100 transition-opacity z-10 pointer-events-none">
                                                                                                        <strong>{intrinsic.name}</strong><br />{intrinsic.desc}
                                                                                                    </div>
                                                                                                </div>
                                                                                            ))}
                                                                                        </div>
                                                                                    </div>
                                                                                    <div className="border-l border-0.5 border-white/25 mr-4.5" style={{ height: "58px" }} />
                                                                                </>
                                                                            )}
                                                                            <div className="space-y-1 flex flex-col justify-center items-center  font-[200]" style={{ width: "27%" }}>
                                                                                <p className="text-sm font-semibold">Diseño</p>
                                                                                <div className="space-x-2 flex flex ">
                                                                                    {selectedArmor.perks?.cosmeticPerks?.map((perk) => (
                                                                                        perk.name && perk?.iconPath && (
                                                                                            <img src={`${API_CONFIG.BUNGIE_API}${perk.iconPath}`} className={"w-[30.5px] h-[30.5px]"} alt={perk.name} title={perk.name} />
                                                                                        )
                                                                                    ))}
                                                                                </div>
                                                                            </div>
                                                                        </div>
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
                                                <div key={stat.statHash} className="flex items-center" onMouseEnter={(e) => handleStatHover(stat, e)} onMouseLeave={() => handleStatLeave()}>
                                                    <img src={`${API_CONFIG.BUNGIE_API}${stat.iconPath}`} className="mr-0.5" width={23} height={23} alt={stat.name} />
                                                    {stat.value}
                                                </div>
                                            )
                                        ))}
                                    </div>
                                    {selectedStat && (
                                        <StatPopup
                                            stat={selectedStat}
                                            position={statPopupPosition}
                                            onClose={() => setSelectedStat(null)}
                                        />
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    )}
                    {activeTab === "Cosmeticos" && !loading && (
                        <motion.div
                            key="Cosmeticos"
                            initial={{ x: "100%", opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            exit={{ x: "100%", opacity: 0 }}
                            transition={{ duration: 0.25 }}
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
                                                    <a href={`https://www.light.gg/db/es/items/${items[index].itemHash}`} target="_blank" rel="noopener noreferrer" className="hover:text-neutral-300">
                                                        <img src={`${API_CONFIG.BUNGIE_API}${items[index].icon}`} className="w-[50px] h-[50px]" alt={items[index].name} title={items[index].name} />
                                                    </a>
                                                    {items[index].watermark && (
                                                        <img
                                                            src={`${API_CONFIG.BUNGIE_API}${items[index].watermark}`}
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
                                                                                    <stop stopColor="#eade8b" offset="50%" stopOpacity="0"></stop>
                                                                                    <stop stopColor="#eade8b" offset="100%" stopOpacity="1"></stop>
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
                                                                            <image href={API_CONFIG.BUNGIE_API + perk.iconPath} x="10" y="10" width="80" height="80" mask="url(#mask)"></image>
                                                                            <circle cx="50" cy="50" r="46" stroke="white" fill="transparent" strokeWidth="2" className="od45Ah47"></circle>
                                                                        </svg>
                                                                    </div>) : (
                                                                        <img src={`${API_CONFIG.BUNGIE_API}${perk.iconPath}`} className={"w-[40px] h-[40px]"} alt={perk.name} title={perk.name} />
                                                                    )}
                                                                {perk.watermark && (
                                                                    <img src={`${API_CONFIG.BUNGIE_API}${perk.watermark}`} className="absolute bottom-0 right-0 w-[40px] h-[40px] z-50 pointer-events-none" />
                                                                )}
                                                            </div>
                                                        )
                                                    ))}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </fieldset>
                                <fieldset className="flex flex-col border-2 px-4 rounded-lg w-fit text-start items-center justify-center w-full py-2 h-full">
                                    <legend className="text-white text-sm mb-2 z-10 font-semibold px-2">SELLO / TÍTULO</legend>
                                    <div className="justify-center items-center flex w-full">
                                        {seal && (
                                            <div className="flex flex-col justify-center items-center mb-4 w-4/5 cursor-pointer relative group" onClick={() => window.open(`https://bray.tech/triumphs/seal/${seal.sealHash}`, '_blank')}>
                                                <img src={`${API_CONFIG.BUNGIE_API}${seal.iconPath}`} className="w-[70px] h-[70px]" />
                                                <div
                                                    className="flex mt-2 items-center justify-center py-1 w-full border-white/25 border-y-[0.1px]"
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
                                                <div className="absolute left-42 top-1 mt-2 w-max max-w-[230px] bg-neutral-800 text-white text-xs p-1.5 border-1 border-white shadow-lg opacity-0 group-hover:opacity-100 transition-opacity z-50 pointer-events-none">
                                                    <p className="w-fit whitespace-pre-line text-xs">{seal.desc?.description ?? seal.desc ?? ""}</p>
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
                                                        <a href={`https://www.light.gg/db/es/items/${perk.plugHash}`} target="_blank" rel="noopener noreferrer" className="hover:text-neutral-300">
                                                            <div className="relative group">
                                                                <img src={`${API_CONFIG.BUNGIE_API}${perk.iconPath}`} className="w-[50px] h-[50px]" alt={perk.name} />
                                                                <div className="absolute left-12 top-10 mt-2 w-max max-w-[230px] bg-neutral-800 text-white text-xs p-1.5 border-1 border-white shadow-lg opacity-0 group-hover:opacity-100 transition-opacity z-50 pointer-events-none">
                                                                    <strong>{perk.name}</strong><br />
                                                                    <p className="w-fit whitespace-pre-line text-xs">{perk.desc?.description ?? perk.desc ?? ""}</p>
                                                                </div>
                                                            </div>
                                                        </a>
                                                        {perk.watermark && (
                                                            <img src={`${API_CONFIG.BUNGIE_API}${perk.watermark}`} className="absolute bottom-0 right-0 w-[50px] h-[50px] z-40 pointer-events-none" />
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </fieldset>
                                <fieldset className="flex flex-col border-2 px-4 rounded-lg w-fit text-start items-center justify-center py-4.5 h-full w-full">
                                    <legend className="text-white text-sm mb-2 z-10 font-semibold px-2">EMBLEMAS</legend>
                                    <div className="flex space-x-10 justify-evenly mx-4 pb-3">
                                        {emblems.map((emblem) => (
                                            <div className="flex flex-col mb-5 justify-center items-center">
                                                <h1 className="font-semibold text-sm mb-1">{emblem.class}</h1>
                                                {emblem.iconPath && (
                                                    <div className={`${emblem.currentClass === true ? "shadow-[0_0_6px_4px_rgba(255,215,0,0.8)] w-[50px] h-[50px]" : ""}`}>
                                                        <a href={`https://destinyemblemcollector.com/emblem?id=${emblem.hash}`} target="_blank" rel="noopener noreferrer">
                                                            <div className="relative group">
                                                                <img src={`${API_CONFIG.BUNGIE_API}${emblem.iconPath}`} className="w-[50px] h-[50px]" alt={emblem.name} />
                                                                <div className="absolute left-13 top-1 mt-2 w-max max-w-[230px] bg-neutral-800 text-white text-xs p-1.5 border-1 border-white shadow-lg opacity-0 group-hover:opacity-100 transition-opacity z-50 pointer-events-none">
                                                                    <strong>{emblem.name}</strong><br />
                                                                    <p className="w-fit whitespace-pre-line text-xs">{emblem.desc?.description ?? emblem.desc ?? ""}</p>
                                                                </div>
                                                            </div>
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
                </AnimatePresence>) : (
                    <div className="flex flex-col items-center justify-center h-full">
                        <Spinner medium={true} />
                        <p className="text-white text-center -translate-y-64">Consiguiendo nuevos datos de la API...</p>
                    </div>
                )}
            </div>
        ) : (
            <div className="flex flex-col items-center justify-center h-full">
                <Spinner medium={true} />
                <p className="text-white text-center -translate-y-68">Cargando...</p>
            </div>
        )
    )
}