import { useEffect, useState } from "react";
import inventory from "../../../assets/inventory.png";
import { API_CONFIG } from "../../../config";
import { useBungieAPI } from "../../APIservices/BungieAPIcalls";
import { loadCache, saveCache } from "../../Cache/componentsCache";
import CurrentLoadout from "./CurrentLoadout";
import StatPopup from "./StatPopup";

export default function SimpleLoadout({ membershipType, userId, name, seasonHash, rank, light }) {
    const [showFull, setShowFull] = useState(false);
    const [totalStats, setTotalStats] = useState(null);
    const [items, setItems] = useState(null);
    const [background, setBackground] = useState(null);
    const [superAbility, setSuperAbility] = useState(null);
    const [isVisible, setIsVisible] = useState(false);
    const [animatePopup, setAnimatePopup] = useState(false);
    const { getFullCharacterProfile, getCharacterSimpleInventoryAndEquipment, getItemManifest, getItemInstance } = useBungieAPI();
    const [statPopupPosition, setStatPopupPosition] = useState(null);
    const [selectedStat, setSelectedStat] = useState(null);

    const CACHE_TTL = 50 * 60 * 1000; // 5 minutes
    const cacheKey = `SLoadout_${membershipType}_${userId}`;

    useEffect(() => {
        const fetchSimpleLoadout = async () => {
            const cached = loadCache(cacheKey, CACHE_TTL);
            if (cached) {
                setItems(cached.items);
                setTotalStats(cached.totalStats);
                setBackground(cached.background);
                setSuperAbility(cached.superAbility);
                return;
            }
            try {

                const responseChar = await getFullCharacterProfile(membershipType, userId);
                const characters = responseChar.characters.data;

                //0 masculino, 1 femenino
                const mostRecentCharacter = Object.values(characters).reduce((latest, current) => {
                    return new Date(current.dateLastPlayed) > new Date(latest.dateLastPlayed) ? current : latest;
                });

                const charID = mostRecentCharacter.characterId;
                const classType = mostRecentCharacter.classType;

                const response = await getCharacterSimpleInventoryAndEquipment(membershipType, userId, charID);

                let totalStatss = [392767087, 4244567218, 1735777505, 144602215, 1943323491, 2996146975];
                totalStatss = await getTotalStats(totalStatss, mostRecentCharacter.stats);

                let backgroundLocal = null;
                let superLocal = null;

                const itemDetails = await Promise.all(response.equipment.data.items.map(async (item) => {
                    const itemResponse = await getItemManifest(item.itemHash, "DestinyInventoryItemDefinition");
                    const itemD = await getItemInstance(membershipType, userId, item.itemInstanceId);

                    if ([11].includes(response.equipment.data.items.indexOf(item))) { //Sublcase
                        backgroundLocal = itemResponse.screenshot;
                        await Promise.all(itemD.sockets.data?.sockets?.map(async (perk) => {
                            const perkResponse = await getItemManifest(perk.plugHash, "DestinyInventoryItemDefinition");
                            if (perkResponse.itemTypeDisplayName.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().includes("super")) {
                                superLocal = {
                                    name: perkResponse.displayProperties.name,
                                    iconPath: perkResponse.displayProperties.icon,
                                };
                            }
                        }) || []);
                    }
                    return {
                        name: itemResponse.displayProperties.name,
                        icon: itemResponse.displayProperties.icon,
                        rarity: itemResponse.inventory.tierType,
                    };
                }))
                const finalTotalStats = getDetailsTotalStats(totalStatss);
                setTotalStats(finalTotalStats);
                setItems(itemDetails);
                setBackground(backgroundLocal);
                setSuperAbility(superLocal);

                try {
                    const toSave = {
                        items: itemDetails,
                        totalStats: finalTotalStats,
                        background: backgroundLocal,
                        superAbility: superLocal,
                    };
                    saveCache(cacheKey, toSave);
                } catch (e) {
                    console.error('[CACHE] error measuring/saving slice', e);
                }

            } catch (error) {
                console.error("Error loading loadout:", error);
            }
        }
        fetchSimpleLoadout();
    }, []);

    const handleStatHover = (stat, event) => {
        const rect = event.target.getBoundingClientRect();
        setStatPopupPosition({
            top: rect.top - 120,
            left: rect.left + 65
        });
        setSelectedStat(stat);
    };

    const handleStatLeave = () => {
        setSelectedStat(null);
    };

    async function getPerks(sockets) {
        const perks = await Promise.all(sockets.map(async (socket) => {
            if (!socket.plugHash) return null;
            const perkResponse = await getItemManifest(socket.plugHash, "DestinyInventoryItemDefinition");
            return {
                name: perkResponse.displayProperties.name,
                iconPath: API_CONFIG.BUNGIE_API + perkResponse.displayProperties.icon,
                desc: perkResponse.displayProperties.description,
                type: perkResponse.plug.plugCategoryIdentifier,
                hash: perkResponse.hash,
            };
        }));
        return perks;
    }

    async function getTotalStats(totalStats, mostRecentCharacterStats) {
        const updatedStats = await Promise.all(totalStats.map(async (statHash) => {
            const statResponse = await getItemManifest(statHash, "DestinyStatDefinition");
            return {
                statHash,
                name: statResponse.displayProperties.name,
                iconPath: statResponse.displayProperties.icon,
                description: statResponse.displayProperties.description,
                value: mostRecentCharacterStats[statHash] || 0,
            };
        }));
        return updatedStats;
    }

    function getDetailsTotalStats(totalStats) {
        totalStats.forEach((stat) => {
            let txtb1, txtb2, valb1, valb2, txtMejora, textM1, textM2, textM3, valM1, valM2, valM3;
            switch (stat.statHash) {
                case 392767087: //salud
                    txtb1 = "Salud por orbe";
                    txtb2 = "Resistencia al temblor";
                    valb1 = "+" + (stat.value > 100 ? 70 : stat.value * 0.7).toFixed(1);
                    valb2 = "+" + (stat.value > 100 ? 10 : stat.value * 0.1).toFixed(1) + "%";
                    txtMejora = "Tus escudos se recargan mas rápido y tienen salud adicional al enfrentar combatientes.";
                    textM1 = "Velocidad de recarga de escudo";
                    textM2 = "Salud de escudo";
                    textM3 = null
                    valM1 = stat.value > 100 ? "+" + (stat.value > 200 ? 45.0 : ((stat.value - 100) * 0.45).toFixed(1)) + "%" : null;
                    valM2 = stat.value > 100 ? "+" + (stat.value > 200 ? 20 : ((stat.value - 100) * 0.2).toFixed(1)) : null;
                    valM3 = null;
                    break;
                case 2996146975: //armas
                    txtb1 = "Recarga y manejo";
                    txtb2 = "Daño";
                    valb1 = "+" + (stat.value > 100 ? 10 : stat.value * 0.1).toFixed(1) + "%";
                    valb2 = "+" + (stat.value > 100 ? 15 : stat.value * 0.15).toFixed(1) + "%";
                    txtMejora = "Hay una probabilidad de que las cajas de munición de los objetivos derrotados contengan rondas adicionales. Aumenta el daño con arma contra jefes y guardianes rivales.";
                    textM1 = "Oportunidad de caja de munición grande";
                    textM2 = "Daño principal/especial";
                    textM3 = "Daño de armas de munición pesada";
                    valM1 = stat.value > 100 ? (stat.value * 0.22).toFixed(1) + " %" : null;
                    valM2 = stat.value > 100 ? "+" + (stat.value > 200 ? 15.0 : (stat.value - 100) * 0.15).toFixed(1) + "% PVE\n" + "+" + (stat.value > 200 ? 6 : (stat.value - 100) * 0.06).toFixed(1) + "% PVP" : null;
                    valM3 = stat.value > 100 ? "+" + (stat.value > 200 ? 10.0 : (stat.value - 100) * 0.1).toFixed(1) + "% PVE\n" + "+" + (stat.value > 200 ? 6 : (stat.value - 100) * 0.06).toFixed(1) + "% PVP" : null;
                    break;
                case 1943323491: //clase
                    txtb1 = "Recuperación de habilidad de clase";
                    txtb2 = "Energía de habilidad de clase";
                    valb1 = "0:" + (stat.value > 100 ? 14 : stat.value * 0.14).toFixed(0);
                    valb2 = "+" + (stat.value > 100 ? 190 : stat.value * 1.9).toFixed(0) + "%"; // Energía de habilidad
                    txtMejora = "Obtienes un sobreescudo al usar tu habilidad de clase.";
                    textM1 = "Salud de sobreescudo";
                    textM2 = null;
                    textM3 = null;
                    valM1 = stat.value > 100 ? (stat.value > 200 ? 40.0 : (stat.value - 100) * 0.4).toFixed(1) : null;
                    valM2 = null;
                    valM3 = null;
                    break;
                case 1735777505: //granada
                    txtb1 = "Recuperación de habilidad de granada";
                    txtb2 = "Energía de granada";
                    valb1 = "0:" + (stat.value > 100 ? 41 : stat.value * 0.41).toFixed(0);
                    valb2 = "+" + (stat.value > 100 ? 190 : stat.value * 1.9).toFixed(0) + "%";
                    txtMejora = "Aumenta el daño que infligen tus granadas.";
                    textM1 = "Daño";
                    textM2 = null;
                    textM3 = null;
                    valM1 = stat.value > 100 ? "+" + (stat.value > 200 ? 65.0 : (stat.value - 100) * 0.65).toFixed(1) + "% PVE \n" + "+" + (stat.value > 200 ? 20 : (stat.value - 100) * 0.2).toFixed(1) + "% PVP" : null;
                    valM2 = null;
                    valM3 = null;
                    break;
                case 144602215: //super
                    txtb1 = "Energía de súper";
                    valb1 = "+" + (stat.value > 100 ? 190 : stat.value * 1.9).toFixed(0) + "%";
                    txtMejora = "Aumenta el daño que inflige tu súper.";
                    textM1 = "Daño";
                    textM2 = null;
                    textM3 = null;
                    valM1 = stat.value > 100 ? "+" + (stat.value > 200 ? 45.0 : (stat.value - 100) * 0.45).toFixed(1) + "% PVE\n" + "+" + (stat.value > 200 ? 15 : (stat.value - 100) * 0.15).toFixed(1) + "% PVP" : null;
                    valM2 = null;
                    valM3 = null;
                    break;
                case 4244567218: //cuerpo a cuerpo
                    txtb1 = "Recuperación de cuerpo a cuerpo";
                    txtb2 = "Energía cuerpo a cuerpo";
                    valb1 = "0:" + (stat.value > 100 ? 50 : stat.value * 0.5).toFixed(0);
                    valb2 = "+" + (stat.value > 100 ? 190 : stat.value * 1.9).toFixed(0) + "%";
                    txtMejora = "Aumenta el daño que infligen tus ataques cuerpo a cuerpo.";
                    textM1 = "Daño";
                    textM2 = null; // Solo hay un beneficio mejorado en la imagen
                    textM3 = null;
                    valM1 = stat.value > 100 ? "+" + (stat.value > 200 ? 30 : (stat.value - 100) * 0.30).toFixed(1) + "% PVE\n" + "+" + (stat.value > 200 ? 20 : (stat.value - 100) * 0.2).toFixed(1) + "% PVP" : null;
                    valM2 = null;
                    valM3 = null;
                    break;
            }
            stat.popUps = {
                beneficios: {
                    b1: {
                        text: txtb1,
                        value: valb1,
                    },
                    b2: {
                        text: txtb2,
                        value: valb2,
                    },
                },
                mejora: {
                    text: txtMejora,
                    beneficiosMejora: {
                        m1: {
                            text: textM1,
                            value: valM1,
                        },
                        m2: {
                            text: textM2,
                            value: valM2,
                        },
                        m3: {
                            text: textM3,
                            value: valM3,
                        }
                    },
                }
            }
        })
        return totalStats;
    }

    useEffect(() => {
        if (showFull) {
            setIsVisible(true);
            setTimeout(() => setAnimatePopup(true), 100);
        } else {
            setAnimatePopup(false);
            setTimeout(() => setIsVisible(false), 200);
        }
    }, [showFull]);

    useEffect(() => {
        const handleKeyDown = (event) => {
            if (event.key === "Escape") {
                setShowFull(false);
            }
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => {
            window.removeEventListener("keydown", handleKeyDown);
        };
    }, []);


    return (
        <>
            <div className={`font-Inter h-[450px]`}>
                {totalStats && background && items ? (
                    <div className="bg-gray-300 p-4 py-4 font-Lato rounded-lg space-y-4 text-white" style={{ backgroundImage: `url(${API_CONFIG.BUNGIE_API}${background})`, backgroundSize: "cover", backgroundPosition: "calc(50% - 30px) center" }}>
                        <h2 className="bg-black/25 p-2 rounded-lg w-fit font-semibold text-2xl">LOADOUT</h2>
                        <div className="justify-evenly flex">
                            <div className="bg-black/25 p-2 rounded-lg w-fit space-y-2 font-Lato">
                                {[11, 3, 4, 5, 6, 7, 0, 1, 2].map((index) => (
                                    items[index] && (index < 3 || index === 11 || items[index]?.rarity == 6) && (
                                        index != 11 ? (
                                            <div key={index} className="flex items-center space-x-2">
                                                <img src={`${API_CONFIG.BUNGIE_API}${items[index].icon}`} width={50} height={50} alt={items[index].name} />
                                                <p className="font-semibold">{items[index].name}</p>
                                            </div>
                                        ) : (
                                            <div key={index} className="flex items-center space-x-2">
                                                <img src={`${API_CONFIG.BUNGIE_API}${superAbility?.iconPath}`} width={50} height={50} alt={superAbility?.name} />
                                                <p className="font-semibold">{superAbility?.name}</p>
                                            </div>
                                        )
                                    )
                                ))}
                            </div>
                            {totalStats && <div className="bg-black/25 p-2 rounded-lg w-fit flex flex-col space-y-5 h-fit font-Lato" >
                                {totalStats.map((stat) => (
                                    stat.iconPath && (
                                        <div key={stat.statHash} className="flex items-center font-semibold text-xl" onMouseEnter={(e) => handleStatHover(stat, e)} onMouseLeave={() => handleStatLeave()}>
                                            <img src={`${API_CONFIG.BUNGIE_API}${stat.iconPath}`} width={30} height={30} alt={stat.name} />
                                            <p className="ml-[2px]">{stat.value}</p>
                                        </div>
                                    )
                                ))}
                                {selectedStat && (
                                    <StatPopup
                                        stat={selectedStat}
                                        position={statPopupPosition}
                                        onClose={() => setSelectedStat(null)}
                                    />
                                )}
                            </div>
                            }
                        </div>
                        <div className="flex justify-center">
                            <a onClick={() => setShowFull(true)} className="-translate-x-8 cristal transform transition-transform duration-200 hover:scale-105">
                                <span></span>
                                <span></span>
                                <span></span>
                                <span></span>
                                Ver Más
                            </a>
                        </div>
                    </div>
                ) : (
                    <div className="bg-gray-300 items-center flex text-2xl mt-4 text-black h-full justify-center rounded-lg font-semibold animate-pulse"></div>
                )}
            </div>
            {showFull && (
                <div className="fixed inset-0 flex items-center justify-center w-full h-full z-40 bg-black/50" onClick={() => setShowFull(false)}>
                    <div className={`rounded-lg relative bg-neutral-600 text-white overflow-hidden transition-all duration-200 transform ${animatePopup ? "opacity-100 scale-100" : "opacity-0 scale-90"}`} style={{ width: '65.28%', height: '77.25%', backgroundImage: `url(${inventory})`, backgroundSize: "cover", backgroundPosition: "center" }} onClick={(e) => e.stopPropagation()}>
                        <CurrentLoadout
                            membershipType={membershipType}
                            userId={userId}
                            name={name}
                            seasonHash={seasonHash}
                            rank={rank}
                            light={light}
                            charStats={totalStats}
                        />
                    </div>
                    <button className="bg-neutral-700 text-white rounded-full w-7 h-7 flex items-center self-start justify-center hover:bg-neutral-800 cursor-pointer" style={{ marginTop: "4%" }} onClick={(e) => { e.stopPropagation(); setShowFull(false); }}>✕</button>
                </div>
            )}
        </>
    );
}
