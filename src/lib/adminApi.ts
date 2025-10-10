// Use environment variable or fallback to localhost
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

interface ApiResponse<T = any> {
    success: boolean;
    message: string;
    data?: T;
}

interface WithdrawalData {
    transactionId: string;
    user: {
        id: string;
        fullName: string;
        username: string;
        mobileNumber: string;
    };
    amount: number;
    status: 'pending' | 'success' | 'cancelled';
    withdrawMethod: string;
    upiId?: string;
    bankAccountNumber?: string;
    description: string;
    createdAt: string;
    updatedAt: string;
}

interface DashboardStats {
    totalUsers: number;
    withdrawals: {
        pending: {
            count: number;
            amount: number;
        };
        success: number;
        cancelled: number;
    };
}

interface RoomData {
    _id: string;
    roomId: string;
    betAmount: number;
    status: 'pending' | 'live' | 'ended' | 'finished' | 'cancelled';
    createdBy: {
        _id: string;
        fullName: string;
        username: string;
        mobileNumber: string;
    };
    players: Array<{
        userId: {
            _id: string;
            fullName: string;
            username: string;
            mobileNumber: string;
        };
        ludoUsername: string;
        _id: string;
        joinedAt: string;
    }>;
    ludoRoomCode?: string;
    gameStartedAt?: string;
    gameEndedAt?: string;
    resultCheckedAt?: string | null;
    winner?: {
        userId: {
            _id: string;
            fullName: string;
            ludoUsername: string;
        };
        amountWon: number;
        netAmount: number;
    };
    totalPrizePool: number;
    serviceCharge: number;
    createdAt: string;
    updatedAt: string;
    __v: number;
}

interface DisputeData {
    disputeId: string;
    roomId: string;
    ludoRoomCode?: string;
    claimType: 'win' | 'loss';
    claimedBy: {
        id: string;
        fullName: string;
        username: string;
        mobileNumber: string;
    };
    ludoUsername: string;
    status: 'pending' | 'verified' | 'rejected';
    adminNotes?: string;
    verifiedBy?: {
        fullName: string;
        username: string;
    };
    createdAt: string;
    verifiedAt?: string;
}

class AdminApiService {
    private baseURL: string;

    constructor() {
        this.baseURL = API_URL;
    }

    private async request<T>(
        endpoint: string,
        token: string,
        options: RequestInit = {}
    ): Promise<ApiResponse<T>> {
        const url = `${this.baseURL}${endpoint}`;

        const config: RequestInit = {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
                ...options.headers,
            },
            ...options,
        };

