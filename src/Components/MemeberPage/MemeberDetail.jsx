import axios from 'axios';
import React, { useEffect, useState } from 'react';
import { useLocation, useParams } from 'react-router-dom';
import { getEquippedEmblem } from '../EquippedEmblem';
import { getTimeSinceLastConnection } from '../LastConexion';
import { fetchCharacterIds } from '../RecentActivity';
import Spinner from '../Spinner';
import ReportLinks from './ReportLinks';

function MemberDetail() {
    const { membershipType, membershipId } = useParams();
    const [memberDetail, setMemberDetail] = useState(null);
    const [userMemberships, setUserMemberships] = useState(null);
    const [emblemIndicators, setEmblemIndicators] = useState(null);
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
                <div style={{ backgroundImage: `url(/api${emblemBackgroundPath})`, backgroundSize: 'contain', backgroundRepeat: 'no-repeat' }} className='w-3/4 p-2 px-20 text-white flex'>
                    <div className='ml-1 items-center'>
                        <h2 className='text-2xl'>{userMemberships.bungieNetUser.displayName}</h2>
                        <h1 className='text-xl'>{memberDetail.profile.data.currentGuardianRank} {guardianRank}</h1>
                        <h1 className='font-light tracking-wider text-slate-200'>BRODAS</h1>
                    </div>
                    <div>
                        <h1 className='ml-52 text-4xl font-[500] text-yellow-200'>{currentLight}</h1>
                        <p>{emblemIndicators}</p>
                    </div>
                </div>
            )}
            <div className='w-3/4 text-start'>
                <h2 className='italic text-gray-400 tracking-wide text-large'>{activity}</h2>
                <ReportLinks type={membershipType} id={membershipId} nombre={userMemberships?.bungieNetUser?.uniqueName} />
            </div>
        </div>
    );
}

export default MemberDetail;