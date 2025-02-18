import axios from 'axios';
import React, { useEffect, useState } from 'react';
import { useLocation, useParams } from 'react-router-dom';
import '../../index.css';
import { getEquippedEmblem } from '../EquippedEmblem';
import { getTimeSinceLastConnection } from '../LastConexion';
import { fetchCharacterIds } from '../RecentActivity';
import Spinner from '../Spinner';
import '../Tabla.css';
import CurrentActivity from './CurrentActivity';
import ReportLinks from './ReportLinks';

function MemberDetail() {
    const { membershipType, membershipId } = useParams();
    const [memberDetail, setMemberDetail] = useState(null);
    const [userMemberships, setUserMemberships] = useState(null);
    const [emblemIndicators, setEmblemIndicators] = useState(null);
    const [numRank, setNumRank] = useState(null);
    const [activity, setActivity] = useState(null);
    const [member, setMember] = useState(null);
    const [currentLight, setCurrentLight] = useState(null);
    const [guardianRank, setGuardianRank] = useState(null);
    const [emblemBackgroundPath, setEmblem] = useState(null);
    const location = useLocation();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const queryParams = new URLSearchParams(location.search);
        const memberParam = queryParams.get('member');
        if (memberParam) {
            setMember(JSON.parse(decodeURIComponent(memberParam)));
        }
    }, [location.search]);

    useEffect(() => {
        const fetchMemberDetail = async () => {
            if (!member) {
                return;
            }

            try {
                const responseProfile = await axios.get(`/api/Platform/Destiny2/${membershipType}/Profile/${membershipId}/?components=100`, {
                    headers: {
                        'X-API-Key': 'f83a251bf2274914ab739f4781b5e710',
                    },
                });
                const membershipsResponse = await axios.get(`/api/Platform/User/GetMembershipsById/${membershipId}/${membershipType}/`, {
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
                setMemberDetail(responseProfile.data.Response);
                setUserMemberships(membershipsResponse.data.Response);
                setGuardianRank(guardianRankResponse.data.Response.displayProperties.name);
                setCurrentLight(await getEquippedEmblem(member, "CharacterPower"));
                setEmblem(await getEquippedEmblem(member, "Large"));

                if (member.isOnline) {
                    setActivity(await fetchCharacterIds(member, "activity", "MemberDetail"));
                } else {
                    setActivity("Última conexión hace " + getTimeSinceLastConnection(member.lastOnlineStatusChange, member.isOnline));
                }

            } catch (error) {
                console.error('Error fetching member details:', error);
                setError('Error fetching member details.');
            } finally {
                setLoading(false);
            }
        };

        fetchMemberDetail();
    }, [membershipId, membershipType, member]);

    if (loading) {
        return <Spinner />;
    }

    if (error) {
        return <div>{error}</div>;
    }
    
    return (
        <div className='justify-center flex mt-20 font-Inter items-center flex-col'>
            <h1 className='text-4xl font-bold text-gray-700 w-3/4 mb-6'>{userMemberships?.bungieNetUser?.uniqueName}</h1>
            {memberDetail && userMemberships && (
                <div style={{ backgroundImage: `url(/api${emblemBackgroundPath})`, backgroundSize: 'contain', backgroundRepeat: 'no-repeat' }} className='w-3/4 p-2 px-20 text-white flex emblema'>
                    <div className='ml-1 items-center'>
                        <h2 className='text-2xl font-large tracking-wide' style={{ textShadow: "0px 1px 2px rgba(37, 37, 37, 0.4)" }}>{userMemberships.bungieNetUser.displayName}</h2>
                        <h1 className='text-xl text-neutral-100 opacity-75 flex items-center' style={{ textShadow: "0px 1px 2px rgba(37, 37, 37, 0.4)" }}>
                            <img src={`${import.meta.env.BASE_URL}/levels/${memberDetail.profile.data.currentGuardianRank}.fw.png`} className='w-6 h-6 mr-1'/>{guardianRank}
                        </h1>
                        <h1 className='font-extralight tracking-wide text-gray-200 text-xl opacity-50'>BRODAS</h1>
                    </div>
                    <div>
                        <h1 className='ml-48 text-4xl lightlevel' style={{ color: "#E5D163", textShadow: "0px 3px 3px rgba(37, 37, 37, 0.4)" }}>
                            <i className="icon-light mr-1" style={{ fontStyle: 'normal', fontSize: '2.2rem', position: 'relative', top: '-0.40rem' }} />{currentLight}
                        </h1>
                        <p>{emblemIndicators}</p>
                    </div>
                </div>
            )}
            <div className='w-3/4 text-start'>
                <h2 className='italic text-gray-400 tracking-wide text-large'>{activity}</h2>
                <ReportLinks type={membershipType} id={membershipId} nombre={userMemberships?.bungieNetUser?.uniqueName} />
                <CurrentActivity type={membershipType} id={membershipId} />
            </div>
        </div>
    );
}

export default MemberDetail;