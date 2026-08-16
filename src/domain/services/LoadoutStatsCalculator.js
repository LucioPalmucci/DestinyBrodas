// Lógica de negocio pura (sin React, sin API) extraída de CurrentLoadout.jsx:
// matemática de stats de armadura/armas (interpolación, coloreado por fuente
// del bonus: base/mod/obra maestra) y ordenamiento de perks.
export class LoadoutStatsCalculator {
    static sortByArtificePerk(perks) {
        const modifiers = [
            "enhancements",
            "intrinsics",
            "tuning.mods"
        ]
        const design = [
            "shader",
            "skins",
        ];
        const modifierPerks = perks.filter(perk => modifiers.some(mod => perk?.perkType?.includes(mod)));
        const designPerks = perks.filter(perk => design.some(des => perk?.perkType?.includes(des)));

        for (const mod of modifierPerks) {
            if (mod.name.includes("Forjad") || mod.name.includes("Modificador vacío") || mod.name.includes("/") || mod.name.includes("equilibrado")) {
                const index = modifierPerks.indexOf(mod);
                if (index > -1) {
                    modifierPerks.splice(index, 1); // Remove the perk from its current position
                    modifierPerks.splice(1, 0, mod); // Insert it at the second index
                }
            }
        }

        return {
            modifierPerks,
            designPerks,
        };
    }

    static getArmorStats(item, investmentStats, stats, gearTier) {
        let sumaBase = 0, sumaAzul = 0, sumaAmarillo = 0;
        const indexAB = investmentStats.findIndex(perk => perk.hash === 3122197216);
        if (indexAB > -1) {
            const [perk] = investmentStats.splice(indexAB, 1);
            investmentStats.unshift(perk);
        }
        stats.forEach((stat) => { //Para cada estat
            let blancobase, azul68a0b7 = 0, azul68a0b7_op8 = 0, amarillo = 0, perkAmarillo, perkAz8, perkAz68;
            investmentStats.forEach((perksinvestmentStat) => { //Para cada mod que afecta la stat
                if (perksinvestmentStat.hash == 3122197216) stat.value--; // Si tiene el mod de ajustes balanceados, restar 1 a la stat
                if (perksinvestmentStat.type == "armor_archetypes" && gearTier >= 3 && stat.value == 37) {
                    switch (stat.statHash) {
                        case 392767087: if (perksinvestmentStat.hash == 549468645) stat.value += 3; break; //Salud con bulwark
                        case 4244567218: if (perksinvestmentStat.hash == 3349393475) stat.value += 3; break; //Cuerpo a cuerpo con Brawler
                        case 1943323491: if (perksinvestmentStat.hash == 2230428468) stat.value += 3; break; //Clase con Specialist
                        case 2996146975: if (perksinvestmentStat.hash == 1807652646) stat.value += 3; break; //Armas con Gunslinger
                        case 1735777505: if (perksinvestmentStat.hash == 2937665788) stat.value += 3; break; //Granada con Grenadier
                        case 144602215: if (perksinvestmentStat.hash == 4227065942) stat.value += 3; break; //Super con Paragon
                        default: break;
                    }
                    stats[6].value += 3;
                }
                if (perksinvestmentStat.type == "v460.plugs.armor.masterworks" && ![5, 10, 15].includes(stat.value) && stat.value > 0) { //Si es el mod de armadura mejorada, solo mejorar las que tienen base 0
                    if (stat.name == "Total") stat.value = stat.value - 15;
                    else stat.value = stat.value - 5;
                }
                const matchingStat = perksinvestmentStat.investmentStats.find(
                    (invStat) => invStat.statTypeHash === stat.statHash
                );
                if (matchingStat) {
                    switch (matchingStat.value) {
                        case 2: //Si es 2 por la obra maestra
                            amarillo += matchingStat.value || 0;
                            perkAmarillo = "+" + matchingStat.value + " Estadística Obra Maestra";
                            break;
                        case 3: //Si es 3 por el mod artificio
                            azul68a0b7_op8 += matchingStat.value || 0;
                            perkAz68 = "+" + matchingStat.value + " " + perksinvestmentStat.name
                            break;
                        case 10: //Si es 10 por el mod insertado
                            azul68a0b7 += matchingStat.value || 0;
                            perkAz8 = "+" + matchingStat.value + " " + perksinvestmentStat.name
                            break;
                        case 5: //Si es 5 por el mod insertado o por mejorar armadura
                            if (perksinvestmentStat.type == "v460.plugs.armor.masterworks" && (stat.value == 5 || (stat.value == 15 || stat.value == 10 && stat.secciones?.["azul68a0b7"].value > 0))) {
                                amarillo += matchingStat.value || 0;
                                perkAmarillo = "+" + matchingStat.value + " " + perksinvestmentStat.name
                            }
                            if (perksinvestmentStat.name != "" != perksinvestmentStat.type == "v460.plugs.armor.masterworks") {
                                azul68a0b7 += matchingStat.value || 0;
                                perkAz8 = "+" + matchingStat.value + " " + perksinvestmentStat.name
                            }
                            break;
                        default:
                            break;
                    }
                }
            });
            blancobase = stat.value - (azul68a0b7 + azul68a0b7_op8 + amarillo);
            stat.secciones = {
                base: {
                    value: blancobase,
                    color: "#fff",
                    name: blancobase + " Estadísticas Base",
                },
                azul68a0b7: {
                    value: azul68a0b7,
                    color: "#68a0b7",
                    name: perkAz8 || null,
                },
                azul68a0b7_op8: {
                    value: azul68a0b7_op8,
                    color: "rgba(104, 160, 183, 0.8)",
                    name: perkAz68 || null,
                },
                amarillo: {
                    value: amarillo,
                    color: "#e8a534",
                    name: perkAmarillo || null,
                },
            }
            if (perkAmarillo) stat.isMw = true; //Atributo de obra maestra
            else stat.isMw = false;
            if (stat.name != "Total") {
                sumaBase += blancobase;
                sumaAzul += azul68a0b7 + azul68a0b7_op8;
                sumaAmarillo += amarillo;
            }
        })

        stats.forEach((stat => {
            if (stat.name == "Total") { //Acomodo los valores del total
                stat.secciones.base.value = stat.value - (sumaAzul + sumaAmarillo);
                stat.secciones.base.name = stat.value - (sumaAzul + sumaAmarillo) + " Estadísticas Base";
                stat.secciones.azul68a0b7.value = sumaAzul;
                stat.secciones.amarillo.value = sumaAmarillo;
                delete stat.secciones.azul68a0b7_op8;
            }
        }))
        return stats;
    }

