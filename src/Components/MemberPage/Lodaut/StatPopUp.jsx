import { createPortal } from 'react-dom';
import { API_CONFIG } from '../../../config';

export default function StatPopup({ stat, position, onClose }) {
    console.log('StatPopup', stat);

    return createPortal(
        <div
            className="text-white text-xs pointer-events-none max-w-[15%]"
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
            <div className="bg-black/75 pt-2 flex flex-col text-[0.8rem]">
                <p className='px-3 leading-tight'>{stat.description}</p>
                {Object.entries(stat.popUps.beneficios || {}).map(([key, benf], index) => (
                    <div key={index} className='w-full flex justify-between items-center mt-2 px-3'>
                        <p className='max-w-[70%]'>{benf.text}</p>
                        <p>{benf.value}</p>
                    </div>
                ))}
                <hr className='my-1 border-gray-600 w-full' />
                <p className='text-[#eade8b] text-[1rem] px-3'>BENEFICIO MEJORADO</p>
                <p className='text-sm px-3 text-[0.8rem] leading-tight mt-0.5'>{stat.popUps.mejora.text}</p>
                {stat.popUps?.mejora?.beneficiosMejora.m1.value ?
                    Object.values(stat.popUps?.mejora?.beneficiosMejora || {}).map((benf, index) => {
                        return benf.value && <div key={index} className='w-full px-3 flex justify-between items-center mt-2 text-[#f1dd55ff]'>
                            <div className='flex items-center -translate-x-[6px] max-w-[70%]'>
                                <svg width="16" height="16" viewBox="0 0 6 12" className='-translate-y-[1.5px]'>
                                    <path d="M3,10 l0,-4 l-1.5,0 l2.25,-3 l2.25,3 l-1.5,0 l0,4 z" fill="#f1dd55ff" />
                                </svg>
                                <p className='-translate-x-0.5'>{benf.text}</p>
                            </div>
                            <p>{benf.value}</p>
                        </div>
                    }) : (<p className='opacity-80 px-3 mt-1'>Necesitas llegar a nivel 100 para desbloquear el beneficio</p>)}
                <div className="flex items-center mt-1 mb-2 px-3">
                    <div className="flex-1 bg-gray-600 h-3 mr-3 flex relative">
                        <div
                            className="bg-gray-300 h-full transition-all duration-300"
                            style={{
                                width: `${Math.min((stat.value / 200) * 100, 100)}%`
                            }}
                        />
                        <div
                            className="absolute bg-black h-3 w-[2px]"
                            style={{
                                left: '50%',
                            }}
                        />
                    </div>
                    <span className="text-white text-sm font-medium">
                        {stat.value}/200
                    </span>
                </div>
            </div>
        </div>,
        document.body
    );
}