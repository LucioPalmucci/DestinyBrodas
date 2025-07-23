import { createPortal } from 'react-dom';
import { API_CONFIG } from '../../../config';

export default function StatPopup({ stat, position, onClose }) {

    return createPortal(
        <div
            className="text-white text-xs pointer-events-none w-[16%]"
            style={{
                position: "fixed",
                top: `${position.top}px`,
                left: `${position.left}px`,
                zIndex: 9999,
            }}
        >
            <div className="flex items-center justify-start bg-black/90 px-1 pb-1.5">
                <img
                    src={`${API_CONFIG.BUNGIE_API}${stat.iconPath}`}
                    className="w-9 h-9 mt-2 mr-1"
                    alt={stat.name}
                />
                <div className='flex flex-col items-start leading-1.5'>
                    <p className="text-lg uppercase font-[500]">{stat.name}</p>
                    <p className='opacity-70 text-[0.8rem]'>Estadística de personaje</p>
                </div>
            </div>
            <div className="bg-neutral-900/90 pt-2 flex flex-col text-[0.8rem]">
                <p className='px-3 leading-tight opacity-80'>{stat.description}</p>
                {Object.entries(stat.popUps.beneficios || {}).map(([key, benf], index) => (
                    <div key={index} className='w-full flex justify-between items-top mt-2 px-3'>
                        <p>{benf.text}</p>
                        <p>{benf.value}</p>
                    </div>
                ))}
                <hr className='my-1 border-gray-600 w-full' />
                <p className={`text-[#efe6ac] text-[1rem] px-3 ${stat.value <= 100 ? 'opacity-70' : ''}`}>BENEFICIO MEJORADO</p>
                <p className={`text-sm px-3 text-[0.8rem] leading-tight mt-0.5 ${stat.value <= 100 ? 'opacity-70' : ''}`}>{stat.popUps.mejora.text}</p>
                {stat.popUps?.mejora?.beneficiosMejora.m1.value ?
                    Object.values(stat.popUps?.mejora?.beneficiosMejora || {}).map((benf, index) => {
                        return benf.value && <div key={index} className='w-full px-3 flex justify-between items-top mt-1 text-[#f1dd55ff]'>
                            <div className='flex items-top -translate-x-[6px]'>
                                <svg width="16" height="16" viewBox="0 0 6 12" className='-translate-y-[1.5px]'>
                                    <path d="M3,10 l0,-4 l-1.5,0 l2.25,-3 l2.25,3 l-1.5,0 l0,4 z" fill="#f1dd55ff" />
                                </svg>
                                <p className='-translate-x-0.5'>{benf.text}</p>
                            </div>
                            <p className='whitespace-pre-line'>{benf.value}</p>
                        </div>
                    }) : (<p className=' px-3 mt-1'>Se activa arriba del nivel 100 de estadísticas</p>)}
                <div className="flex items-center mt-1 mb-2 px-3">
                    <div className="flex-1 bg-black/30 h-5 flex relative">
                        <div
                            className="bg-neutral-400 h-full transition-all duration-300"
                            style={{
                                width: `${Math.min((stat.value / 200) * 100, 100)}%`
                            }}
                        />
                        <div
                            className="absolute h-5 w-[1px]"
                            style={{
                                left: '50%',
                                transform: 'translateX(-50%)',
                                background: stat.value > 100 ? '#000000ff' : '#ffffffff',
                            }}
                        />
                        <span className="absolute right-0 top-0.5 pr-1">
                            {stat.value}/200
                        </span>
                    </div>
                </div>
            </div>
        </div>,
        document.body
    );
}