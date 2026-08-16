// Helpers antes duplicados en playerDetailedData.jsx, ClanTeamates.jsx y CurrentActivity.jsx.
// Reciben las funciones de la capa de API (del hook useBungieAPI) como dependencia,
// para no acoplar esta capa a React.

export const fetchGuardianRank = async (id, type, { getCompsProfile, getItemManifest }) => {
    try {
        const responseProfile = await getCompsProfile(type, id);
        const RankNum = responseProfile.profile.data.currentGuardianRank;
        const guardianRankResponse = await getItemManifest(RankNum, "DestinyGuardianRankDefinition");
        return {
            title: guardianRankResponse.displayProperties.name,
            num: RankNum,
        };
    } catch (error) {
        console.error('Error al cargar datos del popup del jugador:', error);
    }
};

export const fetchEmblema = async (emblem, { getItemManifest }) => {
    const emblemaResponse = await getItemManifest(emblem, "DestinyInventoryItemDefinition");
    return emblemaResponse.secondaryIcon;
};

export const fetchClan = async (id, type, { getClanUser }) => {
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
};
