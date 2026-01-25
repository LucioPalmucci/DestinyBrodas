import { useRef, useState } from "react";
import ActivityPopUp from "./ActivityPopUp";

const ActivitiesComp = ({ activities = [], tipo, pvpWeapon }) => {
    const [hoveredIndex, setHoveredIndex] = useState(null);
    const [popupDirection, setPopupDirection] = useState("right");
    const itemRefs = useRef([]);

    // ensure we always render 4 slots
    const slots = Array.from({ length: 4 }).map((_, i) => activities[i] || { loading: true, mode: `Slot ${i + 1}` });

    // pick background image from first loaded slot that has pgcrImg
    const bgItem = slots.find(s => s && !s.loading && (s.pgcrImg || s.icon));
    const bgImage = bgItem ? bgItem.pgcrImg || bgItem.icon : null;

    const handleMouseEnter = (index) => {
        setHoveredIndex(index);
        const rect = itemRefs.current[index]?.getBoundingClientRect();
        if (rect) {
            if (window.innerWidth - rect.right < 300) {
                setPopupDirection("left");
            } else {
                setPopupDirection("right");
            }
        }
    };
    return (
        <div className="h-[300px] flex flex-col text-white p-6 px-3 rounded-lg space-y-2 content-fit justify-center shadow-lg object-fill bg-center bg-cover" style={{ backgroundImage: bgImage ? `url(${bgImage})` : undefined }}>
            <div className="bg-black/25 p-2 rounded-lg w-fit">
                <p className="flex items-center text-xl font-semibold mb-0 p-0 leading-tight">Actividades mas jugadas en {tipo}</p>
            </div>
            <div className="flex space-x-2 bg-black/50 justify-between rounded-lg mt-4 h-fit text-sm font-semibold leading-tight w-full">
                {slots.map((activity, index) => (
                    <div
                        key={index}
                        ref={el => itemRefs.current[index] = el}
                        className={`relative flex flex-col space-y-2 items-center w-[25%] ${activity.loading ? 'opacity-80' : 'cursor-pointer hover:bg-black/30'} p-3 rounded-lg transition-colors`}
                        onMouseEnter={() => !activity.loading && handleMouseEnter(index)}
                        onMouseLeave={() => setHoveredIndex(null)}
                    >
                        {activity.loading ? (
                            <div className="w-19 h-30 rounded-lg flex justify-center bg-gray-200 items-center shimmer-placeholder"></div>
                        ) : (
                            <div className="flex flex-col items-center">
                                <img src={activity.icon} alt={activity.name || activity.mode} className="w-19 h-19 rounded-lg" />
                                <p className="text-lg">{activity.mode}</p>
                                <p className="text-sm">{(Number(activity.percentage || 0).toFixed(1) + "%")}</p>
                                <div
                                    style={{
                                        position: "absolute",
                                        left: popupDirection === "right" ? "110px" : "auto",
                                        right: popupDirection === "left" ? "110px" : "auto",
                                        top: "50%",
                                        transform: "translateY(-50%)",
                                        zIndex: 50,
                                        pointerEvents: "none",
                                        display: hoveredIndex === index ? "block" : "none"
                                    }}
                                >
                                    {hoveredIndex === index && !activity.loading && (
                                        <ActivityPopUp activity={activity} onClose={() => setHoveredIndex(null)} pvpWeapon={pvpWeapon} />
                                    )}
                                </div>
                            </div>
                        )}

                    </div>
                ))}
            </div>
        </div>
    );
};

export default ActivitiesComp;