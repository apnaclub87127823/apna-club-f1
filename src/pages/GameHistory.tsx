import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '@/components/Header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Trophy } from 'lucide-react';
import { apiService } from '@/lib/api';
import { getAuthToken } from '@/lib/auth';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
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

interface Winner {
    userId: string;
    fullName: string;
    ludoUsername: string;
    amountWon: number;
    netAmount: number;
}

interface Player {
    fullName: string;
    ludoUsername: string;
    status: string;
}

interface FinishedGame {
    roomId: string;
    betAmount: number;
    status: string;
    playersCount: number;
    createdBy: string;
    gameStartedAt: string;
    gameEndedAt: string;
    winner: Winner | null;
    totalPrizePool: number;
    players: Player[];
}

const GameHistory = () => {
    const navigate = useNavigate();
    const { toast } = useToast();
    const { user } = useAuth();
    const { profile } = useProfile();
    const [games, setGames] = useState<FinishedGame[]>([]);
    const [loading, setLoading] = useState(false);
    const [claimDialogOpen, setClaimDialogOpen] = useState(false);
    const [selectedGame, setSelectedGame] = useState<FinishedGame | null>(null);
    const [screenshot, setScreenshot] = useState<File | null>(null);
    const [claimUsername, setClaimUsername] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const fetchFinishedGames = async () => {
        setLoading(true);
        try {
            const token = getAuthToken();
            if (!token) {
                toast({
                    title: "Error",
                    description: "Please login to continue",
                    variant: "destructive",
                });
                navigate('/login');
                return;
            }

            const response = await apiService.getFinishedGames(token);

            if (response.success && response.data) {
                setGames(response.data as FinishedGame[]);
            }
        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to fetch game history",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchFinishedGames();
    }, []);

    const handleScreenshotChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (file.size > 5 * 1024 * 1024) {
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

    const handleClaimWin = (game: FinishedGame) => {
        setSelectedGame(game);
        setClaimUsername(profile?.fullName || '');
        setScreenshot(null);
        setClaimDialogOpen(true);
    };

    const submitClaim = async () => {
        if (!selectedGame || !claimUsername.trim()) {
            toast({
                title: "Error",
                description: "Please enter your Ludo King username",
                variant: "destructive",
            });
            return;
        }

        if (!screenshot) {
            toast({
                title: "Error",
                description: "Please upload a screenshot to claim win",
                variant: "destructive",
            });
            return;
        }

        setSubmitting(true);
        try {
            const token = getAuthToken();
            if (!token) {
                toast({
                    title: "Error",
                    description: "Please login to continue",
                    variant: "destructive",
                });
                navigate('/login');
                return;
            }

            await apiService.claimRoomResult(
                token,
                selectedGame.roomId,
                claimUsername.trim(),
                'win',
                screenshot
            );

            toast({
                title: "Success",
                description: "Your win claim has been submitted for review",
            });

            setClaimDialogOpen(false);
            fetchFinishedGames();
        } catch (error: any) {
            toast({
                title: "Error",
                description: error.message || "Failed to submit claim",
                variant: "destructive",
            });
        } finally {
            setSubmitting(false);
        }
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-IN', {
            day: '2-digit',
            month: 'short',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const isUserWinner = (game: FinishedGame) => {
        return game.winner?.userId === user?.id;
    };

    const canClaimWin = (game: FinishedGame) => {
        return game.winner && !isUserWinner(game);
    };

    return (
        <div className="min-h-screen bg-background">
            <Header isLoggedIn={true} showTermsButton={false} showScrollingBanners={false} />

            <div className="max-w-lg mx-auto px-4 py-2">
                {/* Game History Header */}
                <div className="text-center mb-4">
                    <div className="flex items-center justify-center mb-2">
                        <div className="h-px bg-gray-300 flex-1"></div>
                        <span className="px-4 text-gray-500 text-lg font-bold">🏆 Game History 🏆</span>
                        <div className="h-px bg-gray-300 flex-1"></div>
                    </div>
                </div>

                {loading ? (
                    <div className="text-center py-8">
                        <div className="animate-pulse space-y-3">
                            {[1, 2, 3].map(i => (
                                <div key={i} className="h-24 bg-muted rounded-xl"></div>
                            ))}
                        </div>
                    </div>
                ) : games.length === 0 ? (
                    <div className="text-center py-12 px-4">
                        <Trophy className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                        <h3 className="text-lg font-medium text-foreground mb-2">No Games Yet</h3>
                        <p className="text-sm text-muted-foreground">
                            Your finished game history will appear here
                        </p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {games.map((game) => {
                            const player1 = game.players[0];
                            const player2 = game.players[1];
                            const isWinner = isUserWinner(game);
                            const prize = game.totalPrizePool;

                            return (
                                <div
                                    key={game.roomId}
                                    className="relative rounded-xl p-3 shadow-md"
                                    style={{
                                        background: "linear-gradient(135deg, rgb(190, 106, 255) 0%, rgb(156, 81, 255) 100%)"
                                    }}
                                >
                                    {/* Win/Loss Badge */}
                                    <div className="absolute top-2 right-2">
                                        <div className={`px-2 py-0.5 rounded-full text-xs font-bold ${isWinner
                                            ? 'bg-yellow-400 text-yellow-900'
                                            : 'bg-red-500 text-white'
                                            }`}>
                                            {isWinner ? '🏆 Won' : '😔 Lost'}
                                        </div>
                                    </div>

                                    {/* Room ID & Date */}
                                    <div className="mb-2">
                                        <div className="text-white text-xs font-semibold">
                                            Room #{game.roomId.slice(-6).toUpperCase()}
                                        </div>
                                        <div className="text-white text-xs opacity-90">
                                            {formatDate(game.gameEndedAt)}
                                        </div>
                                    </div>

                                    {/* Battle Details */}
                                    <div className="flex items-center justify-between mb-2">
                                        <div className="text-xs text-white font-semibold">
                                            ENTRY <img src={moneyIcon} alt="Entry" className="w-4 h-4 inline mx-1" />{game.betAmount}
                                        </div>
                                        <div className="text-xs text-white font-semibold">
                                            PRIZE <img src={moneyIcon} alt="Prize" className="w-4 h-4 inline mx-1" />{prize.toFixed(2)}
                                        </div>
                                    </div>

                                    {/* Divider Line */}
                                    <div className="w-full h-px mb-2" style={{ backgroundColor: "rgb(223, 168, 255)" }}></div>

                                    {/* Players */}
                                    <div className="flex items-center justify-between mb-2 px-2">
                                        <div className="flex items-center">
                                            <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs mr-2">
                                                👨
                                            </div>
                                            <span className="text-xs font-semibold text-white truncate max-w-16">
                                                {player1?.ludoUsername || 'Player 1'}
                                            </span>
                                        </div>

                                        <div className="flex items-center">
                                            <img src={vsIcon} alt="VS" className="w-5 h-5" />
                                        </div>

                                        <div className="flex items-center">
                                            <span className="text-xs font-semibold text-white truncate max-w-16 mr-2">
                                                {player2?.ludoUsername || 'Player 2'}
                                            </span>
                                            <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs">
                                                👨
                                            </div>
                                        </div>
                                    </div>

                                    {/* Winner Info */}
                                    {game.winner && (
                                        <div className="mb-2 px-2">
                                            <div className="bg-white/20 rounded-lg p-2 backdrop-blur-sm">
                                                <div className="flex items-center justify-between">
                                                    <div>
                                                        <p className="text-xs text-white font-semibold">
                                                            Winner: {game.winner.ludoUsername}
                                                        </p>
                                                        <p className="text-xs text-white opacity-90">
                                                            {game.winner.fullName}
                                                        </p>
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="text-sm font-bold text-yellow-300">
                                                            +₹{game.winner.netAmount}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* Claim Button */}
                                    {canClaimWin(game) && (
                                        <div className="pt-2 border-t px-2" style={{ borderColor: "rgb(223, 168, 255, 0.3)" }}>
                                            <Button
                                                onClick={() => handleClaimWin(game)}
                                                className="bg-yellow-500 hover:bg-yellow-600 text-yellow-900 text-xs font-medium px-3 py-1.5 h-7 rounded-md shadow-sm w-full"
                                            >
                                                ⚠️ Claim I Won This Game
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Claim Result Dialog - Same as Classic Ludo */}
            <Dialog open={claimDialogOpen} onOpenChange={setClaimDialogOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Declare Result</DialogTitle>
                        <DialogDescription>
                            Claim your win for Room {selectedGame?.roomId}
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

                        <div className="flex gap-2 justify-end">
                            <Button
                                variant="outline"
                                onClick={() => {
                                    setClaimDialogOpen(false);
                                    setSelectedGame(null);
                                    setClaimUsername('');
                                    setScreenshot(null);
                                }}
                                disabled={submitting}
                            >
                                Cancel
                            </Button>
                            <Button
                                onClick={submitClaim}
                                disabled={submitting || !claimUsername.trim() || !screenshot}
                                className="bg-green-600 hover:bg-green-700"
                            >
                                {submitting ? 'Submitting...' : 'Submit Result'}
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default GameHistory;
