import { API_CONFIG } from '../config';

// Fuente única de los 3 iconos de clase (icono + filtro CSS), antes duplicados
// en MemberDetail.jsx (switch por classType), FavouriteActivity.jsx (charImg,
// switch por nombre en español) y playersBasicData.jsx (getUserClassSymbol, por classHash).
const CLASS_ICON_DATA = {
    0: { // Titán
        name: 'Titán',
        link: `${API_CONFIG.BUNGIE_API}/common/destiny2_content/icons/707adc0d9b7b1fb858c16db7895d80cf.png`,
        colore: 'brightness(0) saturate(100%) invert(21%) sepia(52%) saturate(4147%) hue-rotate(335deg) brightness(83%) contrast(111%)',
    },
    1: { // Cazador
        name: 'Cazador',
        link: `${API_CONFIG.BUNGIE_API}/common/destiny2_content/icons/9bb43f897531bb6395bfefc82f2ec267.png`,
        colore: 'brightness(0) saturate(100%) invert(24%) sepia(29%) saturate(5580%) hue-rotate(199deg) brightness(95%) contrast(95%)',
    },
    2: { // Hechicero
        name: 'Hechicero',
        link: `${API_CONFIG.BUNGIE_API}/common/destiny2_content/icons/571dd4d71022cbef932b9be873d431a9.png`,
        colore: 'brightness(0) saturate(100%) invert(82%) sepia(14%) saturate(5494%) hue-rotate(341deg) brightness(105%) contrast(98%)',
    },
};

const CLASS_HASH_TO_TYPE = {
    2271682572: 2, // Hechicero
    3655393761: 0, // Titán
    671679327: 1,  // Cazador
};

const NAME_TO_TYPE = Object.fromEntries(
    Object.entries(CLASS_ICON_DATA).map(([type, data]) => [data.name, Number(type)])
);

// Equivalente al switch(classType) de MemberDetail.jsx -> { link, colore }
export const getClassIconByType = (classType) => {
    const data = CLASS_ICON_DATA[classType];
    return data ? { link: data.link, colore: data.colore } : undefined;
};

// Equivalente a charImg(character) de FavouriteActivity.jsx -> { link, colore }
export const getClassIconByName = (className) => {
    const type = NAME_TO_TYPE[className];
    return type != null ? getClassIconByType(type) : undefined;
};

// Equivalente a getUserClassSymbol(classHash) de playersBasicData.jsx -> url | null
export const getClassIconUrlByHash = (classHash) => {
    const type = CLASS_HASH_TO_TYPE[classHash];
    return type != null ? CLASS_ICON_DATA[type].link : null;
};
