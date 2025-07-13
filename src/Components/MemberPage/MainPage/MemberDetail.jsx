import { useEffect, useState } from 'react';
import { useLocation, useParams } from 'react-router-dom';
import arrowLeft from '../../../assets/arrow-left-solid.svg';
import copy from '../../../assets/copiar-archivo.png';
import { API_CONFIG } from '../../../config';
import '../../../index.css';
import { useBungieAPI } from '../../APIservices/BungieAPIcache';
import { getTimeSinceLastConnection } from '../../LastConexion';
import Spinner from '../../Spinner';
import '../../Tabla.css';
import Commendations from '../Commendations/Commendations';
import CurrentActivity from '../CurrentActivity/CurrentActivity';
import FavouriteActivity from '../FavActivity/FavouriteActivity';
import FavouriteWeapons from '../FavWeapons/FavouriteWeapons';
import ActivityHistory from '../History/ActivityHistory';
import SimpleLoadout from '../Lodaut/SimpleLodaut';
import ClanTeammates from '../Teammates/ClanTeamates';
import TriumphScore from '../TriumphScore/TriumphScore';
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
    const [classImg, setClassImg] = useState(null);
    const [copied, setCopied] = useState(false);
    const { getClanMembers, getCompsProfile, getUserMembershipsById, getItemManifest, getCompChars } = useBungieAPI();

    useEffect(() => {
        const fetchData = async () => {
            const response = await getClanMembers();
            response.forEach((member) => {
                if (member.destinyUserInfo.membershipId === membershipId) {
                    setMember(member);
                }
            })
        };

        fetchData();
    }, [location.search]);

    const handleCopy = () => {
        navigator.clipboard.writeText(userMemberships?.bungieNetUser?.uniqueName || '');
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    useEffect(() => {
        const fetchMemberDetail = async () => {
            try {
                const responseProfile = await getCompsProfile(membershipType, membershipId);
                const membershipsResponse = await getUserMembershipsById(membershipId, membershipType);
                const RankNum = responseProfile.profile.data.currentGuardianRank;
                const guardianRankResponse = await getItemManifest(RankNum, "DestinyGuardianRankDefinition");
                const responselight = await getCompChars(membershipType, membershipId);

                const mostRecentCharacter = Object.values(responselight).reduce((latest, current) => {
                    return new Date(current.dateLastPlayed) > new Date(latest.dateLastPlayed) ? current : latest;
                });

                setMemberDetail(responseProfile);
                setUserMemberships(membershipsResponse);
                setGuardianRank(guardianRankResponse);
                setCurrentLight(mostRecentCharacter.light);
                setEmblem(mostRecentCharacter.emblemBackgroundPath);
                const clase = mostRecentCharacter.classType;

                switch (clase) {
                    case 2: setClassImg({
                        link: `${API_CONFIG.BUNGIE_API}/common/destiny2_content/icons/571dd4d71022cbef932b9be873d431a9.png`,
                        colore: "brightness(0) saturate(100%) invert(82%) sepia(14%) saturate(5494%) hue-rotate(341deg) brightness(105%) contrast(98%)"
                    })
                        break;
                    case 0: setClassImg({
                        link: `${API_CONFIG.BUNGIE_API}/common/destiny2_content/icons/707adc0d9b7b1fb858c16db7895d80cf.png`,
                        colore: "brightness(0) saturate(100%) invert(21%) sepia(52%) saturate(4147%) hue-rotate(335deg) brightness(83%) contrast(111%)"
                    })
                        break;
                    case 1: setClassImg({
                        link: `${API_CONFIG.BUNGIE_API}/common/destiny2_content/icons/9bb43f897531bb6395bfefc82f2ec267.png`,
                        colore: "brightness(0) saturate(100%) invert(24%) sepia(29%) saturate(5580%) hue-rotate(199deg) brightness(95%) contrast(95%)"
                    })
                        break;
                }

                if (member?.isOnline) {
                    setActivity("");
                } else {
                    setActivity("Última conexión hace " + getTimeSinceLastConnection(member?.lastOnlineStatusChange, member?.isOnline));
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
                    <img src={arrowLeft} className='w-4 h-4 inline-block mr-2' />
                    Volver al inicio
                </a>
            </button>
            <div className='flex flex-col mt-10 font-Inter w-full'>
                <div className='flex items-center min-w-[26%] w-fit justify-between ml-30'>
                    <div className='flex items-center'>
                        <img src={`${classImg.link}`} className={`w-10 h-10 mr-2`} style={{ filter: `${classImg.colore}`, marginLeft: '-3px' }} />
                        <h1 className='text-4xl font-bold text-gray-700 mr-0.5'>
                            {userMemberships?.bungieNetUser?.uniqueName?.slice(0, -5)}
                            <span style={{ color: '#479ce4' }}>
                                {userMemberships?.bungieNetUser?.uniqueName?.slice(-5)}
                            </span>
                        </h1>
                        <div className='mr-10 relative flex w-fit'>
                            <img src={copy} style={{ width: "10px", position: 'relative', top: '-0.50rem', cursor: "pointer" }} onClick={handleCopy} title='Copiar nombre' />
                            <div className={`absolute left-2 -translate-y-[10px] z-10 bg-green-500 text-white p-0.5 rounded transition-opacity duration-500 ease-in-out -translate-y-4 w-fit ${copied ? 'opacity-100' : 'opacity-0'}`} style={{ fontSize: '0.6rem', top: "-10px" }}>
                                ¡Copiado!
                            </div>
                        </div>
                    </div>
                    <div className="flex-shrink-0">
                        <ReportLinks type={membershipType} id={membershipId} nombre={userMemberships?.bungieNetUser?.uniqueName} />
                    </div>
                </div>
                <div className='flex w-full space-x-6 mr-0 justify-center'>
                    <div className='w-[26%] space-y-6'>
                        {memberDetail && userMemberships && (
                            <div style={{ backgroundImage: `url(${API_CONFIG.BUNGIE_API}${emblemBackgroundPath})`, backgroundSize: 'cover', backgroundRepeat: 'no-repeat' }} className='p-2 pl-24 text-white flex justify-between'>
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
                        <TriumphScore userId={membershipId} membershipType={membershipType} />
                        <Commendations userId={membershipId} membershipType={membershipType} />
                        <SimpleLoadout userId={membershipId} membershipType={membershipType} name={userMemberships.bungieNetUser.displayName} seasonHash={memberDetail.profile.data.currentSeasonHash} rank={guardianRank.rankNumber} light={currentLight} />
                        <FavouriteWeapons userId={membershipId} membershipType={membershipType} />
                    </div>
                    <div className='w-[60%] space-y-6'>
                        <div className='flex items-center'>
                            <div className='flex space-x-6 w-full'>
                            <div className='space-y-6 w-full'>
                                <CurrentActivity type={membershipType} id={membershipId} isOnline={member?.isOnline} />
                                <ClanTeammates userId={membershipId} membershipType={membershipType} />
                            </div>
                            <div className='w-full'>
                                <FavouriteActivity userId={membershipId} membershipType={membershipType} />
                            </div>
                            </div>
                        </div>
                        <ActivityHistory userId={membershipId} membershipType={membershipType} />
                    </div>
                </div>
            </div>
        </div>
    );
}

export default MemberDetail;