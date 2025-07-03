import axios from "axios";
import { useEffect, useState } from "react";
import elogio from "../../../assets/elogio.png";

export default function Commendations({ membershipType, userId }) {
    const [honor, setCommendations] = useState(null);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchGeneralStats = async () => {
            try {
                const commendation = await axios.get(`/api/Platform/Destiny2/${membershipType}/Profile/${userId}/?components=1400`, {
                    headers: {
                        "X-API-Key": "f83a251bf2274914ab739f4781b5e710",
                    }
                });
                const dataHonor = commendation.data.Response.profileCommendations.data;
                //console.log(dataHonor);

                setCommendations({
                    totalScore: dataHonor.totalScore.toLocaleString('en-US'),
                    recibidas: dataHonor.scoreDetailValues[1],
                    enviadas: dataHonor.scoreDetailValues[0],
                    verdes: dataHonor.commendationNodePercentagesByHash[154475713],
                    rosas: dataHonor.commendationNodePercentagesByHash[1341823550],
                    azules: dataHonor.commendationNodePercentagesByHash[1390663518],
                    naranjas: dataHonor.commendationNodePercentagesByHash[4180748446],
                    verdesPuntos: dataHonor.commendationNodeScoresByHash[154475713],
                    rosasPuntos: dataHonor.commendationNodeScoresByHash[1341823550],
                    azulesPuntos: dataHonor.commendationNodeScoresByHash[1390663518],
                    naranjasPuntos: dataHonor.commendationNodeScoresByHash[4180748446],
                })
            } catch (error) {
                setError(error);
            }
        }
        fetchGeneralStats();
    }, [])

    return (
        honor && (
            <div className="mt-6 bg-gray-300 p-6 font-Lato rounded-lg pt-2 pb-8 space-y-2">
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
            </div>
        )
    )
}