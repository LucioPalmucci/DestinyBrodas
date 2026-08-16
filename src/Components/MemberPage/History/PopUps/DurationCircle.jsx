// Círculo SVG de progreso de duración, antes duplicado byte a byte en
// Crucible.jsx, Rumble.jsx, Social.jsx y Pve.jsx (encabezado + por-jugador).
export default function DurationCircle({ r, circunference, to = 0 }) {
    return (
        <svg width="16" height="16" viewBox="0 0 16 16" className='-rotate-90 transform hidden md:block'>
            <circle cx="8" cy="8" r={r} fill="none" stroke="currentColor" strokeWidth="3" className='text-zinc-800' strokeLinecap="round" strokeDasharray={circunference} strokeDashoffset={0} />
            <circle cx="8" cy="8" r={r} fill="none" stroke="currentColor" strokeWidth="3" className='text-green-500 circle-progress' strokeLinecap="round" style={{ '--circ': circunference, '--from': circunference, '--to': to }} />
        </svg>
    );
}
