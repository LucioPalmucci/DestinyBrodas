import { useState } from "react";
import Slider from "react-slick";
import "slick-carousel/slick/slick-theme.css";
import "slick-carousel/slick/slick.css";
import bungieLogo from "../../../../assets/bungieLogo.png";
import caretLeft from "../../../../assets/caret-left-solid.svg";
import caretRight from "../../../../assets/caret-right-solid.svg";
import destinyLogo from "../../../../assets/destinyLogo.png";
import info from "../../../../assets/details-solid.png";
import dungeonLogo from "../../../../assets/dungeonLogo.png";
import elogio from "../../../../assets/elogio.png";
import gun from "../../../../assets/gun-solid.svg";
import playerInfo from "../../../../assets/playerInfo.png";
import raidReportIcon from "../../../../assets/raidreport.png";
import { API_CONFIG } from "../../../../config";
import "../../../CSS/Tab.css";

const CustomPrevArrow = ({ onClick }) => (
    <button
        onClick={onClick}
        className="absolute -top-3 left-1/2 transform -translate-x-1/2 -translate-y-2 p-1 px-2 rounded-lg transition-all duration-200 z-10 cursor-pointer"
    >
        <img src={caretLeft} width={9} height={9} alt="Previous" style={{ filter: "brightness(0) saturate(100%) invert(1)", transform: "rotate(90deg)" }} />
    </button>
);

const CustomNextArrow = ({ onClick }) => (
    <button
        onClick={onClick}
        className="absolute -bottom-3.5 left-1/2 transform -translate-x-1/2 translate-y-2 p-1 px-2 rounded-lg transition-all duration-200 z-10 cursor-pointer"
    >
        <img src={caretRight} width={9} height={9} alt="Next" style={{ filter: "brightness(0) saturate(100%) invert(1)", transform: "rotate(90deg)" }} />
    </button>
);

