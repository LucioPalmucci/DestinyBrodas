import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";
import bungieLogo from "../../../assets/bungieLogo.png";
import info from "../../../assets/circle-info-solid.svg";
import destinyLogo from "../../../assets/destinyLogo.png";
import dungeonLogo from "../../../assets/dungeonLogo.png";
import elogio from "../../../assets/elogio.png";
import gun from "../../../assets/gun-solid.svg";
import raidReportIcon from "../../../assets/raidreport.png";
import skull from "../../../assets/skull-solid.svg";
import suitcase from "../../../assets/suitcase-medical-solid.svg";
import "../../Tab.css";

const PopUp = ({ jugador, setIsOpen, weaponDetails }) => {
    const [activeTab, setActiveTab] = useState("details");

    if (!jugador || !jugador.name) return null;

    return (
        <div className="text-white font-Inter w-[350px] bg-black/75 text-start justify-start font-normal flex mt-10 font-Inter items-center flex-col space-y-4 relative">
            <div
                style={{
                    backgroundImage: `url(/api${jugador.emblemBig})`,
                    backgroundSize: 'cover',
                    backgroundRepeat: 'no-repeat'
                }}
                className='p-4 pl-20 text-white flex justify-between w-full'
            >
                <div className='ml-1 items-center'>
                    <h2 className='text-xl font-large tracking-wide leading-tight' style={{ textShadow: "0px 1px 2px rgba(37, 37, 37, 0.4)" }}>
                        {jugador.name}
                    </h2>
                    <h1 className='text-lg text-neutral-100 opacity-75 flex items-center leading-tight' style={{ textShadow: "0px 1px 2px rgba(37, 37, 37, 0.4)" }}>
                        <img src={`${import.meta.env.BASE_URL}levels/${jugador.guardinRank?.num || 1}.fw.png`} className='w-4 h-4 mr-1' />
                        {jugador.guardinRank?.title || "Guardian"}
                    </h1>
                    <h1 className='leading-tight font-extralight tracking-wide text-gray-200 text-lg opacity-50'>
                        {jugador.clan || "Sin clan"}
                    </h1>
                </div>
                <div className="absolute right-2 " >
                    <h1 className='text-3xl lightlevel' style={{ color: "#E5D163", textShadow: "0px 3px 3px rgba(37, 37, 37, 0.4)" }}>
                        <i className="icon-light mr-1" style={{ fontStyle: 'normal', fontSize: '1.8rem', position: 'relative', top: '-0.40rem' }} />
                        {jugador.power}
                    </h1>
                </div>
            </div>

            {/* Barra de honor */}
            <div className="flex space-x-8 items-center w-full px-4">
                <p className="flex items-center text-xl font-bold">
                    <img src={elogio} className="w-5 h-5 mr-2 filter" style={{ filter: "brightness(0) invert(1)" }} />
                    {jugador.honor?.totalScore || 0}
                </p>
                <div className="flex h-2 w-full overflow-hidden space-x-0.5">
                    {jugador.honor?.verdes > 0 && (
                        <div style={{ width: `${jugador.honor.verdes}%`, backgroundColor: 'rgba(54,163,137,1)' }} className="h-full"></div>
                    )}
                    {jugador.honor?.naranjas > 0 && (
                        <div style={{ width: `${jugador.honor.naranjas}%`, backgroundColor: 'rgba(205,125,44,1)' }} className="h-full"></div>
                    )}
                    {jugador.honor?.rosas > 0 && (
                        <div style={{ width: `${jugador.honor.rosas}%`, backgroundColor: 'rgba(190,79,106,1)' }} className="h-full"></div>
                    )}
                    {jugador.honor?.azules > 0 && (
                        <div style={{ width: `${jugador.honor.azules}%`, backgroundColor: 'rgba(50,136,193,1)' }} className="h-full"></div>
                    )}
                </div>
            </div>

            <div className="w-full h-px bg-white opacity-30" />

            {/* ID de Bungie */}
            <div className="flex flex-col justify-start items-start w-full px-4">
                <p className="tracking-[0.4rem] mb-1" style={{ color: '#479ce4' }}>ID DE BUNGIE</p>
                <h1 className="items-center flex text-base">
                    <img src={bungieLogo} alt="Bungie Logo" className="w-4 h-4 mr-1" />
                    {jugador.uniqueName?.slice(0, -5) || jugador.name}
                    <span style={{ color: '#479ce4' }}>
                        {jugador.uniqueName?.slice(-5) || ""}
                    </span>
                    <div className='flex w-full space-x-4 ml-2'>
                        <button className="p-0 pb-1 rounded-lg text-white m-1 ml-0 transform transition-transform duration-200 hover:scale-105" style={{ backgroundColor: '#4DB6AC' }}>
                            <a href={`https://raid.report/${jugador.membershipType}/${jugador.membershipId}`} target="_blank" rel="noreferrer noopener" className='flex' title='Raid Report'>
                                <img src={raidReportIcon} alt="Raid Report Icon" className="w-4 h-4 mx-1 mt-1" />
                            </a>
                        </button>
                        <button className="p-0 pb-1 rounded-lg text-white m-1 transform transition-transform duration-200 hover:scale-105" style={{ backgroundColor: '#03A9F4' }}>
                            <a href={`https://dungeon.report/${jugador.membershipType}/${jugador.membershipId}`} target="_blank" rel="noreferrer noopener" className='flex' title='Dungeon Report'>
                                <img src={dungeonLogo} alt="Dungeon Report Icon" className="w-4 h-4 mx-1 mt-1" />
                            </a>
                        </button>
                        <button className="p-0 pb-1 rounded-lg text-white m-1 transform transition-transform duration-200 hover:scale-105" style={{ backgroundColor: '#f2a518' }}>
                            <a href={`https://destinytrialsreport.com/report/${jugador.membershipType}/${jugador.membershipId}`} target="_blank" rel="noreferrer noopener" className="flex" title='Trials Report'>
                                <img src="https://destinytrialsreport.com/assets/svg/icon.svg" alt="Trials Report Icon" className="w-4 h-4 mx-1 mt-1" />
                            </a>
                        </button>
                        <button className="p-0 pb-1 rounded-lg text-white m-1 transform transition-transform duration-200 hover:scale-105" style={{ backgroundColor: '#20262C' }}>
                            <a href={`https://www.bungie.net/7/en/User/Profile/${jugador.membershipType}/${jugador.membershipId}?bgn=${jugador.name}`} target="_blank" rel="noreferrer noopener" className='flex' title='Perfil de bungie'>
                                <img src={destinyLogo} alt="User Icon" className="w-4 h-4 mx-1 mt-1" />
                            </a>
                        </button>
                    </div>
                </h1>
            </div>

            <div className="w-full h-px bg-white opacity-30" />

            <div className="flex justify-evenly space-x-4">
                <span className="flex" title="Tiempo jugado"><i className="icon-clock mr-2 -translate-y-0.5" alt="Clock" /> <p>{jugador.timePlayedSeconds}</p></span>
                <span className="flex" title="Bajas"><i className="icon-kills2 mr-2 -translate-y-0.5" /> {jugador.kills}</span>
                <p className="flex" title="Muertes"><img src={skull} className="mr-2 -translate-y-0.5" width={15} height={15} style={{ filter: "invert(100%)" }} /> {jugador.deaths}</p>
                <p className="flex" title="Asistencias"><img src={suitcase} className="mr-2 -translate-y-0.5" width={15} height={15} style={{ filter: "invert(100%)" }} /> {jugador.assists}</p>
            </div>
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
            <div className="relative w-full h-40 overflow-hidden">
                <AnimatePresence mode="wait">
                    {activeTab === "details" && (
                        <motion.div
                            key="details"
                            initial={{ x: 100, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            exit={{ x: -100, opacity: 1 }}
                            transition={{ duration: 0.3 }}
                            className="absolute items-center w-full "
                        >
                            <div className="flex justify-center w-full px-4">
                                <table className="w-fit text-black text-xs border-collapse border text-black border-black">
                                    <tbody>
                                        <tr>
                                            <td className="border border-black px-2 py-1 font-semibold">Precisión</td>
                                            <td className="border border-black px-2 py-1 text-center">{jugador.values.precisionKills.basic.value}</td>
                                        </tr>
                                        <tr>
                                            <td className="border border-black px-2 py-1 font-semibold">Habilidad</td>
                                            <td className="border border-black px-2 py-1 text-center">{jugador.values.weaponKillsAbility.basic.value}</td>
                                        </tr>
                                        <tr>
                                            <td className="border border-black px-2 py-1 font-semibold">Granada</td>
                                            <td className="border border-black px-2 py-1 text-center">{jugador.values.weaponKillsGrenade.basic.value}</td>
                                        </tr>
                                        <tr>
                                            <td className="border border-black px-2 py-1 font-semibold">Melee</td>
                                            <td className="border border-black px-2 py-1 text-center">{jugador.values.weaponKillsMelee.basic.value}</td>
                                        </tr>
                                        <tr>
                                            <td className="border border-black px-2 py-1 font-semibold">Súper</td>
                                            <td className="border border-black px-2 py-1 text-center">{jugador.values.weaponKillsSuper.basic.value}</td>
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
                            className="absolute w-full items-center"
                        >
                            <div className="grid grid-cols-1 gap-4 height-auto">
                                {jugador.weapons.map((weapon, idx) => (
                                    <div key={idx} className="p-2 rounded flex justify-start pl-13">
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
    );
};

export default PopUp;