// Lógica de negocio pura (sin React, sin llamadas a la API) extraída de
// playersBasicData.jsx: reparto por equipos, cálculo de MVP, normalización
// de jugadores repetidos (multi-personaje) y reglas de "quién se queda".
export class ActivityStatsCalculator {
    static buildTeamsData(people, carnageReportResponse) {
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

    static getReformedPeople(peopleRaw, activity) {
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

    static getMVP(teams, mode, activity) {
        let mvp = null;
        if (mode === "pvp") {
            const winningTeam = teams.teamA.standing == 0 ? teams.teamA : teams.teamB;
            mvp = winningTeam?.people.sort((a, b) => b.score - a.score)[0];
            mvp.message = "El que tuvo mejor puntuación";
            if (mvp.score == null || mvp.score == 0) {
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

    static getScore(activity, people) {
        //Portal: Solo ops, fireteam ops, arena ops, crucible, gambit x2, pruebas de osiris.
        const isFormPortal = activity.activityTypeHash == 1996806804 || activity.activityTypeHash == 3851289711 ||
            activity.activityTypeHash == 904017341 || activity.activityTypeHash == 3340296467 || activity.activityTypeHash == 4088006058
            || activity.activityTypeHash == 2490937569 || activity.activityTypeHash == 248695599 || activity.activityTypeHash == 2112637710;
        if (isFormPortal) {
            return people.some(person => person.score);
        } else return false;
    }

    static getDifficultyColor(difficulty) {
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

    static getHowToDisplayPlayers(activity, playersData, userId) {
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
}
