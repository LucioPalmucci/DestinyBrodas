import Spinner from '../../../CSS/Spinner';

export default function LoadingReport() {
    return (
        <div className="flex flex-col items-center justify-center h-full w-full">
            <Spinner medium={true} />
        </div>
    );

}