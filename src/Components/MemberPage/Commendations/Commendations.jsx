import { useEffect, useState } from "react";
import elogio from "../../../assets/elogio.png"; // Importar el icono de elogio
import { useBungieAPI } from "../../APIservices/BungieAPIcache";


export default function Commendations({ membershipType, userId }) {
    const [honor, setCommendations] = useState(null);
    const { getCommendations } = useBungieAPI();

    useEffect(() => {
        const fetchGeneralStats = async () => {
            try {
                const commendationsData = await getCommendations(membershipType, userId);
                if (commendationsData) {
                    setCommendations(commendationsData);
                }
            } catch (error) {
                setError(error);
            }
        }
        fetchGeneralStats();
    }, [])

    return (
        <div className="bg-gray-300 p-6 font-Lato rounded-lg h-[162px] py-4 pb-10 space-y-2 items-center">
            {honor ? (
                <>
                    <h2 className="text-2xl font-semibold">Elogios</h2>
                    <div className="flex justify-between items-center space-x-4 mb-3">
                        <p className="flex items-center text-2xl font-bold"><img src={elogio} className="w-12 h-12 mr-2" />{honor.totalScore}</p>
                        <div className="flex space-x-4">
                            <p className="font-semibold">Enviados: {honor.enviadas}</p>
                            <p className="font-semibold">Recibidos: {honor.recibidas}</p>
                        </div>
                    </div>
                    <div className="flex h-1 mt-2 relative space-x-0.5">
                        {honor.verdes > 0 && (
                            <div style={{ width: `${honor.verdes}%`, backgroundColor: 'rgba(54,163,137,1)' }} className="text-sm">
                                <p style={{ color: 'rgba(54,163,137,1)' }} className="mt-1">{honor.verdes}%</p>
                            </div>
                        )}
                        {honor.naranjas > 0 && (
                            <div style={{ width: `${honor.naranjas}%`, backgroundColor: 'rgba(205,125,44,1)' }} className="text-sm">
                                <p style={{ color: 'rgba(205,125,44,1)' }} className="mt-1">{honor.naranjas}%</p>
                            </div>
                        )}
                        {honor.rosas > 0 && (
                            <div style={{ width: `${honor.rosas}%`, backgroundColor: 'rgba(190,79,106,1)' }} className="text-sm">
                                <p style={{ color: 'rgba(190,79,106,1)' }} className="mt-1">{honor.rosas}%</p>
                            </div>
                        )}
                        {honor.azules > 0 && (
                            <div style={{ width: `${honor.azules}%`, backgroundColor: 'rgba(50,136,193,1)' }} className="text-sm">
                                <p style={{ color: 'rgba(50,136,193,1)' }} className="mt-1">{honor.azules}%</p>
                            </div>
                        )}
                    </div>
                </>
            ) : (
                <div className="animate-pulse h-full"></div>
            )}
        </div>
    )
}