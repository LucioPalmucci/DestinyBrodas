import axios from "axios";
import { useEffect, useState } from "react";
import Slider from "react-slick";
import "slick-carousel/slick/slick-theme.css";
import "slick-carousel/slick/slick.css";
import caretLeft from "../../assets/caret-left-solid.svg";
import caretRight from "../../assets/caret-right-solid.svg";
import "../../index.css";
import Commendations from "./Commendations";
import FavouriteActivity from "./FavouriteActivity";

export default function ReputationStatus({ membershipType, userId }) {
    const [rango, setRango] = useState(null);
    const [page, setPage] = useState(0);
    const [move, setMove] = useState("next");

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

                //console.log(reputationRes.data.Response.characterProgressions.data[firstCharacterId].progressions);

                const AllProgresions = reputationRes.data.Response.characterProgressions.data[firstCharacterId].progressions;
                const progressions = ["3008065600", "457612306", "2083746873", "3696598664", "2755675426", "599071390", "198624022", "784742260"];
                let rangoVanguardia = [], rangoCrisol = [], rangoCompetitivo = [], rangoPruebas = [], rangoEstandarte = [], rangoGambito = [], rangoClanes = [], rangoEngramas = [];

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
                                logo: "/api" + levelInfo.icon,
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
                                logo: "/api" + levelInfo.icon,
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
                                logo: "/api" + levelInfo.icon,
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
                                logo: "/api" + levelInfo.icon,
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
                                logo: "/api" + levelInfo.icon,
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
                                logo: "/api" + levelInfo.icon,
                                stepName: levelInfo.stepName,
                                resets: AllProgresions[element].currentResetCount,
                                color: "rgb(31, 194, 26)",
                                filter: "brightness(0) saturate(100%) invert(61%) sepia(48%) saturate(2549%) hue-rotate(74deg) brightness(94%) contrast(94%);"
                            }
                            break;
                        case "198624022":
                            levelInfo = await getLogo(AllProgresions[element].stepIndex, "198624022")
                            rangoClanes = {
                                valor: AllProgresions[element].currentProgress,
                                nombre: "Clanes",
                                progreso: AllProgresions[element].progressToNextLevel,
                                valorMaximo: AllProgresions[element].nextLevelAt,
                                level: AllProgresions[element].level,
                                logo: "/api" + levelInfo.icon,
                                stepName: levelInfo.stepName,
                                resets: AllProgresions[element].currentResetCount,
                                color: "rgb(165, 3, 3)",
                                filtro: "brightness(0) saturate(100%) invert(100%) sepia(0%) saturate(0%) hue-rotate(0deg) brightness(100%) contrast(100%);"
                            }
                            break;
                        case "784742260":
                            levelInfo = await getLogo(AllProgresions[element].stepIndex, "784742260")
                            rangoEngramas = {
                                valor: AllProgresions[element].currentProgress,
                                nombre: "Engramas",
                                progreso: AllProgresions[element].progressToNextLevel,
                                valorMaximo: AllProgresions[element].nextLevelAt,
                                level: AllProgresions[element].level,
                                logo: "/api" + levelInfo.icon,
                                stepName: levelInfo.stepName,
                                resets: AllProgresions[element].currentResetCount,
                                color: "rgb(253, 195, 36)",
                                filtro: "brightness(0) saturate(100%) invert(100%) sepia(0%) saturate(0%) hue-rotate(0deg) brightness(100%) contrast(100%);"
                            }
                            break;
                    }
                }

                setRango({
                    vanguardia: rangoVanguardia,
                    crisol: rangoCrisol,
                    competitivo: rangoCompetitivo,
                    pruebas: rangoPruebas,
                    estandarte: rangoEstandarte,
                    gambito: rangoGambito,
                    clanes: rangoClanes,
                    engramas: rangoEngramas,
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

    const pages = [
        ["vanguardia", "crisol"],
        ["competitivo", "pruebas"],
        ["estandarte", "gambito"],
        ["clanes", "engramas"],
    ];

    const sliderSettings = {
        dots: false,
        infinite: false,
        speed: 500,
        slidesToShow: 1,
        slidesToScroll: 1,
        nextArrow: <img src={caretRight} width={10} height={10} class="custom-arrow" />,
        prevArrow: <img src={caretLeft} width={10} height={10} class="custom-arrow" />,
        afterChange: (current) => setPage(current),
        height: 100,
    };

    return (
        <div>
            <FavouriteActivity membershipType={membershipType} userId={userId} />
            <Commendations membershipType={membershipType} userId={userId} />
            {rango && (
                <div className="mt-6 bg-gray-300 p-4 rounded-lg flex flex-col items-center">
                    <h2 className="text-2xl font-semibold self-start">Reputación</h2>
                    <Slider {...sliderSettings} className="w-full max-w-[420px] flex justify-center items-center pt-2 h-[100px]">
                        {pages.map((pageKeys, index) => (
                            <div key={index} className="!flex flex-row justify-center gap-4 w-full items-center px-0">
                                {pageKeys.map((key) => (
                                    rango[key] && (
                                        <div key={key} className="relative justify-center flex space-x-1 items-center">
                                            {rango[key].logo && (
                                                <div className={`relative w-[70px] h-[70px] flex flex-row items-center justify-center ${rango[key].resets == null ? "mt-2" : "mt-0"}`}>
                                                    <img
                                                        src={rango[key].logo}
                                                        width={70}
                                                        height={70}
                                                        alt={`${rango[key].nombre} logo`}
                                                        className="absolute z-10 p-3"
                                                    />
                                                    <svg className="absolute" width="100" height="100">
                                                        <circle cx="50" cy="50" r="30" fill="#222222" />
                                                        <circle
                                                            cx="50"
                                                            cy="50"
                                                            r="32"
                                                            stroke={rango[key].color}
                                                            strokeWidth="4"
                                                            fill="none"
                                                            strokeDasharray={`${(rango[key].progreso / rango[key].valorMaximo) * 176}, 176`}
                                                            transform="rotate(-90 50 50)"
                                                        />
                                                    </svg>
                                                </div>
                                            )}
                                            <div className="text-start leading-5">
                                                <p>Rango {rango[key].level}</p>
                                                <p className="font-semibold">{rango[key].stepName}</p>
                                                <p className="text-sm">{rango[key].valor} ({rango[key].progreso || 0} / {rango[key].valorMaximo || 0})</p>
                                                {rango[key].resets != null && <p className="text-sm">{rango[key].resets} reinicios</p>}
                                            </div>
                                        </div>
                                    )
                                ))}
                            </div>
                        ))}
                    </Slider>
                </div>
            )}
        </div>
    )
}