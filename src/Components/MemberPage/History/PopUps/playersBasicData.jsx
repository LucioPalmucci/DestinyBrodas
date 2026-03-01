import axios from 'axios';
import { useCallback } from 'react';
import { API_CONFIG } from '../../../../config';
import { useBungieAPI } from '../../../APIservices/BungieAPIcalls';
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
                completions: activity.activityType == "PvE" ? await getCompletionsPlayer(activity.hash, entry.player.destinyUserInfo.membershipType, entry.player.destinyUserInfo.membershipId) : null,
            })));
            const people = getReformedPeople(peopleRaw, activity, carnageReportResponse, userId);


            let teams = [], mvp = null, firstPlace = null, secondPlace = null, difficultyColor = null, difficulty = null, feats = null, scoreActivity = null;
            const hasPoints = getScore(activity, people);
            const hasMedals = people.some(person => person.medals > 0);
            const full = carnageReportResponse.activityWasStartedFromBeginning;
            if (activity.activityType == "PvP" || activity.activityType == "Gambito") { //PVP
                if (carnageReportResponse.teams && carnageReportResponse.teams.length >= 2) { //Por equipos
                    teams = buildTeamsData(people, carnageReportResponse, userId);
                    mvp = getMVP(teams, "pvp");
                    return { teams, mvp, hasPoints, hasMedals, full };
                } else { //Individual
                    mvp = getMVP(people, "rumble");
                    firstPlace = people.sort((a, b) => b.score - a.score)[0]
                    firstPlace = people.sort((a, b) => b.score - a.score)[0];
                    secondPlace = people.sort((a, b) => b.score - a.score)[1];
                    return { people: people, mvp, hasPoints, hasMedals, full, firstPlace, secondPlace };
                }
            } else { //PVE
                mvp = getMVP(people, "pve", activity);
                const manifest = await getManifest();
                if (carnageReportResponse.selectedSkullHashes && hazanias.some(h => carnageReportResponse.selectedSkullHashes.includes(h))) feats = await getAllFeats(activity, carnageReportResponse, manifest);
                else {
                    difficulty = await getDifficultyName(activity, carnageReportResponse, manifest);
                    difficultyColor = getDifficultyColor(difficulty);
                }
                if (hasPoints) scoreActivity = people.find(person => person.membershipId == userId)?.score;
                const playersStatusData = getHowToDisplayPlayers(activity, people, userId);
                return { people: people, mvp, hasPoints, hasMedals, full, difficulty, difficultyColor, feats, scoreActivity, ...playersStatusData};
            }
        } catch (error) {
            console.error('Error fetching carnage report:', error);
            return { people: [], teams: [], full: false };
        }
    }, [getCarnageReport, getCommendations, getCompsProfile, getItemManifest, getClanUser]);

    const buildTeamsData = (people, carnageReportResponse) => {

        const sortedTeams = [...(carnageReportResponse?.teams || [])].sort((a, b) => (a?.teamId ?? Infinity) - (b?.teamId ?? Infinity));

        const teamAData = sortedTeams[0] || null;
        const teamBData = sortedTeams[1] || null;
        const teamAstanding = teamAData?.standing?.basic?.value;
        const teamBstanding = teamBData?.standing?.basic?.value;
        let alphaPoints, bravoPoints, peopleA, peopleB;
        alphaPoints = teamAData?.score?.basic?.value ?? 0;
        bravoPoints = teamBData?.score?.basic?.value ?? 0;
        peopleA = people.filter(person => person.standing === teamAstanding);
        peopleB = people.filter(person => person.standing === teamBstanding);

        return {
            teamA: { people: peopleA, score: alphaPoints, name: "Alpha", standing: teamAstanding },
            teamB: { people: peopleB, score: bravoPoints, name: "Bravo", standing: teamBstanding }
        };
    }

    const getReformedPeople = (peopleRaw, activity) => {
        const people = Object.values(
            peopleRaw.reduce((acc, p) => {
                const key = p.membershipId;

                if (!acc[key]) {
                    acc[key] = { ...p, characterIds: [p.characterId] };
                } else {
                    acc[key].kills += p.kills;
                    acc[key].deaths += p.deaths;
                    acc[key].medals += p.medals;
                    acc[key].score += p.score;
                    acc[key].assists += p.assists;
                    acc[key].completed += p.completed;
                    acc[key].timePlayedSeconds += p.timePlayedSeconds;
                    acc[key].characterIds.push(p.characterId);
                }
                return acc;
            }, {})
        ).map((p) => {
            const percentagePlayed = activity.durationInSeconds
                ? Math.trunc((p.timePlayedSeconds / activity.durationInSeconds) * 100)
                : 0;

            const totalSeconds = Math.max(0, Math.floor(p.timePlayedSeconds || 0));
            const h = Math.floor(totalSeconds / 3600);
            const m = Math.floor((totalSeconds % 3600) / 60);
            const s = totalSeconds % 60;

            const timePlayed = h > 0 ? `${h}h ${m}m` : `${m}m ${s}s`;
            return {
                ...p,
                percentagePlayed,
                dashoffset: 2 * Math.PI * 6.5 * (1 - percentagePlayed / 100),
                kd: p.deaths > 0 ? (p.kills / p.deaths).toFixed(1) : p.kills,
                timePlayed,
            };
        });
        return people;
    }

    const getMVP = (teams, mode, activity) => {
        let mvp = null;
        if (mode === "pvp") {
            const winningTeam = teams.teamA.standing == 0 ? teams.teamA : teams.teamB;
            mvp = winningTeam?.people.sort((a, b) => b.score - a.score)[0];
            mvp.message = "El que tuvo mejor puntuación";
            if(mvp.score == null || mvp.score == 0) {
                mvp = winningTeam?.people.sort((a, b) => b.kd - a.kd)[0];
                mvp.message = "El que tuvo mejor KD";
            }
        } else if (mode === "rumble") {
            mvp = teams.sort((a, b) => b.score - a.score)[0];
        } else if (mode === "pve") {
            mvp = teams.sort((a, b) => b.kills - a.kills)[0];
            teams.forEach(person => {
                let timePlayedTotalPercentage = person.timePlayedSeconds / activity.durationInSeconds;
                if (timePlayedTotalPercentage > 0.85) {
                    if (mvp == null || mvp?.deaths > person.deaths) {
                        mvp = person;
                        if (mvp?.deaths == person.deaths && mvp?.kd < person.kd) {
                            mvp = person;
                        }
                    }
                }
            });
            mvp.message = "El que murió menos veces";
        }
        return {
            nombre: mvp?.name,
            membershipId: mvp?.membershipId,
            membershipType: mvp?.membershipType,
            class: mvp?.class,
            classHash: mvp?.classHash,
            uniqueName: mvp?.uniqueName,
            uniqueNameCode: mvp?.uniqueNameCode,
            message: mvp?.message,
        };
    }

    const getUserClassSymbol = (classHash) => {
        const classIcons = {
            [2271682572]: `${API_CONFIG.BUNGIE_API}/common/destiny2_content/icons/571dd4d71022cbef932b9be873d431a9.png`,
            [3655393761]: `${API_CONFIG.BUNGIE_API}/common/destiny2_content/icons/707adc0d9b7b1fb858c16db7895d80cf.png`,
            [671679327]: `${API_CONFIG.BUNGIE_API}/common/destiny2_content/icons/9bb43f897531bb6395bfefc82f2ec267.png`,
        };
        return classIcons[classHash] || null
    }

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

    const getScore = (activity, people) => {
        //Portal: Solo ops, fireteam ops, arena ops, crucible, gambit x2, pruebas de osiris.
        const isFormPortal = activity.activityTypeHash == 1996806804 || activity.activityTypeHash == 3851289711 ||
            activity.activityTypeHash == 904017341 || activity.activityTypeHash == 3340296467 || activity.activityTypeHash == 4088006058
            || activity.activityTypeHash == 2490937569 || activity.activityTypeHash == 248695599 || activity.activityTypeHash == 2112637710;
        if (isFormPortal) {
            return people.some(person => person.score);
        } else return false;
    }

    const getDifficultyName = async (activity, carnageReportResponse, manifest) => {
        let difficultyName = null;
        if (activity.difficultyCollection) {
            const diffUrl = `https://www.bungie.net${manifest.jsonWorldComponentContentPaths.es.DestinyActivityDifficultyTierCollectionDefinition}`;
            const diffRes = await axios.get(diffUrl);
            const diffData = diffRes.data;

            const filteredActivities = Object.values(diffData).find((difficultyItem) => difficultyItem.hash == activity.difficultyCollection);

            difficultyName = filteredActivities?.difficultyTiers?.[carnageReportResponse.activityDifficultyTier - 1]?.displayProperties?.name; //
        }
        if ((difficultyName == null || difficultyName == "") && activity.difficulty || difficultyName.includes(activity.activityMode)) {
            difficultyName = activity.difficulty;
        }
        if (activity.activityName.includes(activity.difficulty)) difficultyName = "Estándar";
        return difficultyName;
    }

    const getDifficultyColor = (difficulty) => {
        const dn = difficulty.toLowerCase();
        if (dn.includes("entrenamiento")) {
            return "brightness(0) saturate(100%) invert(81%) sepia(6%) saturate(145%) hue-rotate(233deg) brightness(93%) contrast(89%)";
        }
        if (["normal", "estándar", "estandar", "avanzado"].some(k => dn.includes(k))) {
            return "brightness(0) saturate(100%) invert(49%) sepia(99%) saturate(135%) hue-rotate(83deg) brightness(91%) contrast(91%)";
        }
        if (["gran maestro", "granmaestro", "definitivo", "ultimátum", "ultimatum"].some(k => dn.includes(k))) {
            return "brightness(0) saturate(100%) invert(22%) sepia(41%) saturate(2631%) hue-rotate(327deg) brightness(88%) contrast(94%)";
        }
        if (["experto", "maestro"].some(k => dn.includes(k))) {
            return "brightness(0) saturate(100%) invert(77%) sepia(79%) saturate(1179%) hue-rotate(324deg) brightness(90%) contrast(83%)";
        }
        return "";
    }

    const getAllFeats = async (activity, carnageReportResponse, manifest) => {
        let feats = [];
        const diffUrl = `https://www.bungie.net${manifest.jsonWorldComponentContentPaths.es.DestinyActivitySelectableSkullCollectionDefinition}`;
        const diffRes = await axios.get(diffUrl);
        const diffData = diffRes.data;
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

    const getHowToDisplayPlayers = (activity, playersData, userId) => {
        let peopleStay = null, peopleLeave = null;
        if (activity.modeNumbers.includes(4) || activity.modeNumbers.includes(82)) { //En Mazmorras o Raids
            if (activity.completed == "Completado") { //Si se completó
                peopleStay = playersData.filter(player => player.completed == 1 || player.membershipId == userId) //se quedó
                peopleLeave = playersData.filter(player => player.completed == 0 && player.membershipId != userId) //se fue
            }
            else if (activity.completed == "Abandonado" && playersData.length <= 6) { //Si no se completó y fueron 6 personas o menos
                peopleStay = playersData; //se quedaron todos
            }
            else if (activity.completed == "Abandonado" && playersData.length > 6) { //Si no se completó y fueron más de 6 personas
                peopleStay = playersData.filter(player => player.completed == 0 || player.membershipId == userId).sort((a, b) => b.timePlayedSeconds - a.timePlayedSeconds) //se quedó y ordenar por el que mas tiempo estuvo
                playersData.mvp = peopleStay[0]; //El MVP ahora es el que más tiempo estuvo.
                playersData.mvp.specialOne = true;
                playersData.mvp.message = "El que bancó más tiempo";
            }
        } else { //En el resto de PvE
            if (activity.completed == "Abandonado") peopleStay = playersData; //Si no se completó, se muestra las stats de todos.
            else if (activity.completed == "Completado") { //Si se completó, se muestra solo las stats de los que lo completaron.
                peopleStay = playersData.filter(player => player.completed == 1 || player.membershipId == userId) //se quedó
                peopleLeave = playersData.filter(player => player.completed == 0 && player.membershipId != userId) //se fue
            }
            if (activity.completed == "Completado" && activity.modeNumbers.includes(6)) { //Si es exploracion
                peopleStay = playersData;
                peopleLeave = null;
            }
        }
        playersData.people = null;
        return { peopleStay, peopleLeave, ...playersData };
    }

    return fetchCarnageReport;
}


export default usePlayersBasicData;