import { useEffect, useState } from 'react';
import { useBungieAPI } from '../../APIservices/BungieAPIcache';


export default function TriumphScore({ membershipType, userId }) {
    const [triumphs, setTriumphs] = useState(null);
    const { getAllSeals } = useBungieAPI();

    useEffect(() => {
        const fetchTriumphs = async () => {

            const response = await getAllSeals(membershipType, userId);

            setTriumphs({
                Total: response.profileRecords.data.lifetimeScore?.toLocaleString('en-US'),
                Active: response.profileRecords.data.activeScore.toLocaleString('en-US'),
            });
        }
        fetchTriumphs();
    }, []);

    return (
        triumphs ? (
            <div className='p-6 bg-gray-300 rounded-lg mt-6'>
                <p className='font-bold text-2xl'>Triunfo</p>
                <div className='flex justify-evenly space-x-8 mt-2'>
                    <div>
                        <p className='font-semibold'>Puntaje total</p>
                        <div className='font-semibold flex space-x-1 items-center'>
                            <img src='/api/common/destiny2_content/icons/3fc55af09fc887e17e1fcf41553619c4.png' className={`w-8 h-8 mr-1`} style={{ filter: "brightness(0) contrast(100%)" }} />
                            {triumphs.Total}
                        </div>
                    </div>
                    <div>
                        <p className='font-semibold'>Puntaje activo</p>
                        <div className='font-semibold flex space-x-1 items-center'>
                            <img src='/api/common/destiny2_content/icons/319084f745e5b3cd9e6c767b92808918.png' className={`w-8 h-8 mr-1`} style={{ filter: "brightness(0) contrast(100%)" }} />
                            <p>{triumphs.Active} <span className='text-xs'>/27,536</span></p>
                        </div>
                    </div>
                </div>
            </div>
        ) : (
            <div className='p-6 bg-gray-300 rounded-lg mt-6 flex items-center justify-center h-[150px] font-semibold animate-pulse'></div>
        )
    )
}