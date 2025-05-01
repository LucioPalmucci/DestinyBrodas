/**
 * El recoil se basa en una función seno, que va de rango 100 a 0.
 * Imagen https://imgur.com/LKwWUNV
 */
function recoilDirection(value) {
    return Math.sin((value + 5) * (Math.PI / 10)) * (100 - value);
}

/**
 * Que tan alto o bajo es el recoil en comparación con el recoil máximo.
 */
export function recoilValue(value) {
    const deviation = Math.abs(recoilDirection(value));
    return 100 - deviation + value / 100000;
}

// Cuánto sesga la dirección hacia el centro - con un valor de 1.0, esto significaría que el retroceso oscilaría ±90°
const verticalScale = 0.8;
// El ángulo máximo del sector, donde un retroceso de cero es el más amplio y un retroceso de 100 es el más estrecho
const maxSpread = 180; // grados

export default function RecoilStat({ value }) {
    const direction = recoilDirection(value) * verticalScale * (Math.PI / 180); // Convert to radians
    const x = Math.sin(direction);
    const y = Math.cos(direction);

    const spread =
        // Mientras mas alto el valor, se expase menos
        ((100 - value) / 100) *
        // Escalado por el factor de dispersión (dividido a la mitad ya que se expande hacia ambos lados)
        (maxSpread / 2) *
        // converitr a radianes
        (Math.PI / 180) *
        // modulado para negativo
        Math.sign(direction);
    const xSpreadMore = Math.sin(direction + spread);
    const ySpreadMore = Math.cos(direction + spread);
    const xSpreadLess = Math.sin(direction - spread);
    const ySpreadLess = Math.cos(direction - spread);

    return (
        <svg height="12" viewBox="0 0 2 1">
            <circle r={1} cx={1} cy={1} fill="#333" />
            {value >= 95 ? (
                <line x1={1 - x} y1={1 + y} x2={1 + x} y2={1 - y} stroke="white" strokeWidth="0.1" />
            ) : (
                <path
                    d={`M1,1 L${1 + xSpreadMore},${1 - ySpreadMore} A1,1 0 0,${direction < 0 ? '1' : '0'} ${1 + xSpreadLess},${1 - ySpreadLess} Z`}
                    fill="#FFF"
                />
            )}
        </svg>
    );
}