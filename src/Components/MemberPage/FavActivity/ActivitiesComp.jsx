import { useState } from "react";
import ActivityPopUp from "./ActivityPopUp";

const ActivitiesComp = ({ activities, tipo }) => {
    const [hoveredIndex, setHoveredIndex] = useState(null);

    return (
        <div className="text-white h-[375px] font-Inter">
            <div className="flex flex-col p-6 h-full rounded-lg content-fit shadow-lg flex object-fill bg-center bg-cover min-w-md" style={{ backgroundImage: `url(${activities[0]?.pgcrImg})` }}>
                <div className="bg-black/25 p-2 rounded-lg w-fit h-fit text-lg font-semibold leading-tight mb-10">
                    <p>Actividades mas jugadas en {tipo}</p>
                </div>
                <div className="flex space-x-2 bg-black/50 p-2 justify-between rounded-lg h-fit text-sm font-semibold leading-tight w-full">
                    {activities.map((activity, index) => (
                        <div
                            key={index}
                            className="relative flex flex-col space-y-2 items-center max-w-[25%] cursor-pointer"
                            onMouseEnter={() => setHoveredIndex(index)}
                            onMouseLeave={() => setHoveredIndex(null)}
                        >
                            <img src={activity.icon} alt={activity.name} className="w-20 h-20 rounded-lg" />
                            <p className="text-lg">{activity.mode}</p>
                            <p className="text-sm">{activity.percentage.toFixed(1)}%</p>
                            <div
                                style={{
                                    position: "absolute",
                                    left: "110px",
                                    top: "50%",
                                    transform: "translateY(-50%)",
                                    zIndex: 50,
                                    pointerEvents: "none",
                                    display: hoveredIndex === index ? "block" : "none"
                                }}
                            >
                                {hoveredIndex === index && (
                                    <ActivityPopUp activity={activity} onClose={() => setHoveredIndex(null)} />
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default ActivitiesComp;