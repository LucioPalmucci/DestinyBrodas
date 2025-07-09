import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Slider from "react-slick";
import "slick-carousel/slick/slick-theme.css";
import "slick-carousel/slick/slick.css";
import caretLeft from "../../../assets/caret-left-solid.svg";
import caretRight from "../../../assets/caret-right-solid.svg";
import "../../../index.css";
import PopUpTeammate from "./PopUpTeammate";

const CustomPrevArrow = ({ onClick }) => (
    <button
        onClick={onClick}
        className="absolute -left-5 top-1/2 transform -translate-y-1/2 -translate-x-2 bg-black/25 hover:bg-black/40 p-1 px-2 rounded-lg transition-all duration-200 z-10 cursor-pointer"
    >
        <img src={caretLeft} width={10} height={10} alt="Previous" style={{ filter: "brightness(0) saturate(100%) invert(1)" }} />
    </button>
);

const CustomNextArrow = ({ onClick }) => (
    <button
        onClick={onClick}
        className="absolute -right-5 top-1/2 transform -translate-y-1/2 translate-x-2 bg-black/25 hover:bg-black/40 p-1 px-2 rounded-lg transition-all duration-200 z-10 cursor-pointer"
    >
        <img src={caretRight} width={10} height={10} alt="Next" style={{ filter: "brightness(0) saturate(100%) invert(1)" }} />
    </button>
);

export default function CaruselTemmate({ members, onMemberClick }) {
    const [selectedPlayer, setSelectedPlayer] = useState(null);
    const [portalContainer, setPortalContainer] = useState(null);
    const [popupPosition, setPopupPosition] = useState({ top: 0, left: 0 });
    const popupRef = useRef(null);

    const settings = {
        dots: false,
        infinite: true,
        speed: 300,
        slidesToShow: 2,
        slidesToScroll: 1,
        autoplay: false,
        arrows: true,
        rows: 2,
        slidesPerRow: 1,
        prevArrow: <CustomPrevArrow />,
        nextArrow: <CustomNextArrow />,
    };

    useEffect(() => {
        // Crear el contenedor del portal
        const container = document.createElement('div');
        container.id = 'popup-portal';
        document.body.appendChild(container);
        setPortalContainer(container);

        return () => {
            // Limpiar el contenedor cuando se desmonte el componente
            if (container.parentNode) {
                container.parentNode.removeChild(container);
            }
        };
    }, []);

    useEffect(() => {
        if (selectedPlayer === null) return;

        function handleClickOutside(event) {
            if (popupRef.current && !popupRef.current.contains(event.target)) {
                setSelectedPlayer(null);
            }
        }

        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [selectedPlayer]);

    const handleMemberClick = (idx, event) => {
        const rect = event.currentTarget.getBoundingClientRect();
        const position = {
            top: rect.top + window.scrollY - 20,
            left: rect.right + window.scrollX
        };

        const popupWidth = 400;
        const screenWidth = window.innerWidth;
        
        if (position.left + popupWidth > screenWidth) {
            position.left = rect.left + window.scrollX - popupWidth - 10;
        }

        setPopupPosition(position);
        setSelectedPlayer(idx);
        
        if (onMemberClick) {
            onMemberClick(idx);
        }
    };

    return (
        <div>
            <div className="relative min-h-[160px]">
                <Slider {...settings}>
                    {members.map((member, idx) => (
                        <div key={member.membershipId} className="px-1 py-1">
                            <div className="relative">
                                <a
                                    className={`flex items-center gap-2 bg-black/25 p-2 rounded-lg w-full cursor-pointer transition-all duration-200  clan-member-shimmer-hover`}
                                    onClick={(e) => handleMemberClick(idx, e)}
                                >
                                    <img src={`/api${member.emblemPath}`} width={40} height={40} alt="Emblem" />
                                    <div className="flex flex-col">
                                        <span>{member.name}</span>
                                        <span>{member.clase} <i className={`icon-${member.subclass}`} style={{ fontStyle: "normal" }} /> - {member.light}</span>
                                    </div>
                                </a>
                            </div>
                        </div>
                    ))}
                </Slider>
            </div>

            {selectedPlayer !== null && portalContainer && createPortal(
                <div
                    ref={popupRef}
                    className="fixed z-50"
                    style={{
                        top: `${popupPosition.top}px`,
                        left: `${popupPosition.left}px`
                    }}
                >
                    <PopUpTeammate jugador={members[selectedPlayer]} />
                </div>,
                portalContainer
            )}
        </div>
    );
}