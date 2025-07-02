import axios from "axios";
import { useEffect, useState } from "react";

export default function PopUpClanTeammates({ jugador }) {
    const [emblema, setEmblema] = useState("");
    const [guardianRank, setGuardianRank] = useState({});

    useEffect(async () => {
        console.log("Jugador: ", jugador);
        const emblemaResponse = await axios.get(`/api/Platform/Destiny2/Manifest/DestinyInventoryItemDefinition/${jugador.emblemHash}/?lc=es`, {
            headers: {
                'X-API-Key': 'f83a251bf2274914ab739f4781b5e710',
            },
        });
        setEmblema(emblemaResponse.data.Response.displayProperties.icon);
        const responseProfile = await axios.get(`/api/Platform/Destiny2/${membershipType}/Profile/${membershipId}/?components=100`, {
            headers: {
                'X-API-Key': 'f83a251bf2274914ab739f4781b5e710',
            },
        });
        const RankNum = responseProfile.data.Response.profile.data.currentGuardianRank;
        const guardianRankResponse = await axios.get(`/api/Platform/Destiny2/Manifest/DestinyGuardianRankDefinition/${RankNum}/?lc=es`, {
            headers: {
                'X-API-Key': 'f83a251bf2274914ab739f4781b5e710',
            },
        });
        setGuardianRank({
            title: guardianRankResponse.data.Response.displayProperties.name,
            num: RankNum,
        });
    }, []);

    return (
        <div className="w-[300px] bg-black/25">
            <div style={{ backgroundImage: `url(/api${emblema})`, backgroundSize: 'cover', backgroundRepeat: 'no-repeat' }} className='p-2 pl-24 text-white flex justify-between'>
                <div className='ml-1 items-center'>
                    <h2 className='text-2xl font-large tracking-wide' style={{ textShadow: "0px 1px 2px rgba(37, 37, 37, 0.4)" }}>{jugador.name}</h2>
                    <h1 className='text-xl text-neutral-100 opacity-75 flex items-center' style={{ textShadow: "0px 1px 2px rgba(37, 37, 37, 0.4)" }}>
                        <img src={`${import.meta.env.BASE_URL}/levels/${guardianRank.num}.fw.png`} className='w-6 h-6 mr-1' />{guardianRank.title}
                    </h1>
                    <h1 className='font-extralight tracking-wide text-gray-200 text-xl opacity-50'>BRODAS</h1>
                </div>
                <div>
                    <h1 className='text-4xl lightlevel' style={{ color: "#E5D163", textShadow: "0px 3px 3px rgba(37, 37, 37, 0.4)" }}>
                        <i className="icon-light mr-1" style={{ fontStyle: 'normal', fontSize: '2.2rem', position: 'relative', top: '-0.40rem' }} />{jugador.light}
                    </h1>
                </div>
            </div>
        </div>
    );

}