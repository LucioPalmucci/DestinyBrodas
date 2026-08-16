import { useCallback } from 'react';
import { bungieApiClient, useBungieAPI } from '../../../APIservices/BungieAPIcalls';
import { getClassIconUrlByHash as getUserClassSymbol } from '../../../../utils/classAssets';
import { ActivityStatsCalculator } from '../../../../domain/services/ActivityStatsCalculator';
const usePlayersBasicData = () => {
    const { getManifest, getCarnageReport, getCommendations, getCompsProfile, getItemManifest, getClanUser, getAggregateActivityStats, getCompChars } = useBungieAPI();
    const hazanias = [991354116, 2392637702, 251257575, 525411852, 2673088233];
    const fetchCarnageReport = useCallback(async (activity, userId, membershipType) => {
        try {
            const carnageReportResponse = await getCarnageReport(activity.instanceId);
            if (activity.activityMode == "Social") {
                let player = await getCaseSocial(activity, carnageReportResponse, userId, membershipType)
                return player;
            }

            const peopleRaw = await Promise.all(carnageReportResponse.entries.map(async (entry) => ({
                kills: entry.values.kills.basic.value,
                kd: entry.values.killsDeathsRatio.basic.value.toFixed(1),
                deaths: entry.values.deaths.basic.value,
                medals: entry.extended?.values?.allMedalsEarned?.basic?.value || 0,
                score: entry.values.score.basic.value == 0 ? entry.extended?.scoreboardValues?.player_score?.basic?.value : entry.values.score.basic.value,
                name: entry.player.destinyUserInfo.bungieGlobalDisplayName,
                emblem: entry.player.destinyUserInfo.iconPath,
                class: entry.player.characterClass,
                classHash: entry.player.classHash,
                classSymbol: getUserClassSymbol(entry.player.classHash),
                power: entry.player.lightLevel,
                characterId: entry.characterId,
                membershipId: entry.player.destinyUserInfo.membershipId,
                membershipType: entry.player.destinyUserInfo.membershipType,
                uniqueName: entry.player.destinyUserInfo.bungieGlobalDisplayName || entry.player.destinyUserInfo.displayName,
                uniqueNameCode: entry.player.destinyUserInfo.bungieGlobalDisplayNameCode ? "#" + String(entry.player.destinyUserInfo.bungieGlobalDisplayNameCode).padStart(4, '0') : "",
                uniqueCompleteName: entry.player.destinyUserInfo.bungieGlobalDisplayName || entry.player.destinyUserInfo.displayName + "#" + String(entry.player.destinyUserInfo.bungieGlobalDisplayNameCode).padStart(4, '0') || "",
                standing: entry.standing,
                completed: entry.values.completed.basic.value,
                values: entry.extended?.values,
                weaponsBase: entry.extended?.weapons,
                emblemHash: entry.player.emblemHash,
                timePlayed: entry.values.timePlayedSeconds.basic.displayValue,
                timePlayedSeconds: entry.values.timePlayedSeconds.basic.value,
                percentagePlayed: Math.trunc((entry.values.timePlayedSeconds.basic.value / activity.durationInSeconds) * 100),
                dashoffset: 2 * Math.PI * 6.5 * (1 - (Math.trunc((entry.values.timePlayedSeconds.basic.value / activity.durationInSeconds) * 100) / 100)),
                assists: entry.values.assists.basic.value,
                instanceId: activity.instanceId,
                completions: activity.activityType == "PvE" ? await getCompletionsPlayer(activity.hash, entry.player.destinyUserInfo.membershipType, entry.player.destinyUserInfo.membershipId) : null,
            })));
            const people = ActivityStatsCalculator.getReformedPeople(peopleRaw, activity, carnageReportResponse, userId);


            let teams = [], mvp = null, firstPlace = null, secondPlace = null, difficultyColor = null, difficulty = null, feats = null, scoreActivity = null;
            const hasPoints = ActivityStatsCalculator.getScore(activity, people);
            const hasMedals = people.some(person => person.medals > 0);
            const full = carnageReportResponse.activityWasStartedFromBeginning;
            if (activity.activityType == "PvP" || activity.activityType == "Gambito") { //PVP
                if (carnageReportResponse.teams && carnageReportResponse.teams.length >= 2) { //Por equipos
                    teams = ActivityStatsCalculator.buildTeamsData(people, carnageReportResponse, userId);
                    mvp = ActivityStatsCalculator.getMVP(teams, "pvp");
                    return { teams, mvp, hasPoints, hasMedals, full };
                } else { //Individual
                    mvp = ActivityStatsCalculator.getMVP(people, "rumble");
                    firstPlace = people.sort((a, b) => b.score - a.score)[0]
                    firstPlace = people.sort((a, b) => b.score - a.score)[0];
                    secondPlace = people.sort((a, b) => b.score - a.score)[1];
                    return { people: people, mvp, hasPoints, hasMedals, full, firstPlace, secondPlace };
                }
            } else { //PVE
                mvp = ActivityStatsCalculator.getMVP(people, "pve", activity);
                const manifest = await getManifest();
                if (carnageReportResponse.selectedSkullHashes && hazanias.some(h => carnageReportResponse.selectedSkullHashes.includes(h))) feats = await getAllFeats(activity, carnageReportResponse, manifest);
                else {
                    difficulty = await getDifficultyName(activity, carnageReportResponse, manifest);
                    difficultyColor = ActivityStatsCalculator.getDifficultyColor(difficulty);
                }
                if (hasPoints) scoreActivity = people.find(person => person.membershipId == userId)?.score;
                const playersStatusData = ActivityStatsCalculator.getHowToDisplayPlayers(activity, people, userId);
                return { people: people, mvp, hasPoints, hasMedals, full, difficulty, difficultyColor, feats, scoreActivity, ...playersStatusData };
            }
        } catch (error) {
            console.error('Error fetching carnage report:', error);
            return { people: [], teams: [], full: false };
        }
    }, [getCarnageReport, getCommendations, getCompsProfile, getItemManifest, getClanUser]);

    const getCompletionsPlayer = async (activityHash, membershipType, membershipId) => {
        try {
            let totalCompletitions = 0;
            const completions = await getCompsProfile(membershipType, membershipId);
            const characterIds = completions.profile.data.characterIds;
            for (const charId of characterIds) {
                const charCompletions = await getAggregateActivityStats(membershipType, membershipId, charId);
                if (charCompletions) {
                    let act = charCompletions.activities.find(activity => activity.activityHash == activityHash);
                    if (act) {
                        totalCompletitions += act.values.activityCompletions.basic.value;
                    }
                }
            }
            return totalCompletitions;
        } catch (error) {
            console.error('Error fetching player completions:', error);
            return 0;
        }
    }

    const getDifficultyName = async (activity, carnageReportResponse, manifest) => {
        let difficultyName = null;
        if (activity.difficultyCollection) {
            const diffUrl = `https://www.bungie.net${manifest.jsonWorldComponentContentPaths.es.DestinyActivityDifficultyTierCollectionDefinition}`;
            const diffData = await bungieApiClient.getPublic(diffUrl);

            const filteredActivities = Object.values(diffData).find((difficultyItem) => difficultyItem.hash == activity.difficultyCollection);

            difficultyName = filteredActivities?.difficultyTiers?.[carnageReportResponse.activityDifficultyTier - 1]?.displayProperties?.name; //
        }
        if ((difficultyName == null || difficultyName == "") && activity.difficulty || difficultyName.includes(activity.activityMode)) {
            difficultyName = activity.difficulty;
        }
        if (activity.activityName.includes(activity.difficulty)) difficultyName = "Estándar";
        return difficultyName;
    }

    const getAllFeats = async (activity, carnageReportResponse, manifest) => {
        let feats = [];
        const diffUrl = `https://www.bungie.net${manifest.jsonWorldComponentContentPaths.es.DestinyActivitySelectableSkullCollectionDefinition}`;
        const diffData = await bungieApiClient.getPublic(diffUrl);
        //const featsManifest = await getItemManifest(361405014, "DestinyActivitySelectableSkullCollectionDefinition");

        diffData[361405014].selectableActivitySkulls.forEach(skull => {
            if (carnageReportResponse.selectedSkullHashes.includes(skull.activitySkull.skullIdentifierHash)) {
                if (skull.activitySkull.skullIdentifierHash != 790421403) { //Si no es hazaña: vacia
                    feats.push({
                        name: skull.activitySkull.displayProperties.name,
                        icon: skull.activitySkull.displayProperties.icon,
                    });
                }
            }
        });
        return feats;
    }

    const getCaseSocial = async (activity, carnageReportResponse, userId, membershipType) => {
        let classe, classSymbol, player = null;
        const playerEntry = carnageReportResponse.entries.find(entry => entry.player.destinyUserInfo.membershipId == userId);

        const profile = playerEntry ? await getCompsProfile(membershipType, userId) : null;
        const chars = profile ? await getCompChars(membershipType, userId) : null;
        let emblem = playerEntry ? await getItemManifest(playerEntry.player.emblemHash, "DestinyInventoryItemDefinition") : null;

        const power = playerEntry ? playerEntry.player.lightLevel : null;
        emblem = emblem ? emblem.displayProperties.icon : null;
        const uniqueName = profile ? profile.profile.data.userInfo.bungieGlobalDisplayName : null;
        const uniqueNameCode = profile ? "#" + String(profile.profile.data.userInfo.bungieGlobalDisplayNameCode).padStart(4, '0') : null;

        for (const char of Object.values(chars)) {
            if (char.characterId == playerEntry.characterId) {
                const charData = await getItemManifest(char.classHash, "DestinyClassDefinition");
                classe = charData.genderedClassNames[char.genderType == 0 ? "Male" : "Female"];
                classSymbol = getUserClassSymbol(char.classHash);
                break;
            }
        }

        return player = {
            emblem,
            uniqueName,
            uniqueNameCode,
            classe,
            classSymbol,
            power,
            kills: playerEntry.values.kills.basic.value,
            deaths: playerEntry.values.deaths.basic.value,
            assists: playerEntry.values.assists.basic.value,
            kd: playerEntry.values.killsDeathsRatio.basic.value.toFixed(1),
            percentagePlayed: Math.trunc((playerEntry.values.timePlayedSeconds.basic.value / activity.durationInSeconds) * 100),
            dashoffset: 2 * Math.PI * 6.5 * (1 - (Math.trunc((playerEntry.values.timePlayedSeconds.basic.value / activity.durationInSeconds) * 100) / 100)),
            timePlayed: playerEntry.values.timePlayedSeconds.basic.displayValue,
            values: playerEntry.extended?.values,
        };
    }

    return fetchCarnageReport;
}


export default usePlayersBasicData;