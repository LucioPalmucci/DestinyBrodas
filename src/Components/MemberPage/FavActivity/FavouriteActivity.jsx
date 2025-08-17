import axios from "axios";
import { useEffect, useState } from "react";
import compBG from "../../../assets/ActivityModes/comp.png";
import gambitBG from "../../../assets/ActivityModes/gambit.png";
import ibBG from "../../../assets/ActivityModes/ib.png";
import pvpBG from "../../../assets/ActivityModes/pvp.jpg";
import strikesBG from "../../../assets/ActivityModes/strikes.png";
import trialsBG from "../../../assets/ActivityModes/trials.png";
import crucibleLogo from "../../../assets/cruciblelogo.png";
import { API_CONFIG } from "../../../config";
import { useBungieAPI } from "../../APIservices/BungieAPIcache";
import ActivitiesComp from "./ActivitiesComp";

export default function FavouriteActivity({ membershipType, userId }) {
    const [modeDataPVE, setModeDataPVE] = useState([]);
    const [modeDataPVP, setModeDataPVP] = useState([]);
    const [error, setError] = useState(null);
    const { getCompsProfile, getItemManifest, getAggregateActivityStats, getProfileChars, getManifest, getGeneralStats } = useBungieAPI();

    useEffect(() => {
        const fetchGeneralStats = async () => {
            try {
                const mazmorras = await activityHashes(608898761, false);
                const operaciones = await activityHashes(4110605575, false);
                const raids = await activityHashes(2043403989, false);
                const gambito = await activityHashes(1848252830, false);
                const estandarte = await activityHashes(2371050408, true);
                const crisol = await activityHashes(4088006058, true);
                const Pruebas = await activityHashes(2112637710, true);
                const competitivo = await activityHashes(2486723318, false);

                console.log("com", competitivo);

                let modeGroups = {
                    Mazmorras: { hashes: mazmorras, timePlayed: 0, completions: 0, kills: 0, modeHash: 608898761, name: "Mazmorras", bgImg: null },
                    Operaciones: { hashes: operaciones, timePlayed: 0, completions: 0, kills: 0, modeHash: 2394616003, name: "Operaciones", bgImg: strikesBG },
                    Incursiones: { hashes: raids, timePlayed: 0, completions: 0, kills: 0, modeHash: 2043403989, name: "Incursiones", bgImg: null },
                    Gambito: { hashes: gambito, timePlayed: 0, completions: 0, kills: 0, modeHash: 1848252830, name: "Gambito", bgImg: gambitBG },
                    Estandarte: { hashes: estandarte, timePlayed: 0, completions: 0, kills: 0, modeHash: 1826469369, name: "Estandarte de Hierro", bgImg: ibBG },
                    Pruebas: { hashes: Pruebas, timePlayed: 0, completions: 0, kills: 0, modeHash: 1673724806, name: "Pruebas de Osiris", bgImg: trialsBG },
                    Crisol: { hashes: crisol, timePlayed: 0, completions: 0, kills: 0, modeHash: 1164760504, name: "Crisol", bgImg: pvpBG },
                    Competitivo: { hashes: competitivo, timePlayed: 0, completions: 0, kills: 0, modeHash: 2486723318, name: "Competitivo", bgImg: compBG }
                };

                const profileRes = await getCompsProfile(membershipType, userId);
                const characterIds = profileRes.profile.data.characterIds;

                console.log(await getGeneralStats(membershipType, userId))
                let allActivities = await activitiesStats(characterIds, membershipType, userId);
                console.log(allActivities)

                allActivities.forEach(activity => {
                    const hash = activity?.activityHash;
                    if (hash == null) return; // Maneja el caso de hash null

                    for (const mode in modeGroups) {
                        if (modeGroups[mode].hashes.includes(hash)) {
                            modeGroups[mode].timePlayed += activity.values.activitySecondsPlayed.basic.value;
                            modeGroups[mode].completions += activity.values.activityCompletions.basic.value;
                            modeGroups[mode].kills += activity.values.activityKills.basic.value;
                            break;
                        }
                    }
                });

                let tempModeData = [];
                for (const mode in modeGroups) {
                    let modoDatos = await fetchActivityDetails(modeGroups[mode].modeHash, "DestinyActivityModeDefinition", "general");
                    let characterCompletions = {};
                    for (const characterId of characterIds) {
                        characterCompletions[characterId] = {};
                        characterCompletions[characterId].totalCompletions = await mostPlayedCharacter(modeGroups[mode], characterId, membershipType, userId);
                        characterCompletions[characterId].percentage = ((characterCompletions[characterId].totalCompletions / modeGroups[mode].completions) * 100).toFixed(1);
                        characterCompletions[characterId].character = await characterClass(characterId, membershipType, userId);
                        characterCompletions[characterId].classImg = charImg(characterCompletions[characterId].character, membershipType, userId);
                    }

                    tempModeData.push({
                        mode: modeGroups[mode].name,
                        timePlayed: (modeGroups[mode].timePlayed / 3600).toFixed(0),
                        completions: modeGroups[mode].completions,
                        kills: modeGroups[mode].kills,
                        icon: modeGroups[mode].name == "Crisol" ? crucibleLogo : API_CONFIG.BUNGIE_API + modoDatos?.displayProperties?.icon,
                        pgcrImg: modeGroups[mode].name == "Mazmorras" || modeGroups[mode].name == "Incursiones" ? await getFavActivityImage(allActivities, modeGroups[mode]) : modeGroups[mode].bgImg,
                        characterCompletions: characterCompletions,
                    });
                }
                // TempModeData mitades: PVE y PVP

                const mid = Math.ceil(tempModeData.length / 2);
                let tempPVE = tempModeData.slice(0, mid);
                let tempPVP = tempModeData.slice(mid);
                tempPVE = getPercentages(tempPVE);
                tempPVP = getPercentages(tempPVP);
                tempPVE.sort((a, b) => b.completions - a.completions);
                tempPVP.sort((a, b) => b.completions - a.completions);
                setModeDataPVE(tempPVE);
                setModeDataPVP(tempPVP);
            } catch (error) {
                console.error(error);
            }
        };

        fetchGeneralStats();
    }, [membershipType, userId]);

    const fetchActivityDetails = async (activityHash, type) => {
        try {
            return await getItemManifest(activityHash, type);
        } catch (error) {
            console.error(`Error fetching activity details for hash ${activityHash}:`, error);
            return null;
        }
    };


    async function activityHashes(mode, pvp) {
        const manifestRes = await getManifest();
        const activityUrl = `https://www.bungie.net${manifestRes.jsonWorldComponentContentPaths.es.DestinyActivityDefinition}`;

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
            const activitiesStats = await getAggregateActivityStats(membershipType, userId, characterId);
            allActivities = allActivities.concat(activitiesStats.activities);
        }
        return allActivities;
    }

    async function mostPlayedCharacter(mode, characterId, membershipType, userId) {
        const activitiesStats = await getAggregateActivityStats(membershipType, userId, characterId);

        if (!activitiesStats || !activitiesStats.activities || !Array.isArray(activitiesStats.activities) || activitiesStats.activities.length === 0) {
            console.warn(`No activities found for character ${characterId}`);
            return 0;
        }
        let allActivities = activitiesStats.activities;
        let classCompletitions = 0;

        allActivities.forEach(activity => {
            const hash = activity?.activityHash;
            if (hash == null) return;
            if (mode.hashes.includes(hash)) {
                classCompletitions += activity.values.activityCompletions.basic.value;
            }
        });

        return classCompletitions;
    }

    async function characterClass(characterId, membershipType, userId) {
        const characterRes = await getProfileChars(membershipType, userId, characterId);
        switch (characterRes.classType) {
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
                link: `${API_CONFIG.BUNGIE_API}/common/destiny2_content/icons/571dd4d71022cbef932b9be873d431a9.png`,
                colore: "brightness(0) saturate(100%) invert(82%) sepia(14%) saturate(5494%) hue-rotate(341deg) brightness(105%) contrast(98%)"
            })
            case "Titán": return ({
                link: `${API_CONFIG.BUNGIE_API}/common/destiny2_content/icons/707adc0d9b7b1fb858c16db7895d80cf.png`,
                colore: "brightness(0) saturate(100%) invert(21%) sepia(52%) saturate(4147%) hue-rotate(335deg) brightness(83%) contrast(111%)"
            })
            case "Cazador": return ({
                link: `${API_CONFIG.BUNGIE_API}/common/destiny2_content/icons/9bb43f897531bb6395bfefc82f2ec267.png`,
                colore: "brightness(0) saturate(100%) invert(24%) sepia(29%) saturate(5580%) hue-rotate(199deg) brightness(95%) contrast(95%)"
            })
        }
    }

    async function getFavActivityImage(allActivities, mode) {
        let mostPlayedActivity = { hash: null, timePlayed: 0 };
        allActivities.forEach(activity => {
            const hash = activity?.activityHash;
            if (hash == null) return;
            if (mode.hashes.includes(hash)) {
                if (activity?.values?.activitySecondsPlayed?.basic?.value > mostPlayedActivity.timePlayed) {
                    mostPlayedActivity = {
                        hash: activity?.activityHash,
                        timePlayed: activity?.values?.activitySecondsPlayed?.basic?.value
                    };
                }
            }
        });
        const activity = await getItemManifest(mostPlayedActivity.hash, "DestinyActivityDefinition");
        return API_CONFIG.BUNGIE_API + activity?.pgcrImage;
    }

    function getPercentages(modes) {
        const total = modes.reduce((sum, mode) => sum + mode.completions, 0);
        return modes.map(mode => ({
            ...mode,
            percentage: total > 0 ? (mode.completions / total) * 100 : 0
        }));
    }

    return (
        <div>
            {modeDataPVE.length > 0 && modeDataPVP.length > 0 ? (
                <div className="flex flex-col space-y-6">
                    <ActivitiesComp activities={modeDataPVE} tipo={"PVE"} />
                    <ActivitiesComp activities={modeDataPVP} tipo={"PVP"} />
                </div>
            ): (
                <div className="flex flex-col space-y-6">
                    <div className="py-4 p-6 rounded-lg h-[375px] flex justify-center bg-gray-300 items-center animate-pulse"></div>
                    <div className="py-4 p-6 rounded-lg h-[375px] flex justify-center bg-gray-300 items-center animate-pulse"></div>
                </div>
            )}
        </div>
    );
}