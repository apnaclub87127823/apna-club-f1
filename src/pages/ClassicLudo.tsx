import React, { useState, useEffect } from 'react';
import Header from '@/components/Header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { X } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { getAuthToken } from '@/lib/auth';
import { apiService } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { useWallet } from '@/hooks/useWallet';
import { useProfile } from '@/hooks/useProfile';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import vsIcon from '@/assets/vs-icon.png';
import moneyIcon from '@/assets/money-icon.png';
// APNA
interface Room {
    roomId: string;
    betAmount: number;
    status: string;
    playersCount: number;
    maxPlayers: number;
    createdBy: string;
    totalPrizePool: number;
    players?: Array<{
        fullName: string;
        ludoUsername: string;
        joinedAt: string;
    }>;
}

interface PendingRequest {
    roomId: string;
    betAmount: number;
    totalPrizePool: number;
    createdAt: string;
    pendingPlayers: Array<{
        userId: string;
        fullName: string;
        username: string;
        mobileNumber: string;
        ludoUsername: string;
        joinedAt: string;
    }>;
}

const ClassicLudo = () => {
    const { isAuthenticated } = useAuth();
    const { toast } = useToast();
    const { wallet, refetch: refetchWallet } = useWallet();
    const { profile } = useProfile();
    const [battleAmount, setBattleAmount] = useState('');
    const [ludoUsername, setLudoUsername] = useState('');
    const [ludoRoomCode, setLudoRoomCode] = useState('');
    const [openBattles, setOpenBattles] = useState<Room[]>([]);
    const [runningBattles, setRunningBattles] = useState<Room[]>([]);
    const [loading, setLoading] = useState(false);
    const [createLoading, setCreateLoading] = useState(false);
    const [showUsernameDialog, setShowUsernameDialog] = useState(false);
    const [showJoinDialog, setShowJoinDialog] = useState(false);
    const [tempBattleAmount, setTempBattleAmount] = useState('');
    const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
    const [userRoomIds, setUserRoomIds] = useState<string[]>([]);
    const [showWaitingDialog, setShowWaitingDialog] = useState(false);
    const [showRoomCodeDialog, setShowRoomCodeDialog] = useState(false);
    const [roomCode, setRoomCode] = useState<string>('');
    const [loadingRoomCode, setLoadingRoomCode] = useState<string | null>(null);
    const [loadingDeclareResult, setLoadingDeclareResult] = useState<string | null>(null);
    const [showClaimDialog, setShowClaimDialog] = useState(false);
    const [selectedClaimRoom, setSelectedClaimRoom] = useState<Room | null>(null);
    const [claimType, setClaimType] = useState<'win' | 'loss'>('win');
    const [claimUsername, setClaimUsername] = useState('');
    const [screenshot, setScreenshot] = useState<File | null>(null);
    const [claimLoading, setClaimLoading] = useState(false);
    const [pendingRequests, setPendingRequests] = useState<PendingRequest[]>([]);
    const [loadingApproval, setLoadingApproval] = useState<string | null>(null);
    const [cancellingRoom, setCancellingRoom] = useState<string | null>(null);
    const [myCreatedRooms, setMyCreatedRooms] = useState<string[]>([]);
    const [showCancelDialog, setShowCancelDialog] = useState(false);
    const [cancelReason, setCancelReason] = useState('');
    const [roomToCancel, setRoomToCancel] = useState<string | null>(null);

    // Fetch rooms on mount and periodically
    useEffect(() => {
        if (isAuthenticated) {
            fetchRooms();
            fetchUserRooms();
            fetchPendingRequests();
            const interval = setInterval(() => {
                fetchRooms();
                fetchUserRooms();
                fetchPendingRequests();
            }, 10000); // Refresh every 10 seconds
            return () => clearInterval(interval);
        }
    }, [isAuthenticated, profile?.fullName]); // Re-fetch when profile loads

    const fetchUserRooms = async () => {
        try {
            const token = getAuthToken();
            if (!token) return;

            const response = await apiService.getUserRooms(token);
            if (response.success && response.data) {
                const rooms = response.data as any[];
                setUserRoomIds(rooms.map(room => room.roomId));

                // Identify rooms created by current user
                // A room is created by user if they are the only player OR if createdBy matches their name
                const currentUserName = profile?.fullName?.trim().toLowerCase();
                const createdRooms = rooms
                    .filter(room => {
                        // Check if user is marked as creator in the room data
                        const isCreator = room.isCreator === true;
                        // Also check by name match if profile is loaded
                        const nameMatch = currentUserName &&
                            typeof room.createdBy === 'string' &&
                            room.createdBy.trim().toLowerCase() === currentUserName;
                        return isCreator || nameMatch;
                    })
                    .map(room => room.roomId);

                // Replace the entire array instead of merging to avoid stale data
                setMyCreatedRooms(createdRooms);
            }
        } catch (error) {
            console.error('Failed to fetch user rooms:', error);
        }
    };

    const fetchRooms = async () => {
        try {
            const token = getAuthToken();
            if (!token) return;

            // Fetch pending rooms (open battles)
            const pendingResponse = await apiService.getAllRooms(token, 'pending', 1, 20);
            if (pendingResponse.success && pendingResponse.data) {
                const data = pendingResponse.data as any;
                setOpenBattles(data.rooms || []);
            }

            // Fetch live rooms (running battles)
            const liveResponse = await apiService.getAllRooms(token, 'live', 1, 20);
            if (liveResponse.success && liveResponse.data) {
                const data = liveResponse.data as any;
                setRunningBattles(data.rooms || []);
            }
        } catch (error) {
            console.error('Failed to fetch rooms:', error);
        }
    };

    const handleCreateRoom = async () => {
        if (!isAuthenticated) {
            toast({
                title: "Authentication Required",
                description: "Please login to create a battle",
                variant: "destructive",
            });
            return;
        }

        const amount = parseInt(battleAmount);
        if (!amount || amount < 10) {
            toast({
                title: "Invalid Amount",
                description: "Bet amount must be at least ₹10",
                variant: "destructive",
            });
            return;
        }

        if (wallet.totalBalance < amount) {
            toast({
                title: "Insufficient Balance",
                description: "Please add money to your wallet first",
                variant: "destructive",
            });
            return;
        }

        // Store the amount, auto-fill username and show dialog
        setTempBattleAmount(battleAmount);
        setLudoUsername(profile?.fullName || '');
        setShowUsernameDialog(true);
    };

    const handleConfirmCreateRoom = async () => {
        if (!ludoUsername.trim()) {
            toast({
                title: "Username Required",
                description: "Please enter your Ludo King username",
                variant: "destructive",
            });
            return;
        }

        if (!ludoRoomCode.trim()) {
            toast({
                title: "Room Code Required",
                description: "Please enter Ludo King room code",
                variant: "destructive",
            });
            return;
        }

        setCreateLoading(true);
        try {
            const token = getAuthToken();
            if (!token) return;

            const amount = parseInt(tempBattleAmount);
            const response = await apiService.createRoom(token, amount, ludoUsername.trim(), ludoRoomCode.trim());
            if (response.success) {
                const data = response.data as any;

                // Track this room as created by current user
                if (data.roomId) {
                    setMyCreatedRooms(prev => Array.from(new Set([...(prev || []), data.roomId])));
                }

                toast({
                    title: "Battle Created",
                    description: `Room created successfully`,
                });
                setBattleAmount('');
                setLudoUsername('');
                setLudoRoomCode('');
                setShowUsernameDialog(false);
                await refetchWallet();
                await fetchRooms();
                await fetchUserRooms();
            }
        } catch (error: any) {
            toast({
                title: "Failed to Create Battle",
                description: error.message || "Something went wrong",
                variant: "destructive",
            });
        } finally {
            setCreateLoading(false);
        }
    };

    const handlePlayClick = (room: Room) => {
        if (!isAuthenticated) {
            toast({
                title: "Authentication Required",
                description: "Please login to join a battle",
                variant: "destructive",
            });
            return;
        }

        // Check if user already joined this room
        const isUserInRoom = userRoomIds.includes(room.roomId);
        if (isUserInRoom) {
            toast({
                title: "Already Joined",
                description: "You are already joined this room, waiting for other players to join this room",
            });
            return;
        }

        if (wallet.totalBalance < room.betAmount) {
            toast({
                title: "Insufficient Balance",
                description: "Please add money to your wallet first",
                variant: "destructive",
            });
            return;
        }

        setSelectedRoom(room);
        setLudoUsername(profile?.fullName || '');
        setShowJoinDialog(true);
    };

    const handleConfirmJoinRoom = async () => {
        if (!selectedRoom) return;

        if (!ludoUsername.trim()) {
            toast({
                title: "Username Required",
                description: "Please enter your Ludo King username",
                variant: "destructive",
            });
            return;
        }

        setLoading(true);
        try {
            const token = getAuthToken();
            if (!token) return;

            const response = await apiService.joinRoom(token, selectedRoom.roomId, ludoUsername.trim());
            if (response.success) {
                toast({
                    title: "Battle Joined",
                    description: `Successfully joined the battle`,
                });
                setLudoUsername('');
                setShowJoinDialog(false);
                setSelectedRoom(null);
                await refetchWallet();
                await fetchRooms();
                await fetchUserRooms();
            }
        } catch (error: any) {
            toast({
                title: "Failed to Join Battle",
                description: error.message || "Something went wrong",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    const handleGetRoomCode = async (roomId: string) => {
        setLoadingRoomCode(roomId);
        try {
            const token = getAuthToken();
            if (!token) return;

            const response = await apiService.getRoomCode(token, roomId);
            if (response.success && response.data) {
                const data = response.data as any;
                setRoomCode(data.ludoRoomCode || 'N/A');
                setShowRoomCodeDialog(true);
            }
        } catch (error: any) {
            toast({
                title: "Failed to Get Room Code",
                description: error.message || "Something went wrong",
                variant: "destructive",
            });
        } finally {
            setLoadingRoomCode(null);
        }
    };

    const handleDeclareResult = (room: Room) => {
        setSelectedClaimRoom(room);
        setClaimUsername(profile?.fullName || '');
        setClaimType('win');
        setScreenshot(null);
        setShowClaimDialog(true);
    };

    const handleConfirmClaimResult = async () => {
        if (!selectedClaimRoom) return;

        if (!claimUsername.trim()) {
            toast({
                title: "Username Required",
                description: "Please enter your Ludo King username",
                variant: "destructive",
            });
            return;
        }

        if (claimType === 'win' && !screenshot) {
            toast({
                title: "Screenshot Required",
                description: "Please upload a screenshot to claim win",
                variant: "destructive",
            });
            return;
        }

        setClaimLoading(true);
        try {
            const token = getAuthToken();
            if (!token) return;

            const response = await apiService.claimRoomResult(
                token,
                selectedClaimRoom.roomId,
                claimUsername.trim(),
                claimType,
                screenshot || undefined
            );

            if (response.success) {
                toast({
                    title: "Success",
                    description: response.message || "Result claimed successfully",
                });

                setShowClaimDialog(false);
                setSelectedClaimRoom(null);
                setClaimUsername('');
                setScreenshot(null);

                await refetchWallet();
                await fetchRooms();
                await fetchUserRooms();
            }
        } catch (error: any) {
            toast({
                title: "Error",
                description: error.message || "Failed to claim result",
                variant: "destructive",
            });
        } finally {
            setClaimLoading(false);
        }
    };

    const handleScreenshotChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (file.size > 5 * 1024 * 1024) { // 5MB limit
                toast({
                    title: "File Too Large",
                    description: "Screenshot must be less than 5MB",
                    variant: "destructive",
                });
                return;
            }
            setScreenshot(file);
        }
    };

    const fetchPendingRequests = async () => {
        try {
            const token = getAuthToken();
            if (!token) return;

            const response = await apiService.getPendingRequests(token);
            if (response.success && response.data) {
                setPendingRequests(response.data as PendingRequest[]);
            }
        } catch (error) {
            console.error('Failed to fetch pending requests:', error);
        }
    };

    const handleJoinRequestAction = async (roomId: string, userId: string, action: 'approve' | 'reject') => {
        setLoadingApproval(`${roomId}-${userId}-${action}`);
        try {
            const token = getAuthToken();
            if (!token) return;

            const response = await apiService.handleJoinRequest(token, roomId, userId, action);
            if (response.success) {
                toast({
                    title: action === 'approve' ? "Player Approved" : "Player Rejected",
                    description: response.message || `Player ${action}ed successfully`,
                });

                await fetchRooms();
                await fetchUserRooms();
                await fetchPendingRequests();
            }
        } catch (error: any) {
            toast({
                title: "Error",
                description: error.message || "Failed to process request",
                variant: "destructive",
            });
        } finally {
            setLoadingApproval(null);
        }
    };

    const handleCancelRoom = async (roomId: string, reason?: string) => {
        setCancellingRoom(roomId);
        try {
            const token = getAuthToken();
            if (!token) return;

            const response = await apiService.cancelRoom(token, roomId, reason);
            if (response.success) {
                // Remove from created rooms list
                setMyCreatedRooms(prev => prev.filter(id => id !== roomId));

                toast({
                    title: "Room Cancelled",
                    description: response.message || "Room cancelled successfully and amount refunded",
                });

                await fetchRooms();
                await fetchUserRooms();
                await fetchPendingRequests();
                await refetchWallet();
            }
        } catch (error: any) {
            toast({
                title: "Error",
                description: error.message || "Failed to cancel room",
                variant: "destructive",
            });
        } finally {
            setCancellingRoom(null);
            setShowCancelDialog(false);
            setCancelReason('');
            setRoomToCancel(null);
        }
    };

    return (
        <div className="min-h-screen bg-background">
            <Header isLoggedIn={isAuthenticated} showTermsButton={false} showScrollingBanners={false} />


            {/* Alert Banner */}
            <div className="max-w-lg mx-auto px-4 pt-4">
                <div className="bg-yellow-50 border-2 border-yellow-400 rounded-xl p-2 mb-2">
                    <div className="flex items-start text-xs text-yellow-800 leading-tight">
                        <div className="flex items-center gap-1 mr-2 flex-shrAPNA-0">
                            <span className="text-red-600">⚠️</span>
                            <span className="text-green-600">📞</span>
                        </div>
                        <div className="flex-1">
                            <span className="font-medium">Support Available on WhatsApp</span>
                            <span className="mx-1">🙏</span>
                            <span>आपके सहयोग के लिए धन्यवाद</span>
                            <span className="mx-1">🙏</span>
                            <span className="text-gray-600">...........................</span>
                            <span className="mx-1">🎮</span>
                            <span className="font-medium text-blue-700">Guest Rule</span>
                            <span className="mx-1">👉</span>
                            <span>यदि साइट पर रूम कोड देने के बाद Guest Join होता है, तो Real Players आने के बाद ही मैच शुरू करें।</span>
                            <span className="text-gray-600">............</span>
                            <span className="mx-1">✨</span>
                            <span className="font-medium">APNA Club के साथ जुड़े रहो और अपने दोस्तों को जोड़ो, आपको Best Service मिलेगी।</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-lg mx-auto px-4 py-2">
                {/* Classic Ludo Header */}
                <div className="text-center mb-6">
                    <div className="flex items-center justify-center mb-2">
                        <div className="h-px bg-gray-300 flex-1"></div>
                        <span className="px-4 text-gray-500 text-lg font-bold">🎲 classic ludo 🎲</span>
                        <div className="h-px bg-gray-300 flex-1"></div>
                    </div>
                </div>

                {/* Create Battle Section */}
                <div className="bg-white rounded-lg border border-gray-200 p-3 mb-4">
                    <h3 className="text-center text-gray-700 font-semibold mb-3">Create a Battle!</h3>
                    <div className="space-y-2">
                        <div className="flex gap-2">
                            <Input
                                placeholder="Amount (Min ₹10)"
                                type="number"
                                value={battleAmount}
                                onChange={(e) => setBattleAmount(e.target.value)}
                                className="flex-1 h-8"
                            />
                            <Button
                                onClick={handleCreateRoom}
                                disabled={createLoading}
                                className="bg-green-600 hover:bg-green-700 text-white px-6 h-8"
                            >
                                Set
                            </Button>
                        </div>
                        <div className="text-xs text-gray-600 text-center">
                            Balance: ₹{wallet.totalBalance.toFixed(2)}
                        </div>
                    </div>
                </div>

                {/* Create Username Dialog */}
                <Dialog open={showUsernameDialog} onOpenChange={setShowUsernameDialog}>
                    <DialogContent className="sm:max-w-md">
                        <DialogHeader>
                            <DialogTitle>Enter Ludo King Username</DialogTitle>
                            <DialogDescription className="space-y-2">
                                <p>Please enter your Ludo King username to create the battle.</p>
                                <p className="text-red-600 font-semibold text-sm">
                                    ⚠️ चेतावनी: यदि आप गलत यूजरनेम भरते हैं तो आपको जीत की राशि नहीं मिलेगी।
                                </p>
                                <p className="text-red-600 font-semibold text-sm">
                                    (Warning: If you enter wrong username, you will not receive winning money)
                                </p>
                            </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                            <Input
                                placeholder="Enter Ludo King Username"
                                value={ludoUsername}
                                onChange={(e) => setLudoUsername(e.target.value)}
                                className="w-full"
                                autoFocus
                            />
                            <Input
                                placeholder="Enter Ludo King Room Code"
                                value={ludoRoomCode}
                                onChange={(e) => setLudoRoomCode(e.target.value)}
                                className="w-full"
                            />
                            <div className="flex gap-2 justify-end">
                                <Button
                                    variant="outline"
                                    onClick={() => {
                                        setShowUsernameDialog(false);
                                        setLudoUsername('');
                                        setLudoRoomCode('');
                                    }}
                                    disabled={createLoading}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    onClick={handleConfirmCreateRoom}
                                    disabled={createLoading || !ludoUsername.trim() || !ludoRoomCode.trim()}
                                    className="bg-green-600 hover:bg-green-700 text-white"
                                >
                                    {createLoading ? 'Creating...' : 'Create Battle'}
                                </Button>
                            </div>
                        </div>
                    </DialogContent>
                </Dialog>

                {/* Waiting Dialog */}
                <Dialog open={showWaitingDialog} onOpenChange={setShowWaitingDialog}>
                    <DialogContent className="sm:max-w-md">
                        <DialogHeader>
                            <DialogTitle>Waiting for Other Player</DialogTitle>
                            <DialogDescription>
                                Please wait while another player joins the battle.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="flex justify-center py-4">
                            <div className="text-orange-600 font-semibold">
                                Waiting for other player to join...
                            </div>
                        </div>
                        <div className="flex justify-end">
                            <Button
                                variant="outline"
                                onClick={() => setShowWaitingDialog(false)}
                            >
                                Close
                            </Button>
                        </div>
                    </DialogContent>
                </Dialog>

                {/* Room Code Dialog */}
                <Dialog open={showRoomCodeDialog} onOpenChange={setShowRoomCodeDialog}>
                    <DialogContent className="sm:max-w-md">
                        <DialogHeader>
                            <DialogTitle>Ludo Room Code</DialogTitle>
                            <DialogDescription>
                                Use this code to join the game in Ludo King
                            </DialogDescription>
                        </DialogHeader>
                        <div className="flex justify-center py-4">
                            <div className="text-2xl font-bold text-green-600">
                                {roomCode}
                            </div>
                        </div>
                        <div className="flex justify-end">
                            <Button
                                variant="outline"
                                onClick={() => {
                                    setShowRoomCodeDialog(false);
                                    setRoomCode('');
                                }}
                            >
                                Close
                            </Button>
                        </div>
                    </DialogContent>
                </Dialog>

                {/* Join Username Dialog */}
                <Dialog open={showJoinDialog} onOpenChange={setShowJoinDialog}>
                    <DialogContent className="sm:max-w-md">
                        <DialogHeader>
                            <DialogTitle>Enter Ludo King Username</DialogTitle>
                            <DialogDescription className="space-y-2">
                                <p>Please enter your Ludo King username to join the battle.</p>
                                <p className="text-red-600 font-semibold text-sm">
                                    ⚠️ चेतावनी: यदि आप गलत यूजरनेम भरते हैं तो आपको जीत की राशि नहीं मिलेगी।
                                </p>
                                <p className="text-red-600 font-semibold text-sm">
                                    (Warning: If you enter wrong username, you will not receive winning money)
                                </p>
                            </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                            <Input
                                placeholder="Enter Ludo King Username"
                                value={ludoUsername}
                                onChange={(e) => setLudoUsername(e.target.value)}
                                className="w-full"
                                autoFocus
                            />
                            <div className="flex gap-2 justify-end">
                                <Button
                                    variant="outline"
                                    onClick={() => {
                                        setShowJoinDialog(false);
                                        setLudoUsername('');
                                        setSelectedRoom(null);
                                    }}
                                    disabled={loading}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    onClick={handleConfirmJoinRoom}
                                    disabled={loading || !ludoUsername.trim()}
                                    className="bg-green-600 hover:bg-green-700 text-white"
                                >
                                    {loading ? 'Joining...' : 'Join Battle'}
                                </Button>
                            </div>
                        </div>
                    </DialogContent>
                </Dialog>

                {/* Pending Join Requests Section - Only for room creators */}
                {pendingRequests.length > 0 && (
                    <div className="mb-6">
                        <div className="flex items-center mb-4">
                            <span className="text-orange-600 text-xl mr-2">⏳</span>
                            <h3 className="font-semibold text-gray-800">Pending Join Requests</h3>
                        </div>

                        <div className="space-y-3">
                            {pendingRequests.map((request) => (
                                <div key={request.roomId} className="bg-orange-50 border-2 border-orange-200 rounded-lg p-3">
                                    <div className="text-sm font-semibold text-orange-800 mb-2">
                                        Room #{request.roomId} - ₹{request.betAmount}
                                    </div>

                                    {request.pendingPlayers.map((player) => (
                                        <div key={player.userId} className="bg-white rounded-md p-2 mb-2">
                                            <div className="flex items-center justify-between">
                                                <div className="flex-1">
                                                    <div className="text-sm font-semibold text-gray-800">
                                                        {player.fullName}
                                                    </div>
                                                    <div className="text-xs text-gray-600">
                                                        Ludo Username: {player.ludoUsername}
                                                    </div>
                                                </div>

                                                <div className="flex gap-2 ml-2">
                                                    <Button
                                                        onClick={() => handleJoinRequestAction(request.roomId, player.userId, 'approve')}
                                                        disabled={loadingApproval === `${request.roomId}-${player.userId}-approve`}
                                                        className="bg-green-600 hover:bg-green-700 text-white text-xs px-3 py-1 h-7"
                                                    >
                                                        {loadingApproval === `${request.roomId}-${player.userId}-approve` ? '...' : '✓'}
                                                    </Button>
                                                    <Button
                                                        onClick={() => handleJoinRequestAction(request.roomId, player.userId, 'reject')}
                                                        disabled={loadingApproval === `${request.roomId}-${player.userId}-reject`}
                                                        className="bg-red-600 hover:bg-red-700 text-white text-xs px-3 py-1 h-7"
                                                    >
                                                        {loadingApproval === `${request.roomId}-${player.userId}-reject` ? '...' : '✗'}
                                                    </Button>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Open Battles Section */}
                <div className="mb-6">
                    <div className="flex items-center mb-4">
                        <X className="w-5 h-5 text-red-500 mr-2" />
                        <h3 className="font-semibold text-gray-800">Open Battles</h3>
                    </div>

                    <div className="space-y-2">
                        {openBattles.length === 0 ? (
                            <div className="text-center text-gray-500 py-4">
                                No open battles available. Create one!
                            </div>
                        ) : (
                            openBattles.map((battle) => {
                                const prize = battle.betAmount * 1.90; // Winning amount (2 players × entry fee - 5% platform fee)
                                const isUserInRoom = userRoomIds.includes(battle.roomId);

                                return (
                                    <div key={battle.roomId} className="rounded-lg p-2 border" style={{ backgroundColor: "rgba(223, 168, 255, 0.1)" }}>
                                        <div className="flex items-start justify-between">
                                            <div className="flex-1">
                                                <div className="text-xs text-gray-600 mb-1">
                                                    CHALLENGE FROM <span style={{ color: "rgb(223, 168, 255)", fontSize: "0.55em", fontWeight: "500" }}>{battle.createdBy}</span>
                                                </div>
                                                <div className="w-full h-px mb-1" style={{ backgroundColor: "rgb(223, 168, 255)" }}></div>
                                                <div className="flex gap-4 mb-1">
                                                    <div style={{ color: "rgb(223, 168, 255)", fontSize: "0.55em", fontWeight: "500", textTransform: "uppercase" }}>ENTRY FEE</div>
                                                    <div style={{ color: "rgb(223, 168, 255)", fontSize: "0.55em", fontWeight: "500", textTransform: "uppercase" }}>Prize</div>
                                                </div>
                                                <div className="flex items-center gap-4">
                                                    <div className="flex items-center">
                                                        <img src={moneyIcon} alt="Money" className="w-4 h-4 mr-1" />
                                                        <span className="text-sm font-semibold">{battle.betAmount}</span>
                                                    </div>
                                                    <div className="flex items-center">
                                                        <img src={moneyIcon} alt="Prize" className="w-4 h-4 mr-1" />
                                                        <span className="text-sm font-semibold">{prize.toFixed(2)}</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="ml-4 mt-4 flex gap-2">
                                                {myCreatedRooms.includes(battle.roomId) && battle.playersCount === 1 && (
                                                    <Button
                                                        onClick={() => {
                                                            setRoomToCancel(battle.roomId);
                                                            setShowCancelDialog(true);
                                                        }}
                                                        disabled={cancellingRoom === battle.roomId}
                                                        className="bg-red-600 hover:bg-red-700 text-white text-xs px-3 py-1 h-6"
                                                    >
                                                        {cancellingRoom === battle.roomId ? 'Cancelling...' : 'Cancel'}
                                                    </Button>
                                                )}
                                                <Button
                                                    onClick={() => isUserInRoom ? setShowWaitingDialog(true) : handlePlayClick(battle)}
                                                    disabled={loading}
                                                    className="bg-gray-600 hover:bg-gray-700 text-white text-xs px-4 py-1 h-6"
                                                >
                                                    Play
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>

                {/* Running Battles Section */}
                <div className="pb-6">
                    <div className="flex items-center mb-4">
                        <X className="w-5 h-5 text-red-500 mr-2" />
                        <h3 className="font-semibold text-gray-800">Running Battles</h3>
                    </div>

                    <div className="space-y-2">
                        {runningBattles.length === 0 ? (
                            <div className="text-center text-gray-500 py-4">
                                No running battles at the moment
                            </div>
                        ) : (
                            runningBattles.map((battle) => {
                                const prize = battle.betAmount * 1.90; // Winning amount (2 players × entry fee - 5% platform fee)
                                const player1 = battle.players?.[0];
                                const player2 = battle.players?.[1];
                                const isUserInRoom = userRoomIds.includes(battle.roomId);

                                return (
                                    <div key={battle.roomId} className="rounded-lg p-3 border mb-3" style={{ backgroundColor: "rgba(223, 168, 255, 0.1)" }}>
                                        <div className="flex items-center justify-between mb-2 px-4">
                                            <div className="text-xs text-gray-600">
                                                PLAYING FOR <img src={moneyIcon} alt="Money" className="w-4 h-4 inline mx-1" />{battle.betAmount}
                                            </div>
                                            <div className="text-xs text-gray-600">
                                                PRIZE <img src={moneyIcon} alt="Prize" className="w-4 h-4 inline mx-1" />{prize.toFixed(2)}
                                            </div>
                                        </div>

                                        {/* Divider Line */}
                                        <div className="w-full h-px mb-3" style={{ backgroundColor: "rgb(223, 168, 255)" }}></div>

                                        <div className="flex items-center justify-between mb-3 px-2">
                                            <div className="flex items-center">
                                                <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs mr-2">
                                                    👨
                                                </div>
                                                <span className="text-xs font-semibold truncate max-w-16">
                                                    {player1?.ludoUsername || 'Player 1'}
                                                </span>
                                            </div>

                                            <div className="flex items-center">
                                                <img src={vsIcon} alt="VS" className="w-5 h-5" />
                                            </div>

                                            <div className="flex items-center">
                                                <span className="text-xs font-semibold truncate max-w-16 mr-2">
                                                    {player2?.ludoUsername || 'Player 2'}
                                                </span>
                                                <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs">
                                                    👨
                                                </div>
                                            </div>
                                        </div>

                                        {isUserInRoom && (
                                            <div className="flex justify-between gap-2 mt-3 pt-2 border-t px-2" style={{ borderColor: "rgb(223, 168, 255, 0.3)" }}>
                                                <Button
                                                    onClick={() => handleGetRoomCode(battle.roomId)}
                                                    disabled={loadingRoomCode === battle.roomId}
                                                    className="bg-purple-600 hover:bg-purple-700 text-white text-xs font-medium px-3 py-1.5 h-7 rounded-md shadow-sm flex-1"
                                                >
                                                    {loadingRoomCode === battle.roomId ? 'Loading...' : 'Get Room Code'}
                                                </Button>
                                                <Button
                                                    onClick={() => handleDeclareResult(battle)}
                                                    disabled={loadingDeclareResult === battle.roomId}
                                                    className="bg-green-600 hover:bg-green-700 text-white text-xs font-medium px-3 py-1.5 h-7 rounded-md shadow-sm flex-1"
                                                >
                                                    {loadingDeclareResult === battle.roomId ? 'Checking...' : 'Declare Result'}
                                                </Button>
                                            </div>
                                        )}

                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>
            </div>

            {/* Room Code Dialog */}
            <Dialog open={showRoomCodeDialog} onOpenChange={setShowRoomCodeDialog}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Ludo King Room Code</DialogTitle>
                        <DialogDescription>
                            Use this code to join the room in Ludo King app
                        </DialogDescription>
                    </DialogHeader>
                    <div className="flex items-center justify-center py-8">
                        <div className="text-4xl font-bold text-green-600 tracking-widest">
                            {roomCode}
                        </div>
                    </div>
                    <div className="flex justify-end">
                        <Button onClick={() => setShowRoomCodeDialog(false)}>
                            Close
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Claim Result Dialog */}
            <Dialog open={showClaimDialog} onOpenChange={setShowClaimDialog}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Declare Result</DialogTitle>
                        <DialogDescription>
                            Claim your result for Room {selectedClaimRoom?.roomId}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium mb-2">Ludo King Username</label>
                            <Input
                                placeholder="Enter your Ludo King username"
                                value={claimUsername}
                                onChange={(e) => setClaimUsername(e.target.value)}
                                className="w-full"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-2">Result Type</label>
                            <div className="flex gap-3">
                                <Button
                                    type="button"
                                    onClick={() => {
                                        setClaimType('win');
                                        setScreenshot(null);
                                    }}
                                    variant={claimType === 'win' ? 'default' : 'outline'}
                                    className="flex-1"
                                >
                                    I Won 🏆
                                </Button>
                                <Button
                                    type="button"
                                    onClick={() => {
                                        setClaimType('loss');
                                        setScreenshot(null);
                                    }}
                                    variant={claimType === 'loss' ? 'default' : 'outline'}
                                    className="flex-1"
                                >
                                    I Lost 😔
                                </Button>
                            </div>
                        </div>

                        {claimType === 'win' && (
                            <div>
                                <label className="block text-sm font-medium mb-2">
                                    Upload Screenshot <span className="text-red-500">*</span>
                                </label>
                                <Input
                                    type="file"
                                    accept="image/*"
                                    onChange={handleScreenshotChange}
                                    className="w-full"
                                />
                                {screenshot && (
                                    <p className="text-xs text-green-600 mt-1">
                                        ✓ {screenshot.name} ({(screenshot.size / 1024).toFixed(2)} KB)
                                    </p>
                                )}
                                <p className="text-xs text-gray-500 mt-1">
                                    Upload a screenshot showing you won the game (Max 5MB)
                                </p>
                            </div>
                        )}

                        {claimType === 'loss' && (
                            <div className="bg-yellow-50 border border-yellow-300 rounded-lg p-3">
                                <p className="text-sm text-yellow-800">
                                    ⚠️ By accepting loss, you confirm that you lost this game. This action cannot be undone.
                                </p>
                            </div>
                        )}

                        <div className="flex gap-2 justify-between">
                            <Button
                                variant="destructive"
                                onClick={() => {
                                    if (!selectedClaimRoom) return;
                                    setRoomToCancel(selectedClaimRoom.roomId);
                                    setShowCancelDialog(true);
                                }}
                                disabled={claimLoading || cancellingRoom === selectedClaimRoom?.roomId}
                                className="bg-red-600 hover:bg-red-700"
                            >
                                {cancellingRoom === selectedClaimRoom?.roomId ? 'Cancelling...' : 'Cancel Room'}
                            </Button>

                            <div className="flex gap-2">
                                <Button
                                    variant="outline"
                                    onClick={() => {
                                        setShowClaimDialog(false);
                                        setSelectedClaimRoom(null);
                                        setClaimUsername('');
                                        setScreenshot(null);
                                    }}
                                    disabled={claimLoading}
                                >
                                    Close
                                </Button>
                                <Button
                                    onClick={handleConfirmClaimResult}
                                    disabled={claimLoading || !claimUsername.trim() || (claimType === 'win' && !screenshot)}
                                    className="bg-green-600 hover:bg-green-700"
                                >
                                    {claimLoading ? 'Submitting...' : 'Submit Result'}
                                </Button>
                            </div>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Cancel Room Dialog */}
            <Dialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
                <DialogContent className="bg-white text-black border-gray-300 shadow-xl">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-bold text-black">Cancel Room</DialogTitle>
                        <DialogDescription className="text-gray-700">
                            Are you sure you want to cancel this room? The bet amount will be refunded to all players.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4">
                        <div>
                            <label className="text-sm text-gray-700 mb-2 block">
                                Reason for cancellation (Optional)
                            </label>
                            <Textarea
                                value={cancelReason}
                                onChange={(e) => setCancelReason(e.target.value)}
                                placeholder="Enter reason for cancellation..."
                                className="bg-gray-100 border border-gray-300 text-black placeholder:text-gray-500 focus:ring-2 focus:ring-gray-400"
                                rows={3}
                            />
                        </div>

                        <div className="flex gap-2 justify-end">
                            <Button
                                variant="outline"
                                onClick={() => {
                                    setShowCancelDialog(false);
                                    setCancelReason('');
                                    setRoomToCancel(null);
                                }}
                                disabled={cancellingRoom !== null}
                                className="border-gray-400 text-black hover:bg-gray-100"
                            >
                                Close
                            </Button>
                            <Button
                                variant="destructive"
                                onClick={async () => {
                                    if (!roomToCancel) return;
                                    await handleCancelRoom(roomToCancel, cancelReason || undefined);
                                    setShowClaimDialog(false);
                                    setSelectedClaimRoom(null);
                                    setClaimUsername('');
                                    setScreenshot(null);
                                }}
                                disabled={cancellingRoom !== null}
                                className="bg-red-600 hover:bg-red-700 text-white"
                            >
                                {cancellingRoom ? 'Cancelling...' : 'Cancel Room'}
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

        </div>
    );
};

export default ClassicLudo;
