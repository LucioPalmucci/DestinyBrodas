import axios from "axios";
import pLimit from 'p-limit';
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
    const [mostUsedWeaponPVP, setMostUsedWeaponPVP] = useState(null);

    const CACHE_TTL = 1 //* 60 * 1000; // 1 minute
    const cacheKey = `favActivity_${membershipType}_${userId}`;

    const { getCompsProfile, getItemManifest, getAggregateActivityStats, getProfileChars, getManifest, getManifestData, getCharacterManyActivities, getCarnageReport, getProfileGeneralProgressions, getGeneralStats, loadCache, saveCache } = useBungieAPI();

    //Armas e iconos
    const weaponTranslations = {
        'AutoRifle': { name: 'Fusil Automático', icon: 'icon-AutoRifle' },
        'BeamRifle': { name: 'Fusil de Rastreo', icon: 'icon-BeamRifle' },
        'Bow': { name: 'Arco', icon: 'icon-Bow' },
        'FusionRifle': { name: 'Fusil de Fusion', icon: 'icon-FusionRifle' },
        'Glaive': { name: 'Guja', icon: 'icon-Glaive' },
        'GrenadeLauncher': { name: 'Lanzagranadas', icon: 'icon-GrenadeLauncher' },
        'HandCannon': { name: 'Cañón de Mano', icon: 'icon-HandCannon' },
        'MachineGun': { name: 'Ametralladora', icon: 'icon-MachineGun' },
        'PulseRifle': { name: 'Fusil de Pulsos', icon: 'icon-PulseRifle' },
        'RocketLauncher': { name: 'Lanzacohetes', icon: 'icon-RocketLauncher' },
        'ScoutRifle': { name: 'Fusil de Explorador', icon: 'icon-ScoutRifle' },
        'Shotgun': { name: 'Escopeta', icon: 'icon-Shotgun' },
        'SideArm': { name: 'Pistola', icon: 'icon-SideArm' },
        'Sniper': { name: 'Francotirador', icon: 'icon-Sniper' },
        'Submachinegun': { name: 'Subfusil', icon: 'icon-Submachinegun' },
        'Sword': { name: 'Espada', icon: 'icon-Sword' },
        'TraceRifle': { name: 'Fusil de Rastreo', icon: 'icon-TraceRifle' },
        'N/A': { name: '', icon: 'icon-na' }
    };

    useEffect(() => {
        const fetchGeneralStats = async () => {
            try {
                // Try loading from cache first
                const cached = loadCache(cacheKey, CACHE_TTL);
                if (cached) {
                    setModeDataPVE(cached.pve || []);
                    setModeDataPVP(cached.pvp || []);
                    setMostUsedWeaponPVP(cached.weapon || null);
                    console.log("Loaded favourite activities from cache", cached);
                    return;
                }
                const manifestRes = await getManifest();
                let mazmorras = await activityHashes(608898761, true, manifestRes);
                let operaciones = await activityHashes(4110605575, false, manifestRes);
                let raids = await activityHashes(2043403989, true, manifestRes);
                let gambito = await activityHashes(1848252830, false, manifestRes);
                let estandarte = await activityHashes(2371050408, true, manifestRes);
                let crisol = await activityHashes(4088006058, true, manifestRes);
                let pruebas = await activityHashes(2112637710, true, manifestRes);
                let competitivo = await activityHashes(2239249083, true, manifestRes); //1430623298, 3194159491, 2442635447, 197180276

                // Sacar hashes del crisol estandarte y pruebas que pertenencen a competitivo
                const competitivoSet = new Set(competitivo);
                crisol = crisol.filter(hash => !competitivoSet.has(hash));
                estandarte = estandarte.filter(hash => !competitivoSet.has(hash));
                pruebas = pruebas.filter(hash => !competitivoSet.has(hash));

                let modeGroups = {
                    Mazmorras: { hashes: mazmorras, timePlayed: 0, completions: 0, kills: 0, modeHash: 608898761, name: "Mazmorras", bgImg: null, textCompletitions: "mazmorras" },
                    Operaciones: { hashes: operaciones, timePlayed: 0, completions: 0, kills: 0, modeHash: 2394616003, name: "Portal", bgImg: strikesBG, modeData: { favoriteActivity: null }, textCompletitions: "actividades" },
                    Incursiones: { hashes: raids, timePlayed: 0, completions: 0, kills: 0, modeHash: 2043403989, name: "Incursiones", bgImg: null, textCompletitions: "incursiones" },
                    Gambito: { hashes: gambito, timePlayed: 0, completions: 0, kills: 0, modeHash: 1848252830, name: "Gambito", bgImg: gambitBG, textCompletitions: "partidas" },
                    Estandarte: { hashes: estandarte, timePlayed: 0, completions: 0, kills: 0, modeHash: 1826469369, name: "Estandarte de Hierro", bgImg: ibBG, modeData: [], textCompletitions: "partidas" },
                    Pruebas: { hashes: pruebas, timePlayed: 0, completions: 0, kills: 0, modeHash: 1673724806, name: "Pruebas de Osiris", bgImg: trialsBG, textCompletitions: "partidas" },
                    Crisol: { hashes: crisol, timePlayed: 0, completions: 0, kills: 0, modeHash: 1164760504, name: "Crisol", bgImg: pvpBG, modeData: [], textCompletitions: "partidas" },
                    Competitivo: { hashes: competitivo, timePlayed: 0, completions: 0, kills: 0, modeHash: 2239249083, name: "Competitivo", bgImg: compBG, modeData: [], textCompletitions: "partidas" }
                };

                const profileRes = await getCompsProfile(membershipType, userId);
                const characterIds = profileRes.profile.data.characterIds;
                let allActivities = [];
                let charactersData = await Promise.all(
                    characterIds.map(async (characterId) => {
                        const charClass = await characterClass(characterId, membershipType, userId);
                        let act = await getAggregateActivityStats(membershipType, userId, characterId);
                        allActivities.push(...Object.values(act));
                        return {
                            class: charClass,
                            classImg: charImg(charClass),
                            id: characterId,
                            act,
                        };

                    })
                );
                allActivities = allActivities.flat();
                const mostUsedWeapon = await getMostUsedWeapons(membershipType, userId);
                setMostUsedWeaponPVP(mostUsedWeapon);

                const profileProgression = await getProfileGeneralProgressions(membershipType, userId);
                let localPVE = [];
                let localPVP = [];
                const mazData = await getEndGameData(membershipType, userId, allActivities, modeGroups["Mazmorras"], `62192879-bde5-45b6-9918-09166dc0c6d4`, false, characterIds, profileProgression, charactersData);
                localPVE = upsertByMode(localPVE, mazData);
                setModeDataPVE(localPVE);

                const compData = await fetchAllCompetitiveMatches(membershipType, userId, allActivities, charactersData, profileProgression, modeGroups["Competitivo"]);
                localPVP = upsertByMode(localPVP, compData);
                setModeDataPVP(localPVP);

                const crisolData = await fetchPVPDATA(membershipType, userId, allActivities, modeGroups["Crisol"], 475207334, 1250683514, profileProgression, charactersData);
                localPVP = upsertByMode(localPVP, crisolData);
                setModeDataPVP(localPVP);

                const estandarteData = await fetchPVPDATA(membershipType, userId, allActivities, modeGroups["Estandarte"], 2161171268, null, profileProgression, charactersData);
                localPVP = upsertByMode(localPVP, estandarteData);
                setModeDataPVP(localPVP);

                const pruebasData = await fetchPVPDATA(membershipType, userId, allActivities, modeGroups["Pruebas"], 1733555826, 4112712479, profileProgression, charactersData);
                localPVP = upsertByMode(localPVP, pruebasData);
                setModeDataPVP(localPVP);

                const opsFav = await getOpsData(allActivities, modeGroups["Operaciones"], charactersData);
                localPVE = upsertByMode(localPVE, opsFav);
                setModeDataPVE(localPVE);

                const gambitoData = await getGambitoData(membershipType, userId, allActivities, modeGroups["Gambito"], characterIds, profileProgression, charactersData);
                localPVE = upsertByMode(localPVE, gambitoData);
                setModeDataPVE(localPVE);

                const incursionesData = await getEndGameData(membershipType, userId, allActivities, modeGroups["Incursiones"], `62192879-bde5-45b6-9918-09166dc0c6d4`, true, characterIds, profileProgression, charactersData);
                localPVE = upsertByMode(localPVE, incursionesData);
                setModeDataPVE(localPVE);

                console.log("Fetched favourite activities from API", localPVE, localPVP, mostUsedWeapon);
                try { saveCache(cacheKey, { pve: localPVE, pvp: localPVP, weapon: mostUsedWeapon }); } catch (e) { }
            } catch (error) {
                console.error(error);
            }
        };

        fetchGeneralStats();
    }, [membershipType, userId]);

    async function buildModeData(mode, allActivities, charactersData, progressions) {

        allActivities.forEach(activity => {
            const hash = activity?.activityHash;
            if (hash == null) return; // Maneja el caso de hash null
            if (mode.hashes.includes(hash)) {
                mode.timePlayed += activity.values.activitySecondsPlayed.basic.value;
                mode.completions += activity.values.activityCompletions.basic.value;
                mode.kills += activity.values.activityKills.basic.value;
                //break;
            }
        });

        let modoDatos = await fetchActivityDetails(mode.modeHash, "DestinyActivityModeDefinition", "general");
        let characterCompletions = {};
        for (const character of charactersData) {
            characterCompletions[character.id] = {};
            characterCompletions[character.id].totalCompletions = await mostPlayedCharacter(mode, character) || mode.modeData.characterCompletions[character.id]?.completions || 0;
            characterCompletions[character.id].percentage = mode.name == "Competitivo" ? mode.modeData.characterCompletions[character.id]?.percentage : ((characterCompletions[character.id].totalCompletions / mode.completions) * 100).toFixed(1) || 0;
            characterCompletions[character.id].character = character.class;
            characterCompletions[character.id].classImg = charImg(characterCompletions[character.id].character);
        }
        characterCompletions = Object.values(characterCompletions).sort((a, b) => b.totalCompletions - a.totalCompletions);

        if (mode.name == "Gambito") mode.completions = progressions.profileRecords.data.records?.[3565692839]?.intervalObjectives[0].progress;

        return ({
            mode: mode.name,
            timePlayed: mode.modeData?.timePlayed || (mode.timePlayed / 3600).toFixed(0),
            completions: mode.completions || mode.modeData?.completions,
            kills: mode.kills || mode.modeData?.kills,
            icon: mode.name == "Crisol" ? crucibleLogo : API_CONFIG.BUNGIE_API + modoDatos?.displayProperties?.icon,
            pgcrImg: mode.name == "Mazmorras" || mode.name == "Incursiones" ? API_CONFIG.BUNGIE_API + mode.modeData?.favoriteActivity?.pgcrImage : mode.bgImg,
            characterCompletions: characterCompletions,
            modeData: mode.modeData || [],
            textCompletitions: mode.textCompletitions
        });
    }

    const fetchActivityDetails = async (activityHash, type) => {
        try {
            return await getItemManifest(activityHash, type);
        } catch (error) {
            console.error(`Error fetching activity details for hash ${activityHash}:`, error);
            return null;
        }
    };

    async function activityHashes(mode, pvp, manifest) {
        const activityUrl = `https://www.bungie.net${manifest.jsonWorldComponentContentPaths.es.DestinyActivityDefinition}`;
        const activityRes = await axios.get(activityUrl);
        const activityData = activityRes.data;

        const filteredActivities = Object.values(activityData).filter(
            (activity) => pvp ? activity.activityTypeHash == mode : activity.directActivityModeHash == mode
        );

        const activityHashes = filteredActivities.map((activity) => activity.hash);
        return activityHashes;
    }

    async function mostPlayedCharacter(mode, charactersData) {
        let allActivities = charactersData.act.activities;
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

    async function fetchAllRaidActivities(userId, apiKey) {
        let allActivities = [];
        let cursor = null;
        let hasMore = true;

        while (hasMore) {
            const url = cursor
                ? `https://api.raidhub.io/player/${userId}/history?count=5000&cursor=${cursor}`
                : `https://api.raidhub.io/player/${userId}/history`;

            const response = await axios.get(url, {
                headers: {
                    "X-API-Key": apiKey
                }
            });

            const data = response.data;

            if (data.response.activities) {
                allActivities = allActivities.concat(data.response.activities);
            }

            if (data.response.nextCursor) {
                cursor = data.response.nextCursor;
            } else {
                hasMore = false;
            }
        }

        allActivities = allActivities.filter(activity => activity?.player?.completed == true);
        const completitions = allActivities.length;
        const freshCompletitions = allActivities.filter(activity => activity?.fresh == true).length;
        const checkpointCompletitions = allActivities.filter(activity => activity?.fresh == false || activity?.fresh == null).length;

        return {
            completitions,
            freshCompletitions,
            checkpointCompletitions
        };
    }

    async function fetchAllDungeonsActivities(membershipType, userId, characterIds, group) {
        let allDungeons = await Promise.all(
            characterIds.map(async (charId) => {
                let page = 0;
                let allDungeonsChar = [];
                while (true) {
                    const activities = await getCharacterManyActivities(membershipType, userId, charId, "7", page);
                    if (!activities || activities.length === 0) break;
                    allDungeonsChar = allDungeonsChar.concat(activities);
                    page++;
                }

                return allDungeonsChar;
            })
        );
        allDungeons = allDungeons.flat();
        allDungeons.sort((a, b) => (b.period > a.period ? 1 : b.period < a.period ? -1 : 0));
        allDungeons = allDungeons.filter(dungeon => group.hashes.includes(dungeon.activityDetails.directorActivityHash));
        let allClearedDungeons = allDungeons.filter(dungeon => dungeon?.values?.completed?.basic?.value == 1);
        //let allClearedFreshDungeons = await getAllFreshDungeons(membershipType, userId, allClearedDungeons, characterIds);
        let allClearedFreshDungeons = [];
        const completitions = allClearedDungeons.length;
        const freshCompletitions = allClearedFreshDungeons?.filter(dungeon => dungeon.activityWasStartedFromBeginning == true).length || 0;
        const checkpointCompletitions = allClearedFreshDungeons.filter(dungeon => dungeon.activityWasStartedFromBeginning == false).length || 0;

        return {
            completitions,
            freshCompletitions,
            checkpointCompletitions
        };
    }

    async function getAllFreshDungeons(membershipType, userId, allClearedDungeons, characterIds) {
        const limit = pLimit(250);
        const results = await Promise.all(
            allClearedDungeons.map(dungeon =>
                limit(async () => {
                    const acts = await getCarnageReport(dungeon.activityDetails.instanceId);
                    return {
                        ...dungeon,
                        activityWasStartedFromBeginning: acts.activityWasStartedFromBeginning,
                    };
                })
            )
        );
        return results;
    }

    async function fetchAllCompetitiveMatches(membershipType, userId, allActivities, charactersData, progressions, group) {
        let characterCompletions = {};
        let allCompetitive = await Promise.all(
            charactersData.map(async (character) => {
                let page = 0;
                let allCompetitiveChar = [];
                while (true) {
                    let activities = await getCharacterManyActivities(membershipType, userId, character.id, "69", page);
                    if (!activities || activities.length === 0) break;
                    allCompetitiveChar = allCompetitiveChar.concat(activities);
                    page++;
                }
                characterCompletions[character.id] = {
                    ...character,
                    completions: allCompetitiveChar.reduce(
                        (acc, activity) => acc + (activity?.values?.completed?.basic?.value || 0),
                        0
                    ),
                };
                return allCompetitiveChar;
            })
        );
        // Calcular el % de completiciones totales que representa cada personaje
        const totalCompletions = Object.values(characterCompletions).reduce((acc, curr) => acc + (curr.completions || 0), 0);
        Object.keys(characterCompletions).forEach(charId => {
            characterCompletions[charId].percentage = totalCompletions > 0
                ? ((characterCompletions[charId].completions / totalCompletions) * 100).toFixed(1)
                : "0.0";
        });

        allCompetitive = allCompetitive.flat();
        let completions = 0, timePlayed = 0, kills = 0, wins = 0, defeats = 0, kd = 0, deaths = 0;
        allCompetitive.forEach(activity => {
            completions += activity?.values?.completed?.basic?.value || 0;
            timePlayed += activity?.values?.timePlayedSeconds?.basic?.value || 0;
            kills += activity?.values?.kills?.basic?.value || 0;
            deaths += activity?.values?.deaths?.basic?.value || 0;
            wins += activity?.values?.standing?.basic?.value == 0 ? 1 : 0;
            defeats += activity?.values?.standing?.basic?.value == 1 ? 1 : 0;
            kd += activity?.values?.killsDeathsRatio?.basic?.value || 0;
        });

        let winDefeatRatio = (wins / (wins + defeats || 1) * 100).toFixed(1);
        let totalKD = (kills / (deaths || 1)).toFixed(2);
        let division = progressions.characterProgressions.data[charactersData[0].id].progressions[3696598664];
        let logo = await getItemManifest("3696598664", "DestinyProgressionDefinition");
        division = {
            ...division,
            logo: API_CONFIG.BUNGIE_API + logo.steps[division.stepIndex].icon
        }

        group.modeData = {
            completions: completions,
            timePlayed: (timePlayed / 3600).toFixed(0),
            percentage: (completions / (totalCompletions || 1) * 100).toFixed(1),
            kills: kills,
            wins: wins,
            defeats: defeats,
            kd: totalKD,
            winDefeatRatio: winDefeatRatio,
            division: division,
            characterCompletions: characterCompletions,
        }

        let completeData = await buildModeData(group, allActivities, charactersData, progressions);
        return completeData;
    }

    async function fetchPVPDATA(membershipType, userId, allActivities, group, sealHash, gildedHash, progressions, charactersData) {
        let completions = 0, timePlayed = 0, kills = 0, wins = 0, defeats = 0, kd = 0, deaths = 0, precisionKills = 0;
        allActivities.forEach(activity => {
            const hash = activity?.activityHash;
            if (hash == null) return; // Maneja el caso de hash null
            if (group.hashes.includes(hash)) {
                timePlayed += activity.values.activitySecondsPlayed.basic.value;
                completions += activity.values.activityCompletions.basic.value;
                kills += activity.values.activityKills.basic.value;
                deaths += activity.values.activityDeaths.basic.value;
                wins += activity?.values?.activityWins?.basic?.value;
                kd += activity?.values?.activityKillsDeathsRatio?.basic?.value;
                precisionKills += activity?.values?.activityPrecisionKills?.basic?.value;
            }
        });

        if (group.name == "Pruebas de Osiris") {
            console.log("Processing PVP data for group:", progressions);
            wins = progressions?.metrics?.data?.metrics?.[1365664208]?.objectiveProgress.progress;
        }
        if(group.name == "Estandarte de Hierro") {
            wins = progressions.profileRecords.data.records?.[4159436958]?.objectives[0].progress + progressions.profileRecords.data.records?.[4159436958]?.objectives[1].progress + progressions.profileRecords.data.records?.[4159436958]?.objectives[2].progress || 0;
        }
        if(group.name == "Crisol") {
            completions = progressions.profileRecords.data.records?.[4181381577]?.intervalObjectives[0].progress || 0;
            wins = progressions.profileRecords.data.records?.[3561485187]?.intervalObjectives[0].progress || 0;
        }
        let winDefeatRatio = (wins / (completions || 1) * 100).toFixed(1);
        let totalKD = (kills / (deaths || 1)).toFixed(2);

        let seal = await getItemManifest(sealHash, "DestinyPresentationNodeDefinition");

        group.modeData = {
            completions,
            timePlayed: (timePlayed / 3600).toFixed(0),
            kills,
            deaths,
            wins: wins,
            defeats: completions - wins,
            kd: totalKD,
            winDefeatRatio,
            precisionKills,
            seals: {
                name: seal?.displayProperties?.name || "Desconocido",
                iconComplete: API_CONFIG.BUNGIE_API + seal?.displayProperties?.iconSequences?.[0]?.frames?.[0],
                iconIncomplete: API_CONFIG.BUNGIE_API + seal?.displayProperties?.iconSequences?.[1]?.frames?.[0],
                hash: seal?.hash,
                completionRecordHash: seal?.completionRecordHash || 0,
                completed: progressions.profileRecords.data.records[seal.completionRecordHash].objectives[0].complete,
                gilded: progressions.metrics.data.metrics?.[gildedHash]?.objectiveProgress.progress,
            }
        };
        let completeData = await buildModeData(group, allActivities, charactersData);
        return completeData;
    }

    /*async function fetchTrialsData(progressions) {
        let flawless = progressions?.metrics?.data.metrics?.[1765255052]?.objectiveProgress.progress;
        let highestStreak = progressions?.metrics?.data.metrics[1076064058].objectiveProgress.progress;
        return { flawless, highestStreak };
    }*/

    async function getFavActivity(allActivities, group) {
        let favoriteActivity = null;
        allActivities.forEach(activity => {
            const hash = activity?.activityHash;
            if (hash == null) return;
            if (group.hashes.includes(hash)) {
                if (activity.values.activityCompletions.basic.value > (favoriteActivity?.completions || 0)) {
                    favoriteActivity = {
                        hash,
                        completions: activity.values.activityCompletions.basic.value,
                    };
                }
            }
        });
        let favoriteActivityData = await getItemManifest(favoriteActivity.hash, "DestinyActivityDefinition");
        return favoriteActivityData;
    }

    async function getEndGameData(membershipType, userId, allActivities, group, apikey, isRaid, chars, progressions, charsData) {
        let completions = 0, favoriteActivity = null;
        if (group.name === "Incursiones") completions = await fetchAllRaidActivities(userId, apikey);
        else completions = await fetchAllDungeonsActivities(membershipType, userId, chars, group);
        favoriteActivity = await getFavActivity(allActivities, group);

        let seals = await fetchAllSeals(isRaid, progressions);

        group.modeData = { completions, favoriteActivity, seals }
        let completeData = await buildModeData(group, allActivities, charsData);
        return completeData;
    }

    async function fetchAllSeals(isRaid, progressions) {
        const raidSeals = [3954661385, 334829503, 238107129, 1976056830, 2613142083, 2886738008, 3734352323, 2960810718, 1827854727, 1486062207, 3492865493];
        const dungeonSeals = [1504131436, 2105055614, 2723381343, 1021469803, 1705744655, 4183969062, 854126634, 2603002048];

        let seals = [];
        if (isRaid) seals = raidSeals;
        else seals = dungeonSeals;

        const SealData = await Promise.all(
            seals.map(async (sealHash) => {
                const seal = await getItemManifest(sealHash, "DestinyPresentationNodeDefinition");
                let sealName = seal?.displayProperties?.name || "Desconocido";
                if (sealName.startsWith("El ")) {
                    sealName = sealName.slice(3);
                } else if (sealName.startsWith("La ")) {
                    sealName = sealName.slice(3);
                }
                sealName = sealName.charAt(0).toUpperCase() + sealName.slice(1);
                return {
                    name: sealName || "Desconocido",
                    iconComplete: API_CONFIG.BUNGIE_API + seal?.displayProperties?.iconSequences?.[0]?.frames?.[0],
                    iconIncomplete: API_CONFIG.BUNGIE_API + seal?.displayProperties?.iconSequences?.[1]?.frames?.[0],
                    hash: seal?.hash,
                    completionRecordHash: seal?.completionRecordHash || 0,
                    completed: false,
                };
            })
        );

        SealData.forEach(seal => {
            seal.completed = progressions.profileRecords.data.records?.[seal.completionRecordHash]?.objectives[0].complete;
        });

        return SealData;
    }

    async function getOpsData(allActivities, group, charsData) {
        let favoriteActivity = await getFavActivity(allActivities, group);
        group.modeData = { favoriteActivity }
        let completeData = await buildModeData(group, allActivities, charsData);
        return completeData;
    }

    async function getGambitoData(membershipType, userId, allActivities, group, characterIds, progressions, charactersData) {
        let invadersDefeated = progressions?.metrics?.data.metrics?.[3227312321]?.objectiveProgress.progress; // 921988512 seasonal, 3227312321 historico
        let gilded = progressions?.metrics?.data.metrics?.[2365336843]?.objectiveProgress.progress;
        let invasiones = progressions?.profileRecords?.data.records?.[985373860]?.intervalObjectives[0]?.progress;

        let motasTitan = progressions?.profileRecords?.data.records?.[89114360]?.objectives[2]?.progress;
        let motasHechicero = progressions?.profileRecords?.data.records?.[2129704137]?.objectives[2]?.progress;
        let motasCazador = progressions?.profileRecords?.data.records?.[1676011372]?.objectives[2]?.progress;

        let winsTitan = progressions?.profileRecords?.data.records?.[89114360]?.objectives[0]?.progress;
        let winsHechicero = progressions?.profileRecords?.data.records?.[2129704137]?.objectives[0]?.progress;
        let winsCazador = progressions?.profileRecords?.data.records?.[1676011372]?.objectives[0]?.progress;

        let motas = (motasTitan || 0) + (motasHechicero || 0) + (motasCazador || 0);
        let completions = progressions?.profileRecords.data.records?.[3565692839]?.intervalObjectives[0].progress;
        let wins = (winsTitan || 0) + (winsHechicero || 0) + (winsCazador || 0);

        let winDefeatRatio = (wins / (completions || 1) * 100).toFixed(1);

        const seal = await getItemManifest(3665267419, "DestinyPresentationNodeDefinition");
        group.modeData = {
            invadersDefeated,
            invasiones,
            killsGamb: invadersDefeated + invasiones,
            motas,
            winDefeatRatio,
            wins,
            defeats: completions - wins,
            seals:
            {
                name: seal?.displayProperties?.name || "Desconocido",
                iconComplete: API_CONFIG.BUNGIE_API + seal?.displayProperties?.iconSequences?.[0]?.frames?.[0],
                iconIncomplete: API_CONFIG.BUNGIE_API + seal?.displayProperties?.iconSequences?.[1]?.frames?.[0],
                hash: seal?.hash,
                completionRecordHash: seal?.completionRecordHash || 0,
                completed: progressions.profileRecords.data.records[seal.completionRecordHash].objectives[0].complete,
                gilded: gilded,
            }
        };
        let completeData = await buildModeData(group, allActivities, charactersData, progressions);
        return completeData;
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

    async function getMostUsedWeapons(membershipType, userId) {
        const responseGeneral = await getGeneralStats(membershipType, userId);
        let mostUsedWeapon = null;
        Object.values(responseGeneral.mergedAllCharacters.results.allPvP.allTime).forEach(weapon => {
            if (weapon.statId && weapon.statId.includes("weapon") && !weapon.statId.includes("Super") && !weapon.statId.includes("Melee") && !weapon.statId.includes("Grenade")) {
                if (!mostUsedWeapon || weapon.basic.value > mostUsedWeapon.basic.value) {
                    mostUsedWeapon = weapon;
                }
            }
        });
        let weaponInfo = { name: '', icon: 'icon-na' };
        if (mostUsedWeapon) {
            const weaponType = mostUsedWeapon.statId.replace("weaponKills", "");
            weaponInfo = weaponTranslations[weaponType] || {};
        }
        return mostUsedWeapon ? {
            name: weaponInfo.name,
            icon: weaponInfo.icon,
            kills: mostUsedWeapon.basic.value
        } : null;
    }

    // helper para insertar o reemplazar por mode
    const upsertByMode = (list, item) => {
        const arr = Array.isArray(list) ? list.slice() : [];
        const idx = arr.findIndex(x => x?.mode === item?.mode);
        if (idx >= 0) {
            arr[idx] = item;
        } else {
            arr.push(item);
        }
        return arr;
    };

    // Expected slot order for each side (keeps positions until all loaded)
    const expectedPVE = ["Mazmorras", "Portal", "Incursiones", "Gambito"];
    const expectedPVP = ["Estandarte de Hierro", "Pruebas de Osiris", "Crisol", "Competitivo"];

    const getSlotItems = (side) => {
        const source = side === 'PVE' ? modeDataPVE : modeDataPVP;
        const expected = side === 'PVE' ? expectedPVE : expectedPVP;

        const slots = expected.map(name => {
            const found = Array.isArray(source) ? source.find(x => x?.mode === name) : null;
            return found || { mode: name, loading: true };
        });
        const allLoaded = slots.every(s => !s.loading);
        if (allLoaded) {
            const totalCompletions = slots.reduce((sum, s) => sum + (s.completions || 0), 0);
            const slotsWithPct = slots.map(s => ({
                ...s,
                percentage: totalCompletions > 0 ? Number(((s.completions || 0) / totalCompletions * 100).toFixed(1)) : 0
            }));
            return slotsWithPct.slice().sort((a, b) => (b.completions || 0) - (a.completions || 0));
        }
        return slots;
    };

    const slotsPVE = getSlotItems('PVE');
    const slotsPVP = getSlotItems('PVP');

    return (
        <div>
            {modeDataPVE.length > 0 && modeDataPVP.length > 0 ? (
                <div className="flex flex-col space-y-6">
                    <ActivitiesComp activities={slotsPVE} tipo={"PVE"} pvpWeapon={null} />
                    <ActivitiesComp activities={slotsPVP} tipo={"PVP"} pvpWeapon={mostUsedWeaponPVP} />
                </div>
            ) : (
                <div className="flex flex-col space-y-6">
                    <div className="py-4 p-6 rounded-lg h-[300px] flex justify-center bg-gray-300 items-center animate-pulse"></div>
                    <div className="py-4 p-6 rounded-lg h-[300px] flex justify-center bg-gray-300 items-center animate-pulse"></div>
                </div>
            )}
        </div>
    );
}
