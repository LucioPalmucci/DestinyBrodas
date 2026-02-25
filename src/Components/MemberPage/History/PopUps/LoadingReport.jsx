import { useEffect, useState } from "react";
import Spinner from '../../../CSS/Spinner';

export default function LoadingReport({ image }) {
    const [isLoaded, setIsLoaded] = useState(false);

    useEffect(() => {

        setIsLoaded(false);
        const img = new Image();
        img.src = image;
        img.onload = () => setIsLoaded(true);
        img.onerror = () => setIsLoaded(true);

        return () => {
            img.onload = null;
            img.onerror = null;
        };
    }, [image]);

    return (
        <div className="flex flex-col items-center justify-center h-full w-full">
            <Spinner medium={true} />
        </div>
    );

}