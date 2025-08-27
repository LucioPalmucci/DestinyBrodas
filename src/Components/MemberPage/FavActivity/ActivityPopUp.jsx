
export default function ActivityPopUp({ activity, onClose }) {
    return (
        <div className="bg-black/90 opacity-90 p-3 rounded" onClick={onClose}>
            {activity?.modeData?.favoriteActivity && <p className="mb-2">Favorita: {activity?.modeData?.favoriteActivity?.displayProperties?.name}</p>}
            <p className="mb-2">Completiciones: {activity?.modeData?.completions?.completitions || activity?.completions}</p>
            <p className="mb-2">Fresh: {activity?.modeData?.completions?.freshCompletitions}</p>
            <p className="mb-2">Checkpoint: {activity?.modeData?.completions?.checkpointCompletitions}</p>
        </div>
    );
}
