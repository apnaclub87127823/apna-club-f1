import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Menu, ArrowLeft, RefreshCw, Trash2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { getAuthToken } from '@/lib/auth';
import { adminApiService } from '@/lib/adminApi';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import AppSidebar from '@/components/AppSidebar';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

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
    } | null;
    players: Array<{
        userId: {
            _id: string;
            fullName: string;
            username: string;
            mobileNumber: string;
        } | null;
        ludoUsername: string;
        _id: string;
        joinedAt: string;
        status?: string;
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
    } | null;
    totalPrizePool: number;
    serviceCharge: number;
    createdAt: string;
    updatedAt: string;
}

const AdminRooms = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [rooms, setRooms] = useState<RoomData[]>([]);
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [updating, setUpdating] = useState<string | null>(null);
    const [showCancelDialog, setShowCancelDialog] = useState(false);
    const [selectedRoom, setSelectedRoom] = useState<RoomData | null>(null);
    const [cancelReason, setCancelReason] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalRooms, setTotalRooms] = useState(0);

    useEffect(() => {
        if (!user || user.role !== 'admin') {
            toast.error('Access denied. Admin privileges required.');
            navigate('/');
            return;
        }

        fetchRooms();
    }, [user, navigate, statusFilter, currentPage]);

    const fetchRooms = async () => {
        const token = getAuthToken();
        if (!token) {
            navigate('/login');
            return;
        }

        try {
            setLoading(true);
            const response = await adminApiService.getAllRooms(
                token,
                statusFilter === 'all' ? undefined : (statusFilter as any),
                currentPage,
                20
            );

            if (response.success && response.data) {
                setRooms(response.data);
                setTotalPages(response.totalPages || 1);
                setTotalRooms(response.totalRooms || 0);
            } else {
                setRooms([]);
                setTotalPages(1);
                setTotalRooms(0);
            }
        } catch (error: any) {
            console.error('Failed to fetch rooms:', error);
            toast.error(error.message || 'Failed to load rooms');
            setRooms([]);
        } finally {
            setLoading(false);
        }
    };

    const handleStatusUpdate = async (roomId: string, newStatus: 'pending' | 'live' | 'ended' | 'finished') => {
        const token = getAuthToken();
        if (!token) return;

        try {
            setUpdating(roomId);
            const response = await adminApiService.updateRoomStatus(token, roomId, newStatus);

            if (response.success) {
                toast.success(response.message);
                fetchRooms();
            }
        } catch (error: any) {
            toast.error(error.message || 'Failed to update room status');
        } finally {
            setUpdating(null);
        }
    };

    const handleCancelRoom = async () => {
        if (!selectedRoom) return;

        const token = getAuthToken();
        if (!token) return;

        try {
            setUpdating(selectedRoom.roomId);
            const response = await adminApiService.adminCancelRoom(
                token,
                selectedRoom.roomId,
                cancelReason
            );

            if (response.success) {
                toast.success(response.message);
                setShowCancelDialog(false);
                setSelectedRoom(null);
                setCancelReason('');
                fetchRooms();
            }
        } catch (error: any) {
            toast.error(error.message || 'Failed to cancel room');
        } finally {
            setUpdating(null);
        }
    };

    const openCancelDialog = (room: RoomData) => {
        setSelectedRoom(room);
        setShowCancelDialog(true);
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'pending': return 'bg-yellow-500';
            case 'live': return 'bg-blue-500';
            case 'ended': return 'bg-orange-500';
            case 'finished': return 'bg-green-500';
            case 'cancelled': return 'bg-red-500';
            default: return 'bg-gray-500';
        }
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleString('en-IN', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    if (loading && rooms.length === 0) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <RefreshCw className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background">
            <AppSidebar
                isOpen={isSidebarOpen}
                onClose={() => setIsSidebarOpen(false)}
                isLoggedIn={true}
            />

            {/* Header */}
            <header className="sticky top-0 z-30 bg-background border-b">
                <div className="flex items-center justify-between p-4">
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => setIsSidebarOpen(true)}
                            className="p-2 hover:bg-muted rounded-md transition-colors lg:hidden"
                        >
                            <Menu className="h-5 w-5" />
                        </button>
                        <button
                            onClick={() => navigate('/admin')}
                            className="p-2 hover:bg-muted rounded-md transition-colors"
                        >
                            <ArrowLeft className="h-5 w-5" />
                        </button>
                        <h1 className="text-lg font-bold">Room Management</h1>
                    </div>
                    <Button
                        onClick={fetchRooms}
                        size="sm"
                        variant="outline"
                        className="gap-2"
                    >
                        <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                        <span className="hidden sm:inline">Refresh</span>
                    </Button>
                </div>
            </header>

            <main className="container mx-auto p-3 pb-20 max-w-7xl lg:p-6">
                {/* Stats */}
                <Card className="mb-4">
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-muted-foreground">Total Rooms</p>
                                <p className="text-2xl font-bold">{totalRooms}</p>
                            </div>
                            <Select value={statusFilter} onValueChange={setStatusFilter}>
                                <SelectTrigger className="w-40">
                                    <SelectValue placeholder="Filter by status" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Rooms</SelectItem>
                                    <SelectItem value="pending">Pending</SelectItem>
                                    <SelectItem value="live">Live</SelectItem>
                                    <SelectItem value="ended">Ended</SelectItem>
                                    <SelectItem value="finished">Finished</SelectItem>
                                    <SelectItem value="cancelled">Cancelled</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </CardContent>
                </Card>

                {/* Rooms Table */}
                <Card>
                    <CardHeader>
                        <CardTitle>Rooms ({rooms.length})</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Room ID</TableHead>
                                        <TableHead>Bet Amount</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead>Players</TableHead>
                                        <TableHead>Created By</TableHead>
                                        <TableHead>Created At</TableHead>
                                        <TableHead>Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {rooms.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={7} className="text-center py-8">
                                                No rooms found
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        rooms.map((room) => (
                                            <TableRow key={room._id}>
                                                <TableCell className="font-mono text-sm">
                                                    {room.roomId}
                                                </TableCell>
                                                <TableCell>₹{room.betAmount}</TableCell>
                                                <TableCell>
                                                    <Badge className={getStatusColor(room.status)}>
                                                        {room.status}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell>
                                                    {room.players.filter(p => p.userId).length}/2
                                                </TableCell>
                                                <TableCell>
                                                    {room.createdBy ? (
                                                        <div>
                                                            <p className="font-medium text-sm">{room.createdBy.fullName}</p>
                                                            <p className="text-xs text-muted-foreground">
                                                                {room.createdBy.mobileNumber}
                                                            </p>
                                                        </div>
                                                    ) : (
                                                        <span className="text-xs text-muted-foreground">Unknown</span>
                                                    )}
                                                </TableCell>
                                                <TableCell className="text-sm">
                                                    {formatDate(room.createdAt)}
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex gap-2">
                                                        <Select
                                                            value={room.status}
                                                            onValueChange={(value) =>
                                                                handleStatusUpdate(room.roomId, value as any)
                                                            }
                                                            disabled={updating === room.roomId}
                                                        >
                                                            <SelectTrigger className="w-28">
                                                                <SelectValue />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                <SelectItem value="pending">Pending</SelectItem>
                                                                <SelectItem value="live">Live</SelectItem>
                                                                <SelectItem value="ended">Ended</SelectItem>
                                                                <SelectItem value="finished">Finished</SelectItem>
                                                                <SelectItem value="cancelled">Cancelled</SelectItem>
                                                            </SelectContent>
                                                        </Select>
                                                        <Button
                                                            size="sm"
                                                            variant="destructive"
                                                            onClick={() => openCancelDialog(room)}
                                                            disabled={updating === room.roomId || room.status === 'finished'}
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </div>

                        {/* Pagination */}
                        {totalPages > 1 && (
                            <div className="flex items-center justify-center gap-2 mt-4">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                    disabled={currentPage === 1}
                                >
                                    Previous
                                </Button>
                                <span className="text-sm">
                                    Page {currentPage} of {totalPages}
                                </span>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                    disabled={currentPage === totalPages}
                                >
                                    Next
                                </Button>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </main>

            {/* Cancel Room Dialog */}
            <Dialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Cancel Room</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to cancel room {selectedRoom?.roomId}?
                            All players will be refunded their bet amount.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div>
                            <label className="text-sm font-medium">Reason (Optional)</label>
                            <Textarea
                                value={cancelReason}
                                onChange={(e) => setCancelReason(e.target.value)}
                                placeholder="Enter cancellation reason..."
                                rows={3}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => {
                                setShowCancelDialog(false);
                                setSelectedRoom(null);
                                setCancelReason('');
                            }}
                        >
                            Cancel
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={handleCancelRoom}
                            disabled={updating === selectedRoom?.roomId}
                        >
                            {updating === selectedRoom?.roomId ? 'Cancelling...' : 'Confirm Cancel'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default AdminRooms;
