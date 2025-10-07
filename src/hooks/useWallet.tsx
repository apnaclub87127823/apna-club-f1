import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { getAuthToken } from '@/lib/auth';
import { apiService } from '@/lib/api';

interface WalletData {
    totalBalance: number;
    depositBalance: number;
    winningBalance: number;
}

export const useWallet = () => {
    const { isAuthenticated } = useAuth();
    const [wallet, setWallet] = useState<WalletData>({
        totalBalance: 0,
        depositBalance: 0,
        winningBalance: 0,
    });
    const [loading, setLoading] = useState(false);

    const fetchWallet = async () => {
        if (!isAuthenticated) return;

        setLoading(true);
        try {
            const token = getAuthToken();
            if (!token) return;

            const response = await apiService.getWallet(token);
            if (response.success && response.data) {
                setWallet(response.data as WalletData);
            }
        } catch (error) {
            console.error('Failed to fetch wallet:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchWallet();
    }, [isAuthenticated]);

    return { wallet, loading, refetch: fetchWallet };
};