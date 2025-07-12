
import destinyLogo from '../../../assets/destinyLogo.png';
import dungeonLogo from '../../../assets/dungeonLogo.png';
import raidReportIcon from '../../../assets/raidreport.png';
export default function ReportLinks({ type, id, nombre }) {
    return (
        <div className='flex pl-0 w-full text-2xl font-Inter rounded items-center py-1'>
            <button className="p-0 pb-1 rounded-lg text-white m-1 ml-0 transform transition-transform duration-200 hover:scale-105" style={{backgroundColor: '#4DB6AC'}}>
                <a href={`https://raid.report/${type}/${id}`} target="_blank" rel="noreferrer noopener" className='flex' title='Raid Report'>
                    <img src={raidReportIcon} alt="Raid Report Icon" className="w-5 h-5 mx-1 mt-1" />
                </a>
            </button>
            <button className="p-0 pb-1 rounded-lg text-white m-1 transform transition-transform duration-200 hover:scale-105" style={{backgroundColor: '#03A9F4'}}>
                <a href={`https://dungeon.report/${type}/${id}`} target="_blank" rel="noreferrer noopener" className='flex' title='Dungeon Report'>
                    <img src={dungeonLogo} alt="Dungeon Report Icon" className="w-5 h-5 mx-1 mt-1" />
                </a>
            </button>
            <button className="p-0 pb-1 rounded-lg text-white m-1 transform transition-transform duration-200 hover:scale-105" style={{backgroundColor: '#f2a518'}}>
                <a href={`https://destinytrialsreport.com/report/${type}/${id}`} target="_blank" rel="noreferrer noopener" className="flex" title='Trials Report'>
                    <img src="https://destinytrialsreport.com/assets/svg/icon.svg" alt="Trials Report Icon" className="w-5 h-5 mx-1 mt-1" />
                </a>
            </button>
            <button className="p-0 pb-1 rounded-lg text-white m-1 transform transition-transform duration-200 hover:scale-105" style={{backgroundColor: '#20262C'}}>
                <a href={`https://www.bungie.net/7/en/User/Profile/${type}/${id}?bgn=${nombre}`} target="_blank" rel="noreferrer noopener" className='flex' title='Perfil de bungie'>
                    <img src={destinyLogo} alt="User Icon" className="w-5 h-5 mx-1 mt-1" />
                </a>
            </button>
        </div>
    );
}