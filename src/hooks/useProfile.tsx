import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { getAuthToken } from '@/lib/auth';
import { apiService } from '@/lib/api';

interface ProfileData {
    _id: string;
    fullName: string;
    username: string;
    mobileNumber: string;
    referCode: string;
    referredBy: string | null;
    kycStatus: 'pending' | 'verified' | 'rejected';
    gamesPlayed: number;
    earning: number;
    referralEarning: number;
    penalty: number;
    isActive: boolean;
}

export const useProfile = () => {
    const { isAuthenticated } = useAuth();
    const [profile, setProfile] = useState<ProfileData | null>(null);
    const [loading, setLoading] = useState(false);

    const fetchProfile = async () => {
        if (!isAuthenticated) return;

        setLoading(true);
        try {
            const token = getAuthToken();
            if (!token) return;

            const response = await apiService.getProfile(token);
            if (response.success && response.data) {
                setProfile(response.data as ProfileData);
            }
        } catch (error) {
            console.error('Failed to fetch profile:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchProfile();
    }, [isAuthenticated]);

    return { profile, loading, refetch: fetchProfile };
};
