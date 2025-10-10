// Use environment variable or fallback to localhost
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

interface ApiResponse<T = any> {
    success: boolean;
    message: string;
    data?: T;
    token?: string;
    user?: any;
    mobileNumber?: string;
}

interface DepositResponse {
    paymentUrl: string;
    orderId: string;
    localTransactionId: string;
}

interface ZapupiStatusResponse {
    status: 'success' | 'pending' | 'failed';
    amount?: number;
    transactionId: string;
    zapupiTxnId?: string;
    newBalance?: number;
}

class ApiService {
    private baseURL: string;

    constructor() {
        this.baseURL = API_URL;
    }

    private async request<T>(
        endpoint: string,
        options: RequestInit = {}
    ): Promise<ApiResponse<T>> {
        const url = `${this.baseURL}${endpoint}`;

        console.log('API Request:', {
            url,
            method: options.method || 'GET',
            hasBody: !!options.body
        });

        const config: RequestInit = {
            headers: {
                'Content-Type': 'application/json',
                ...options.headers,
            },
            ...options,
        };

        try {
            const response = await fetch(url, config);
            console.log('API Response Status:', response.status, response.statusText);

            const data = await response.json();
            console.log('API Response Data:', data);

            if (!response.ok) {
                const errorMessage = data.message || `Request failed with status ${response.status}`;
                console.error('API Error:', errorMessage);
                throw new Error(errorMessage);
            }

            return data;
        } catch (error) {
            console.error('API request failed:', {
                endpoint,
                error: error instanceof Error ? error.message : 'Unknown error'
            });
            throw error;
        }
    }

    // Auth endpoints
    async signup(fullName: string, mobileNumber: string, referCode?: string) {
        return this.request('/api/auth/signup', {
            method: 'POST',
            body: JSON.stringify({
                fullName,
                mobileNumber,
                referCode: referCode || undefined
            }),
        });
    }

    async verifySignupOTP(mobileNumber: string, otp: string) {
        return this.request('/api/auth/verify-signup', {
            method: 'POST',
            body: JSON.stringify({
                mobileNumber,
                otp,
            }),
        });
    }

    async login(mobileNumber: string) {
        return this.request('/api/auth/login', {
            method: 'POST',
            body: JSON.stringify({
                mobileNumber,
            }),
        });
    }

    async verifyLoginOTP(mobileNumber: string, otp: string) {
        return this.request('/api/auth/verify-login', {
            method: 'POST',
            body: JSON.stringify({
                mobileNumber,
                otp,
            }),
        });
    }

