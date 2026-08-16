import { weaponTranslations } from '../../utils/weaponTranslations';

// Extraído de FavouriteActivity.jsx (getMostUsedWeapons): la parte de
// negocio pura (elegir el arma más usada excluyendo Super/Cuerpo a
// cuerpo/Granada, traducir tipo -> nombre/ícono). La llamada a
// getGeneralStats() sigue en el componente.
export class WeaponStatsCalculator {
    static pickMostUsedWeapon(responseGeneral) {
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
}
