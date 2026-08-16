// Extraído de FavouriteActivity.jsx: armado de la lista de modos favoritos
// (upsert por nombre de modo) y de los "slots" ordenados PVE/PVP mientras
// van llegando los datos de cada modo. Lógica pura, sin React ni API.
export class ActivityModeAggregator {
    static upsertByMode(list, item) {
        const arr = Array.isArray(list) ? list.slice() : [];
        const idx = arr.findIndex(x => x?.mode === item?.mode);
        if (idx >= 0) {
            arr[idx] = item;
        } else {
            arr.push(item);
        }
        return arr;
    }

    static getSlotItems(source, expected) {
        const slots = expected.map(name => {
            const found = Array.isArray(source) ? source.find(x => x?.mode === name) : null;
            return found || { mode: name, loading: true };
        });
        const allLoaded = slots.every(s => !s.loading);
        if (allLoaded) {
            const totalCompletions = slots.reduce((sum, s) => sum + (s.completions || 0), 0);
            const slotsWithPct = slots.map(s => ({
                ...s,
                percentage: totalCompletions > 0 ? Number(((s.completions || 0) / totalCompletions * 100).toFixed(1)) : 0
            }));
            return slotsWithPct.slice().sort((a, b) => (b.completions || 0) - (a.completions || 0));
        }
        return slots;
    }
}
