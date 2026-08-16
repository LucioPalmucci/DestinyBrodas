import bgArc from "../../assets/subClassBg/subclass-arc.png";
import bgKinetic from "../../assets/subClassBg/subclass-kinetic.png";
import bgSolar from "../../assets/subClassBg/subclass-solar.png";
import bgStasis from "../../assets/subClassBg/subclass-stasis.png";
import bgStrand from "../../assets/subClassBg/subclass-strand.png";
import bgVoid from "../../assets/subClassBg/subclass-void.png";

// Mapeos puros (rareza/tier/clase -> color o imagen) extraídos de
// CurrentLoadout.jsx. Sin React, sin API.
export class LoadoutVisualHelpers {
    static getRarityColor(rarity) {
        let color, colorRGBA;
        switch (rarity) {
            case 2:
                color = "rgba(220, 220, 220)";
                colorRGBA = "#050505d9";
                break;
            case 3:
                color = "rgba(54, 110, 66)";
                colorRGBA = "color-mix(in srgb, #081109 60%, #0000)";
                break;
            case 4:
                color = "rgba(80, 118, 163)";
                colorRGBA = "color-mix(in srgb, #0a0f15 60%, #0000)"
                break;
            case 5:
                color = "rgba(81, 48, 101)";
                colorRGBA = "color-mix(in srgb, #0e0811 60%, #0000) ";
                break;
            case 6:
                color = "rgba(195, 160, 25)";
                colorRGBA = "color-mix(in srgb, #161204 50%, #0000) ";
                break;
            default:
                color = "#000000";
                colorRGBA = "rgba(0, 0, 0, 0.3)";
                break;
        }
        return {
            rgb: color,
            rgba: colorRGBA,
        };
    }

    static getTierColor(tier) {
        let color;
        switch (tier) {
            case 4:
                color = "#D0AEF7";
                break;
            case 5:
                color = "#E5CF7B";
                break;
            default:
                color = "#ffffffff";
                break;
        }
        return color;
    }

    static getArmorCategory(armorType, classType) {
        switch (classType) {
            case 0:
                if (armorType.includes("titan")) return armorType;
                else return "Titán " + armorType;
            case 1:
                if (armorType.includes("cazador")) return armorType;
                else return "Cazador " + armorType;
            case 2:
                if (armorType.includes("hechicero")) return armorType;
                else return "Hechicero " + armorType;
            default:
                return armorType;
        }
    }

    static getSecondaryBgImg(subclassIndex) {
        switch (subclassIndex) {
            case 1:
                return bgKinetic;
            case 2:
                return bgArc;
            case 3:
                return bgSolar;
            case 4:
                return bgVoid;
            case 6:
                return bgStasis;
            case 7:
                return bgStrand;
            default:
                return "";
        }
    }

    static getGhostEnergy(isMw, perks) {
        let energyUsed = 0;
        perks.forEach(perk => {
            if (perk.investmentStats?.[0]?.value && perk.investmentStats?.[0]?.statTypeHash == 514071887) {
                energyUsed += perk.investmentStats[0].value;
            }
        })
        return energyUsed;
    }
}
