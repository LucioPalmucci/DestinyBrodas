import axios from 'axios';
import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { getEquippedEmblem } from '../EquippedEmblem';
import Spinner from '../Spinner';
import ReportLinks from './ReportLinks';


function MemberDetail() {
    const { membershipType, membershipId } = useParams();
    const [memberDetail, setMemberDetail] = useState(null);
    const [userMemberships, setUserMemberships] = useState(null);
    const [emblemIndicators, setEmblemIndicators] = useState(null);
    const [currentLight, setCurrentLight] = useState(null);
    const [guardianRank, setGuardianRank] = useState(null);
    const [emblemBackgroundPath, setEmblem] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchMemberDetail = async () => {
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

                console.log("membershipsResponse:", membershipsResponse.data.Response);
                console.log("responseProfile:", responseProfile.data.Response);
                setMemberDetail(responseProfile.data.Response);
                setUserMemberships(membershipsResponse.data.Response);

                const RankNum = responseProfile.data.Response.profile.data.currentGuardianRank;
                const guardianRankResponse = await axios.get(`/api/Platform/Destiny2/Manifest/DestinyGuardianRankDefinition/${RankNum}/?lc=es`, {
                    headers: {
                        'X-API-Key': 'f83a251bf2274914ab739f4781b5e710',
                    },
                });
                setGuardianRank(guardianRankResponse.data.Response.displayProperties.name);

                const member = {
                    destinyUserInfo: {
                        membershipType: membershipType,
                        membershipId: membershipId,
                    }
                };
                setCurrentLight(await getEquippedEmblem(member, "CharacterPower"));
                setEmblem(await getEquippedEmblem(member, "Large"));
                console.log("Emblem:", emblemBackgroundPath);

                const emblemResponse = await axios.get(`/api/Platform/Destiny2/${membershipType}/Profile/${membershipId}/?components=200`, {
                    headers: {
                        'X-API-Key': 'f83a251bf2274914ab739f4781b5e710',
                    },
                });
                console.log("emblemResponse:", emblemResponse.data.Response);

            } catch (error) {
                console.error('Error fetching member details:', error);
                setError('Error fetching member details.');
            } finally {
                setLoading(false);
            }
        };
        fetchMemberDetail();
    }, [membershipId, membershipType]);

    if (loading) {
        return <Spinner />;
    }

    if (error) {
        return <div>{error}</div>;
    }

    return (
        <div className='justify-center flex mt-20 font-Inter items-center flex-col'>
            <h1 className='text-4xl font-bold text-gray-700 w-3/4 mb-10'>{userMemberships.bungieNetUser.uniqueName}</h1>
            {memberDetail && userMemberships && (
                <div style={{ backgroundImage: `url(/api${emblemBackgroundPath})`, backgroundSize: 'contain', backgroundRepeat: 'no-repeat' }} className='w-3/4 p-2 px-20 text-white flex'>
                    <div className='items-center'>
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
                <ReportLinks type={membershipType} id={membershipId} nombre={userMemberships.bungieNetUser.uniqueName} />
            </div>
        </div>
    );
}

export default MemberDetail;