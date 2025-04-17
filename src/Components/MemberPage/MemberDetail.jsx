import axios from 'axios';
import React, { useEffect, useState } from 'react';
import { useLocation, useParams } from 'react-router-dom';
import arrowLeft from '../../assets/arrow-left-solid.svg';
import '../../index.css';
import { getEquippedEmblem } from '../EquippedEmblem';
import { getTimeSinceLastConnection } from '../LastConexion';
import { fetchCharacterIds } from '../RecentActivity';
import Spinner from '../Spinner';
import '../Tabla.css';
import ActivityHistory from './ActivityHistory';
import CurrentActivity from './CurrentActivity';
import CurrentLodaout from './CurrentLoadout';
import FavouriteWeapons from './FavouriteWeapons';
import ReportLinks from './ReportLinks';
import ReputationStatus from './ReputationStatus';
import TriumphScore from './TriumphScore';
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
    const [classImg, setClassImg] = useState(null);

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
                console.log(responseProfile.data.Response)
                setMemberDetail(responseProfile.data.Response);
                setUserMemberships(membershipsResponse.data.Response);
                setGuardianRank(guardianRankResponse.data.Response);
                setCurrentLight(await getEquippedEmblem(member, "CharacterPower"));
                setEmblem(await getEquippedEmblem(member, "Large"));
                const clase = await getEquippedEmblem(member, "CharacterClass");

                switch (clase) {
                    case 2: setClassImg({
                        link: "/api/common/destiny2_content/icons/571dd4d71022cbef932b9be873d431a9.png",
                        colore: "brightness(0) saturate(100%) invert(82%) sepia(14%) saturate(5494%) hue-rotate(341deg) brightness(105%) contrast(98%)"
                    })
                        break;
                    case 0: setClassImg({
                        link: "/api/common/destiny2_content/icons/707adc0d9b7b1fb858c16db7895d80cf.png",
                        colore: "brightness(0) saturate(100%) invert(21%) sepia(52%) saturate(4147%) hue-rotate(335deg) brightness(83%) contrast(111%)"
                    })
                        break;
                    case 1: setClassImg({
                        link: "/api/common/destiny2_content/icons/9bb43f897531bb6395bfefc82f2ec267.png",
                        colore: "brightness(0) saturate(100%) invert(24%) sepia(29%) saturate(5580%) hue-rotate(199deg) brightness(95%) contrast(95%)"
                    })
                        break;
                }

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
        <div>
            <button className='bg-gray-300 hover:bg-gray-400 font-bold py-2 px-4 rounded mt-4 ml-4 '>
                <a href='/DestinyBrodas/' className='items-center flex'>
                    <img src={arrowLeft} className='w-4 h-4 inline-block mr-2'  />
                    Volver al inicio
                </a>
            </button>
            <div className='justify-start flex mt-10 font-Inter items-center flex-col w-3/4'>
                <div className='w-3/4 text-start'>
                    <div className='flex space-x-4 items-center mb-1'>
                        <img src={`${classImg.link}`} className={`w-10 h-10 mr-2`} style={{ filter: `${classImg.colore}`, marginLeft: '-3px' }} />
                        <h1 className='text-4xl font-bold text-gray-700 mr-8'>{userMemberships?.bungieNetUser?.uniqueName}</h1>
                        <ReportLinks type={membershipType} id={membershipId} nombre={userMemberships?.bungieNetUser?.uniqueName} />
                    </div>
                    {memberDetail && userMemberships && (
                        <div style={{ backgroundImage: `url(/api${emblemBackgroundPath})`, backgroundSize: 'contain', backgroundRepeat: 'no-repeat' }} className='p-2 pl-24 text-white flex justify-between w-1/2'>
                            <div className='ml-1 items-center'>
                                <h2 className='text-2xl font-large tracking-wide' style={{ textShadow: "0px 1px 2px rgba(37, 37, 37, 0.4)" }}>{userMemberships.bungieNetUser.displayName}</h2>
                                <h1 className='text-xl text-neutral-100 opacity-75 flex items-center' style={{ textShadow: "0px 1px 2px rgba(37, 37, 37, 0.4)" }}>
                                    <img src={`${import.meta.env.BASE_URL}/levels/${memberDetail.profile.data.currentGuardianRank}.fw.png`} className='w-6 h-6 mr-1' />{guardianRank.displayProperties.name}
                                </h1>
                                <h1 className='font-extralight tracking-wide text-gray-200 text-xl opacity-50'>BRODAS</h1>
                            </div>
                            <div>
                                <h1 className='text-4xl lightlevel' style={{ color: "#E5D163", textShadow: "0px 3px 3px rgba(37, 37, 37, 0.4)" }}>
                                    <i className="icon-light mr-1" style={{ fontStyle: 'normal', fontSize: '2.2rem', position: 'relative', top: '-0.40rem' }} />{currentLight}
                                </h1>
                                <p>{emblemIndicators}</p>
                            </div>
                        </div>
                    )}
                    <CurrentLodaout userId={membershipId} membershipType={membershipType} name={userMemberships.bungieNetUser.displayName} seasonHash={memberDetail.profile.data.currentSeasonHash} rank={guardianRank.rankNumber} light={currentLight} />
                </div>

                <div className='w-3/4 text-start'>
                    <div>
                        <div className='flex'>
                            <CurrentActivity type={membershipType} id={membershipId} />
                            <ReputationStatus userId={membershipId} membershipType={membershipType} />
                        </div>
                        <FavouriteWeapons userId={membershipId} membershipType={membershipType} />
                        <ActivityHistory userId={membershipId} membershipType={membershipType} />
                    </div>
                    <div>
                        <TriumphScore userId={membershipId} membershipType={membershipType} />
                    </div>
                </div>
            </div>
        </div>
    );
}

export default MemberDetail;