    static sortWeaponPerks(perks) {
        const excludedModifiers = [
            "plugs.weapons.masterworks",
            "intrinsics",
            "plugs.weapons.masterworks.stats",
            "mementos",
            "shader",
            "skins",
            "v400.plugs.weapons.masterworks.trackers",
            "crafting.plugs",
            "crafting.recipes",
            "repackage",
            "weapon.damage_type.energy",
            "plugs.masterworks",
            "exotic.weapon.masterwork",
            "masterwork",
            "kill_vfx",
        ]

        const archetype = [
            "intrinsics",
            "masterwork",
        ];

        const design = [
            "mementos",
            "crafting.recipes",
            "kill_vfx",
            "shader",
            "skins",
        ];

        const tracker = [
            "plugs.weapons.masterworks.trackers",
        ];

        let modifierPerks = perks.filter(perk =>
            perk && excludedModifiers.every(mod => !perk.perkType?.includes(mod))
        );

        // Mover los perks de tipo "weapon.mod_" al final
        modifierPerks = modifierPerks.sort((a, b) => {
            const isAWeaponMod = a.perkType?.includes("weapon.mod_") ? 1 : 0;
            const isBWeaponMod = b.perkType?.includes("weapon.mod_") ? 1 : 0;
            return isAWeaponMod - isBWeaponMod;
        });

        const archetypePerks = perks.filter(perk => archetype.some(arch => perk?.perkType?.includes(arch) && !perk?.perkType?.includes("tracker")));
        const designPerks = perks.filter(perk => design.some(des => perk?.perkType?.includes(des)));
        const trackerPerks = perks.filter(perk => tracker.some(trk => perk?.perkType?.includes(trk)));

        return {
            modifierPerks,
            cosmeticPerks: {
                archetype: archetypePerks,
                design: designPerks,
                tracker: trackerPerks,
            }
        };
    }

