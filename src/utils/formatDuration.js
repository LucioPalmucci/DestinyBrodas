// Formato compacto "00h 00m 00s" (usado en activityDetailedData.jsx y ActivityHistory.jsx)
export const formatDurationHMS = (seconds) => {
    const h = String(Math.floor(seconds / 3600)).padStart(2, '0');
    const m = String(Math.floor((seconds % 3600) / 60)).padStart(2, '0');
    const s = String(seconds % 60).padStart(2, '0');
    if (h === "00") return `${m}m ${s}s`;
    return `${h}h ${m}m ${s}s`;
};

// Formato verboso "X horas Y minutos" (usado en ClanTeamates.jsx)
export const formatDurationVerbose = (seconds) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    let horas = h > 1 ? 'horas' : 'hora';
    let minutos = m != 1 ? 'minutos' : 'minuto';
    let segundos = s != 1 ? 'segundos' : 'segundo';
    if (h > 0) {
        return `${h} ${horas} ${m} ${minutos}`;
    } else {
        return `${m} ${minutos} ${s} ${segundos}`;
    }
};
