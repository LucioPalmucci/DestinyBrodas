import axios from "axios";
import { useEffect, useState } from "react";
import Commendations from "./Commendations";
import FavouriteActivity from "./FavouriteActivity";
export default function GeneralStats({ membershipType, userId }) {
    const [rango, setRango] = useState(null);
    const [Triumphs, setTriumphs] = useState(null);
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

                const reputationRes = await axios.get(`/api/Platform/Destiny2/${membershipType}/Profile/${userId}/?components=202,900`, {
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
                const progressions = ["3008065600", "457612306", "2083746873", "3696598664", "2755675426", "599071390"];
                let rangoVanguardia = [], rangoCrisol = [], rangoCompetitivo = [], rangoPruebas = [], rangoEstandarte = [], rangoGambito = [];

                console.log(AllProgresions);

                let levelInfo = {};
                for (const element of progressions) {
                    switch (element) {
                        case "3008065600":
                            levelInfo = await getLogo(AllProgresions[element].stepIndex, "3008065600")
                            rangoGambito = {
                                valor: AllProgresions[element].currentProgress,
                                nombre: "Gambito",
                                progreso: AllProgresions[element].progressToNextLevel,
                                valorMaximo: AllProgresions[element].nextLevelAt,
                                level: AllProgresions[element].level,
                                logo: "/api"+levelInfo.icon,
                                stepName: levelInfo.stepName,
                                resets: AllProgresions[element].currentResetCount,
                                color: "rgb(63,198,163)",
                                filtro: "brightness(0) saturate(100%) invert(61%) sepia(70%) saturate(459%) hue-rotate(118deg) brightness(90%) contrast(96%)"
                            }
                            break;
                        case "457612306":
                            levelInfo = await getLogo(AllProgresions[element].stepIndex, "457612306")
                            rangoVanguardia = {
                                valor: AllProgresions[element].currentProgress,
                                nombre: "Vanguardia",
                                progreso: AllProgresions[element].progressToNextLevel,
                                valorMaximo: AllProgresions[element].nextLevelAt,
                                level: AllProgresions[element].level,
                                logo: "/api"+levelInfo.icon,
                                stepName: levelInfo.stepName,
                                resets: AllProgresions[element].currentResetCount,
                                color: "rgb(92,145,184)",
                                filtro: "brightness(0) saturate(100%) invert(75%) sepia(12%) saturate(5033%) hue-rotate(177deg) brightness(79%) contrast(77%);"
                            }
                            break;
                        case "2083746873":
                            levelInfo = await getLogo(AllProgresions[element].stepIndex, "2083746873")
                            rangoCrisol = {
                                valor: AllProgresions[element].currentProgress,
                                nombre: "Crisol",
                                progreso: AllProgresions[element].progressToNextLevel,
                                valorMaximo: AllProgresions[element].nextLevelAt,
                                level: AllProgresions[element].level,
                                logo: "/api"+levelInfo.icon,
                                stepName: levelInfo.stepName,
                                resets: AllProgresions[element].currentResetCount,
                                color: "rgb(209, 94, 87)",
                                filtro: "brightness(0) saturate(100%) invert(49%) sepia(7%) saturate(4282%) hue-rotate(315deg) brightness(92%) contrast(92%);"
                            }
                            break;
                        case "3696598664":
                            levelInfo = await getLogo(AllProgresions[element].stepIndex, "3696598664")
                            rangoCompetitivo = {
                                valor: AllProgresions[element].currentProgress,
                                nombre: "Competitivo",
                                progreso: AllProgresions[element].progressToNextLevel,
                                valorMaximo: AllProgresions[element].nextLevelAt,
                                level: AllProgresions[element].level,
                                logo: "/api"+levelInfo.icon,
                                stepName: levelInfo.stepName,
                                resets: AllProgresions[element].currentResetCount,
                                color: "rgba(209, 94, 87, 1)",
                                filtro: "brightness(0) saturate(100%) invert(49%) sepia(7%) saturate(4282%) hue-rotate(315deg) brightness(92%) contrast(92%);"
                            }
                            break;
                        case "2755675426":
                            levelInfo = await getLogo(AllProgresions[element].stepIndex, "2755675426")
                            rangoPruebas = {
                                valor: AllProgresions[element].currentProgress,
                                nombre: "Pruebas",
                                progreso: AllProgresions[element].progressToNextLevel,
                                valorMaximo: AllProgresions[element].nextLevelAt,
                                level: AllProgresions[element].level,
                                logo: "/api"+levelInfo.icon,
                                stepName: levelInfo.stepName,
                                resets: AllProgresions[element].currentResetCount,
                                color: "rgb(248, 159, 27)",
                                filtro: "brightness(0) saturate(100%) invert(67%) sepia(58%) saturate(1177%) hue-rotate(345deg) brightness(99%) contrast(97%);"
                            }
                            break;
                        case "599071390":
                            levelInfo = await getLogo(AllProgresions[element].stepIndex, "599071390")
                            rangoEstandarte = {
                                valor: AllProgresions[element].currentProgress,
                                nombre: "Estandarte de Hierro",
                                progreso: AllProgresions[element].progressToNextLevel,
                                valorMaximo: AllProgresions[element].nextLevelAt,
                                level: AllProgresions[element].level,
                                logo: "/api"+levelInfo.icon,
                                stepName: levelInfo.stepName,
                                resets: AllProgresions[element].currentResetCount,
                                color: "rgb(31, 194, 26)",
                                filter: "brightness(0) saturate(100%) invert(61%) sepia(48%) saturate(2549%) hue-rotate(74deg) brightness(94%) contrast(94%);"
                            }
                            break;
                    }
                }
                console.log(rangoVanguardia, rangoCrisol, rangoCompetitivo, rangoPruebas, rangoEstandarte, rangoGambito);

                setTriumphs({
                    Total: reputationRes.data.Response.profileRecords.data.lifetimeScore,
                    Active: reputationRes.data.Response.profileRecords.data.activeScore,
                });

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

    async function getLogo(progression, hash) {
        try {
            const response = await axios.get(`/api/Platform/Destiny2/Manifest/DestinyProgressionDefinition/${hash}/?lc=es`, {
                headers: {
                    'X-API-Key': 'f83a251bf2274914ab739f4781b5e710',
                },
            });

            return response.data.Response.steps[progression];
        } catch (error) {
            console.error(error);
        }
    }

    return (
        <div>
            <FavouriteActivity membershipType={membershipType} userId={userId} />
            <Commendations membershipType={membershipType} userId={userId} />
            {rango && (
                <div className="mt-6 bg-gray-300 p-4 rounded-lg">
                    <h2 className="text-2xl font-semibold">Reputación</h2>
                    <div className="grid gap-2 grid-rows-3 grid-cols-2 items-center flex">
                        {Object.keys(rango).map((key) => (
                            rango[key] && (
                                <div key={key} className="relative pt-4 justify-center flex space-x-1 items-center">
                                    {rango[key].logo && (
                                        <div className="relative w-[60px] h-[60px]">
                                            <img
                                                src={rango[key].logo}
                                                width={60}
                                                height={60}
                                                alt={`${rango[key].nombre} logo`}
                                                className="absolute top-0 left-0 z-10 p-3"
                                                style={{ filter: rango[key].filtro }}
                                            />
                                            <svg className="absolute top-0 left-0" width="100" height="100">
                                                <circle cx="30" cy="30" r="23" fill="#222222" />
                                                <circle
                                                    cx="30"
                                                    cy="30"
                                                    r="25"
                                                    stroke={rango[key].color}
                                                    strokeWidth="4"
                                                    fill="none"
                                                    strokeDasharray={`${(rango[key].progreso / rango[key].valorMaximo) * 176}, 176`}
                                                    transform="rotate(-90 30 30)"
                                                />
                                            </svg>
                                        </div>
                                    )}
                                    <div className="text-start">
                                        <p>Rango {rango[key].level}</p>
                                        <p className=" font-semibold">{rango[key].stepName}</p>
                                        <p className="text-sm">{rango[key].valor} ({rango[key].progreso || 0} / {rango[key].valorMaximo || 0})</p>
                                        <p className="text-sm">{rango[key].resets || 0} reinicios</p>
                                    </div>
                                </div>
                            )
                        ))}
                    </div>
                </div>
            )}
            {/*{Triumphs && (
                <div className="mt-6">
                    <h2>Triunfos</h2>
                    <p>Puntuación en total: {Triumphs.Total}</p>
                    <p>Puntuación en activos: {Triumphs.Active}</p>
                </div>
            )}*/}
        </div>
    )
}