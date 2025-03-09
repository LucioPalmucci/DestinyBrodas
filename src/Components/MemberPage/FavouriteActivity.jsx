import axios from "axios";
import { useEffect, useState } from "react";

export default function FavouriteActivity({ membershipType, userId, pvp }) {
    const [mostPlayedActivity, setMostPlayedMode] = useState(null);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchGeneralStats = async () => {
            try {

                let modeGroups = {};

                const mazmorras = await activityHashes(608898761, false);
                const asaltos = await activityHashes(4110605575, false);
                const raids = await activityHashes(2043403989, false);
                const ocasos = await activityHashes(547513715, false);
                const historia = await activityHashes(1686739444, false);
                const estandarte = await activityHashes(2371050408, true);
                const crisol = await activityHashes(4088006058, true);
                const Pruebas = await activityHashes(2112637710, true);

                modeGroups = {
                    Mazmorras: { hashes: mazmorras, timePlayed: 0, completions: 0, kills: 0 },
                    Asaltos: { hashes: asaltos, timePlayed: 0, completions: 0, kills: 0 },
                    Incursiones: { hashes: raids, timePlayed: 0, completions: 0, kills: 0 },
                    Ocasos: { hashes: ocasos, timePlayed: 0, completions: 0, kills: 0 },
                    Historia: { hashes: historia, timePlayed: 0, completions: 0, kills: 0 },
                    Estandarte: { hashes: estandarte, timePlayed: 0, completions: 0, kills: 0 },
                    Pruebas: { hashes: Pruebas, timePlayed: 0, completions: 0, kills: 0 },
                    Crisol: { hashes: crisol, timePlayed: 0, completions: 0, kills: 0 },
                };

                const profileRes = await axios.get(`/api/Platform/Destiny2/${membershipType}/Profile/${userId}/?components=100,104`, {
                    headers: {
                        "X-API-Key": "f83a251bf2274914ab739f4781b5e710",
                    }
                });
                const characterIds = profileRes.data.Response.profile.data.characterIds;

                let allActivities = await activitiesStats(characterIds, membershipType, userId);

                allActivities.forEach(activity => {
                    const hash = activity.activityHash;
                    for (const mode in modeGroups) {
                        if (modeGroups[mode].hashes.includes(hash)) {
                            modeGroups[mode].timePlayed += activity.values.activitySecondsPlayed.basic.value;
                            modeGroups[mode].completions += activity.values.activityCompletions.basic.value;
                            modeGroups[mode].kills += activity.values.activityKills.basic.value;
                            break;
                        }
                    }
                });

                let mostPlayedMode = null;
                let maxTimePlayed = 0;
                for (const mode in modeGroups) {
                    if (modeGroups[mode].timePlayed > maxTimePlayed) {
                        maxTimePlayed = modeGroups[mode].timePlayed;
                        mostPlayedMode = mode;
                    }
                }

                if (mostPlayedMode) {
                    setMostPlayedMode({
                        mode: mostPlayedMode,
                        timePlayed: (modeGroups[mostPlayedMode].timePlayed / 3600).toFixed(0),
                        completions: modeGroups[mostPlayedMode].completions,
                        kills: modeGroups[mostPlayedMode].kills,
                    });
                }

            } catch (error) {
                console.error(error);
            }
        };

        fetchGeneralStats();
    }, [membershipType, userId]);


    async function activityHashes(mode, pvp) {
        const activityUrl = "https://www.bungie.net/common/destiny2_content/json/es/DestinyActivityDefinition-180d19ec-32f8-4b44-8b2a-fcc5163f4db0.json";
        const activityRes = await axios.get(activityUrl);

        const activityData = activityRes.data;
        const filteredActivities = Object.values(activityData).filter(
            (activity) => pvp ? activity.activityTypeHash == mode : activity.directActivityModeHash == mode
        );

        const activityHashes = filteredActivities.map((activity) => activity.hash);
        return activityHashes;
    }

    async function activitiesStats(characterIds, membershipType, userId) {
        let allActivities = [];
        for (const characterId of characterIds) {
            const activitiesStats = await axios.get(`/api/Platform/Destiny2/${membershipType}/Account/${userId}/Character/${characterId}/Stats/AggregateActivityStats/`, {
                headers: {
                    'X-API-Key': 'f83a251bf2274914ab739f4781b5e710',
                },
            });
            allActivities = allActivities.concat(activitiesStats.data.Response.activities);
        }

        /*const activityMap = new Map();
        allActivities.forEach(activity => {
            const hash = activity.activityHash;
            if (!activityMap.has(hash)) {
                activityMap.set(hash, {
                    ...activity,
                    values: { ...activity.values },
                });
            } else {
                const existingActivity = activityMap.get(hash);
                Object.keys(activity.values).forEach(key => {
                    existingActivity.values[key].basic.value += activity.values[key].basic.value;
                });
            }
        });
        allActivities = Array.from(activityMap.values());*/

        return allActivities;
    }

    return (
        <div>
            {mostPlayedActivity ? (
                <p>
                    Actividad más jugada: {mostPlayedActivity.mode}<br />
                    Tiempo jugado: {mostPlayedActivity.timePlayed} horas<br />
                    Completiciones: {mostPlayedActivity.completions}<br />
                    Kills: {mostPlayedActivity.kills}
                </p>
            ) : (
                <p>Cargando actividad...</p>
            )}
            {error && <p>{error}</p>}
        </div>
    );
}