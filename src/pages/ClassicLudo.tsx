import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
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
    status: 'pending' | 'live' | 'ended' | 'finished' | 'cancelled';
    playersCount: number;
    maxPlayers: number;
    createdBy: string;
    totalPrizePool: number;
    roomCode?: string;
    roomCreator?: {
        id: string;
        fullName: string;
        username: string;
    };
    players?: Array<{
        _id?: string;
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
    const navigate = useNavigate();
    const { isAuthenticated, user } = useAuth();
    const { toast } = useToast();
    const { wallet, refetch: refetchWallet } = useWallet();
    const { profile } = useProfile();
    const [battleAmount, setBattleAmount] = useState('');
    const [ludoUsername, setLudoUsername] = useState('');
    const [ludoRoomCode, setLudoRoomCode] = useState('');
    const [openBattles, setOpenBattles] = useState<Room[]>([]);
    const [runningBattles, setRunningBattles] = useState<Room[]>([]);
    const [loading, setLoading] = useState(false);
    const [dataLoading, setDataLoading] = useState(true);
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
    const [selectedCancelReason, setSelectedCancelReason] = useState<string>('');
    const [roomToCancel, setRoomToCancel] = useState<string | null>(null);
    const [pendingJoinRooms, setPendingJoinRooms] = useState<string[]>([]);
    const autoCancelledRoomsRef = useRef<Set<string>>(new Set());
    const hasLoadedRef = useRef(false);

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
            }, 5000); // Refresh every 5 seconds
            return () => clearInterval(interval);
        }
    }, [isAuthenticated, profile?.fullName]); // Re-fetch when profile loads

    // Check and auto-cancel rooms based on creation time
    useEffect(() => {
        if (!isAuthenticated || myCreatedRooms.length === 0) return;

        const checkAndCancelRooms = async () => {
            try {
                const token = getAuthToken();
                if (!token) return;

                for (const roomId of myCreatedRooms) {
                    // Skip if already auto-cancelled
                    if (autoCancelledRoomsRef.current.has(roomId)) continue;

                    const room = openBattles.find(r => r.roomId === roomId);
                    if (!room || room.playersCount !== 1) continue;

                    // Get room creation time from players array
                    const creationTime = room.players?.[0]?.joinedAt;
                    if (creationTime) {
                        const createdAt = new Date(creationTime).getTime();
                        const now = new Date().getTime();
                        const minutesPassed = (now - createdAt) / (1000 * 60);

                        // If more than 3 minutes passed, cancel the room
                        if (minutesPassed >= 3) {
                            autoCancelledRoomsRef.current.add(roomId);

                            await apiService.cancelRoom(token, roomId, 'No players joined within 3 minutes');

                            toast({
                                title: "Room Cancelled",
                                description: "Your room was automatically cancelled because no one joined within 3 minutes",
                                variant: "destructive",
                            });

                            await fetchRooms();
                            await fetchUserRooms();
                        }
                    }
                }
            } catch (error: any) {
                console.error('Auto-cancel check failed:', error);
            }
        };

        // Check immediately and then every 5 seconds
        checkAndCancelRooms();
        const interval = setInterval(checkAndCancelRooms, 5000);

        return () => clearInterval(interval);
    }, [myCreatedRooms, openBattles, isAuthenticated, toast]);

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

            if (!hasLoadedRef.current) {
                setDataLoading(true);
            }
            // Fetch pending and live rooms (for Open Battles)
            const pendingResponse = await apiService.getAllRooms(token, 'pending', 1, 20);
            const liveResponse = await apiService.getAllRooms(token, 'live', 1, 20);

            const pendingRooms = pendingResponse.success && pendingResponse.data
                ? (pendingResponse.data as any).rooms || []
                : [];
            const liveRooms = liveResponse.success && liveResponse.data
                ? (liveResponse.data as any).rooms || []
                : [];

            // Combine pending and live for Open Battles
            setOpenBattles([...pendingRooms, ...liveRooms]);

            // Show live battles in Running Battles
            setRunningBattles(liveRooms);

            // Clear pending join rooms for any rooms that are now live or full
            setPendingJoinRooms(prev => {
                const allRooms = [...pendingRooms, ...liveRooms];
                return prev.filter(roomId => {
                    const room = allRooms.find(r => r.roomId === roomId);
                    // Remove from pending if room is live or has 2 players
                    return room && room.status === 'pending' && room.playersCount < 2;
                });
            });
        } catch (error) {
            console.error('Failed to fetch rooms:', error);
        } finally {
            setDataLoading(false);
            hasLoadedRef.current = true;
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

        setCreateLoading(true);
        try {
            const token = getAuthToken();
            if (!token) return;

            const amount = parseInt(tempBattleAmount);
            const response = await apiService.createRoom(token, amount, ludoUsername.trim(), ludoRoomCode.trim() || undefined);
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

    const handlePlayClick = async (room: Room) => {
        if (!isAuthenticated) {
            toast({
                title: "Authentication Required",
                description: "Please login to join a battle",
                variant: "destructive",
            });
            return;
        }

        // Check if room is full (2 players)
        if (room.playersCount >= 2) {
            const isUserInRoom = userRoomIds.includes(room.roomId);

            // If user is not one of the 2 players who joined, show "room is full" message
            if (!isUserInRoom) {
                toast({
                    title: "Room is Full",
                    description: "This room already has 2 players",
                    variant: "destructive",
                });
                return;
            }
        }

        // Check if user already joined this room
        const isUserInRoom = userRoomIds.includes(room.roomId);
        if (isUserInRoom) {
            // Check if still pending approval
            const isPending = pendingJoinRooms.includes(room.roomId);
            if (isPending) {
                toast({
                    title: "Request Pending",
                    description: "Waiting for creator to accept your request",
                    variant: "default",
                });
                return;
            }

            // Always fetch the latest room code before navigating
            try {
                const token = getAuthToken();
                if (token) {
                    const response = await apiService.getLudoRoomCode(token, room.roomId);
                    if (response.success && response.data) {
                        const data = response.data as any;
                        room = {
                            ...room,
                            roomCode: data.ludoRoomCode,
                            roomCreator: data.roomCreator
                        };
                    }
                }
            } catch (error) {
                console.error('Failed to fetch room code:', error);
            }
            // Navigate to the room code page
            navigate('/room-code', { state: { room } });
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
                // Add to pending join rooms
                setPendingJoinRooms(prev => [...prev, selectedRoom.roomId]);

                toast({
                    title: "Join Request Sent",
                    description: `Waiting for creator to accept your request`,
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

            const response = await apiService.getLudoRoomCode(token, roomId);
            if (response.success && response.data) {
                const data = response.data as any;
                if (data.codeAvailable) {
                    setRoomCode(data.ludoRoomCode || 'N/A');
                    setSelectedRoom({ roomId } as Room); // Store for cancel functionality
                    setShowRoomCodeDialog(true);
                } else {
                    toast({
                        title: "Room Code Not Available",
                        description: "The room creator hasn't provided the room code yet. Please wait.",
                        variant: "destructive",
                    });
                }
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
                // Remove from pending join rooms when approved
                if (action === 'approve') {
                    setPendingJoinRooms(prev => prev.filter(id => id !== roomId));
                }

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

    const handleRequestMutualCancellation = async (roomId: string) => {
        setCancellingRoom(roomId);
        try {
            const token = getAuthToken();
            if (!token) return;

            const response = await apiService.requestMutualCancellation(token, roomId);
            if (response.success) {
                toast({
                    title: "Cancellation Request",
                    description: response.message,
                });

                await fetchRooms();
                await fetchUserRooms();
                await refetchWallet();
            }
        } catch (error: any) {
            toast({
                title: "Error",
                description: error.message || "Failed to request cancellation",
                variant: "destructive",
            });
        } finally {
            setCancellingRoom(null);
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
                    <DialogContent className="sm:max-w-md bg-white z-[9999]">
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
                            <div>
                                <label className="text-sm font-medium mb-2 block">
                                    Ludo King Username <span className="text-red-500">*</span>
                                </label>
                                <Input
                                    placeholder="Enter Ludo King Username"
                                    value={ludoUsername}
                                    onChange={(e) => setLudoUsername(e.target.value)}
                                    className="w-full"
                                    autoFocus
                                />
                            </div>
                            {/* <div>
                            <label className="text-sm font-medium mb-2 block">
                                Ludo King Room Code <span className="text-gray-500 text-xs">(Optional)</span>
                            </label>
                            <Input
                                placeholder="Enter Ludo King Room Code (Optional)"
                                value={ludoRoomCode}
                                onChange={(e) => setLudoRoomCode(e.target.value)}
                                className="w-full"
                            />
                        </div> */}
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
                                    disabled={createLoading || !ludoUsername.trim()}
                                    className="bg-green-600 hover:bg-green-700 text-white"
                                >
                                    {createLoading ? 'Creating...' : 'Create Battle'}
                                </Button>
                            </div>
                        </div>
                    </DialogContent>
                </Dialog>

                {/* Join Battle Dialog */}
                <Dialog open={showJoinDialog} onOpenChange={setShowJoinDialog}>
                    <DialogContent className="sm:max-w-md bg-white z-[9999]">
                        <DialogHeader>
                            <DialogTitle>Join Battle</DialogTitle>
                            <DialogDescription className="space-y-2">
                                <p>Please enter your Ludo King username to join this battle.</p>
                                <p className="text-red-600 font-semibold text-sm">
                                    ⚠️ चेतावनी: यदि आप गलत यूजरनेम भरते हैं तो आपको जीत की राशि नहीं मिलेगी।
                                </p>
                                <p className="text-red-600 font-semibold text-sm">
                                    (Warning: If you enter wrong username, you will not receive winning money)
                                </p>
                            </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                            <div>
                                <label className="text-sm font-medium mb-2 block">
                                    Ludo King Username <span className="text-red-500">*</span>
                                </label>
                                <Input
                                    placeholder="Enter Ludo King Username"
                                    value={ludoUsername}
                                    onChange={(e) => setLudoUsername(e.target.value)}
                                    className="w-full"
                                    autoFocus
                                />
                            </div>
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
                    <div className="flex items-center gap-2 mb-3">
                        <div className="w-5 h-5 bg-red-600 rounded-full flex items-center justify-center">
                            <X className="w-3 h-3 text-white" />
                        </div>
                        <h3 className="font-semibold text-sm text-gray-900">Open Battles</h3>
                    </div>

                    <div className="space-y-2">
                        {dataLoading ? (
                            <div className="text-center py-8 bg-white rounded-lg border border-gray-200">
                                <div className="w-10 h-10 border-4 border-gray-300 border-t-blue-600 rounded-full animate-spin mx-auto mb-2"></div>
                                <p className="text-xs text-gray-600">Loading battles...</p>
                            </div>
                        ) : openBattles.filter(battle => {
                            // Only show live rooms where user has already joined
                            if (battle.status === 'live') {
                                // Check if user is in the room by checking userRoomIds AND players array
                                const isInRoomIds = userRoomIds.includes(battle.roomId);
                                const isInPlayers = battle.players?.some(p => p._id === user?.id);
                                return isInRoomIds && isInPlayers;
                            }
                            // Show all pending rooms
                            return battle.status === 'pending';
                        }).length === 0 ? (
                            <div className="text-center text-gray-500 py-6 bg-white rounded-lg border border-gray-200 text-xs">
                                No open battles available. Create one!
                            </div>
                        ) : (
                            openBattles.filter(battle => {
                                // Only show live rooms where user has already joined
                                if (battle.status === 'live') {
                                    // Check if user is in the room by checking userRoomIds AND players array
                                    const isInRoomIds = userRoomIds.includes(battle.roomId);
                                    const isInPlayers = battle.players?.some(p => p._id === user?.id);
                                    return isInRoomIds && isInPlayers;
                                }
                                // Show all pending rooms
                                return battle.status === 'pending';
                            }).map((battle) => {
                                const prize = battle.betAmount * 1.95;
                                const isUserInRoom = userRoomIds.includes(battle.roomId);
                                const isCreatedByUser = myCreatedRooms.includes(battle.roomId);

                                return (
                                    <div key={battle.roomId} className="bg-purple-50 rounded-lg p-3 border border-purple-100">
                                        <div className="mb-1.5 flex items-center justify-between">
                                            <div className="text-[10px] font-semibold text-gray-900">
                                                CHALLENGE FROM <span className="text-purple-400">{battle.createdBy?.toUpperCase() || 'PLAYER'}</span>
                                            </div>
                                            {isCreatedByUser && battle.playersCount === 1 && (
                                                <button
                                                    onClick={() => {
                                                        setRoomToCancel(battle.roomId);
                                                        setShowCancelDialog(true);
                                                    }}
                                                    disabled={cancellingRoom === battle.roomId}
                                                    className="bg-red-300 hover:bg-red-400 text-white text-[9px] font-semibold px-2 h-5 rounded-none"
                                                >
                                                    {cancellingRoom === battle.roomId ? '...' : 'Cancel'}
                                                </button>
                                            )}
                                        </div>

                                        {/* Divider Line */}
                                        <div className="w-full h-px bg-purple-400 my-2"></div>

                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-6">
                                                <div>
                                                    <div className="text-[9px] text-purple-400 font-medium uppercase mb-0.5">Entry Fee</div>
                                                    <div className="flex items-center gap-1">
                                                        <div className="w-4 h-4 bg-green-600 rounded flex items-center justify-center">
                                                            <span className="text-white text-[8px] font-bold">₹</span>
                                                        </div>
                                                        <span className="text-base font-bold text-gray-900">{battle.betAmount}</span>
                                                    </div>
                                                </div>
                                                <div>
                                                    <div className="text-[9px] text-purple-400 font-medium uppercase mb-0.5">Prize</div>
                                                    <div className="flex items-center gap-1">
                                                        <div className="w-4 h-4 bg-green-600 rounded flex items-center justify-center">
                                                            <span className="text-white text-[8px] font-bold">₹</span>
                                                        </div>
                                                        <span className="text-base font-bold text-gray-900">{prize.toFixed(1)}</span>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="flex gap-2">
                                                {/* If room is live and user is a player, show "See" button */}
                                                {battle.status === 'live' && isUserInRoom ? (
                                                    <Button
                                                        onClick={() => handlePlayClick(battle)}
                                                        disabled={loading}
                                                        className="bg-green-600/70 hover:bg-green-600/90 text-white font-medium text-xs px-5 h-8 rounded-md"
                                                    >
                                                        See
                                                    </Button>
                                                ) : isUserInRoom && battle.playersCount >= 2 && battle.status === 'pending' ? (
                                                    <Button
                                                        onClick={() => handlePlayClick(battle)}
                                                        disabled={loading}
                                                        className="bg-green-600/70 hover:bg-green-600/90 text-white font-medium text-xs px-5 h-8 rounded-md"
                                                    >
                                                        See
                                                    </Button>
                                                ) : isUserInRoom && battle.status === 'pending' ? (
                                                    <div className="bg-orange-500 text-white font-medium text-xs px-5 h-8 rounded-md flex items-center">
                                                        Waiting...
                                                    </div>
                                                ) : isCreatedByUser && battle.playersCount === 1 && battle.status === 'pending' ? (
                                                    <div className="flex items-center gap-2 px-5 h-8">
                                                        <div className="w-4 h-4 border-2 border-gray-400 border-t-blue-600 rounded-full animate-spin"></div>
                                                        <span className="text-xs text-gray-600 font-medium">Waiting...</span>
                                                    </div>
                                                ) : (
                                                    <Button
                                                        onClick={() => handlePlayClick(battle)}
                                                        disabled={loading}
                                                        className="bg-gray-600/60 hover:bg-gray-600/80 text-white font-medium text-xs px-5 h-8 rounded-md"
                                                    >
                                                        Play
                                                    </Button>
                                                )}
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
                    <div className="flex items-center gap-2 mb-3">
                        <div className="w-5 h-5 bg-red-600 rounded-full flex items-center justify-center">
                            <X className="w-3 h-3 text-white" />
                        </div>
                        <h3 className="font-semibold text-sm text-gray-900">Running Battles</h3>
                    </div>

                    <div className="space-y-2">
                        {runningBattles.length === 0 ? (
                            <div className="text-center text-gray-500 py-6 bg-white rounded-lg border border-gray-200 text-xs">
                                No running battles at the moment
                            </div>
                        ) : (
                            runningBattles.map((battle) => {
                                const prize = battle.betAmount * 1.95;
                                const player1 = battle.players?.[0];
                                const player2 = battle.players?.[1];
                                const isUserInRoom = userRoomIds.includes(battle.roomId);
                                const isSearching = battle.playersCount < 2;

                                return (
                                    <div key={battle.roomId} className="bg-purple-50 rounded-lg px-2 py-1 border border-gray-200">
                                        <div className="flex items-center justify-between mb-1">
                                            <div className="flex items-center gap-1">
                                                <span className="text-[9px] font-medium text-gray-700">Playing For</span>
                                                <div className="w-3 h-3 bg-green-600 rounded flex items-center justify-center">
                                                    <span className="text-white text-[7px] font-bold">₹</span>
                                                </div>
                                                <span className="text-[11px] font-bold text-gray-900">{battle.betAmount}</span>
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <span className="text-[9px] font-medium text-gray-700">Prize</span>
                                                <div className="w-3 h-3 bg-green-600 rounded flex items-center justify-center">
                                                    <span className="text-white text-[7px] font-bold">₹</span>
                                                </div>
                                                <span className="text-[11px] font-bold text-gray-900">{prize.toFixed(1)}</span>
                                            </div>
                                        </div>

                                        <div className="flex items-center justify-between py-1">
                                            <div className="text-center flex-1">
                                                <div className="w-8 h-8 mx-auto mb-1 bg-blue-100 rounded-full flex items-center justify-center">
                                                    <span className="text-base">👤</span>
                                                </div>
                                                <p className="text-[10px] font-semibold text-gray-900">{player1?.ludoUsername || 'Player 1'}</p>
                                            </div>

                                            <div className="flex-shrink-0 mx-2">
                                                <img src={vsIcon} alt="VS" className="w-7 h-7" />
                                            </div>

                                            <div className="text-center flex-1">
                                                {isSearching ? (
                                                    <div className="flex flex-col items-center">
                                                        <div className="w-8 h-8 mx-auto mb-1 bg-gray-100 rounded-full flex items-center justify-center">
                                                            <div className="w-4 h-4 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin"></div>
                                                        </div>
                                                        <p className="text-[10px] font-semibold text-gray-600">Searching...</p>
                                                    </div>
                                                ) : (
                                                    <>
                                                        <div className="w-8 h-8 mx-auto mb-1 bg-pink-100 rounded-full flex items-center justify-center">
                                                            <span className="text-base">👤</span>
                                                        </div>
                                                        <p className="text-[10px] font-semibold text-gray-900">{player2?.ludoUsername || 'Player 2'}</p>
                                                    </>
                                                )}
                                            </div>
                                        </div>

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
                    <div className="flex gap-2 justify-end">
                        <Button
                            variant="destructive"
                            onClick={() => {
                                if (selectedRoom) {
                                    setRoomToCancel(selectedRoom.roomId);
                                    setShowCancelDialog(true);
                                    setShowRoomCodeDialog(false);
                                }
                            }}
                            className="bg-red-600 hover:bg-red-700"
                        >
                            Cancel
                        </Button>
                        <Button onClick={() => {
                            setShowRoomCodeDialog(false);
                            setSelectedRoom(null);
                        }}>
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
                                <div className="flex items-center justify-between mb-2">
                                    <label className="block text-sm font-medium">
                                        Upload Screenshot <span className="text-red-500">*</span>
                                    </label>
                                    <Button
                                        variant="destructive"
                                        size="sm"
                                        onClick={() => {
                                            if (!selectedClaimRoom) return;
                                            setRoomToCancel(selectedClaimRoom.roomId);
                                            setShowCancelDialog(true);
                                        }}
                                        disabled={claimLoading || cancellingRoom === selectedClaimRoom?.roomId}
                                        className="bg-red-600 hover:bg-red-700"
                                    >
                                        {cancellingRoom === selectedClaimRoom?.roomId ? 'Requesting...' : 'Cancel Room'}
                                    </Button>
                                </div>
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
                            <>
                                <div className="bg-yellow-50 border border-yellow-300 rounded-lg p-3">
                                    <p className="text-sm text-yellow-800">
                                        ⚠️ By accepting loss, you confirm that you lost this game. This action cannot be undone.
                                    </p>
                                </div>
                                <Button
                                    variant="destructive"
                                    onClick={() => {
                                        if (!selectedClaimRoom) return;
                                        setRoomToCancel(selectedClaimRoom.roomId);
                                        setShowCancelDialog(true);
                                    }}
                                    disabled={claimLoading || cancellingRoom === selectedClaimRoom?.roomId}
                                    className="bg-red-600 hover:bg-red-700 w-full"
                                >
                                    {cancellingRoom === selectedClaimRoom?.roomId ? 'Requesting...' : 'Cancel Room'}
                                </Button>
                            </>
                        )}

                        <div className="flex gap-2 justify-end">
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
                </DialogContent>
            </Dialog>

            {/* Cancel Room Dialog */}
            <Dialog open={showCancelDialog} onOpenChange={(open) => {
                setShowCancelDialog(open);
                if (!open) {
                    setRoomToCancel(null);
                }
            }}>
                <DialogContent className="bg-white text-black border-gray-300 shadow-xl max-w-md !fixed !top-auto !bottom-4 !left-[50%] !translate-x-[-50%] !translate-y-0 !z-[9999] rounded-t-2xl">
                    <DialogHeader>
                        <DialogTitle className="text-lg font-bold text-black text-center">
                            Cancel Room
                        </DialogTitle>
                        <DialogDescription className="text-center text-gray-600">
                            Are you sure you want to cancel this room?
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-3 py-2">
                        <Button
                            onClick={async () => {
                                if (!roomToCancel) return;

                                try {
                                    setCancellingRoom(roomToCancel);
                                    const token = getAuthToken();
                                    if (!token) {
                                        toast({
                                            title: "Error",
                                            description: "Authentication required",
                                            variant: "destructive",
                                        });
                                        return;
                                    }

                                    await apiService.cancelRoom(token, roomToCancel);

                                    toast({
                                        title: "Room Cancelled",
                                        description: "The room has been cancelled successfully",
                                    });

                                    setShowCancelDialog(false);
                                    setRoomToCancel(null);
                                    setShowClaimDialog(false);
                                    setSelectedClaimRoom(null);
                                    setClaimUsername('');
                                    setScreenshot(null);

                                    await fetchRooms();
                                    await fetchUserRooms();
                                    await refetchWallet();
                                } catch (error: any) {
                                    console.error('Cancel room error:', error);
                                    toast({
                                        title: "Error",
                                        description: error.message || "Failed to cancel room",
                                        variant: "destructive",
                                    });
                                } finally {
                                    setCancellingRoom(null);
                                }
                            }}
                            disabled={cancellingRoom !== null}
                            className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 text-base"
                        >
                            {cancellingRoom ? 'Cancelling...' : 'Confirm Cancel'}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

        </div>
    );
};

export default ClassicLudo;
