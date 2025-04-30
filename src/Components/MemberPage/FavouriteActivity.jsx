import axios from "axios";
import { useEffect, useState } from "react";
import { fetchActivityDetails } from "../RecentActivity";

export default function FavouriteActivity({ membershipType, userId }) {
    const [mostPlayedActivity, setMostPlayedMode] = useState(null);
    const [charCompl, setCharCompl] = useState(null);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchGeneralStats = async () => {
            try {
                const mazmorras = await activityHashes(608898761, false);
                const asaltos = await activityHashes(4110605575, false);
                const raids = await activityHashes(2043403989, false);
                const ocasos = await activityHashes(547513715, false);
                const historia = await activityHashes(1686739444, false);
                const estandarte = await activityHashes(2371050408, true);
                const crisol = await activityHashes(4088006058, true);
                const Pruebas = await activityHashes(2112637710, true);

                let modeGroups = {
                    Mazmorras: { hashes: mazmorras, timePlayed: 0, completions: 0, kills: 0, modeHash: 608898761, name: "Mazmorras" },
                    Asaltos: { hashes: asaltos, timePlayed: 0, completions: 0, kills: 0, modeHash: 2394616003, name: "Asaltos" },
                    Incursiones: { hashes: raids, timePlayed: 0, completions: 0, kills: 0, modeHash: 2043403989, name: "Incursiones" },
                    Ocasos: { hashes: ocasos, timePlayed: 0, completions: 0, kills: 0, modeHash: 3789021730, name: "Ocasos" },
                    Historia: { hashes: historia, timePlayed: 0, completions: 0, kills: 0, modeHash: 1686739444, name: "Historia" },
                    Estandarte: { hashes: estandarte, timePlayed: 0, completions: 0, kills: 0, modeHash: 1826469369, name: "Estandarte de Hierro" },
                    Pruebas: { hashes: Pruebas, timePlayed: 0, completions: 0, kills: 0, modeHash: 1673724806, name: "Pruebas de Osiris" },
                    Crisol: { hashes: crisol, timePlayed: 0, completions: 0, kills: 0, modeHash: 1164760504, name: "Crisol" },
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

                let mostPlayedActivity = { name: null, completions: 0 };
                allActivities.forEach(activity => {
                    const hash = activity.activityHash;
                    if (modeGroups[mostPlayedMode].hashes.includes(hash)) {
                        if (activity.values.activityCompletions.basic.value > mostPlayedActivity.completions) {
                            mostPlayedActivity = { name: activity.activityHash, completions: activity.values.activityCompletions.basic.value };
                        }
                    }
                });

                let modoDatos = await fetchActivityDetails(modeGroups[mostPlayedMode].modeHash, "DestinyActivityModeDefinition", "general");
                let characterCompletions = {};
                for (const characterId of characterIds) {
                    characterCompletions[characterId] = {};
                    characterCompletions[characterId].totalCompletions = await mostPlayedCharacter(modeGroups[mostPlayedMode], characterId, membershipType, userId);
                    characterCompletions[characterId].percentage = ((characterCompletions[characterId].totalCompletions / modeGroups[mostPlayedMode].completions) * 100).toFixed(1);
                    characterCompletions[characterId].character = await characterClass(characterId, membershipType, userId);
                    characterCompletions[characterId].classImg = charImg(characterCompletions[characterId].character, membershipType, userId);
                }
                

                if (mostPlayedMode) {
                    setMostPlayedMode({
                        mode: modeGroups[mostPlayedMode].name,
                        timePlayed: (modeGroups[mostPlayedMode].timePlayed / 3600).toFixed(0),
                        completions: modeGroups[mostPlayedMode].completions,
                        kills: modeGroups[mostPlayedMode].kills,
                        icon: "/api" + modoDatos?.displayProperties?.icon,
                        pgcrImg: mostPlayedMode == "Incursiones" ? "https://images.contentstack.io/v3/assets/blte410e3b15535c144/blt25ec3d789f5701d6/664ee84d2dad6500dee525d3/low-res-Pantheon-art---Raid-logo.jpg" : ("/api" + (modoDatos?.pgcrImage ?? "")),
                        fav: await fetchActivityDetails(mostPlayedActivity.name, "DestinyActivityDefinition"),
                    });
                }
                setCharCompl(characterCompletions);

                //console.log("Char completions", charCompl);
            } catch (error) {
                console.error(error);
            }
        };

        fetchGeneralStats();
    }, [membershipType, userId]);


    async function activityHashes(mode, pvp) {
        const manifestRes = await axios.get("/api/Platform/Destiny2/Manifest/", {
            headers: {
                "X-API-Key": "f83a251bf2274914ab739f4781b5e710",
            }
        });
        const activityUrl = `https://www.bungie.net${manifestRes.data.Response.jsonWorldComponentContentPaths.es.DestinyActivityDefinition}`;

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
        //console.log("Actividades", allActivities);
        return allActivities;
    }

    async function mostPlayedCharacter(mode, characterId, membershipType, userId) {

        const activitiesStats = await axios.get(`/api/Platform/Destiny2/${membershipType}/Account/${userId}/Character/${characterId}/Stats/AggregateActivityStats/`, {
            headers: {
                'X-API-Key': 'f83a251bf2274914ab739f4781b5e710',
            },
        });

        let allActivities = activitiesStats.data.Response.activities;
        let classCompletitions = 0;

        allActivities.forEach(activity => {
            const hash = activity.activityHash;
            if (mode.hashes.includes(hash)) {
                classCompletitions += activity.values.activityCompletions.basic.value;
            }
        });

        return classCompletitions;
    }

    async function characterClass(characterId, membershipType, userId) {

        const characterRes = await axios.get(`/api/Platform/Destiny2/${membershipType}/Profile/${userId}/Character/${characterId}/?components=200`, {
            headers: {
                "X-API-Key": "f83a251bf2274914ab739f4781b5e710",
            }
        });
        const characterData = characterRes.data.Response.character.data;
        switch (characterData.classType) {
            case 0:
                return "Titán";
            case 1:
                return "Cazador";
            case 2:
                return "Hechicero";
        }
    }

    function charImg(character) {
        switch (character) {
            case "Hechicero": return ({
                link: "/api/common/destiny2_content/icons/571dd4d71022cbef932b9be873d431a9.png",
                colore: "brightness(0) saturate(100%) invert(82%) sepia(14%) saturate(5494%) hue-rotate(341deg) brightness(105%) contrast(98%)"
            })
            case "Titán": return ({
                link: "/api/common/destiny2_content/icons/707adc0d9b7b1fb858c16db7895d80cf.png",
                colore: "brightness(0) saturate(100%) invert(21%) sepia(52%) saturate(4147%) hue-rotate(335deg) brightness(83%) contrast(111%)"
            })
            case "Cazador": return ({
                link: "/api/common/destiny2_content/icons/9bb43f897531bb6395bfefc82f2ec267.png",
                colore: "brightness(0) saturate(100%) invert(24%) sepia(29%) saturate(5580%) hue-rotate(199deg) brightness(95%) contrast(95%)"
            })
        }
    }

    return (
        <div className="w-fit font-Inter">
            {mostPlayedActivity && charCompl ? (
                <div className="text-white p-6 rounded-lg content-fit justify-between shadow-lg flex object-fill bg-center bg-cover min-w-md" style={{ backgroundImage: `url(${mostPlayedActivity.pgcrImg})`}}>
                    <div className="space-y-2 flex flex-col">
                        <div className="bg-black/25 p-2 rounded-lg w-fit mr-10 text-lg font-semibold p-0 leading-tight">
                            Actividad más jugada
                        </div>
                        <div className="bg-black/25 p-2 rounded-lg w-fit mr-10 text-4xl font-semibold p-0">
                            {mostPlayedActivity.mode}
                        </div>
                        <div className="bg-black/25 p-2 rounded-lg w-fit mr-10 p-0">
                            Completiciones: {mostPlayedActivity.completions}<br />
                            Tiempo jugado: {mostPlayedActivity.timePlayed}h<br />
                            Bajas: {mostPlayedActivity.kills}<br />
                            Favorita: {mostPlayedActivity.fav}
                        </div>
                        <div className="bg-black/25 p-2 rounded-lg w-fit mr-10 p-0 flex space-x-6">
                            {Object.keys(charCompl).sort((a, b) => charCompl[b].percentage - charCompl[a].percentage).map((char) => (
                                <div className="font-semibold mb-0 p-0 flex items-center" title={charCompl[char].totalCompletions}>
                                    <img src={charCompl[char].classImg.link} className={`w-8 h-8 mr-1`} style={{ filter: `${charCompl[char].classImg.colore}`, marginLeft: '-3px' }} />{charCompl[char].percentage}%
                                </div>
                            ))}
                        </div>
                    </div>
                    <div>
                        {mostPlayedActivity.icon && <img src={mostPlayedActivity.icon} className="w-20 h-20 opacity-50 ml-10" />}

                    </div>
                </div>
            ) : (
                <p>Cargando actividad...</p>
            )}
            {error && <p>{error}</p>}
        </div>
    );
}