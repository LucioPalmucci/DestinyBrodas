import axios from 'axios';
import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';

function MemberDetail() {
    const { membershipId } = useParams();
    const [memberDetail, setMemberDetail] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchMemberDetail = async () => {
            try {
                const response = await axios.get(`/api/Platform/Destiny2/Account/${membershipId}/Stats/`, {
                    headers: {
                        'X-API-Key': 'f83a251bf2274914ab739f4781b5e710',
                    },
                });
                setMemberDetail(response.data.Response);
            } catch (error) {
                console.error('Error fetching member details:', error);
                setError('Error fetching member details.');
            } finally {
                setLoading(false);
            }
        };
        fetchMemberDetail();
    }, [membershipId]);

    if (loading) {
        return <div>Loading...</div>;
    }

    if (error) {
        return <div>{error}</div>;
    }

    return (
        <div>
            <h1>Member Details</h1>
            {/* Renderiza los detalles del miembro aquí */}
            <pre>{JSON.stringify(memberDetail, null, 2)}</pre>
        </div>
    );
}

export default MemberDetail;