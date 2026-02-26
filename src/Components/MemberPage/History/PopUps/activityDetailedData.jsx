import { useCallback } from 'react';
import tharsis from "../../../../assets/ActivityModes/Tharsis.png";
import completed from "../../../../assets/completed.png";
import NotCompleted from "../../../../assets/notCompleted.png";
import { useBungieAPI } from '../../../APIservices/BungieAPIcalls';

import { API_CONFIG } from '../../../../config';
export default function useActivityDetails() {
    const { getManifest, getCarnageReport, getCommendations, getCompsProfile, getItemManifest, getClanUser, getAggregateActivityStats, getCompChars } = useBungieAPI();

    const fetchActivitiesDetails = useCallback(async (instanceId, userId) => {
        try {
            const carnageAct = await getCarnageReport(instanceId);
            const activityMain = await getItemManifest(carnageAct.activityDetails.referenceId, "DestinyActivityDefinition");
            const activityInfo = await getItemManifest(carnageAct.activityDetails.directorActivityHash, "DestinyActivityDefinition");

            let datosDelModo, datosDelTipo;
            datosDelTipo = await getItemManifest(activityInfo.activityTypeHash, "DestinyActivityTypeDefinition");
            if (activityInfo.directActivityModeHash) datosDelModo = await getItemManifest(activityInfo.directActivityModeHash, "DestinyActivityModeDefinition");

            //console.log("Activity main details:", carnageAct, activityMain, activityInfo, datosDelModo, datosDelTipo);
            const activityType = getActivityType(carnageAct);
            const actIcon = await getIcon(activityInfo, activityMain, datosDelModo, datosDelTipo);
            const modeName = getModeName(carnageAct, datosDelModo, datosDelTipo);
            const splitedInTeams = carnageAct.teams && carnageAct.teams.length >= 2;
            const date = new Date(carnageAct.period).toLocaleString('es-ES', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour12: false
            }).replace(/(\d+)\/(\d+)\/(\d+)/, '$1/$2/$3');
            const hour = new Date(carnageAct.period).toLocaleTimeString('es-ES', {
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
                hour12: false
            });

            const playerEntry = carnageAct.entries.find(entry => entry.player.destinyUserInfo.membershipId === userId);
            return {
                activityName: activityMain?.originalDisplayProperties?.name,
                activityMode: modeName,
                activityTypePVP: activityInfo?.originalDisplayProperties?.name?.replaceAll(":", " -"),
                activityIcon: actIcon,
                instanceId: carnageAct.activityDetails.instanceId,
                pgcrImage: activityMain.hash == 1477356389 ? tharsis : API_CONFIG.BUNGIE_API + activityMain?.pgcrImage,
                difficulty: activityType == "PvE" ? activityMain?.selectionScreenDisplayProperties?.name || "Estándar" : activityInfo?.selectionScreenDisplayProperties?.name || "Estándar",
                kills: playerEntry.values.kills.basic.value || 0,
                deaths: playerEntry.values.deaths.basic.value || 0,
                kd: playerEntry.values.killsDeathsRatio.basic.value.toFixed(2) || 0,
                completed: playerEntry.values.completed.basic.value == 1 ? "Completado" : "Abandonado",
                completedSymbol: playerEntry.values.completed.basic.value == 1 ? completed : NotCompleted,
                modeNumbers: carnageAct.activityDetails.modes,
                activityType,
                activityTypeHash: activityInfo.activityTypeHash || null,
                date,
                duration: formatDuration(playerEntry.values.activityDurationSeconds.basic.value),
                hour,
                durationInSeconds: playerEntry.values.activityDurationSeconds.basic.value,
                durationFormated: playerEntry.values.activityDurationSeconds.basic.displayValue,
                hash: carnageAct.activityDetails.referenceId,
                difficultyCollection: activityInfo.difficultyTierCollectionHash,
                splitedInTeams: splitedInTeams,
            };

        } catch (error) {
            console.error("Error fetching activity details:", error);
        }
    })

    const getActivityType = (carnageAct) => {
        let activityType;
        if (carnageAct?.activityDetails?.modes.includes(7)) {
            activityType = "PvE";
        } else if (carnageAct?.activityDetails?.modes.includes(5) || carnageAct?.activityDetails?.modes.includes(32)) {
            activityType = "PvP";
        } else if (carnageAct?.activityDetails?.modes.includes(63)) {
            activityType = "Gambito";
        } else activityType = "PvE";
        return activityType;
    }

    const getIcon = async (activityInfo, activityMain, datosDelModo, datosDelTipo) => {
        let actIcon = null;
        if (datosDelModo?.displayProperties?.icon != null && !datosDelModo?.displayProperties?.icon.includes("missing_icon")) actIcon = datosDelModo?.displayProperties?.icon;
        else if (activityInfo?.displayProperties?.icon != null && !activityInfo?.displayProperties?.icon.includes("missing_icon")) actIcon = activityInfo?.displayProperties?.icon;
        else if (datosDelTipo?.displayProperties?.icon != null && !datosDelTipo?.displayProperties?.icon.includes("missing_icon")) actIcon = datosDelTipo?.displayProperties?.icon;
        else activityMain?.displayProperties?.icon || null;

        if (actIcon == null || actIcon.includes("missing_icon")) {
            const modoPorTipo = await getItemManifest(datosDelTipo?.hash, "DestinyActivityModeDefinition");
            actIcon = modoPorTipo?.displayProperties?.icon || null;
        }
        if (actIcon == null) actIcon = "/img/misc/missing_icon_d2.png";
        return actIcon;
    }

    const getModeName = (carnageAct, datosDelModo, datosDelTipo) => {
        let modeName = null;
        if (carnageAct?.activityDetails?.modes.includes(5) && !carnageAct?.activityDetails?.modes.includes(84)) {
            modeName = datosDelModo?.displayProperties?.name + ": " + carnageAct?.originalDisplayProperties?.name;
        } else {
            modeName = datosDelTipo?.displayProperties?.name || datosDelModo?.displayProperties?.name;
        }
        return modeName;
    }

    
    const formatDuration = (seconds) => {
        const h = String(Math.floor(seconds / 3600)).padStart(2, '0');
        const m = String(Math.floor((seconds % 3600) / 60)).padStart(2, '0');
        const s = String(seconds % 60).padStart(2, '0');
        if (h === "00") return `${m}m ${s}s`;
        return `${h}h ${m}m ${s}s`;
    }
    return fetchActivitiesDetails;
}