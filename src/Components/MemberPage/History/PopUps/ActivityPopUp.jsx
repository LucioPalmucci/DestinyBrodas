import { useEffect, useState } from "react";
import useActivityDetails from './activityDetailedData';
import Crucible from './Crucible';
import LoadingReport from "./LoadingReport";
import usePlayersBasicData from './playersBasicData';
import Pve from './Pve';
import Rumble from './Rumble';
import Social from './Social';

const preloadImage = (src) =>
    new Promise((resolve) => {
        if (!src) return resolve(null);
        const img = new Image();
        img.onload = () => resolve(src);
        img.onerror = () => resolve(null);
        img.src = src;
    });

export default function ActivityPopUp({ instanceId, userId, membershipType, onClose }) {
    const fetchActivitiesDetails = useActivityDetails();
    const fetchPlayersBasicData = usePlayersBasicData();
    const [activity, setActivity] = useState({});
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchActivity = async () => {
            setLoading(true);

            const activityGeneral = await fetchActivitiesDetails(instanceId, userId);
            const player = await fetchPlayersBasicData(activityGeneral, userId, membershipType);
            let activityData = null;
            const raw = activityGeneral?.pgcrImage;
            const fullPgcrImage = raw
                ? (raw.startsWith("http") ? raw : `${raw}`)
                : null;

            const preloadedBg = await preloadImage(fullPgcrImage);
            
            if (activityGeneral?.activityMode == "Social") activityData = { ...activityGeneral, player, pgcrImage: preloadedBg };
            else activityData = { ...activityGeneral, ...player,  pgcrImage: preloadedBg};
            setActivity(activityData);
            setLoading(false);
        };

        fetchActivity();
    }, [instanceId, userId, membershipType]);

    return (
        activity && !loading ? (
            activity.splitedInTeams == true ? (
                <Crucible actComplete={activity} userId={userId} onClose={onClose} instanceId={activity.instanceId} />
            ) : (
                activity.activityType == "PvE" ? (
                    activity.activityMode == "Social" ? (
                        <Social actComplete={activity} userId={userId} membershipType={membershipType} onClose={onClose} instanceId={activity.instanceId} />
                    ) : (
                        <Pve actComplete={activity} userId={userId} onClose={onClose} />
                    )
                ) : (
                    <Rumble actComplete={activity} userId={userId} onClose={onClose} instanceId={activity.instanceId} />
                )
            )) : <LoadingReport />
    );

}