    static getTrackerKills(trackerHash, perks) {
        if (perks != null) {
            let tracker;
            for (const [key, value] of Object.entries(perks)) {
                if (key == trackerHash) {
                    tracker = value[0].progress;
                    break;
                }
            }
            return tracker;
        } else {
            return null;
        }
    }

    static getWeaponLevel(objectivesPerPlug) {
        for (const objective of Object.values(objectivesPerPlug)) {
            const subObjective = objective.find(sub => sub.objectiveHash === 3077315735);
            if (subObjective) {
                return subObjective.progress;
            }
        }
        return null;
    }

    static interpoledStats(weaponStats, interpolatingStats) {
        const interpolatedStats = weaponStats.map(stat => {
            const interpolatingStat = interpolatingStats.find(interpolatingStat => interpolatingStat.statHash === stat.statHash);
            if (interpolatingStat) {
                const { displayInterpolation } = interpolatingStat;
                const value = stat.value;
                // Ordenar los valores de displayInterpolation por 'value' en caso de que no estén ordenados
                displayInterpolation.sort((a, b) => a.value - b.value);

                // Buscar el rango en el que se encuentra el valor
                for (let i = 0; i < displayInterpolation.length - 1; i++) {
                    const current = displayInterpolation[i];
                    const next = displayInterpolation[i + 1];

                    if (value >= current.value && value <= next.value) {
                        // Calcular el peso interpolado
                        const range = next.value - current.value;
                        const weightRange = next.weight - current.weight;
                        const proportion = (value - current.value) / range;

                        const interpolatedValue = current.weight + proportion * weightRange;

                        return {
                            ...stat,
                            value: Math.round(interpolatedValue),
                        };
                    }
                }

                // Si el valor está fuera del rango, devolver el peso más cercano
                if (value < displayInterpolation[0].value) {
                    return {
                        ...stat,
                        value: displayInterpolation[0].weight,
                    };
                }
                if (value > displayInterpolation[displayInterpolation.length - 1].value) {
                    return {
                        ...stat,
                        value: displayInterpolation[displayInterpolation.length - 1].weight,
                    };
                }
            }
        });
        return interpolatedStats;
    }

