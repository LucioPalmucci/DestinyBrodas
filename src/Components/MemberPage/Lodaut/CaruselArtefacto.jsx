import { useState } from "react";
import Slider from "react-slick";
import "slick-carousel/slick/slick-theme.css";
import "slick-carousel/slick/slick.css";
import "../../../index.css";
import frasesArtefactoES from "../frases/frasesArtefactoES";
import ToolTipArtefacto from "./ToolTipArtefacto";

function CaruselArtefacto({ elements }) {

    function escapeRegex(str) {
        return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }
    const frasesOrdenadasArtf = [...frasesArtefactoES].sort((a, b) => b.length - a.length);
    const regexArtf = new RegExp(`\\b(${frasesOrdenadasArtf.map(escapeRegex).join('|')})\\b`, "gi");

    function reemplazarCorchetes(texto) {
        if (typeof texto !== "string") {
            return texto;
        }
        return texto.replace(/\[([^\]]+)\]/gi, (match, palabra) => {
            const clave = palabra.trim().toLowerCase();
            return reemplazos[clave] || match;
        });
    }

    function reemplazarCorchetesYColorearArtefacto(texto) {
        const conIconos = reemplazarCorchetes(texto ?? "");
        return conIconos.replace(regexArtf, (match, ...args) => {
            const offset = args[args.length - 2];
            const before = conIconos.slice(0, offset);
            const openTag = before.lastIndexOf('<i');
            const closeTag = before.lastIndexOf('</i>');
            if (openTag > closeTag) return match; // Está dentro de <i>...</i>
            return `<span style="color:#799AB5;">${match}</span>`;
        });
    }

    const reemplazos = {
        "cuerpo a cuerpo": '<i class="icon-melee" style="font-style:normal"></i>',
        "granada": '<i class="icon-granada" style="font-style:normal"></i>',
        "estasis": '<i class="icon-estasis" style="font-style:normal"></i>',
        "cuerda": '<i class="icon-cuerda" style="font-style:normal"></i>',
        "atadura": '<i class="icon-cuerda" style="font-style:normal"></i>',
        "solar": '<i class="icon-solar" style="font-style:normal"></i>',
        "vacío": '<i class="icon-vacío" style="font-style:normal"></i>',
        "arco": '<i class="icon-arco" style="font-style:normal"></i>',
        "perturbación": '<i class="icon-perturbacion" style="font-style:normal"></i>',
        "perforación de escudos": '<i class="icon-perforacion" style="font-style:normal"></i>',
        "aturdimiento": '<i class="icon-aturdimiento" style="font-style:normal"></i>',
    }
    const settings = {
        dots: false,
        infinite: false,
        speed: 300,
        slidesToShow: 4,
        slidesToScroll: 4,
        autoplay: false,
        autoplaySpeed: 2000,
        cssEase: "linear",
        overflow: "visible",
    };
    return (
        <div>
            <Slider {...settings}>
                {elements.map((perk, index) => {
                    const [showTooltip, setShowTooltip] = useState(false);
                    const [tooltipPos, setTooltipPos] = useState({ top: 0, left: 0 });

                    const handleMouseEnter = (e) => {
                        const rect = e.target.getBoundingClientRect();
                        setTooltipPos({ top: rect.top - 60, left: rect.left });
                        setShowTooltip(true);
                    };
                    const handleMouseLeave = () => setShowTooltip(false);

                    return (
                        <div className="group relative" key={index}>
                            <img
                                src={`${perk.iconPath}`}
                                className={`rounded-[5px] p-1 object-cover ${perk.name === "Fusil de francotirador antibarrera" ? "w-[39px] h-[39px]" : "w-[40px] h-[40px]"}`}
                                alt={perk.name}
                                onMouseEnter={handleMouseEnter}
                                onMouseLeave={handleMouseLeave}
                            />
                            <div
                                className={`absolute top-0 left-0 rounded-[5px] pointer-events-none ${perk.name === "Fusil de francotirador antibarrera" ? "w-[39px] h-[39px]" : "w-[40px] h-[40px]"}`}
                                style={{
                                    background: "linear-gradient(to bottom, rgb(43,120,123) 0%, rgb(40,110,113) 60%, rgb(37,101,104) 100%)",
                                    zIndex: -1,
                                }}
                            />
                            <ToolTipArtefacto show={showTooltip} position={tooltipPos}>
                                <div className="-top-24 left-8 mt-2 w-max max-w-[230px] bg-neutral-800 text-white text-xs p-1.5 border-1 border-white shadow-lg z-50">
                                    <strong>{perk.name}</strong>
                                    <br />
                                    <p
                                        className="w-fit whitespace-pre-line text-[0.7rem]"
                                        dangerouslySetInnerHTML={{
                                            __html: reemplazarCorchetesYColorearArtefacto(perk.desc?.description ?? perk.desc ?? ""),
                                        }}
                                    />
                                </div>
                            </ToolTipArtefacto>
                        </div>
                    );
                })}
            </Slider>
        </div>
    );
}

export default CaruselArtefacto;
