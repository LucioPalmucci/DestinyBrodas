import { useEffect } from 'react';

// Cierra el popup al hacer click fuera de popupRef. Antes duplicado byte a
// byte en Crucible.jsx, Rumble.jsx, Social.jsx y Pve.jsx.
export function useCloseOnOutsideClick(popupRef, onOutsideClick) {
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (popupRef.current && !popupRef.current.contains(event.target)) {
                onOutsideClick(null);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);
}
