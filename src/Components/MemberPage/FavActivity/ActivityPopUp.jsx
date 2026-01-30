import { useEffect, useState } from "react";
import check from "../../../assets/check.png";
import favorite from '../../../assets/favorite.png';
import mote from '../../../assets/mote.png';


export default function ActivityPopUp({ activity, onClose, pvpWeapon }) {
    return (
        <div className="bg-black/90 opacity-90 p-3 rounded w-fit min-w-60" onClick={onClose}>
            <div className="flex items-center mb-2 justify-between w-full font-normal text-[0.7rem] ">
                <div className="flex flex-col h-full space-y-0.5 justify-center">
                    {(activity?.modeData?.favoriteActivity) && (
                        <p className="flex "><img src={favorite} alt="favorite" className="w-3 h-3 mr-1 mt-[1px]" /> {activity.modeData.favoriteActivity?.name}</p>
                    )}
                    {activity?.modeData?.winDefeatRatio != null && (
                        <div>
                            <p>Ratio: {activity.modeData.winDefeatRatio}% </p>
                            <p className="pl-[16px] text-[0.58rem] opacity-70">G: {activity.modeData.wins}  |  P: {activity.modeData.defeats}</p>
                        </div>
                    )}
                    {activity?.modeData?.completions?.completitions != null || activity?.completions != null ? (
                        <p className="flex items-center"> <img src={check} alt="check" className="w-3 h-3 mr-1" /> {activity?.modeData?.completions?.completitions ?? activity?.completions} {activity?.textCompletitions}</p>
                    ) : null}
                    {activity?.modeData?.completions?.freshCompletitions != null && activity?.modeData?.completions?.checkpointCompletitions != null && (
                        <p className="pl-[16px] text-[0.58rem] opacity-70">Full: {activity.modeData.completions.freshCompletitions} | Check: {activity.modeData.completions.checkpointCompletitions}</p>
                    )}
                    {activity?.modeData?.killsGamb != null && (
                        <p className="flex items-center"><i className='icon-kills mr-1 mb-0.5'></i>{activity.modeData.killsGamb} guardianes</p>
                    )}
                    {activity?.modeData?.motas != null && (
                        <p className="flex items-center"><img src={mote} alt="mote" className="w-3 h-3 mr-1" /> {activity.modeData.motas}</p>
                    )}
                    {activity?.modeData?.kd != null && (
                        <p>KD: {activity.modeData.kd}</p>
                    )}
                    {activity?.modeData?.precisionKills != null && (
                        <p><i className="icon-precision" style={{ fontStyle: "normal" }} /> {activity.modeData.precisionKills}</p>
                    )}
                    {(activity?.modeData?.division?.logo || activity?.modeData?.division?.currentProgress != null) && (
                        <div className="flex items-center">
                            {activity?.modeData?.division?.logo && (
                                <img src={activity.modeData.division.logo} className="w-8 h-8" />
                            )}
                            {activity?.modeData?.division?.currentProgress != null && (
                                <p className="ml-0.5">{activity.modeData.division.currentProgress}</p>
                            )}
                        </div>
                    )}
                    {pvpWeapon && (
                        <p>
                            Más usada:{" "}
                            <i
                                className={pvpWeapon.icon}
                                title={pvpWeapon.name + "\n" + pvpWeapon.kills + " bajas"}
                            ></i>
                        </p>
                    )}
                </div>
                {activity.characterCompletions &&
                    <div className="flex flex-col h-full space-y-0.5 justify-center ">
                        {(() => {
                            const chars = Array.isArray(activity.characterCompletions)
                                ? activity.characterCompletions.slice(0, 3)
                                : Object.values(activity.characterCompletions).slice(0, 3);
                            return (
                                <div className="w-20 font-light h-full flex flex-col justify-center text-[0.65rem]">
                                    <div className="flex justify-center mb-1">
                                        {chars[0] && (
                                            <div className="flex flex-col items-center">
                                                <img
                                                    src={chars[0].classImg.link}
                                                    title={chars[0].totalCompletions || chars[0].completions}
                                                    className="w-5 h-5"
                                                    style={{ filter: chars[0].classImg.colore }}
                                                />
                                                <p>{(chars[0].percentage || 0)}%</p>
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex justify-between">
                                        {chars[1] ? (
                                            <div className="flex flex-col items-center">
                                                <img
                                                    src={chars[1].classImg.link}
                                                    title={chars[1].totalCompletions || chars[1].completions}
                                                    className="w-5 h-5"
                                                    style={{ filter: chars[1].classImg.colore }}
                                                />
                                                <p>{(chars[1].percentage || 0)}%</p>
                                            </div>
                                        ) : <div />}
                                        {chars[2] ? (
                                            <div className="flex flex-col items-center">
                                                <img
                                                    src={chars[2].classImg.link}
                                                    title={chars[2].totalCompletions || chars[2].completions}
                                                    className="w-5 h-5"
                                                    style={{ filter: chars[2].classImg.colore }}
                                                />
                                                <p>{(chars[2].percentage || 0)}%</p>
                                            </div>
                                        ) : <div />}
                                    </div>
                                </div>
                            );
                        })()}
                    </div>
                }
            </div>
            {activity?.modeData?.seals && (
                <div>
                    <div className="border-t border-0.5 border-white/25 mb-2.5 mx-3" />
                    <div className="flex flex-col items-start">
                        {Array.isArray(activity.modeData.seals) ? (
                            <SealSlider seals={activity.modeData.seals} />
                        ) : (
                            <div className="flex flex-col items-center w-full">
                                <div className="flex flex-col justify-center items-center cursor-pointer relative group">
                                    <img
                                        src={activity.modeData.seals.iconComplete}
                                        alt={activity.modeData.seals.name}
                                        className={`w-9 h-9 mb-1 ${activity.modeData.seals.completed ? "opacity-100" : "opacity-40"}`}
                                    />
                                    <div
                                        className="flex py-1 w-full font-light"
                                    //style={{ background: "linear-gradient(to right, rgba(237, 178, 94, 0) 0%, rgba(174, 114, 47, 0.5) 25%, rgba(174, 114, 47, 0.5) 75%, rgba(237, 178, 94, 0) 100%)" }}
                                    >
                                        <p className="tracking-[0.2em] text-xs uppercase titulo text-[0.5rem]">{activity.modeData.seals.name}</p>
                                        {activity.modeData.seals.gilded > 0 && (
                                            <div className="flex ml-1 -translate-y-[1px] items-center">
                                                <i className="icon-gilded font-[100]" style={{ fontStyle: 'normal', fontSize: '0.54rem' }} />
                                                <p style={{ fontStyle: 'normal', fontSize: '0.4rem', position: 'relative', top: '-0.10rem' }}>{activity.modeData.seals.gilded}</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );

    // Slider component
    function SealSlider({ seals }) {
        const [offset, setOffset] = useState(0);
        const itemWidth = 50; // px
        const visibleCount = 4;
        const speed = 0.3; // px por frame

        // Duplica el array para efecto infinito
        const displaySeals = [...seals, ...seals.slice(0, visibleCount)];
        const totalWidth = itemWidth * seals.length; // solo los originales

        useEffect(() => {
            let animationFrame;
            function animate() {
                setOffset(prev => {
                    let next = prev + speed;
                    // Reinicia solo cuando se desplazó el ancho de todos los ítems originales
                    if (next >= totalWidth) {
                        return 0;
                    }
                    return next;
                });
                animationFrame = requestAnimationFrame(animate);
            }
            animationFrame = requestAnimationFrame(animate);
            return () => cancelAnimationFrame(animationFrame);
        }, [totalWidth]);


        return (
            <div
                className="overflow-hidden w-full"
                style={{ width: `${itemWidth * visibleCount + 13}px` }}
            >
                <div
                    className="flex"
                    style={{
                        width: `${itemWidth * displaySeals.length}px`,
                        transform: `translateX(-${offset}px)`,
                        transition: 'transform 0s linear',
                    }}
                >
                    {displaySeals.map((seal, idx) => (
                        <div
                            key={seal.hash + idx}
                            className="flex flex-col items-center mx-1"
                            style={{ width: `${itemWidth}px`, flex: '0 0 auto' }}
                        >
                            <img
                                src={seal.iconComplete}
                                alt={seal.name}
                                className={`w-9 h-9 mb-1 ${seal.completed ? "opacity-100" : "opacity-40"}`}
                            />
                            <p className="text-[0.32rem] text-center w-14 uppercase font-light">{seal.name}</p>
                        </div>
                    ))}
                </div>
            </div>
        );
    }
}
