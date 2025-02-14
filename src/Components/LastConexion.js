export const getTimeSinceLastConnection = (lastOnlineStatusChange, isOnline) => {
    const now = new Date();
    const lastOnlinene = new Date(lastOnlineStatusChange * 1000);
    const diff = now - lastOnlinene;

    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (isOnline) {
        return 'Jugando ahora';
    } else if (days > 0 && days == 1) {
        return `${days} día`;
    } else if (days > 0) {
        return `${days} días`;
    } else if (hours > 0 && hours == 1) {
        return `${hours} hora`;
    } else if (hours > 0) {
        return `${hours} horas`;
    } else if (minutes > 0) {
        return `${minutes} minutos`;
    } else if (seconds > 0) {
        return `${seconds} segundos`;
    }
};