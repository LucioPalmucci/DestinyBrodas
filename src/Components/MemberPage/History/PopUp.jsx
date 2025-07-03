import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";
import info from "../../../assets/circle-info-solid.svg";
import gun from "../../../assets/gun-solid.svg";
import skull from "../../../assets/skull-solid.svg";
import suitcase from "../../../assets/suitcase-medical-solid.svg";
import "../../Tab.css";

const PopUp = ({ isOpen, setIsOpen, weaponDetails }) => {
    const [activeTab, setActiveTab] = useState("details");

    useEffect(() => {
        if (isOpen) {
            document.body.classList.add("overflow-hidden");
        } else {
            document.body.classList.remove("overflow-hidden");
        }
        return () => document.body.classList.remove("overflow-hidden");
    }, [isOpen]);

    if (!isOpen || !isOpen.name) return null; // Evita renderizar si no hay datos

    return (
        <div
            className="fixed inset-0 flex items-center justify-center w-full z-50"
            onClick={() => setIsOpen(false)}
        >
            <div
                className="p-4 rounded-lg relative bg-neutral-600 text-white w-96 max-h-[90vh] overflow-auto"
                onClick={(e) => e.stopPropagation()}
            >
                <button
                    onClick={() => setIsOpen(false)}
                    className="absolute cursor-pointer top-2 right-2 text-gray-500 hover:text-gray-300"
                >
                    &times;
                </button>
                <div className="space-y-2">
                    <div className="flex items-center">
                        <img
                            src={`/api/${isOpen.emblem}`}
                            width={40}
                            height={40}
                            alt="Emblem"
                            className="rounded"
                        />
                        <div className="ml-4">
                            <p>{isOpen.name}</p>
                            <p>{isOpen.class} - {isOpen.power}</p>
                        </div>
                    </div>

                    <div className="flex justify-evenly items-center space-x-4">
                        <span className="flex" title="Tiempo jugado"><i className="icon-clock mr-2" alt="Clock" /> {isOpen.timePlayedSeconds}</span>
                        <span className="flex" title="bajas"><i className="icon-kills2 mr-2" /> {isOpen.kills}</span>
                        <p className="flex" title="muertes"><img src={skull} className="mr-2" width={15} height={15} style={{ filter: "invert(100%)" }} /> {isOpen.deaths}</p>
                        <p className="flex" title="asistencias"><img src={suitcase} className="mr-2" width={15} height={15} style={{ filter: "invert(100%)" }} /> {isOpen.assists}</p>
                    </div>

                    {/* Botones de Tabs */}
                    <div className="flex justify-center space-x-2">
                        <button
                            onClick={() => setActiveTab("details")}
                            className={`px-4 py-2 flex cursor-pointer ${activeTab === "details" ? "bg-neutral-800" : "bg-neutral-600"}`}
                        >
                            <img src={info} className="mr-1" width={15} height={15} style={{ filter: "invert(100%)" }} />Detalles
                        </button>
                        <button
                            onClick={() => setActiveTab("weapons")}
                            className={`px-4 py-2 flex cursor-pointer ${activeTab === "weapons" ? "bg-neutral-800" : "bg-neutral-600"}`}
                        >
                            <img src={gun} className="mr-1" width={15} height={15} style={{ filter: "invert(100%)" }} /> Armas
                        </button>
                    </div>
                    <div className="relative w-full h-56 overflow-hidden">
                        <AnimatePresence mode="wait">
                            {activeTab === "details" && (
                                <motion.div
                                    key="details"
                                    initial={{ x: 100, opacity: 0 }}
                                    animate={{ x: 0, opacity: 1 }}
                                    exit={{ x: -100, opacity: 1 }}
                                    transition={{ duration: 0.3 }}
                                    className="absolute w-full"
                                >
                                    <div className="flex">
                                        <table className="text-black border-1 table-custom">
                                            <thead>
                                                <tr >
                                                    <th className="border-1">Precisión</th>
                                                    <th className="border-1">Habilidad</th>
                                                    <th className="border-1">Granada</th>
                                                    <th className="border-1">Melee</th>
                                                    <th className="border-1">Súper</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                <tr>
                                                    <td className="border-1">{isOpen.values.precisionKills.basic.value}</td>
                                                    <td className="border-1">{isOpen.values.weaponKillsAbility.basic.value}</td>
                                                    <td className="border-1">{isOpen.values.weaponKillsGrenade.basic.value}</td>
                                                    <td className="border-1">{isOpen.values.weaponKillsMelee.basic.value}</td>
                                                    <td className="border-1">{isOpen.values.weaponKillsSuper.basic.value}</td>
                                                </tr>
                                            </tbody>
                                        </table>
                                    </div>
                                </motion.div>
                            )}

                            {activeTab === "weapons" && (
                                <motion.div
                                    key="weapons"
                                    initial={{ x: -100, opacity: 0 }}
                                    animate={{ x: 0, opacity: 1 }}
                                    exit={{ x: 100, opacity: 1 }}
                                    transition={{ duration: 0.3 }}
                                    className="absolute w-full"
                                >
                                    <div className="grid grid-cols-1 gap-4 height-auto">
                                        {weaponDetails.map((weapon, idx) => (
                                            <div key={idx} className="p-2 rounded">
                                                <div className="flex items-center">
                                                    <img
                                                        src={`/api/${weapon.icon}`}
                                                        width={40}
                                                        height={40}
                                                        alt="Weapon Icon"
                                                        className="rounded"
                                                    />
                                                    <div className="ml-4 space-y-1">
                                                        <div>
                                                            <p className="text-sm">{weapon.name}</p>
                                                            <p className="text-xs flex space-x-2">
                                                                <p>{weapon.archetype}</p>
                                                                <p>
                                                                    <i className="icon-kills" />{weapon.kills}
                                                                </p>
                                                                <p title={`${weapon.precisionKills} bajas`}>
                                                                    <i className="icon-precision" style={{ fontStyle: "normal" }} />
                                                                    {weapon.precisionKillsPercentage}
                                                                </p>
                                                            </p>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PopUp;
