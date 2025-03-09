import axios from "axios";
import { useEffect, useState } from "react";
import FavouriteActivity from "./FavouriteActivity";
export default function GeneralStats({ membershipType, userId }) {
    const [honor, setCommendations] = useState(null);
    const [rango, setRango] = useState(null);

    useEffect(() => {
        const fetchGeneralStats = async () => {
            try {
                const response = await axios.get(`/api/Platform/Destiny2/${membershipType}/Profile/${userId}/?components=Characters&lc=es-mx`, {
                    headers: {
                        'X-API-Key': 'f83a251bf2274914ab739f4781b5e710',
                    },
                });
                const characterIds = Object.keys(response.data.Response.characters.data);
                const firstCharacterId = characterIds[0];

                const commendation = await axios.get(`/api/Platform/Destiny2/${membershipType}/Profile/${userId}/?components=1400`, {
                    headers: {
                        "X-API-Key": "f83a251bf2274914ab739f4781b5e710",
                    }
                });
                const dataHonor = commendation.data.Response.profileCommendations.data;

                setCommendations({
                    totalScore: dataHonor.totalScore,
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

                const reputationRes = await axios.get(`/api/Platform/Destiny2/${membershipType}/Profile/${userId}/?components=202`, {
                    headers: {
                        "X-API-Key": "f83a251bf2274914ab739f4781b5e710",
                    }
                });

                // 3008065600 progression gambito
                // 1021210278 progression vanguardia
                // 2083746873 progression crisol
                // 3696598664 progression competitivio
                // 2755675426 progression pruebas
                // 599071390 progression estandarte

                const AllProgresions = reputationRes.data.Response.characterProgressions.data[firstCharacterId].progressions;
                console.log(AllProgresions);
                const progressions = ["3008065600", "1021210278", "2083746873", "3696598664", "2755675426", "599071390"];
                let rangoVanguardia = [], rangoCrisol = [], rangoCompetitivo = [], rangoPruebas = [], rangoEstandarte = [], rangoGambito = [];

                for (const element of progressions) {
                    switch (element) {
                        case "3008065600":
                            rangoGambito = {
                                valor: AllProgresions[element].currentProgress || "dssdd",
                                nombre: "Gambito",
                                progreso: AllProgresions[element].progressToNextLevel,
                                valorMaximo: AllProgresions[element].nextLevelAt,
                                level: AllProgresions[element].level,
                                logo: "/api/common/destiny2_content/icons/DestinyActivityModeDefinition_96f7e9009d4f26e30cfd60564021925e.png"
                            }
                            break;
                        case "1021210278":
                            rangoVanguardia = {
                                valor: AllProgresions[element].currentProgress,
                                nombre: "Vanguardia",
                                progreso: AllProgresions[element].progressToNextLevel,
                                valorMaximo: AllProgresions[element].nextLevelAt,
                                level: AllProgresions[element].level,
                                logo: "/api/common/destiny2_content/icons/DestinyActivityModeDefinition_38e26baf417d26bb3548d97bf4872b54.png"
                            }
                            break;
                        case "2083746873":
                            rangoCrisol = {
                                valor: AllProgresions[element].currentProgress,
                                nombre: "Crisol",
                                progreso: AllProgresions[element].progressToNextLevel,
                                valorMaximo: AllProgresions[element].nextLevelAt,
                                level: AllProgresions[element].level,
                                logo: "/api/common/destiny2_content/icons/f9dbb041c0414ea4856c7be6d8c29f48.png"
                            }
                            break;
                        case "3696598664":
                            rangoCompetitivo = {
                                valor: AllProgresions[element].currentProgress,
                                nombre: "Competitivo",
                                progreso: AllProgresions[element].progressToNextLevel,
                                valorMaximo: AllProgresions[element].nextLevelAt,
                                level: AllProgresions[element].level,
                                logo: await getLogo(AllProgresions[element].stepIndex),
                            }
                            break;
                        case "2755675426":
                            rangoPruebas = {
                                valor: AllProgresions[element].currentProgress,
                                nombre: "Pruebas",
                                progreso: AllProgresions[element].progressToNextLevel,
                                valorMaximo: AllProgresions[element].nextLevelAt,
                                level: AllProgresions[element].level,
                                logo: "/api/common/destiny2_content/icons/DestinyActivityModeDefinition_e35792b49b249ca5dcdb1e7657ca42b6.png"
                            }
                            break;
                        case "599071390":
                            rangoEstandarte = {
                                valor: AllProgresions[element].currentProgress,
                                nombre: "Estandarte de Hierro",
                                progreso: AllProgresions[element].progressToNextLevel,
                                valorMaximo: AllProgresions[element].nextLevelAt,
                                level: AllProgresions[element].level,
                                logo: "/api/common/destiny2_content/icons/DestinyActivityModeDefinition_fe57052d7cf971f7502daa75a2ca2437.png"
                            }
                            break;
                    }
                }
                console.log(rangoVanguardia, rangoCrisol, rangoCompetitivo, rangoPruebas, rangoEstandarte, rangoGambito);

                setRango({
                    vanguardia: rangoVanguardia,
                    crisol: rangoCrisol,
                    competitivo: rangoCompetitivo,
                    pruebas: rangoPruebas,
                    estandarte: rangoEstandarte,
                    gambito: rangoGambito,
                })
            } catch (error) {
                console.error(error);
            }
        }
        fetchGeneralStats();
    }, [membershipType, userId]);

    async function getLogo(progression) {
        try {
            const response = await axios.get(`/api/Platform/Destiny2/Manifest/DestinyProgressionDefinition/3696598664/?lc=es`, {
                headers: {
                    'X-API-Key': 'f83a251bf2274914ab739f4781b5e710',
                },
            });

            console.log("Competi", response.data.Response.steps[progression].icon);

            return "/api"+response.data.Response.steps[progression].icon;
        } catch (error) {
            console.error(error);
        }
    }

    return (
        <div>
            <h1>General Stats</h1>
            <FavouriteActivity membershipType={membershipType} userId={userId} />
            {honor && (
                <div className="mt-6">
                    <h2>Commendations</h2>
                    <p>Total Score: {honor.totalScore}</p>
                    <p>Recibidas: {honor.recibidas}</p>
                    <p>Enviadas: {honor.enviadas}</p>
                    <p>Verdes: {honor.verdes}% ({honor.verdesPuntos})</p>
                    <p>Rosas: {honor.rosas}% ({honor.rosasPuntos})</p>
                    <p>Azules: {honor.azules}% ({honor.azulesPuntos})</p>
                    <p>Naranjas: {honor.naranjas}% ({honor.naranjasPuntos})</p>
                </div>
            )}
            {rango && (
                <div className="mt-6">
                    <h2>Ranks</h2>
                    {Object.keys(rango).map((key) => (
                        rango[key] && (
                            <div key={key} className="bg-gray-300">
                                <h3>{rango[key].nombre}</h3>
                                <p>Valor: {rango[key].valor}</p>
                                <p>Progreso: {rango[key].progreso}</p>
                                <p>Valor Máximo: {rango[key].valorMaximo}</p>
                                <p>Nivel: {rango[key].level}</p>
                                {rango[key].logo && <img src={rango[key].logo} width={40} height={40} alt={`${rango[key].nombre} logo`} />}
                            </div>
                        )
                    ))}
                </div>
            )}
        </div>
    )
}