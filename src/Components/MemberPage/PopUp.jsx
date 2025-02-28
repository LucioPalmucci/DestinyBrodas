import React, { useState } from 'react';
import 'slick-carousel/slick/slick-theme.css';
import 'slick-carousel/slick/slick.css';
import '../Tab.css';

const PopUp = ({ isOpen, setIsOpen, weaponDetails }) => {
    const [activeTab, setActiveTab] = useState('details');

    const settings = {
        dots: true,
        infinite: false,
        speed: 500,
        slidesToShow: 1,
        slidesToScroll: 1,
        beforeChange: (current, next) => setActiveTab(next === 0 ? 'details' : 'weapons'),
    };

    const handleTabClick = (tab) => {
        setActiveTab(tab);
        sliderRef.slickGoTo(tab === 'details' ? 0 : 1);
    };

    let sliderRef;

    return (
        <div className="fixed inset-0 flex items-center justify-center w-full p-8 " onClick={() => setIsOpen(false)}>
            <div className="p-4 rounded-lg relative bg-neutral-600 text-white" onClick={(e) => e.stopPropagation()}>
                <button onClick={() => setIsOpen(false)} className="absolute cursor-pointer top-2 right-2 text-gray-500 hover:text-gray-700">
                    &times;
                </button>
                <div className='space-y-2'>
                    <div className='flex items-center'>
                        <img src={`/api/${isOpen.emblem}`} width={40} height={40} alt="Emblem" className='rounded' />
                        <div className='ml-4'>
                            <p>{isOpen.name}</p>
                            <p>{isOpen.class} - {isOpen.power}</p>
                        </div>
                    </div>
                    <div className='flex justify-evenly'>
                        <p>Tiempo jugado: {isOpen.timePlayedSeconds}</p>
                        <p>Bajas: {isOpen.kills}</p>
                        <p>Muertes: {isOpen.deaths}</p>
                        <p>Asistencias: {isOpen.assists}</p>
                    </div>
                    <div className='flex justify-center'>
                        <table className='bg-neutral-500 text-black'>
                            <thead>
                                <tr>
                                    <th>Precisión</th>
                                    <th>Habilidad</th>
                                    <th>Granada</th>
                                    <th>Melee</th>
                                    <th>Súper</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <td>{isOpen.values.precisionKills.basic.value}</td>
                                    <td>{isOpen.values.weaponKillsAbility.basic.value}</td>
                                    <td>{isOpen.values.weaponKillsGrenade.basic.value}</td>
                                    <td>{isOpen.values.weaponKillsMelee.basic.value}</td>
                                    <td>{isOpen.values.weaponKillsSuper.basic.value}</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                    <div className='grid grid-cols-3 gap-4'>
                        {weaponDetails.map((weapon, idx) => (
                            <div key={idx}>
                                <div className='flex items-center'>
                                    <img src={`/api/${weapon.icon}`} width={40} height={40} alt="Weapon Icon" className='rounded' />
                                    <div className='ml-4 space-y-1'>
                                        <div>
                                            <p className='text-sm'>{weapon.name}</p>
                                            <p className='text-xs'>{weapon.archetype}</p>
                                        </div>
                                        <div className='flex space-x-2 items-center text-xs'>
                                            <p className='items-center'><i className='icon-kills' /> {weapon.kills}</p>
                                            <p className='items-center' title={`${weapon.precisionKills} bajas`}><i className='icon-precision' style={{ fontStyle: "normal" }} />{weapon.precisionKillsPercentage}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PopUp;