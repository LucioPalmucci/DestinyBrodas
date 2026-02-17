import { useCallback } from 'react';
import { API_CONFIG } from '../../../../config';
import { useBungieAPI } from '../../../APIservices/BungieAPIcalls';
const usePlayersBasicData = () => {
    const { getCarnageReport, getCommendations, getCompsProfile, getItemManifest, getClanUser } = useBungieAPI();

    const fetchCarnageReport = useCallback(async (activity, userId) => {
        try {
            const carnageReportResponse = await getCarnageReport(activity.instanceId);
            const filteredEntries = carnageReportResponse.entries;
            if (filteredEntries.length > 30) filteredEntries.splice(30);

            const people = await Promise.all(filteredEntries.map(async (entry) => ({
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
                membershipId: entry.player.destinyUserInfo.membershipId,
                membershipType: entry.player.destinyUserInfo.membershipType,
                uniqueName: entry.player.destinyUserInfo.bungieGlobalDisplayName,
                uniqueNameCode: "#" + entry.player.destinyUserInfo.bungieGlobalDisplayNameCode,
                honor: entry.player.destinyUserInfo.membershipType != 0 ? await getCommendations(entry.player.destinyUserInfo.membershipType, entry.player.destinyUserInfo.membershipId) : null,
                guardinRank: entry.player.destinyUserInfo.membershipType != 0 ? await fetchGuardianRank(entry.player.destinyUserInfo.membershipId, entry.player.destinyUserInfo.membershipType) : null,
                emblemBig: entry.player.destinyUserInfo.membershipType != 0 ? await fetchEmblema(entry.player.emblemHash) : null,
                clan: entry.player.destinyUserInfo.membershipType != 0 ? await fetchClan(entry.player.destinyUserInfo.membershipId, entry.player.destinyUserInfo.membershipType) : null,
                standing: entry.standing,
                completed: entry.values.completed.basic.value,
                values: entry.extended?.values,
                weapons: await getWeaponDetails(entry.extended?.weapons) || null,
                timePlayed: entry.values.timePlayedSeconds.basic.displayValue,
                timePlayedSeconds: entry.values.timePlayedSeconds.basic.value,
                assists: entry.values.assists.basic.value,
            })));

            let teams = [], mvp = null, firstPlace = null, secondPlace = null;
            const hasPoints = people.some(person => person.score > 0);
            const hasMedals = people.some(person => person.medals > 0);
            const full = carnageReportResponse.activityWasStartedFromBeginning;
            if ((activity.modeNumbers.includes(5) || activity.modeNumbers.includes(63)) && (!activity.modeNumbers.includes(48) && !activity.modeNumbers.includes(57))) {
                teams = buildTeamsData(people, carnageReportResponse, userId);
                mvp = getMVP(teams, "pvp");
                return { teams, mvp, hasPoints, hasMedals, full };
            } else if ((activity.modeNumbers.includes(48) || activity.modeNumbers.includes(57))) {
                mvp = getMVP(people, "rumble");
                firstPlace = people.sort((a, b) => b.score - a.score)[0];
                secondPlace = people.sort((a, b) => b.score - a.score)[1];
                return { people: people, mvp, hasPoints, hasMedals, full, firstPlace, secondPlace };
            } else {
                mvp = getMVP(people, "pve", activity);
                return { people: people, mvp, hasPoints, hasMedals, full };
            }
        } catch (error) {
            console.error('Error fetching carnage report:', error);
            return { people: [], teams: [], full: false };
        }
    }, [getCarnageReport, getCommendations, getCompsProfile, getItemManifest, getClanUser]);

    const buildTeamsData = (people, carnageReportResponse, userId) => {
        const teamW = people.filter(person => person.standing === 0);
        const teamL = people.filter(person => person.standing === 1);
        const userInTeamW = people.some(person => person.standing === 0 && person.membershipId === userId);
        const userInTeamL = people.some(person => person.standing === 1 && person.membershipId === userId);

        let winnerPoints, loserPoints, winnerName, loserName;
        winnerPoints = carnageReportResponse.teams[0].standing.basic.value == 0 ? carnageReportResponse.teams[0].score.basic.value : carnageReportResponse.teams[1]?.score.basic.value;
        loserPoints = carnageReportResponse.teams[0].standing.basic.value == 1 ? carnageReportResponse.teams[0].score.basic.value : carnageReportResponse.teams[1]?.score.basic.value;
        winnerName = carnageReportResponse.teams[0].standing.basic.value == 0 ? carnageReportResponse.teams[0].teamId : carnageReportResponse.teams[1]?.teamId;
        loserName = carnageReportResponse.teams[0].standing.basic.value == 1 ? carnageReportResponse.teams[0].teamId : carnageReportResponse.teams[1]?.teamId;

        return { teamW: { people: teamW, user: userInTeamW, points: winnerPoints, name: winnerName }, teamL: { people: teamL, user: userInTeamL, points: loserPoints, name: loserName } };
    }

    const getMVP = (teams, mode, activity) => {
        let mvp = null;
        if (mode === "pvp") {
            mvp = teams.teamW.people.sort((a, b) => b.score - a.score)[0];
        } else if (mode === "rumble") {
            mvp = teams.sort((a, b) => b.score - a.score)[0];
        } else if (mode === "pve") {
            teams.forEach(person => {
                let timePlayedTotalPercentage = person.timePlayedSeconds / activity.values.activityDurationSeconds.basic.value;
                if (timePlayedTotalPercentage > 0.85) {
                    if (mvp == null || mvp?.deaths > person.deaths) {
                        if (mvp == null || mvp?.kd < person.kd) {
                            mvp = person;
                        }
                    }
                }
            });
        }
        return {
            nombre: mvp?.name,
            membershipId: mvp?.membershipId,
            membershipType: mvp?.membershipType,
            class: mvp?.class,
            classHash: mvp?.classHash,
        };
    }

    const fetchGuardianRank = async (id, type) => {
        try {
            const responseProfile = await getCompsProfile(type, id);
            const RankNum = responseProfile.profile.data.currentGuardianRank;
            const guardianRankResponse = await getItemManifest(RankNum, "DestinyGuardianRankDefinition");
            return ({
                title: guardianRankResponse.displayProperties.name,
                num: RankNum,
            });
        } catch (error) {
            console.error('Error al cargar datos del popup del jugador:', error);
        }
    }

    const fetchEmblema = async (emblem) => {
        const emblemaResponse = await getItemManifest(emblem, "DestinyInventoryItemDefinition");
        return emblemaResponse.secondaryIcon;
    }

    const fetchClan = async (id, type) => {
        try {
            const userClan = await getClanUser(type, id);
            if (userClan?.results && userClan.results.length > 0 && userClan.results[0]?.group?.name) {
                return userClan.results[0].group.name;
            } else {
                return "No pertenece a ningún clan";
            }
        } catch (error) {
            console.error('Error al cargar el clan del usuario:', error);
            return "No pertenece a ningún clan";
        }
    }

    const getWeaponDetails = async (weapons) => {
        if (!weapons || !Array.isArray(weapons)) {
            return [];
        }
        const weaponD = await Promise.all(weapons.map(async (weapon) => {
            const weaponInfo = await getItemManifest(weapon.referenceId, "DestinyInventoryItemDefinition");
            return {
                name: weaponInfo.displayProperties.name,
                icon: weaponInfo.displayProperties.icon,
                archetype: weaponInfo.itemTypeDisplayName,
                kills: weapon.values.uniqueWeaponKills.basic.value,
                precisionKills: weapon.values.uniqueWeaponPrecisionKills.basic.value,
                precisionKillsPercentage: weapon.values.uniqueWeaponKillsPrecisionKills.basic.displayValue,
            };
        }));
        return weaponD;
    }

    const getUserClassSymbol = (classHash) => {
        const classIcons = {
            [2271682572]: `${API_CONFIG.BUNGIE_API}/common/destiny2_content/icons/571dd4d71022cbef932b9be873d431a9.png`,
            [3655393761]: `${API_CONFIG.BUNGIE_API}/common/destiny2_content/icons/707adc0d9b7b1fb858c16db7895d80cf.png`,
            [671679327]: `${API_CONFIG.BUNGIE_API}/common/destiny2_content/icons/9bb43f897531bb6395bfefc82f2ec267.png`,
        };
        return classIcons[classHash] || null
    }

    return fetchCarnageReport;
}



export default usePlayersBasicData;