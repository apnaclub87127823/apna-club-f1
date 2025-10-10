import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { getAuthToken, getUser } from '@/lib/auth';
import { apiService } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { useProfile } from '@/hooks/useProfile';
import vsIcon from '@/assets/vs-icon.png';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface Room {
    roomId: string;
    betAmount: number;
    status: string;
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
        fullName: string;
        ludoUsername: string;
        joinedAt: string;
        userId: string;
    }>;
}

const RoomCode = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { isAuthenticated } = useAuth();
    const { toast } = useToast();
    const { profile } = useProfile();
    const [room, setRoom] = useState<Room | null>(location.state?.room || null);
    const [showCancelDialog, setShowCancelDialog] = useState(false);
    const [selectedCancelReason, setSelectedCancelReason] = useState<string>('');
    const [cancellingRoom, setCancellingRoom] = useState<string | null>(null);
    const [claimLoading, setClaimLoading] = useState(false);
    const [screenshot, setScreenshot] = useState<File | null>(null);
    const [showClaimDialog, setShowClaimDialog] = useState(false);
    const [claimType, setClaimType] = useState<'win' | 'loss'>('win');
    const [claimUsername, setClaimUsername] = useState('');
    const [roomCodeInput, setRoomCodeInput] = useState('');
    const [submittingRoomCode, setSubmittingRoomCode] = useState(false);
    const [timeRemaining, setTimeRemaining] = useState(180); // 3 minutes in seconds
    const timerStartedRef = useRef(false);

    // Timer effect - runs only once
    useEffect(() => {
        if (!timerStartedRef.current && room && !room.roomCode) {
            timerStartedRef.current = true;

            const timerInterval = setInterval(() => {
                setTimeRemaining((prev) => {
                    if (prev <= 1) {
                        clearInterval(timerInterval);
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);

            return () => clearInterval(timerInterval);
        }
    }, [room]);

    useEffect(() => {
        if (!isAuthenticated) {
            navigate('/login');
            return;
        }

        if (!room) {
            navigate('/classic-ludo');
            return;
        }

        // Helper to fetch latest code immediately and on interval
        const fetchLatestCode = async () => {
            try {
                const token = getAuthToken();
                if (token && room) {
                    const response = await apiService.getLudoRoomCode(token, room.roomId);
                    if (response.success && response.data) {
                        const data = response.data as any;
                        if (data.codeAvailable && data.ludoRoomCode) {
                            setRoom(prev => prev ? {
                                ...prev,
                                roomCode: data.ludoRoomCode,
                                roomCreator: data.roomCreator
                            } : null);
                        } else if (data.roomCreator) {
                            // Even if no code yet, update room creator info
                            setRoom(prev => prev ? {
                                ...prev,
                                roomCreator: data.roomCreator
                            } : null);
                        }
                    }
                }
            } catch (error) {
                console.error('Failed to fetch room code:', error);
            }
        };

        // Fetch immediately on mount
        fetchLatestCode();

        // Poll for room code updates
        const interval = setInterval(fetchLatestCode, 3000);

        return () => clearInterval(interval);
    }, [isAuthenticated, room?.roomId, navigate]);

    const handleRequestMutualCancellation = async (roomId: string) => {
        setCancellingRoom(roomId);
        try {
            const token = getAuthToken();
            if (!token) {
                toast({
                    title: "Authentication Required",
                    description: "Please login to continue",
                    variant: "destructive",
                });
                return;
            }

            const response = await apiService.requestMutualCancellation(token, roomId);

            if (response.success) {
                toast({
                    title: "Request Sent",
                    description: response.message || "Mutual cancellation request sent successfully",
                });
                navigate('/classic-ludo');
            } else {
                toast({
                    title: "Error",
                    description: response.message || "Failed to send cancellation request",
                    variant: "destructive",
                });
            }
        } catch (error: any) {
            toast({
                title: "Error",
                description: error.message || "Failed to send cancellation request",
                variant: "destructive",
            });
        } finally {
            setCancellingRoom(null);
        }
    };

    const handleSubmitRoomCode = async () => {
        if (!roomCodeInput.trim()) {
            toast({
                title: "Room Code Required",
                description: "Please enter the Ludo room code",
                variant: "destructive",
            });
            return;
        }

        setSubmittingRoomCode(true);
        try {
            const token = getAuthToken();
            if (!token || !room) {
                toast({
                    title: "Error",
                    description: "Authentication required",
                    variant: "destructive",
                });
                return;
            }

            const response = await apiService.saveLudoRoomCode(token, room.roomId, roomCodeInput.trim());

            if (response.success) {
                toast({
                    title: "Success",
                    description: "Room code submitted successfully",
                });
                setRoom(prev => prev ? { ...prev, roomCode: roomCodeInput.trim() } : null);
                setRoomCodeInput('');
            } else {
                toast({
                    title: "Error",
                    description: response.message || "Failed to submit room code",
                    variant: "destructive",
                });
            }
        } catch (error: any) {
            toast({
                title: "Error",
                description: error.message || "Failed to submit room code",
                variant: "destructive",
            });
        } finally {
            setSubmittingRoomCode(false);
        }
    };

    const handleDeclareResult = async () => {
        if (!room) return;

        setClaimUsername(profile?.fullName || '');
        setClaimType('win');
        setScreenshot(null);
        setShowClaimDialog(true);
    };

    const handleClaimResult = async () => {
        if (!room || !claimUsername.trim()) {
            toast({
                title: "Username Required",
                description: "Please enter your Ludo username",
                variant: "destructive",
            });
            return;
        }

        if (claimType === 'win' && !screenshot) {
            toast({
                title: "Screenshot Required",
                description: "Please upload a screenshot for win claims",
                variant: "destructive",
            });
            return;
        }

        setClaimLoading(true);
        try {
            const token = getAuthToken();
            if (!token) {
                toast({
                    title: "Authentication Required",
                    description: "Please login to continue",
                    variant: "destructive",
                });
                return;
            }

            const response = await apiService.claimRoomResult(
                token,
                room.roomId,
                claimUsername,
                claimType,
                screenshot || undefined
            );

            if (response.success) {
                toast({
                    title: "Success",
                    description: response.message || "Result submitted successfully",
                });
                setShowClaimDialog(false);
                navigate('/classic-ludo');
            } else {
                toast({
                    title: "Error",
                    description: response.message || "Failed to submit result",
                    variant: "destructive",
                });
            }
        } catch (error: any) {
            toast({
                title: "Error",
                description: error.message || "Failed to submit result",
                variant: "destructive",
            });
        } finally {
            setClaimLoading(false);
        }
    };

    if (!room) {
        return null;
    }

    const player1 = room.players?.[0];
    const player2 = room.players?.[1];

    // Determine if current user is the room creator (robust: API roomCreator.id OR fallback to createdBy OR first player)
    const profileUserId = profile?._id || getUser()?.id;
    const roomCreatorId = room.roomCreator?.id;
    const createdById = room.createdBy;
    const firstPlayerUserId = room.players?.[0]?.userId;

    // Normalize IDs to strings and trim whitespace
    const normalizeId = (id: any): string => {
        if (!id) return '';
        return String(id).trim();
    };

    const normalizedProfileId = normalizeId(profileUserId);
    const normalizedRoomCreatorId = normalizeId(roomCreatorId);
    const normalizedCreatedById = normalizeId(createdById);
    const normalizedFirstPlayerId = normalizeId(firstPlayerUserId);

    const isCreatorByRoomCreator = normalizedProfileId && normalizedRoomCreatorId &&
        normalizedProfileId === normalizedRoomCreatorId;
    const isCreatorByCreatedBy = normalizedProfileId && normalizedCreatedById &&
        normalizedProfileId === normalizedCreatedById;
    const isCreatorByFirstPlayer = normalizedProfileId && normalizedFirstPlayerId &&
        normalizedProfileId === normalizedFirstPlayerId;

    const isCreator = isCreatorByRoomCreator || isCreatorByCreatedBy || isCreatorByFirstPlayer;

    // Detailed debug logging
    console.log('🔍 CREATOR DETECTION DEBUG:', {
        profileUserId: normalizedProfileId,
        roomCreatorId: normalizedRoomCreatorId,
        createdById: normalizedCreatedById,
        firstPlayerUserId: normalizedFirstPlayerId,
        roomCreatorInfo: room.roomCreator,
        isCreatorByRoomCreator,
        isCreatorByCreatedBy,
        isCreatorByFirstPlayer,
        FINAL_IS_CREATOR: isCreator,
        playersCount: room.players?.length
    });

    // Format timer
    const minutes = Math.floor(timeRemaining / 60);
    const seconds = timeRemaining % 60;
    const formattedTime = `${minutes}:${seconds.toString().padStart(2, '0')}`;

    return (
        <div className="min-h-screen bg-white flex flex-col">
            {/* Top Navigation - Mobile Optimized */}
            <div className="flex items-center justify-between p-3 border-b border-gray-300 bg-white sticky top-0 z-10">
                <button
                    onClick={() => navigate('/classic-ludo')}
                    className="bg-blue-600 text-white px-3 py-1.5 text-xs font-medium rounded flex items-center gap-1"
                >
                    ← Back
                </button>
                <button className="border border-red-500 text-red-500 px-3 py-1.5 text-xs font-medium rounded">
                    ⓘ Rules
                </button>
            </div>

            <div className="flex-1 overflow-y-auto">
                <div className="max-w-lg mx-auto p-3 space-y-3 pb-20">
                    {/* Timer Display - Hidden */}

                    {/* Player Matchup Card */}
                    <div className="bg-white border border-gray-300 p-3">
                        <div className="flex items-center justify-between">
                            <div className="flex flex-col items-center flex-1">
                                <div className="w-10 h-10 rounded-full bg-pink-200 flex items-center justify-center mb-1.5">
                                    <span className="text-xl">👤</span>
                                </div>
                                <p className="text-xs font-bold text-gray-900 break-all px-1">{player1?.ludoUsername || 'Player1'}</p>
                            </div>

                            <div className="flex flex-col items-center px-3">
                                <img src={vsIcon} alt="VS" className="w-10 h-10 mb-1.5" />
                                <div className="flex items-center gap-0.5">
                                    <span className="text-green-600 font-bold text-base">₹</span>
                                    <span className="text-green-600 font-bold text-base">{room.betAmount}</span>
                                </div>
                            </div>

                            <div className="flex flex-col items-center flex-1">
                                <div className="w-10 h-10 rounded-full bg-orange-200 flex items-center justify-center mb-1.5">
                                    <span className="text-xl">👤</span>
                                </div>
                                <p className="text-xs font-bold text-gray-900 break-all px-1">{player2?.ludoUsername || 'Player2'}</p>
                            </div>
                        </div>
                    </div>

                    {/* Warning Message */}
                    <div className="bg-pink-100 border-l-4 border-pink-500 p-3">
                        <div className="flex items-start gap-2">
                            <span className="text-pink-600 text-lg">⚠️</span>
                            <div>
                                <p className="text-xs text-pink-900 leading-snug font-medium">
                                    {isCreator
                                        ? `You must provide the room code within ${formattedTime} minutes, otherwise the match will be automatically cancelled.`
                                        : `The host must provide the room code within ${formattedTime} minutes, otherwise the match will be automatically cancelled.`
                                    }
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Room Code Section */}
                    <div className="bg-white border border-gray-300">
                        <div className="bg-gray-100 border-b border-gray-300 p-2.5">
                            <h3 className="text-center font-bold text-gray-900 text-sm">Room Code</h3>
                        </div>
                        <div className="p-4">
                            {room.roomCode ? (
                                <>
                                    <p className="text-center text-gray-500 text-xs mb-2">
                                        {isCreator ? "You shared this Ludo King room code:" : "Host provided Ludo King room code:"}
                                    </p>
                                    <p className="text-center text-gray-900 font-bold text-3xl mb-4 tracking-wider">
                                        {room.roomCode}
                                    </p>
                                    <button
                                        onClick={() => {
                                            navigator.clipboard.writeText(room.roomCode || '');
                                            toast({
                                                title: "Copied!",
                                                description: "Room code copied to clipboard",
                                            });
                                        }}
                                        className="w-full bg-blue-600 text-white font-bold py-2.5 text-sm rounded flex items-center justify-center gap-2 mb-4"
                                    >
                                        📋 Copy Code & Open Ludo King
                                    </button>
                                </>
                            ) : (
                                <div className="text-center py-4 mb-4">
                                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-50 mb-3">
                                        <span className="text-3xl animate-pulse">⏳</span>
                                    </div>
                                    <p className="text-gray-700 font-medium text-base mb-1">
                                        {isCreator ? "Please enter room code below" : "Waiting for room code from host..."}
                                    </p>
                                    <p className="text-gray-500 text-xs">
                                        {isCreator ? "Create a room in Ludo King and enter the code" : "The host will share the Ludo King room code shortly"}
                                    </p>
                                </div>
                            )}

                            {/* Input box visible to both players */}
                            <div className="space-y-3 pt-3 border-t border-gray-200">
                                {isCreator && (
                                    <div className="bg-yellow-50 border border-yellow-200 rounded p-2 mb-2">
                                        <p className="text-center text-yellow-800 text-xs font-medium">
                                            🎮 You are the HOST - {room.roomCode ? 'Update' : 'Enter'} room code
                                        </p>
                                    </div>
                                )}
                                <div className="flex gap-2">
                                    <Input
                                        type="text"
                                        placeholder="Enter Ludo Room Code"
                                        value={roomCodeInput}
                                        onChange={(e) => setRoomCodeInput(e.target.value.toUpperCase())}
                                        className="text-center text-lg font-bold tracking-wider uppercase flex-1"
                                        maxLength={10}
                                    />
                                    <button
                                        onClick={handleSubmitRoomCode}
                                        // disabled={submittingRoomCode || !roomCodeInput.trim() || !isCreator}
                                        className="bg-green-600 text-white font-bold px-4 py-2 text-sm rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-green-700 transition-colors whitespace-nowrap"
                                    >
                                        {submittingRoomCode ? '...' : 'Save'}
                                    </button>
                                </div>
                                {!isCreator && (
                                    <p className="text-center text-gray-500 text-xs">
                                        Only the host can submit the room code
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* How to Play Section */}
                    {room.roomCode && (
                        <div className="bg-blue-600 p-3 rounded flex items-center gap-2">
                            <div className="text-white text-2xl">🎮</div>
                            <p className="text-white font-medium text-xs">How to play</p>
                        </div>
                    )}

                    {/* Game Result Section */}
                    <div className="bg-white border border-gray-300">
                        <div className="bg-gray-100 border-b border-gray-300 p-2.5">
                            <h3 className="text-center font-bold text-gray-900 text-sm">Game Result</h3>
                        </div>
                        <div className="p-3">
                            {room.roomCode ? (
                                <>
                                    <p className="text-xs text-gray-700 leading-relaxed mb-3">
                                        If you are not playing the game or the game has not started within 2 minutes, please select cancel with appropriate reason and submit the result.
                                    </p>
                                    <div className="space-y-2">
                                        <button
                                            onClick={handleDeclareResult}
                                            className="w-full bg-green-600 text-white font-bold py-2.5 text-sm rounded"
                                        >
                                            I Won
                                        </button>
                                        <button
                                            onClick={() => {
                                                setClaimUsername(profile?.fullName || '');
                                                setClaimType('loss');
                                                setScreenshot(null);
                                                setShowClaimDialog(true);
                                            }}
                                            className="w-full bg-red-600 text-white font-bold py-2.5 text-sm rounded"
                                        >
                                            I Lost
                                        </button>
                                        <button
                                            onClick={() => {
                                                setShowCancelDialog(true);
                                            }}
                                            disabled={cancellingRoom === room.roomId}
                                            className="w-full border border-gray-900 bg-white text-gray-900 font-bold py-2.5 text-sm rounded flex items-center justify-center gap-2"
                                        >
                                            {cancellingRoom === room.roomId ? 'Requesting...' : 'Cancel'}
                                            <span className="text-blue-600 text-lg">💬</span>
                                        </button>
                                    </div>
                                </>
                            ) : (
                                <>
                                    <p className="text-xs text-gray-700 leading-relaxed mb-3">
                                        If you are not playing the game or the game has not started within 2 minutes, please select cancel with appropriate reason and submit the result.
                                    </p>
                                    <button
                                        onClick={() => setShowCancelDialog(true)}
                                        disabled={cancellingRoom === room.roomId}
                                        className="w-full border border-gray-900 bg-white text-gray-900 font-bold py-2.5 text-sm rounded"
                                    >
                                        {cancellingRoom === room.roomId ? 'Processing...' : 'Cancel'}
                                    </button>
                                </>
                            )}
                        </div>
                    </div>

                    {/* Information Section */}
                    <div className="bg-white border border-gray-300">
                        <div className="bg-gray-100 border-b border-gray-300 p-2.5 flex items-center justify-between">
                            <h3 className="font-bold text-gray-900 text-sm">Information</h3>
                            <button className="text-blue-600 text-xl">💬</button>
                        </div>
                        <div className="p-3 space-y-3">
                            <div className="overflow-x-auto">
                                <table className="w-full text-xs">
                                    <thead>
                                        <tr className="border-b border-gray-300">
                                            <th className="text-left p-2.5 font-bold text-gray-900">Penalty Amount</th>
                                            <th className="text-left p-2.5 font-bold text-gray-900">Reason</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <tr className="border-b border-gray-200">
                                            <td className="p-2.5 text-red-600 font-bold">₹{room.betAmount}</td>
                                            <td className="p-2.5 text-gray-900">Fraud / Fake Screenshot</td>
                                        </tr>
                                        <tr className="border-b border-gray-200">
                                            <td className="p-2.5 text-red-600 font-bold">₹{room.betAmount}</td>
                                            <td className="p-2.5 text-gray-900">Wrong Username Submission</td>
                                        </tr>
                                        <tr className="border-b border-gray-200">
                                            <td className="p-2.5 text-red-600 font-bold">₹{room.betAmount}</td>
                                            <td className="p-2.5 text-gray-900">Game Abandonment</td>
                                        </tr>
                                        <tr>
                                            <td className="p-2.5 text-red-600 font-bold">₹{room.betAmount}</td>
                                            <td className="p-2.5 text-gray-900">Cheating or Manipulation</td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>

                            {/* Additional Warning */}
                            <div className="bg-red-50 border-l-4 border-red-500 p-2.5">
                                <p className="text-xs text-red-900 leading-snug font-semibold">
                                    ⚠️ Warning: Any fraudulent activity will result in penalty deduction and account suspension.
                                </p>
                            </div>

                            <div className="bg-yellow-50 border-l-4 border-yellow-500 p-2.5">
                                <p className="text-xs text-yellow-900 leading-snug">
                                    📝 Note: Always submit correct Ludo username and genuine screenshots to claim your winnings.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Cancel Dialog - Bottom Sheet Style */}
            <Dialog open={showCancelDialog} onOpenChange={(open) => {
                setShowCancelDialog(open);
                if (!open) {
                    setSelectedCancelReason('');
                }
            }}>
                <DialogContent className="bg-white text-black border-0 shadow-2xl max-w-md !fixed !top-auto !bottom-0 !left-0 !right-0 !translate-x-0 !translate-y-0 !z-[9999] rounded-t-2xl sm:!left-[50%] sm:!right-auto sm:!translate-x-[-50%] p-0 gap-0 [&>button]:hidden">
                    {/* Header with close button */}
                    <div className="flex items-center justify-between p-4 border-b border-gray-200">
                        <DialogTitle className="text-base font-bold text-black">
                            Reason for Cancellation
                        </DialogTitle>
                        <button
                            onClick={() => setShowCancelDialog(false)}
                            className="text-gray-500 hover:text-gray-700 p-1"
                        >
                            ✕
                        </button>
                    </div>

                    <div className="space-y-4 p-4">
                        {/* Reason Selection Buttons */}
                        <div className="flex flex-wrap gap-2">
                            <button
                                onClick={() => setSelectedCancelReason('Not Participated')}
                                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${selectedCancelReason === 'Not Participated'
                                    ? 'bg-gray-700 text-white'
                                    : 'bg-gray-500 text-white hover:bg-gray-600'
                                    }`}
                            >
                                Not Participated
                            </button>
                            <button
                                onClick={() => setSelectedCancelReason('Not Playing')}
                                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${selectedCancelReason === 'Not Playing'
                                    ? 'bg-gray-700 text-white'
                                    : 'bg-gray-500 text-white hover:bg-gray-600'
                                    }`}
                            >
                                Not Playing
                            </button>
                            <button
                                onClick={() => setSelectedCancelReason('Game Did Not Start')}
                                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${selectedCancelReason === 'Game Did Not Start'
                                    ? 'bg-gray-700 text-white'
                                    : 'bg-gray-500 text-white hover:bg-gray-600'
                                    }`}
                            >
                                Game Did Not Start
                            </button>
                            <button
                                onClick={() => setSelectedCancelReason('Other')}
                                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${selectedCancelReason === 'Other'
                                    ? 'bg-gray-700 text-white'
                                    : 'bg-gray-500 text-white hover:bg-gray-600'
                                    }`}
                            >
                                Other
                            </button>
                        </div>

                        {/* Confirm Button */}
                        <Button
                            onClick={async () => {
                                if (!selectedCancelReason) {
                                    toast({
                                        title: "Select a Reason",
                                        description: "Please select a cancellation reason",
                                        variant: "destructive",
                                    });
                                    return;
                                }

                                await handleRequestMutualCancellation(room.roomId);
                                setShowCancelDialog(false);
                                setSelectedCancelReason('');
                            }}
                            disabled={cancellingRoom !== null || !selectedCancelReason}
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 text-base rounded-lg"
                        >
                            {cancellingRoom ? 'Processing...' : 'Confirm'}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Claim Result Dialog - Bottom Sheet Style */}
            <Dialog open={showClaimDialog} onOpenChange={setShowClaimDialog}>
                <DialogContent className="bg-white text-black border-0 shadow-2xl max-w-md !fixed !top-auto !bottom-0 !left-0 !right-0 !translate-x-0 !translate-y-0 !z-[9999] rounded-t-2xl sm:!left-[50%] sm:!right-auto sm:!translate-x-[-50%] p-0 gap-0 [&>button]:hidden">
                    {/* Header with close button */}
                    <div className="flex items-center justify-between p-4 border-b border-gray-200">
                        <DialogTitle className="text-base font-bold text-black">
                            {claimType === 'win' ? 'Upload Your Win Screenshot' : 'Confirm Loss'}
                        </DialogTitle>
                        <button
                            onClick={() => setShowClaimDialog(false)}
                            className="text-gray-500 hover:text-gray-700 p-1"
                        >
                            ✕
                        </button>
                    </div>

                    <div className="space-y-4 p-4">
                        {claimType === 'win' ? (
                            <>
                                {/* Win Screenshot Upload */}
                                <label className="relative cursor-pointer">
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={(e) => setScreenshot(e.target.files?.[0] || null)}
                                        className="hidden"
                                        id="screenshot-upload"
                                    />
                                    <div
                                        onClick={() => document.getElementById('screenshot-upload')?.click()}
                                        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 text-base rounded-lg flex items-center justify-center gap-2 transition-colors"
                                    >
                                        📸 Upload Screenshot
                                    </div>
                                </label>

                                {screenshot && (
                                    <div className="text-xs text-green-600 text-center">
                                        ✓ {screenshot.name} ({(screenshot.size / 1024).toFixed(1)} KB)
                                    </div>
                                )}

                                {/* Submit Button */}
                                <Button
                                    onClick={handleClaimResult}
                                    disabled={claimLoading || !screenshot}
                                    className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 text-base rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {claimLoading ? 'Submitting...' : 'Submit'}
                                </Button>
                            </>
                        ) : (
                            <>
                                {/* Loss Confirmation */}
                                <p className="text-sm text-gray-700 text-center">
                                    Are you sure you want to declare this game as a loss?
                                </p>

                                {/* Confirm Loss Button */}
                                <Button
                                    onClick={handleClaimResult}
                                    disabled={claimLoading}
                                    className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 text-base rounded-lg"
                                >
                                    {claimLoading ? 'Submitting...' : 'Confirm Loss'}
                                </Button>

                                {/* Cancel Button */}
                                <Button
                                    variant="outline"
                                    onClick={() => {
                                        setShowClaimDialog(false);
                                        setClaimUsername('');
                                        setScreenshot(null);
                                    }}
                                    disabled={claimLoading}
                                    className="w-full border-gray-400 text-black hover:bg-gray-100 py-3 text-base rounded-lg"
                                >
                                    Cancel
                                </Button>
                            </>
                        )}
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default RoomCode;
// save 