    static colorStats(item, perks, stats, tier) {
        stats.forEach((stat) => {
            let blancobase = 0, blancoFFFFFF1F = 0, blancoFFFFFF3D = 0, azul = 0, rojo = 0, amarillo = 0;
            let perk1F, perk3D, perkAzul, perkRojo, perkAmarillo;
            perks.forEach(perk => {
                perk.investmentStats.forEach(invStat => {
                    if (invStat.statTypeHash == stat.statHash) {
                        if (perks[0] === perk || perk.name.includes("Obra Maestra")) { //Si esta en la posicion cero es el arquetipo o tiene obra maestra
                            if (perk.name.includes("Obra Maestra") && invStat.value == 3); //Si es una obra maestra no crafteada, no sumar stats secundarias
                            if (perk.name.includes("Obra Maestra") && invStat.value == 0 && tier != null) { //Si es tier 5 y no tiene valor, sumarle 5
                                amarillo += tier;
                                perkAmarillo = tier + " Estadística Obra Maestra";
                                if (stat.value < 100) stat.value += Math.min(tier, 100 - stat.value); //Sumar maximo hasta 100
                            }
                            else if (perk.name.includes("Obra Maestra") && invStat.value == 10) {
                                amarillo += invStat.value;
                                perkAmarillo = invStat.value + " Estadística Obra Maestra";
                            }
                            else {
                                amarillo += invStat.value;
                                perkAmarillo = invStat.value + " Estadística Obra Maestra"; //Gaurdo en un a veriable el nombre de la perk y el valor
                            }
                        }
                        else if (perks[1] === perk) { // cañon
                            if (invStat.value > 0) {//Si el value del cañon es positivo
                                blancoFFFFFF1F += invStat.value;
                                perk1F = invStat.value + " " + perk.name;
                            } else if (invStat.value < 0) { //Si el value del cañon es negativo
                                rojo += invStat.value;
                                perkRojo = invStat.value + " " + perk.name;
                            }
                        }
                        else if (perks[2] === perk || perk.perkType == "grips") { //cargador o empuñadura
                            if (invStat.value > 0) {//Si el value del cargador es positivo
                                blancoFFFFFF3D += invStat.value;
                                perk3D = invStat.value + " " + perk.name;
                            } else if (invStat.value < 0) { //Si el value del cargador es negativo
                                rojo += invStat.value;
                                perkRojo = invStat.value + " " + perk.name;
                            }
                        }
                        else if (perk.perkType.includes("weapon.mod_")) { //Si es un mod insertado
                            azul += invStat.value;
                            perkAzul = invStat.value + " " + perk.name;
                        }
                    }
                })
            })
            let sumaColores = rojo + amarillo + blancoFFFFFF1F + blancoFFFFFF3D + azul;
            if (sumaColores < 0) blancobase = stat.value + Math.abs(sumaColores); //Si la suma de colores es negativa, se le resta al stat base
            else blancobase = stat.value - sumaColores; //Si no, se queda con el valor base

            let valorAbsolutoRojo = Math.abs(rojo);
            let aux = 0;

            if (valorAbsolutoRojo >= azul) { //El valorAbsolutoRojo se come al resto de sumas
                aux += azul;
                azul = 0;
                if (valorAbsolutoRojo >= aux + amarillo) {
                    aux += amarillo;
                    amarillo = 0;
                    if (valorAbsolutoRojo >= aux + blancoFFFFFF1F) {
                        aux += blancoFFFFFF1F;
                        blancoFFFFFF1F = 0;
                        if (valorAbsolutoRojo >= aux + blancoFFFFFF3D) {
                            aux += blancoFFFFFF3D;
                            blancoFFFFFF3D = 0;
                            if (valorAbsolutoRojo > aux + blancoFFFFFF3D) { //Si es mas grande que todas las perks, le empieza a comer al stat base
                                blancobase = blancobase - (valorAbsolutoRojo - aux);
                            }
                        } else blancoFFFFFF3D = blancoFFFFFF3D - (valorAbsolutoRojo - aux); //Si el rojo no es mas que el auxiliar, le saca puntos en donde se quedó
                    } else blancoFFFFFF1F = blancoFFFFFF1F - (valorAbsolutoRojo - aux);
                } else amarillo = amarillo - (valorAbsolutoRojo - aux);
            } else azul = azul - (valorAbsolutoRojo - aux);

            stat.secciones = {
                base: {
                    value: blancobase,
                    color: "#fff",
                    name: stat.value - sumaColores + " Estadística Base",
                },
                blancoFFFFFF1F: {
                    value: blancoFFFFFF1F,
                    color: "rgba(255,255,255, 0.88)",
                    name: perk1F ? "+" + perk1F : null,
                },
                blancoFFFFFF3D: {
                    value: blancoFFFFFF3D,
                    color: "rgba(255,255,255, 0.76)",
                    name: perk3D ? "+" + perk3D : null,
                },
                amarillo: {
                    value: amarillo,
                    color: "#e8a534",
                    name: perkAmarillo ? "+" + perkAmarillo : null,
                },
                azul: {
                    value: azul,
                    color: "#68a0b7",
                    name: azul ? "+" + perkAzul : null,
                },
                rojo: {
                    value: Math.abs(rojo),
                    color: "#7a2727",
                    name: perkRojo ? perkRojo : null,
                },
            }
            if (perkAmarillo) stat.isMw = true; //Atributo de obra maestra
            else stat.isMw = false;
        })
        return stats;
    }
}
