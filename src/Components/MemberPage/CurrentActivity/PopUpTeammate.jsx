import bungieLogo from '../../../assets/bungieLogo.png';
import destinyLogo from '../../../assets/destinyLogo.png';
import dungeonLogo from '../../../assets/dungeonLogo.png';
import elogio from "../../../assets/elogio.png";
import raidReportIcon from '../../../assets/raidreport.png';

export default function PopUpTeammate({ jugador }) {
    return (
            <div className="text-white font-Inter w-[350px] bg-black/75 text-start justify-start flex mt-10 font-Inter items-center flex-col space-y-4">
                <div style={{ backgroundImage: `url(/api${jugador.emblemaBig})`, backgroundSize: 'cover', backgroundRepeat: 'no-repeat' }} className='p-2 pl-20 text-white flex justify-between w-full'>
                    <div className='ml-1 items-center'>
                        <h2 className='text-xl font-large tracking-wide leading-tight' style={{ textShadow: "0px 1px 2px rgba(37, 37, 37, 0.4)" }}>{jugador.name}</h2>
                        <h1 className='text-lg text-neutral-100 opacity-75 flex items-center leading-tight' style={{ textShadow: "0px 1px 2px rgba(37, 37, 37, 0.4)" }}>
                            <img src={`${import.meta.env.BASE_URL}levels/${jugador.guardianRank.num}.fw.png`} className='w-4 h-4 mr-1' />{jugador.guardianRank.title}
                        </h1>
                        <h1 className='leading-tight font-extralight tracking-wide text-gray-200 text-lg opacity-50'>BRODAS</h1>
                    </div>
                    <div>
                        <h1 className='text-3xl lightlevel' style={{ color: "#E5D163", textShadow: "0px 3px 3px rgba(37, 37, 37, 0.4)" }}>
                            <i className="icon-light mr-1" style={{ fontStyle: 'normal', fontSize: '1.8rem', position: 'relative', top: '-0.40rem' }} />{jugador.light}
                        </h1>
                    </div>
                </div>
                <div className="flex space-x-8 items-center w-full px-7">
                    <p className="flex items-center text-xl font-bold"><img src={elogio} className="w-5 h-5 mr-2 filter" style={{ filter: "brightness(0) invert(1)" }} />{jugador.honor.totalScore}</p>
                    <div className="flex h-2 w-full overflow-hidden space-x-0.5">
                        {jugador.honor.verdes > 0 && (
                            <div style={{ width: `${jugador.honor.verdes}%`, backgroundColor: 'rgba(54,163,137,1)' }} className="h-full"></div>
                        )}
                        {jugador.honor.naranjas > 0 && (
                            <div style={{ width: `${jugador.honor.naranjas}%`, backgroundColor: 'rgba(205,125,44,1)' }} className="h-full"></div>
                        )}
                        {jugador.honor.rosas > 0 && (
                            <div style={{ width: `${jugador.honor.rosas}%`, backgroundColor: 'rgba(190,79,106,1)' }} className="h-full"></div>
                        )}
                        {jugador.honor.azules > 0 && (
                            <div style={{ width: `${jugador.honor.azules}%`, backgroundColor: 'rgba(50,136,193,1)' }} className="h-full"></div>
                        )}
                    </div>
                </div>
                <div className="w-full h-px bg-white opacity-30" />
                <div className="flex items-center w-full px-6 space-x-4">
                    <img className="w-12 h-12" src={`/api${jugador.iconActivity}`} />
                    <div className="flex flex-col items-start">
                        <p className="text-lg font-semibold leading-tight">{jugador.activityName}</p>
                        <p className="italic">{jugador.mode}</p>
                    </div>
                </div>
                <div className="w-full h-px bg-white opacity-30" />
                <div className="flex flex-col justify-start items-start w-full px-7">
                    <p className="tracking-[0.4rem] mb-1" style={{ color: '#479ce4' }}>ID DE BUNGIE</p>
                    <h1 className="items-center">
                        <img src={bungieLogo} alt="Bungie Logo" className="inline-block w-5 h-5 mr-2" />
                        {jugador.uniqueName.slice(0, -5)}
                        <span style={{ color: '#479ce4' }}>
                            {jugador.uniqueName.slice(-5)}
                        </span>
                    </h1>
                </div>
                <div className="w-full h-px bg-white opacity-30" />
                <div className='flex px-6 w-full justify-center text-2xl font-Inter rounded items-center space-x-4 pb-4'>
                    <button className="p-0 pb-1 rounded-lg text-white m-1 ml-0 transform transition-transform duration-200 hover:scale-105" style={{ backgroundColor: '#4DB6AC' }}>
                        <a href={`https://raid.report/${jugador.membershipType}/${jugador.membershipId}`} target="_blank" rel="noreferrer noopener" className='flex' title='Raid Report'>
                            <img src={raidReportIcon} alt="Raid Report Icon" className="w-7 h-7 mx-1 mt-1" />
                        </a>
                    </button>
                    <button className="p-0 pb-1 rounded-lg text-white m-1 transform transition-transform duration-200 hover:scale-105" style={{ backgroundColor: '#03A9F4' }}>
                        <a href={`https://dungeon.report/${jugador.membershipType}/${jugador.membershipId}`} target="_blank" rel="noreferrer noopener" className='flex' title='Dungeon Report'>
                            <img src={dungeonLogo} alt="Dungeon Report Icon" className="w-7 h-7 mx-1 mt-1" />
                        </a>
                    </button>
                    <button className="p-0 pb-1 rounded-lg text-white m-1 transform transition-transform duration-200 hover:scale-105" style={{ backgroundColor: '#f2a518' }}>
                        <a href={`https://destinytrialsreport.com/report/${jugador.membershipType}/${jugador.membershipId}`} target="_blank" rel="noreferrer noopener" className="flex" title='Trials Report'>
                            <img src="https://destinytrialsreport.com/assets/svg/icon.svg" alt="Trials Report Icon" className="w-7 h-7 mx-1 mt-1" />
                        </a>
                    </button>
                    <button className="p-0 pb-1 rounded-lg text-white m-1 transform transition-transform duration-200 hover:scale-105" style={{ backgroundColor: '#20262C' }}>
                        <a href={`https://www.bungie.net/7/en/User/Profile/${jugador.membershipType}/${jugador.membershipId}?bgn=${jugador.nombre}`} target="_blank" rel="noreferrer noopener" className='flex' title='Perfil de bungie'>
                            <img src={destinyLogo} alt="User Icon" className="w-7 h-7 mx-1 mt-1" />
                        </a>
                    </button>
                </div>
            </div>
    );
}