    // Profile endpoints
    async getProfile(token: string) {
        return this.request('/api/profile', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
            },
        });
    }

    async updateProfile(token: string, data: any) {
        console.log('Update profile request:', {
            url: `${this.baseURL}/api/profile`,
            token: token.substring(0, 20) + '...',
            body: data
        });

        return this.request('/api/profile', {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
        });
    }

    // Wallet endpoints
    async getWallet(token: string) {
        return this.request('/api/wallet', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
            },
        });
    }

    async deposit(token: string, amount: number): Promise<ApiResponse<DepositResponse>> {
        console.log('Deposit request:', {
            url: `${this.baseURL}/api/wallet/deposit`,
            token: token.substring(0, 20) + '...',
            body: { amount }
        });

        return this.request<DepositResponse>('/api/wallet/deposit', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ amount }),
        });
    }

    async withdraw(token: string, amount: number, type: 'upi' | 'bank', upiId?: string, bankAccountNumber?: string) {
        const body: any = {
            amount,
            type,
        };

        if (type === 'upi' && upiId) {
            body.upiId = upiId;
        } else if (type === 'bank' && bankAccountNumber) {
            body.bankAccountNumber = bankAccountNumber;
        }

        console.log('Withdraw request:', {
            url: `${this.baseURL}/api/wallet/withdraw`,
            token: token.substring(0, 20) + '...',
            body
        });

        return this.request('/api/wallet/withdraw', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(body),
        });
    }

    async getTransactionHistory(token: string, page = 1, limit = 10, type?: string) {
        const params = new URLSearchParams({
            page: page.toString(),
            limit: limit.toString(),
            ...(type && { type }),
        });
        return this.request(`/api/wallet/history?${params}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
            },
        });
    }

    async checkZapupiStatus(token: string, zapupiOrderId: string): Promise<ApiResponse<ZapupiStatusResponse>> {
        console.log('Check Zapupi status request:', {
            url: `${this.baseURL}/api/wallet/check-zapupi-status`,
            token: token.substring(0, 20) + '...',
            body: { zapupiOrderId }
        });

        return this.request<ZapupiStatusResponse>('/api/wallet/check-zapupi-status', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ zapupiOrderId }),
        });
    }

    // Game Room endpoints
    async createRoom(token: string, betAmount: number, ludoUsername: string, ludoRoomCode: string) {
        console.log('Create room request:', {
            url: `${this.baseURL}/api/game/create-room`,
            token: token.substring(0, 20) + '...',
            body: { betAmount, ludoUsername, ludoRoomCode }
        });

        return this.request('/api/game/create-room', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ betAmount, ludoUsername, ludoRoomCode }),
        });
    }

    async joinRoom(token: string, roomId: string, ludoUsername: string) {
        console.log('Join room request:', {
            url: `${this.baseURL}/api/game/join-room`,
            token: token.substring(0, 20) + '...',
            body: { roomId, ludoUsername }
        });

        return this.request('/api/game/join-room', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ roomId, ludoUsername }),
        });
    }

    async getRoomCode(token: string, roomId: string) {
        return this.request(`/api/game/room-code/${roomId}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
            },
        });
    }

    async getLudoRoomCode(token: string, roomId: string) {
        return this.request(`/api/game/ludo-room-code/${roomId}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
            },
        });
    }

    async getRoomDetails(token: string, status?: string) {
        // Use my-rooms endpoint to get detailed room information with player status
        const params = status ? `?status=${status}` : '';
        return this.request(`/api/game/my-rooms${params}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
            },
        });
    }

    async saveLudoRoomCode(token: string, roomId: string, ludoRoomCode: string) {
        return this.request('/api/game/save-ludo-room-code', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ roomId, ludoRoomCode }),
        });
    }

    async getUserRooms(token: string, status?: string) {
        const params = status ? `?status=${status}` : '';
        return this.request(`/api/game/my-rooms${params}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
            },
        });
    }

    async getAllRooms(token: string, status?: string, page = 1, limit = 10) {
        const params = new URLSearchParams({
            page: page.toString(),
            limit: limit.toString(),
            ...(status && { status }),
        });
        return this.request(`/api/game/rooms?${params}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
            },
        });
    }

    async checkRoomResult(token: string, roomId: string) {
        console.log('Check room result request:', {
            url: `${this.baseURL}/api/game/check-result`,
            token: token.substring(0, 20) + '...',
            body: { roomId }
        });

        return this.request('/api/game/check-result', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ roomId }),
        });
    }

    async claimRoomResult(token: string, roomId: string, ludoUsername: string, claimType: 'win' | 'loss', screenshot?: File) {
        console.log('Claim room result request:', {
            url: `${this.baseURL}/api/game/claim-result`,
            token: token.substring(0, 20) + '...',
            claimType,
            hasScreenshot: !!screenshot,
            screenshotSize: screenshot?.size,
            screenshotType: screenshot?.type
        });

        const formData = new FormData();
        formData.append('roomId', roomId);
        formData.append('ludoUsername', ludoUsername);
        formData.append('claimType', claimType);

        if (screenshot) {
            formData.append('screenshot', screenshot, screenshot.name);
            console.log('Screenshot appended:', {
                name: screenshot.name,
                size: screenshot.size,
                type: screenshot.type
            });
        }

        const url = `${this.baseURL}/api/game/claim-result`;

        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    // DO NOT set Content-Type - browser will set it with boundary for multipart/form-data
                },
                body: formData,
            });

            console.log('Claim result response status:', response.status);

            const data = await response.json();
            console.log('Claim result response data:', data);

            if (!response.ok) {
                throw new Error(data.message || 'Failed to claim result');
            }

            return data;
        } catch (error) {
            console.error('Claim result error:', error);
            throw error;
        }
    }

    async handleJoinRequest(token: string, roomId: string, userId: string, action: 'approve' | 'reject') {
        console.log('Handle join request:', {
            url: `${this.baseURL}/api/game/handle-join-request`,
            token: token.substring(0, 20) + '...',
            body: { roomId, userId, action }
        });

        return this.request('/api/game/handle-join-request', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ roomId, userId, action }),
        });
    }

    async getPendingRequests(token: string) {
        return this.request('/api/game/pending-requests', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
            },
        });
    }

    async getFinishedGames(token: string) {
        return this.request('/api/game/finished-games', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
            },
        });
    }

    async cancelRoom(token: string, roomId: string, reason?: string) {
        console.log('Cancel room request:', {
            url: `${this.baseURL}/api/game/cancel-room/${roomId}`,
            token: token.substring(0, 20) + '...',
            reason
        });

        return this.request(`/api/game/cancel-room/${roomId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
            body: reason ? JSON.stringify({ reason }) : undefined,
        });
    }

    async requestMutualCancellation(token: string, roomId: string) {
        console.log('Request mutual cancellation:', {
            url: `${this.baseURL}/api/game/request-mutual-cancellation`,
            token: token.substring(0, 20) + '...',
            roomId
        });

        return this.request('/api/game/request-mutual-cancellation', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ roomId }),
        });
    }
}

export const apiService = new ApiService();