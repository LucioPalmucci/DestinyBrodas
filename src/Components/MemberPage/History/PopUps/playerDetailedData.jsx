import { useState } from "react";
import { useBungieAPI } from '../../../APIservices/BungieAPIcalls';
import { loadCache, saveCache } from '../../../Cache/componentsCache';

const CACHE_TTL = 5 * 60 * 1000;

export const usePlayerDetailedData = () => {
    const { getCommendations, getCompsProfile, getItemManifest, getClanUser } = useBungieAPI();
    const [playerReady, setPlayerReady] = useState(false);

    const fetchGuardianRank = async (id, type) => {
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

    const fetchEmblema = async (emblem) => {
        const emblemaResponse = await getItemManifest(emblem, "DestinyInventoryItemDefinition");
        return emblemaResponse.secondaryIcon;
    };

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
    };

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
        weaponD.sort((a, b) => b.kills - a.kills);
        return weaponD;
    };

    const loadDetailedData = async (jugadores) => {
        if (!jugadores) return;
        const players = Array.isArray(jugadores) ? jugadores : [jugadores];

        const allCached = players.every((jugador) => {
            const cacheKey = `player_popup_${jugador.membershipId}_${jugador.instanceId}`;
            const cached = loadCache(cacheKey, CACHE_TTL);
            if (cached) {
                jugador.honor = cached.honor;
                jugador.guardianRank = cached.guardianRank;
                jugador.clan = cached.clan;
                jugador.emblemBig = cached.emblemBig;
                jugador.weapons = cached.weapons;
                return true;
            }
            return false;
        });

        if (allCached) {
            setPlayerReady(true);
            return;
        }

        try {
            await Promise.all(players.map(async (jugador) => {
                const cacheKey = `player_popup_${jugador.membershipId}_${jugador.instanceId}`;
                const cached = loadCache(cacheKey, CACHE_TTL);
                if (cached) {
                    jugador.honor = cached.honor;
                    jugador.guardianRank = cached.guardianRank;
                    jugador.clan = cached.clan;
                    jugador.emblemBig = cached.emblemBig;
                    jugador.weapons = cached.weapons;
                    return;
                }

                jugador.honor = await getCommendations(jugador.membershipType, jugador.membershipId);
                jugador.guardianRank = await fetchGuardianRank(jugador.membershipId, jugador.membershipType);
                jugador.clan = await fetchClan(jugador.membershipId, jugador.membershipType);
                jugador.emblemBig = await fetchEmblema(jugador.emblemHash);
                jugador.weapons = await getWeaponDetails(jugador.weaponsBase);
                saveCache(cacheKey, {
                    honor: jugador.honor,
                    guardianRank: jugador.guardianRank,
                    clan: jugador.clan,
                    emblemBig: jugador.emblemBig,
                    weapons: jugador.weapons,
                });
            }));
            setPlayerReady(true);
        } catch (error) {
            console.error("Error al cargar los datos del jugador:", error);
            setPlayerReady(false);
        }
    };

    return { playerReady, loadDetailedData };
};
