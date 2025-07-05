import { useEffect, useState } from "react";
import Slider from "react-slick";
import "slick-carousel/slick/slick-theme.css";
import "slick-carousel/slick/slick.css";
import caretLeft from "../../../assets/caret-left-solid.svg";
import caretRight from "../../../assets/caret-right-solid.svg";
import "../../../index.css";
import { useBungieAPI } from "../../APIservices/BungieAPIcache";

const NextArrow = ({ onClick }) => (
    <div className="custom-arrow cursor-pointer" onClick={onClick}>
        <img src={caretRight} width={30} height={30} alt="Next" />
    </div>
);

const PrevArrow = ({ onClick }) => (
    <div className="custom-arrow cursor-pointer" onClick={onClick}>
        <img src={caretLeft} width={30} height={30} alt="Previous" />
    </div>
);
export default function ReputationStatus({ membershipType, userId }) {
    const [rango, setRango] = useState(null);
    const [page, setPage] = useState(0);
    const [move, setMove] = useState("next");
    const { getCompChars, getFullCharacterProfile, getItemManifest } = useBungieAPI();

    useEffect(() => {
        const fetchGeneralStats = async () => {
            try {
                const response = await getCompChars(membershipType, userId);
                const characterIds = Object.keys(response);
                const firstCharacterId = characterIds[0];

                const reputationRes = await getFullCharacterProfile(membershipType, userId);

                const AllProgresions = reputationRes.characterProgressions.data[firstCharacterId].progressions;
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
            const response = await getItemManifest(hash, "DestinyProgressionDefinition");
            return response.steps[progression] || response.steps[15];
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
        nextArrow: <NextArrow />,
        prevArrow: <PrevArrow />,
        afterChange: (current) => setPage(current),
        height: 100,
    };

    return (
        <div>
            {rango && (
                <div className="mt-6 bg-gray-300 p-4 rounded-lg flex flex-col items-center">
                    <h2 className="text-2xl font-semibold self-start">Reputación</h2>
                    <Slider {...sliderSettings} className="w-full max-w-[420px] !flex justify-center items-center pt-2 h-[100px]">
                        {pages.map((pageKeys, index) => (
                            <div key={"page-" + index} className="!flex flex-row justify-center gap-4 w-full items-center px-0">
                                {pageKeys.map((key) => (
                                    rango[key] && (
                                        <div key={"reputation-" + key} className="relative justify-center flex space-x-1 items-center">
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
                                                            strokeDasharray={`${(rango[key].progreso / rango[key].valorMaximo) * 176}, 189`}
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