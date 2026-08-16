import { useState } from "react";
import { useBungieAPI } from '../../../APIservices/BungieAPIcalls';
import { loadCache, saveCache } from '../../../Cache/componentsCache';
import { fetchClan, fetchEmblema, fetchGuardianRank } from '../../../../utils/playerInfoFetchers';

const CACHE_TTL = 5 * 60 * 1000;

export const usePlayerDetailedData = () => {
    const api = useBungieAPI();
    const { getCommendations, getItemManifest } = api;
    const [playerReady, setPlayerReady] = useState(false);

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
                jugador.guardianRank = await fetchGuardianRank(jugador.membershipId, jugador.membershipType, api);
                jugador.clan = await fetchClan(jugador.membershipId, jugador.membershipType, api);
                jugador.emblemBig = await fetchEmblema(jugador.emblemHash, api);
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
