// Botón de cerrar (✕), antes duplicado byte a byte en Crucible.jsx,
// Rumble.jsx, Social.jsx y Pve.jsx.
export default function ClosePopupButton({ onClose }) {
    return (
        <button
            className="absolute -top-8 -right-8 bg-neutral-700 text-white rounded-full w-8 h-8 flex items-center justify-center hover:bg-neutral-800 cursor-pointer shadow-lg"
            onClick={(e) => {
                e.stopPropagation();
                onClose?.();
            }}
            aria-label="Cerrar"
        >
            ✕
        </button>
    );
}
