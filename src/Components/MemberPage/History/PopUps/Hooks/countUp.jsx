import { useEffect, useState } from "react";

export function useCountUp(end = 0, duration = 1000) {
    const [value, setValue] = useState(0);

    useEffect(() => {
        if (end == null) return;

        let startTime = null;

        function animate(timestamp) {
            if (!startTime) startTime = timestamp;

            const progress = timestamp - startTime;
            const percentage = Math.min(progress / duration, 1);

            const current = Math.floor(percentage * end);
            setValue(current);

            if (percentage < 1) {
                requestAnimationFrame(animate);
            }
        }

        setValue(0);
        requestAnimationFrame(animate);

    }, [end, duration]);

    return value;
}
