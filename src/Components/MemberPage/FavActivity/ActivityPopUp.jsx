import { useEffect, useState } from "react";

export default function ActivityPopUp({ activity, onClose, pvpWeapon }) {
    return (
        <div className="bg-black/90 opacity-90 p-3 rounded w-fit min-w-60" onClick={onClose}>
            {activity?.modeData?.favoriteActivity && (
                <p>Favorita: {activity.modeData.favoriteActivity.displayProperties?.name}</p>
            )}
            {activity?.modeData?.completions?.completitions != null || activity?.completions != null ? (
                <p>Completiciones: {activity?.modeData?.completions?.completitions ?? activity?.completions}</p>
            ) : null}
            {activity?.modeData?.completions?.freshCompletitions != null && (
                <p>Fresh: {activity.modeData.completions.freshCompletitions}</p>
            )}
            {activity?.modeData?.completions?.checkpointCompletitions != null && (
                <p>Checkpoint: {activity.modeData.completions.checkpointCompletitions}</p>
            )}
            {activity?.modeData?.winDefeatRatio != null && (
                <p>Win ratio: {activity.modeData.winDefeatRatio}%</p>
            )}
            {activity?.modeData?.invadersDefeated != null && (
                <p>Invasores derrotados: {activity.modeData.invadersDefeated}</p>
            )}
            {activity?.modeData?.motas != null && (
                <p>Motas: {activity.modeData.motas}</p>
            )}
            {activity?.modeData?.kd != null && (
                <p>KD: {activity.modeData.kd}</p>
            )}
            {activity?.modeData?.precisionKills != null && (
                <p>Precision: {activity.modeData.precisionKills}</p>
            )}
            {(activity?.modeData?.division?.logo || activity?.modeData?.division?.currentProgress != null) && (
                <div className="flex items-center">
                    {activity?.modeData?.division?.logo && (
                        <img src={activity.modeData.division.logo} className="w-8 h-8" />
                    )}
                    {activity?.modeData?.division?.currentProgress != null && (
                        <p> {activity.modeData.division.currentProgress}</p>
                    )}
                </div>
            )}
            {pvpWeapon && (
                <p>
                    Arma PVP:{" "}
                    <i
                        className={pvpWeapon.icon}
                        title={pvpWeapon.name + "\n" + pvpWeapon.kills + " bajas"}
                    ></i>
                </p>
            )}
            {activity?.modeData?.seals && (
                <div className="flex flex-col items-start">
                    {Array.isArray(activity.modeData.seals) ? (
                        <SealSlider seals={activity.modeData.seals} />
                    ) : (
                        <div className="flex flex-col items-center">
                            <div className="flex flex-col justify-center items-center mb-4 cursor-pointer relative group">
                                <img
                                    src={activity.modeData.seals.iconComplete}
                                    alt={activity.modeData.seals.name}
                                    className={`w-16 h-16 mb-2 ${activity.modeData.seals.completed ? "opacity-100" : "opacity-40"}`}
                                />
                                <div
                                    className="flex mt-2 items-center justify-center py-1 w-full border-white/25 border-y-[0.1px]"
                                    style={{ background: "linear-gradient(to right, rgba(237, 178, 94, 0) 0%, rgba(174, 114, 47, 0.5) 25%, rgba(174, 114, 47, 0.5) 75%, rgba(237, 178, 94, 0) 100%)" }}
                                >
                                    <p className="tracking-[0.2em] text-xs uppercase titulo">{activity.modeData.seals.name}</p>
                                    {activity.modeData.seals.gilded && activity.modeData.seals.gilded > 0 && (
                                        <div className="flex items-center ml-1">
                                            <i className="icon-gilded font-[100]" style={{ fontStyle: 'normal', fontSize: '0.8rem' }} />
                                            <p style={{ fontStyle: 'normal', fontSize: '0.6rem', position: 'relative', top: '-0.30rem' }}>{activity.modeData.seals.gilded}</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}
            {activity.characterCompletions &&
                <div className="flex w-full justify-evenly">
                    {Object.entries(activity.characterCompletions).map(([indx, char]) => (
                        <div key={indx}>
                            <img src={char.classImg.link} title={char.totalCompletions} className="w-10 h-10 mb-2" style={{ filter: char.classImg.colore }} />
                            <p>{char.percentage}%</p>
                        </div>
                    ))}
                </div>
            }
        </div>
    );

    // Slider component
    function SealSlider({ seals }) {
        const [offset, setOffset] = useState(0);
        const itemWidth = 90; // px
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
                style={{ width: `${itemWidth * visibleCount}px` }}
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
                            className="flex flex-col items-center"
                            style={{ width: `${itemWidth}px`, flex: '0 0 auto' }}
                        >
                            <img
                                src={seal.iconComplete}
                                alt={seal.name}
                                className={`w-16 h-16 mb-2 ${seal.completed ? "opacity-100" : "opacity-40"}`}
                            />
                            <p className="text-xs text-center">{seal.name}</p>
                        </div>
                    ))}
                </div>
            </div>
        );
    }
}
