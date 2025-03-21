import axios from 'axios';
import { useEffect, useState } from 'react';

export default function TriumphScore({ membershipType, userId }) {
    const [triumphs, setTriumphs] = useState(null);

    useEffect(() => {
        const fetchTriumphs = async () => {

            const response = await axios.get(`/api/Platform/Destiny2/${membershipType}/Profile/${userId}/?components=900`, {
                headers: {
                    'X-API-Key': 'f83a251bf2274914ab739f4781b5e710',
                },
            });

            setTriumphs({
                Total: response.data.Response.profileRecords.data.lifetimeScore.toLocaleString('en-US'),
                Active: response.data.Response.profileRecords.data.activeScore.toLocaleString('en-US'),
            });
        }
        fetchTriumphs();
    }, []);

    return (
        triumphs && (
            <div className='p-6 bg-gray-300 rounded-lg w-fit'>
                <p className='font-bold text-2xl'>Triunfo</p>
                <div className='flex justify-evenly space-x-8 mt-2'>
                    <div>
                        <p className='font-semibold'>Puntaje total</p>
                        <p className='font-semibold flex space-x-1 items-center'>
                            <img src='/api/common/destiny2_content/icons/3fc55af09fc887e17e1fcf41553619c4.png' className={`w-8 h-8 mr-1`} />
                            {triumphs.Total}
                        </p>
                    </div>
                    <div>
                        <p className='font-semibold'>Puntaje activo</p>
                        <p className='font-semibold flex space-x-1 items-center'>
                            <img src='/api/common/destiny2_content/icons/319084f745e5b3cd9e6c767b92808918.png' className={`w-8 h-8 mr-1`} />
                            <p>{triumphs.Active} <span className='text-xs'>/27,536</span></p>
                        </p>
                    </div>
                </div>
            </div>
        )
    )
}