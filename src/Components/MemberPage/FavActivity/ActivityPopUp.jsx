import { useEffect, useState } from "react";

export default function ActivityPopUp({ activity, onClose }) {
    return (
        <div className="bg-black/90 opacity-90 p-3 rounded w-fit min-w-60" onClick={onClose}>
            {activity?.modeData?.favoriteActivity && (
                <p className="mb-2">
                    Favorita: {activity?.modeData?.favoriteActivity?.displayProperties?.name}
                </p>
            )}
            <p className="mb-2">
                Completiciones: {activity?.modeData?.completions?.completitions || activity?.completions}
            </p>
            <p className="mb-2">
                Fresh: {activity?.modeData?.completions?.freshCompletitions}
            </p>
            <p className="mb-2">
                Checkpoint: {activity?.modeData?.completions?.checkpointCompletitions}
            </p>
            {activity?.modeData?.seals && (
                <div className="flex flex-col items-start">
                    {Array.isArray(activity.modeData.seals) ? (
                        <SealSlider seals={activity.modeData.seals} />
                    ) : (
                        <div className="flex flex-col items-center">
                            <img
                                src={activity.modeData.seals.iconComplete}
                                alt={activity.modeData.seals.name}
                                className={`w-16 h-16 mb-2 ${activity.modeData.seals.completed ? "opacity-100" : "opacity-40"}`}
                            />
                            <p className="text-xs text-center">{activity.modeData.seals.name}</p>
                        </div>
                    )}
                </div>
            )}
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
