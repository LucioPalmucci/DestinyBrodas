
const ActivitiesComp = ({ activities , tipo}) => {
    console.log(activities);
    return (
        <div className="text-white h-[375px] font-Inter">
            <div className="flex flex-col p-6 h-full rounded-lg content-fit shadow-lg flex object-fill bg-center bg-cover min-w-md" style={{ backgroundImage: `url(${activities[0]?.pgcrImg})` }}>
                <div className="bg-black/25 p-2 rounded-lg w-fit h-fit text-lg font-semibold leading-tight mb-10">
                    <p>Actividades mas jugadas en {tipo}</p>
                </div>
                <div className="flex space-x-2 bg-black/50 p-2 rounded-lg justify-between h-fit text-sm font-semibold leading-tight w-full">
                    {activities.map((activity, index) => (
                        <div key={index} className="flex flex-col space-y-2" style={{ width: "25%" }}>
                            <img src={activity.icon} alt={activity.name} className="w-20 h-20 rounded-lg" />
                            <p className="text-lg">{activity.mode}</p>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default ActivitiesComp;