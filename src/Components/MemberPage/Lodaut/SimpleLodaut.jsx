import { useEffect, useState } from "react";
import inventory from "../../../assets/inventory.png";
import { API_CONFIG } from "../../../config";
import { useBungieAPI } from "../../APIservices/BungieAPIcache";
import CurrentLoadout from "./CurrentLoadout";

export default function SimpleLoadout({ membershipType, userId, name, seasonHash, rank, light }) {
    const [showFull, setShowFull] = useState(false);
    const [totalStats, setTotalStats] = useState(null);
    const [items, setItems] = useState(null);
    const [background, setBackground] = useState(null);
    const [superAbility, setSuperAbility] = useState(null);
    const [isVisible, setIsVisible] = useState(false);
    const [animatePopup, setAnimatePopup] = useState(false);
    const { getFullCharacterProfile, getCharacterSimpleInventoryAndEquipment, getItemManifest, getItemInstance } = useBungieAPI();

    useEffect(() => {
        const fetchSimpleLoadout = async () => {
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

                let totalStats = [2996146975, 392767087, 1943323491, 1735777505, 144602215, 4244567218];
                await getTotalStats(totalStats);

                const itemDetails = await Promise.all(response.equipment.data.items.map(async (item) => {
                    const itemResponse = await getItemManifest(item.itemHash, "DestinyInventoryItemDefinition");
                    const itemD = await getItemInstance(membershipType, userId, item.itemInstanceId);

                    if ([3, 4, 5, 6, 7].includes(response.equipment.data.items.indexOf(item))) {
                        const statsList = itemD.stats.data?.stats;
                        for (const stat of Object.values(statsList)) {
                            try {
                                totalStats.find((baseStat) => baseStat.statHash === stat.statHash).value += stat.value;
                            } catch (error) {
                                console.error(`Error fetching stat definition for ${stat.statHash}:`, error);
                            }
                        }
                    }
                    if ([11].includes(response.equipment.data.items.indexOf(item))) { //Sublcase
                        setBackground(itemResponse.screenshot);
                        await Promise.all(itemD.sockets.data?.sockets?.map(async (perk) => {
                            const perkResponse = await getItemManifest(perk.plugHash, "DestinyInventoryItemDefinition");
                            if (perkResponse.itemTypeDisplayName.includes("Súper")) {
                                setSuperAbility({
                                    name: perkResponse.displayProperties.name,
                                    iconPath: perkResponse.displayProperties.icon,
                                });
                            }
                            if (perkResponse.investmentStats.length > 0) { //Si el fragmento tiene algun bonus o penalizacion de stats
                                if (perkResponse.hash == 2272984671 || perkResponse.hash == 1727069360) { //Si es un fragmento de clase
                                    switch (classType) {
                                        case 0: //Titan resto resistencia
                                            totalStats[1].value -= Math.abs(perkResponse.investmentStats[3].value);
                                            break;
                                        case 1: //Cazador resto movilidad
                                            totalStats[4].value -= Math.abs(perkResponse.investmentStats[2].value);
                                            break;
                                        case 2: //Hechicero resto recuperacion
                                            totalStats[3].value -= Math.abs(perkResponse.investmentStats[1].value);
                                            break;
                                    }
                                }
                                else for (const stat of Object.values(perkResponse.investmentStats).slice(1)) {
                                    const baseStat = totalStats.find((baseStat) => baseStat.statHash == stat.statTypeHash);
                                    if (stat.value < 0) {
                                        baseStat.value -= Math.abs(stat.value);
                                    } else {
                                        baseStat.value += stat.value;
                                    }
                                }
                            }
                        }) || []);
                    }
                    return {
                        name: itemResponse.displayProperties.name,
                        icon: itemResponse.displayProperties.icon,
                        rarity: itemResponse.inventory.tierType,
                    };
                }))
                setTotalStats(totalStats);
                setItems(itemDetails);

            } catch (error) {
                console.error("Error loading loadout:", error);
            }
        }
        fetchSimpleLoadout();
    }, []);


    async function getTotalStats(totalStats) {
        const updatedStats = await Promise.all(totalStats.map(async (statHash) => {
            const statResponse = await getItemManifest(statHash, "DestinyStatDefinition");
            return {
                statHash,
                name: statResponse.displayProperties.name,
                iconPath: statResponse.displayProperties.icon,
                value: 0,
            };
        }));
        totalStats.splice(0, totalStats.length, ...updatedStats);
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
                setshowFull(false);
            }
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => {
            window.removeEventListener("keydown", handleKeyDown);
        };
    }, []);


    return (
        <>
            <div className={`font-Inter h-[475px]`}>
                {totalStats && background && items ? (
                    <div className="bg-gray-300 p-4 py-4 font-Lato rounded-lg space-y-4 text-white mt-4" style={{ backgroundImage: `url(${API_CONFIG.BUNGIE_API}${background})`, backgroundSize: "cover", backgroundPosition: "calc(50% - 30px) center" }}>
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
                                        <p key={stat.statHash} className="flex items-center space-x-4 font-semibold text-xl">
                                            <img src={`${API_CONFIG.BUNGIE_API}${stat.iconPath}`} width={30} height={30} alt={stat.name} title={stat.name} />
                                            {stat.value}
                                        </p>
                                    )
                                ))}
                            </div>}
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
                <div className="fixed inset-0 flex items-center justify-center w-full z-40 bg-black/50" onClick={() => setShowFull(false)}>
                    <div className={`rounded-lg relative bg-neutral-600 text-white overflow-hidden transition-all duration-200 transform ${animatePopup ? "opacity-100 scale-100" : "opacity-0 scale-90"}`} style={{ width: '65.28%', height: '77.25%', backgroundImage: `url(${inventory})`, backgroundSize: "cover", backgroundPosition: "center" }} onClick={(e) => e.stopPropagation()}>
                        <CurrentLoadout
                            membershipType={membershipType}
                            userId={userId}
                            name={name}
                            seasonHash={seasonHash}
                            rank={rank}
                            light={light}
                        />
                    </div>
                    <button className="bg-neutral-700 text-white rounded-full w-7 h-7 flex items-center self-start justify-center hover:bg-neutral-800 cursor-pointer" style={{ marginTop: "4%" }} onClick={(e) => { e.stopPropagation(); setShowFull(false); }}>✕</button>
                </div>
            )}
        </>
    );
}