        try {
            const response = await fetch(url, config);
            const data = await response.json();

            if (!response.ok) {
                const errorMessage = data.message || `Request failed with status ${response.status}`;
                throw new Error(errorMessage);
            }

            return data;
        } catch (error) {
            console.error('Admin API request failed:', {
                endpoint,
                error: error instanceof Error ? error.message : 'Unknown error'
            });
            throw error;
        }
    }

    // Get dashboard statistics
    async getDashboardStats(token: string): Promise<ApiResponse<DashboardStats>> {
        return this.request('/api/admin/dashboard', token, {
            method: 'GET',
        });
    }

    // Get all withdrawals
    async getAllWithdrawals(
        token: string,
        status?: 'pending' | 'success' | 'cancelled',
        page = 1,
        limit = 10
    ): Promise<ApiResponse<{
        withdrawals: WithdrawalData[];
        totalPages: number;
        currentPage: number;
        totalWithdrawals: number;
    }>> {
        const params = new URLSearchParams({
            page: page.toString(),
            limit: limit.toString(),
            ...(status && { status }),
        });

        return this.request(`/api/admin/withdrawals?${params}`, token, {
            method: 'GET',
        });
    }

    // Get withdrawal by ID
    async getWithdrawalById(
        token: string,
        transactionId: string
    ): Promise<ApiResponse<WithdrawalData>> {
        return this.request(`/api/admin/withdrawals/${transactionId}`, token, {
            method: 'GET',
        });
    }

    // Update withdrawal status
    async updateWithdrawalStatus(
        token: string,
        transactionId: string,
        status: 'pending' | 'success' | 'cancelled'
    ): Promise<ApiResponse<{
        transactionId: string;
        oldStatus: string;
        newStatus: string;
        amount: number;
        user: {
            fullName: string;
            mobileNumber: string;
        };
    }>> {
        return this.request(`/api/admin/withdrawals/${transactionId}/status`, token, {
            method: 'PUT',
            body: JSON.stringify({ status }),
        });
    }

    // Get all rooms
    async getAllRooms(
        token: string,
        status?: 'pending' | 'live' | 'ended' | 'finished' | 'cancelled',
        page = 1,
        limit = 10
    ): Promise<{
        success: boolean;
        data: RoomData[];
        totalPages: number;
        currentPage: number;
        totalRooms: number;
    }> {
        const params = new URLSearchParams({
            page: page.toString(),
            limit: limit.toString(),
            ...(status && { status }),
        });

        const url = `${this.baseURL}/api/admin/rooms?${params}`;

        const config: RequestInit = {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
            },
            method: 'GET',
        };

        try {
            const response = await fetch(url, config);
            const data = await response.json();

            if (!response.ok) {
                const errorMessage = data.message || `Request failed with status ${response.status}`;
                throw new Error(errorMessage);
            }

            // Backend returns: { success, data: [...], totalPages, currentPage, totalRooms }
            return {
                success: data.success,
                data: data.data || [],
                totalPages: data.totalPages || 1,
                currentPage: data.currentPage || page,
                totalRooms: data.totalRooms || 0
            };
        } catch (error) {
            console.error('Get all rooms error:', error);
            throw error;
        }
    }

    // Provide Ludo room code
    async provideRoomCode(
        token: string,
        roomId: string,
        ludoRoomCode: string
    ): Promise<ApiResponse<{
        roomId: string;
        ludoRoomCode: string;
    }>> {
        return this.request('/api/admin/provide-room-code', token, {
            method: 'POST',
            body: JSON.stringify({ roomId, ludoRoomCode }),
        });
    }

    // Declare winner
    async declareWinner(
        token: string,
        roomId: string,
        winnerUserId: string
    ): Promise<ApiResponse<{
        roomId: string;
        winner: {
            userId: string;
            fullName: string;
            ludoUsername: string;
            amountWon: number;
            netAmount: number;
        };
        serviceCharge: number;
        status: string;
    }>> {
        return this.request('/api/admin/declare-winner', token, {
            method: 'POST',
            body: JSON.stringify({ roomId, winnerUserId }),
        });
    }

    // Get all disputes
    async getAllDisputes(
        token: string,
        status?: 'pending' | 'verified' | 'rejected',
        page = 1,
        limit = 10
    ): Promise<ApiResponse<{
        disputes: DisputeData[];
        totalPages: number;
        currentPage: number;
        totalDisputes: number;
    }>> {
        const params = new URLSearchParams({
            page: page.toString(),
            limit: limit.toString(),
            ...(status && { status }),
        });

        return this.request(`/api/admin/disputes?${params}`, token, {
            method: 'GET',
        });
    }

    // Get dispute screenshot
    getDisputeScreenshotUrl(disputeId: string): string {
        return `${this.baseURL}/api/admin/disputes/${disputeId}/screenshot`;
    }

    // Resolve dispute
    async resolveDispute(
        token: string,
        roomId: string,
        winnerUserId: string,
        adminNotes?: string
    ): Promise<ApiResponse<{
        roomId: string;
        winner: {
            userId: string;
            fullName: string;
            ludoUsername: string;
            amountWon: number;
            netAmount: number;
        };
        serviceCharge: number;
        status: string;
    }>> {
        return this.request('/api/admin/resolve-dispute', token, {
            method: 'POST',
            body: JSON.stringify({ roomId, winnerUserId, adminNotes }),
        });
    }

    // Get all users
    async getAllUsers(token: string): Promise<ApiResponse<Array<{
        _id: string;
        fullName: string;
        username: string;
        mobileNumber: string;
    }>>> {
        return this.request('/api/admin/users', token, {
            method: 'GET',
        });
    }

    // Get all users with wallet information
    async getAllUsersWithWallet(
        token: string,
        page = 1,
        limit = 10,
        search?: string
    ): Promise<ApiResponse<{
        users: Array<{
            _id: string;
            fullName: string;
            username: string;
            mobileNumber: string;
            wallet: {
                depositBalance: number;
                winningBalance: number;
                totalBalance: number;
            };
        }>;
        totalPages: number;
        currentPage: number;
        totalUsers: number;
    }>> {
        const params = new URLSearchParams({
            page: page.toString(),
            limit: limit.toString(),
            ...(search && { search }),
        });

        return this.request(`/api/admin/users-with-wallet?${params}`, token, {
            method: 'GET',
        });
    }

    // Add deposit funds to user
    async addDepositFundsToUser(
        token: string,
        userId: string,
        amount: number
    ): Promise<ApiResponse<{
        userId: string;
        newDepositBalance: number;
        newTotalBalance: number;
    }>> {
        return this.request('/api/admin/add-deposit-funds', token, {
            method: 'POST',
            body: JSON.stringify({ userId, amount }),
        });
    }

    // Update user balance (deduct or set to zero)
    async updateUserBalance(
        token: string,
        userId: string,
        depositDeductAmount?: number,
        winningDeductAmount?: number,
        setDepositToZero?: boolean,
        setWinningToZero?: boolean
    ): Promise<ApiResponse<{
        userId: string;
        newDepositBalance: number;
        newWinningBalance: number;
        newTotalBalance: number;
        changes: Array<{
            type: 'deposit' | 'winning';
            action: 'deduction' | 'set_to_zero';
            amount: number;
        }>;
    }>> {
        return this.request('/api/admin/update-user-balance', token, {
            method: 'POST',
            body: JSON.stringify({
                userId,
                depositDeductAmount,
                winningDeductAmount,
                setDepositToZero,
                setWinningToZero
            }),
        });
    }

    // Admin cancel room
    async adminCancelRoom(
        token: string,
        roomId: string,
        reason?: string
    ): Promise<ApiResponse<{
        roomId: string;
        refundedPlayers: Array<{
            userId: string;
            amount: number;
        }>;
        cancellationReason: string;
    }>> {
        return this.request(`/api/admin/rooms/${roomId}`, token, {
            method: 'DELETE',
            body: JSON.stringify({ reason }),
        });
    }

    // Update room status
    async updateRoomStatus(
        token: string,
        roomId: string,
        newStatus: 'pending' | 'live' | 'ended' | 'finished' | 'cancelled'
    ): Promise<ApiResponse<{
        roomId: string;
        newStatus: string;
        gameStartedAt?: string;
        gameEndedAt?: string;
    }>> {
        return this.request(`/api/admin/rooms/${roomId}/status`, token, {
            method: 'PUT',
            body: JSON.stringify({ newStatus }),
        });
    }
}

export const adminApiService = new AdminApiService();