const PopUp = ({ jugador, playerReady, inverted }) => {
    const [activeSection, setActiveSection] = useState(1);

    const settings = {
        dots: false,
        infinite: false,
        speed: 300,
        slidesToShow: 3,
        slidesToScroll: 1,
        autoplay: false,
        arrows: true,
        vertical: true,
        prevArrow: <CustomPrevArrow />,
        nextArrow: <CustomNextArrow />,
    };

    const detailRows = [
        { label: "Precisión", value: jugador.values.precisionKills.basic.value, iconDetail: "icon-precision" },
        { label: "Habilidad de clase", value: jugador.values.weaponKillsAbility.basic.value, iconDetail: "icon-habilidadClase" },
        { label: "Súper", value: jugador.values.weaponKillsSuper.basic.value, iconDetail: "icon-super" },
        { label: "Cuerpo a cuerpo", value: jugador.values.weaponKillsMelee.basic.value, iconDetail: "icon-melee" },
        { label: "Granada", value: jugador.values.weaponKillsGrenade.basic.value, iconDetail: "icon-granada" },
    ];

    const sectionButtons = [
        { id: 1, label: "General", iconSection: playerInfo },
        { id: 2, label: "Detalles", iconSection: info },
        { id: 3, label: "Armas", iconSection: gun },
    ];

    return (
        <div className="text-white font-Inter w-[350px] bg-black/75 text-start justify-start font-normal flex mt-10 font-Inter items-center flex-col relative h-60">
            <div className={`absolute top-1/2 -translate-y-1/3 flex flex-col z-30 space-y-0 ${inverted ? 'right-0 -translate-x-87.5' : 'left-0 translate-x-87.5'}`}>
                {sectionButtons.map((section, index) => (
                    <button
                        key={section.id}
                        type="button"
                        title={section.label}
                        onClick={() => setActiveSection(section.id)}
                        className={`px-3 py-2 text-xs font-bold cursor-pointer shadow-md rounded-none
                            ${index === 0 && inverted ? 'rounded-tl-md' : ''}
                            ${index === 0 && !inverted ? 'rounded-tr-md' : ''}
                            ${index === sectionButtons.length - 1 && inverted ? 'rounded-bl-md' : ''}
                            ${index === sectionButtons.length - 1 && !inverted ? 'rounded-br-md' : ''}
                            ${activeSection === section.id ? 'bg-neutral-500 text-white' : 'bg-black/75 text-neutral-200 hover:bg-neutral-400'}`}
                    >
                        {section.iconSection && <img src={section.iconSection} className="w-4 h-4 inline" style={{ filter: "brightness(0) invert(1)" }} />}
                    </button>
                ))}
            </div>

            <div className="overflow-hidden w-full h-60">
                <div style={{ transform: `translateY(-${(activeSection - 1) * 240}px)`, transition: 'transform 0.6s ease' }}>
                    <div className="w-full h-60">
                        <div
                            style={{
                                backgroundImage: `url(${API_CONFIG.BUNGIE_API}${jugador.emblemBig})`,
                                backgroundSize: 'cover',
                                backgroundRepeat: 'no-repeat'
                            }}
                            className='py-1.5 pr-2 pl-20 text-white flex justify-between w-full overflow-hidden relative items-start'
                        >
                            <div className='ml-1 items-center mb-0'>
                                <h2 className='text-xl font-large tracking-wide leading-tight' style={{ textShadow: "0px 1px 2px rgba(37, 37, 37, 0.4)" }}>
                                    {jugador.uniqueName.length > 12 ? `${jugador.uniqueName.substring(0, 12)}...` : jugador.uniqueName}
                                </h2>
                                <div className='text-lg text-neutral-100 opacity-75 flex items-center leading-tight' style={{ textShadow: "0px 1px 2px rgba(37, 37, 37, 0.4)" }}>
                                    <img src={`${import.meta.env.BASE_URL}levels/${jugador.guardianRank?.num || 1}.fw.png`} className='w-4 h-4 mr-1 mt-0.5' />
                                    <p className="mt-1">{jugador.guardianRank?.title || "Guardian"}</p>
                                </div>
                                <h1 className='leading-tight font-extralight tracking-wide text-gray-200 text-lg opacity-50'>
                                    {jugador.clan || "Sin clan"}
                                </h1>
                            </div>
                            <div className="absolute right-2" >
                                <h1 className='text-3xl lightlevel' style={{ color: "#E5D163", textShadow: "0px 3px 3px rgba(37, 37, 37, 0.4)" }}>
                                    <i className="icon-light mr-1" style={{ fontStyle: 'normal', fontSize: '1.8rem', position: 'relative', top: '-0.40rem' }} />
                                    {jugador.power}
                                </h1>
                            </div>
                        </div>

                        <div className="flex space-x-8 items-center w-full px-4 mt-4">
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

                        <div className="w-full h-px bg-white opacity-30 mt-4" />

                        <div className="flex flex-col justify-start items-start w-full px-4 py-3">
                            <p className="tracking-[0.4rem] mb-1" style={{ color: '#479ce4' }}>ID DE BUNGIE</p>
                            <div className="items-center flex text-base w-full">
                                <img src={bungieLogo} alt="Bungie Logo" className="w-4 h-4 mr-1" />
                                {jugador.uniqueName || jugador.name}
                                <span style={{ color: '#479ce4' }}>
                                    {jugador.uniqueNameCode || ""}
                                </span>
                                <div className='flex space-x-4 ml-2'>
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
                            </div>
                        </div>
                    </div>

                    <div className="w-full h-60 flex items-center justify-center flex-col">
                        <p className="text-[0.8rem] tracking-[0.2rem] text-white uppercase mb-5">Detalles</p>
                        <div className="flex flex-col items-center gap-5 text-white">
                            <div className="flex items-center gap-12">
                                {detailRows.slice(0, 3).map((row) => (
                                    <div key={row.label} className="flex flex-col items-center">
                                        <i className={`${row.iconDetail} ${row.iconSize || 'text-2xl'}`} title={row.label} style={{ fontStyle: 'normal' }} />
                                        <span className="text-lg font-bold mt-1">{row.value}</span>
                                    </div>
                                ))}
                            </div>
                            <div className="flex items-center gap-8">
                                {detailRows.slice(3, 5).map((row) => (
                                    <div key={row.label} className="flex flex-col items-center">
                                        <i className={`${row.iconDetail} ${row.iconSize || 'text-2xl'}`} title={row.label} style={{ fontStyle: 'normal' }} />
                                        <span className="text-lg font-bold mt-1">{row.value}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="w-full h-50 items-center flex justify-center flex-col space-y-5">
                        <p className="text-[0.8rem] tracking-[0.2rem] text-white uppercase my-4">Armas</p>
                        {jugador?.weapons && jugador.weapons.length > 3 ? (
                            <Slider {...settings} className="h-full overflow-visible mt-3">
                                {jugador?.weapons?.map((weapon, idx) => (
                                    <div key={idx}>
                                        <div className="px-4 py-1.5 rounded w-full">
                                            <div className="flex items-center justify-between w-full">
                                                <div className="flex items-center w-[60%]">
                                                    <img
                                                        src={`${API_CONFIG.BUNGIE_API}/${weapon.icon}`}
                                                        width={36}
                                                        height={36}
                                                        alt="Weapon Icon"
                                                        className="rounded"
                                                    />
                                                    <div className="ml-3">
                                                        <p className="text-sm font-semibold leading-tight" title={weapon.name}>
                                                            {weapon.name.length > 16 ? `${weapon.name.substring(0, 16)}...` : weapon.name}
                                                        </p>
                                                        <p className="text-xs text-gray-400">{weapon.archetype}</p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center space-x-4 text-xs font-bold w-[40%] justify-start text-start">
                                                    <span className="flex items-center w-[40%] justify-start text-start translate-y-[1px]" title="Bajas">
                                                        <i className="icon-kills2 mr-1" />
                                                        <p className="translate-y-[1px]">{weapon.kills}</p>
                                                    </span>
                                                    <span className="flex items-center w-[60%] justify-start text-start translate-y-[1px]" title={`${weapon.precisionKills} bajas de precisión`}>
                                                        <i className="icon-precision mr-1 font-medium translate-y-[1px]" style={{ fontStyle: "normal" }} />
                                                        <p className="translate-y-[1px]">{weapon.precisionKillsPercentage}</p>
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </Slider>
                        ) : (
                            <div className="space-y-1 h-full flex flex-col justify-center w-full px-4 mt-1">
                                {jugador?.weapons?.map((weapon, idx) => (
                                    <div key={idx} className="py-1 rounded w-full">
                                        <div className="flex items-center justify-between w-full">
                                            <div className="flex items-center w-[60%]">
                                                <img
                                                    src={`${API_CONFIG.BUNGIE_API}/${weapon.icon}`}
                                                    width={36}
                                                    height={36}
                                                    alt="Weapon Icon"
                                                    className="rounded"
                                                />
                                                <div className="ml-3">
                                                    <p className="text-sm font-semibold leading-tight" title={weapon.name}>
                                                        {weapon.name.length > 16 ? `${weapon.name.substring(0, 16)}...` : weapon.name}
                                                    </p>
                                                    <p className="text-xs text-gray-400">{weapon.archetype}</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center space-x-4 text-xs font-bold w-[40%] justify-start text-start">
                                                <span className="flex items-center w-[40%] justify-start text-start translate-y-[1px]" title="Bajas">
                                                    <i className="icon-kills2 mr-1" />
                                                    <p className="translate-y-[1px]">{weapon.kills}</p>
                                                </span>
                                                <span className="flex items-center w-[60%] justify-start text-start translate-y-[1px]" title={`${weapon.precisionKills} bajas de precisión`}>
                                                    <i className="icon-precision mr-1 font-medium translate-y-[1px]" style={{ fontStyle: "normal" }} />
                                                    <p className="translate-y-[1px]">{weapon.precisionKillsPercentage}</p>
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PopUp;