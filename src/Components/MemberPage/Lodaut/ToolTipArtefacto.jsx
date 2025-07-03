import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";

export default function Tooltip({ children, show, position }) {
    const el = useRef(document.createElement("div"));

    useEffect(() => {
        const tooltipRoot = document.body;
        const current = el.current;
        tooltipRoot.appendChild(current);
        return () => {
            tooltipRoot.removeChild(current);
        };
    }, []);

    if (!show) return null;

    return createPortal(
        <div
            style={{
                position: "fixed",
                top: position.top,
                left: position.left + 40,
                zIndex: 9999,
                pointerEvents: "none",
            }}
        >
            {children}
        </div>,
        el.current
    );
}