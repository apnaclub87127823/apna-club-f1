import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Menu, ArrowLeft, Users, Clock, CheckCircle, XCircle, IndianRupee, RefreshCw, AlertTriangle, ChevronDown, ChevronUp, ZoomIn, X, Trash2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { getAuthToken } from '@/lib/auth';
import { adminApiService } from '@/lib/adminApi';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import AppSidebar from '@/components/AppSidebar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
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

interface Withdrawal {
    transactionId: string;
    user: {
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
}


interface Dispute {
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

interface UserData {
    _id: string;
    fullName: string;
    username: string;
    mobileNumber: string;
}

interface UserWithWallet {
    _id: string;
    fullName: string;
    username: string;
    mobileNumber: string;
    wallet: {
        depositBalance: number;
        winningBalance: number;
        totalBalance: number;
    };
}

const AdminDashboard = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
    const [disputes, setDisputes] = useState<Dispute[]>([]);
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState<string>('pending');
    const [disputeStatusFilter, setDisputeStatusFilter] = useState<string>('pending');
    const [updating, setUpdating] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<string>('withdrawals');
    const [rooms, setRooms] = useState<any[]>([]);
    const [roomsLoading, setRoomsLoading] = useState(false);
    const [roomStatusFilter, setRoomStatusFilter] = useState<string>('all');
    const [roomPage, setRoomPage] = useState(1);
    const [totalRoomPages, setTotalRoomPages] = useState(1);
    const [totalRooms, setTotalRooms] = useState(0);
    const [showCancelDialog, setShowCancelDialog] = useState(false);
    const [selectedRoom, setSelectedRoom] = useState<any | null>(null);
    const [cancelReason, setCancelReason] = useState('');
    const [showResolveDialog, setShowResolveDialog] = useState(false);
    const [selectedDispute, setSelectedDispute] = useState<{ roomId: string, disputes: Dispute[] } | null>(null);
    const [adminNotes, setAdminNotes] = useState('');
    const [selectedWinnerId, setSelectedWinnerId] = useState<string>('');
    const [expandedRooms, setExpandedRooms] = useState<Set<string>>(new Set());
    const [screenshotModal, setScreenshotModal] = useState<{ isOpen: boolean, url: string, userName: string }>({ isOpen: false, url: '', userName: '' });
    const [users, setUsers] = useState<UserData[]>([]);
    const [usersWithWallet, setUsersWithWallet] = useState<UserWithWallet[]>([]);
    const [selectedUserId, setSelectedUserId] = useState<string>('');
    const [depositAmount, setDepositAmount] = useState<string>('');
    const [addingBalance, setAddingBalance] = useState(false);
    const [userSearch, setUserSearch] = useState<string>('');
    const [userPage, setUserPage] = useState(1);
    const [totalUserPages, setTotalUserPages] = useState(1);
    const [totalUsers, setTotalUsers] = useState(0);
    const [showAddMoneyDialog, setShowAddMoneyDialog] = useState(false);
    const [selectedUser, setSelectedUser] = useState<UserWithWallet | null>(null);
    const [balanceOperation, setBalanceOperation] = useState<'add' | 'deduct'>('add');
    const [depositDeductAmount, setDepositDeductAmount] = useState<string>('');
    const [winningDeductAmount, setWinningDeductAmount] = useState<string>('');
    const [setDepositToZero, setSetDepositToZero] = useState(false);
    const [setWinningToZero, setSetWinningToZero] = useState(false);

    useEffect(() => {
        // Check if user is admin
        if (!user || user.role !== 'admin') {
            toast.error('Access denied. Admin privileges required.');
            navigate('/');
            return;
        }

        fetchDashboardData();
    }, [user, navigate, statusFilter, disputeStatusFilter, activeTab, userPage, userSearch, roomStatusFilter, roomPage]);

    const fetchDashboardData = async () => {
        const token = getAuthToken();
        if (!token) {
            navigate('/login');
            return;
        }

        try {
            setLoading(true);
            const statsResponse = await adminApiService.getDashboardStats(token);

            if (statsResponse.success && statsResponse.data) {
                setStats(statsResponse.data);
            }

            if (activeTab === 'withdrawals') {
                const withdrawalsResponse = await adminApiService.getAllWithdrawals(token, statusFilter as any, 1, 20);
                if (withdrawalsResponse.success && withdrawalsResponse.data) {
                    setWithdrawals(withdrawalsResponse.data.withdrawals);
                }
            } else if (activeTab === 'disputes') {
                const disputesResponse = await adminApiService.getAllDisputes(token, disputeStatusFilter as any, 1, 20);
                if (disputesResponse.success && disputesResponse.data) {
                    setDisputes(disputesResponse.data.disputes);
                }
            } else if (activeTab === 'add-balance') {
                const usersResponse = await adminApiService.getAllUsersWithWallet(
                    token,
                    userPage,
                    10,
                    userSearch || undefined
                );
                if (usersResponse.success && usersResponse.data) {
                    setUsersWithWallet(usersResponse.data.users);
                    setTotalUserPages(usersResponse.data.totalPages);
                    setTotalUsers(usersResponse.data.totalUsers);
                }
            } else if (activeTab === 'rooms') {
                setRoomsLoading(true);
                const roomsResponse = await adminApiService.getAllRooms(
                    token,
                    roomStatusFilter === 'all' ? undefined : (roomStatusFilter as any),
                    roomPage,
                    20
                );
                if (roomsResponse.success && roomsResponse.data) {
                    setRooms(roomsResponse.data);
                    setTotalRoomPages(roomsResponse.totalPages || 1);
                    setTotalRooms(roomsResponse.totalRooms || 0);
                } else {
                    setRooms([]);
                    setTotalRoomPages(1);
                    setTotalRooms(0);
                }
                setRoomsLoading(false);
            }
        } catch (error) {
            console.error('Failed to fetch dashboard data:', error);
            toast.error('Failed to load dashboard data');
        } finally {
            setLoading(false);
        }
    };

    const handleStatusUpdate = async (transactionId: string, newStatus: 'pending' | 'success' | 'cancelled') => {
        const token = getAuthToken();
        if (!token) return;

        try {
            setUpdating(transactionId);
            const response = await adminApiService.updateWithdrawalStatus(token, transactionId, newStatus);

            if (response.success) {
                toast.success(response.message);
                fetchDashboardData();
            }
        } catch (error: any) {
            toast.error(error.message || 'Failed to update status');
        } finally {
            setUpdating(null);
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'pending': return 'bg-yellow-500';
            case 'live': return 'bg-blue-500';
            case 'ended': return 'bg-orange-500';
            case 'finished': return 'bg-green-500';
            case 'success': return 'bg-green-500';
            case 'cancelled': return 'bg-red-500';
            default: return 'bg-gray-500';
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'pending': return <Clock className="h-4 w-4" />;
            case 'success': return <CheckCircle className="h-4 w-4" />;
            case 'cancelled': return <XCircle className="h-4 w-4" />;
            default: return null;
        }
    };

    const handleRoomStatusUpdate = async (roomId: string, newStatus: 'pending' | 'live' | 'ended' | 'finished' | 'cancelled') => {
        const token = getAuthToken();
        if (!token) return;

        try {
            setUpdating(roomId);
            const response = await adminApiService.updateRoomStatus(token, roomId, newStatus);

            if (response.success) {
                toast.success(response.message);
                fetchDashboardData();
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
                fetchDashboardData();
            }
        } catch (error: any) {
            toast.error(error.message || 'Failed to cancel room');
        } finally {
            setUpdating(null);
        }
    };

    const openCancelDialog = (room: any) => {
        setSelectedRoom(room);
        setShowCancelDialog(true);
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


    const handleResolveDispute = async () => {
        if (!selectedDispute || !selectedWinnerId) {
            toast.error('Please select a winner');
            return;
        }

        const token = getAuthToken();
        if (!token) return;

        try {
            const response = await adminApiService.resolveDispute(
                token,
                selectedDispute.roomId,
                selectedWinnerId,
                adminNotes
            );
            if (response.success) {
                toast.success('Dispute resolved successfully');
                setShowResolveDialog(false);
                setSelectedDispute(null);
                setSelectedWinnerId('');
                setAdminNotes('');
                fetchDashboardData();
            }
        } catch (error: any) {
            toast.error(error.message || 'Failed to resolve dispute');
        }
    };

    const handleViewDispute = (roomId: string) => {
        const roomDisputes = disputes.filter(d => d.roomId === roomId);
        setSelectedDispute({ roomId, disputes: roomDisputes });
        setShowResolveDialog(true);
    };

    const toggleRoomExpand = (roomId: string) => {
        setExpandedRooms(prev => {
            const newSet = new Set(prev);
            if (newSet.has(roomId)) {
                newSet.delete(roomId);
            } else {
                newSet.add(roomId);
            }
            return newSet;
        });
    };

    const openScreenshotModal = (url: string, userName: string) => {
        setScreenshotModal({ isOpen: true, url, userName });
    };

    const handleAddBalance = async () => {
        if (!selectedUser || !depositAmount || parseFloat(depositAmount) <= 0) {
            toast.error('Please enter a valid amount');
            return;
        }

        const token = getAuthToken();
        if (!token) return;

        try {
            setAddingBalance(true);
            const response = await adminApiService.addDepositFundsToUser(
                token,
                selectedUser._id,
                parseFloat(depositAmount)
            );

            if (response.success) {
                toast.success(response.message);
                setSelectedUser(null);
                setDepositAmount('');
                setShowAddMoneyDialog(false);
                fetchDashboardData();
            }
        } catch (error: any) {
            toast.error(error.message || 'Failed to add balance');
        } finally {
            setAddingBalance(false);
        }
    };

    const handleDeductBalance = async () => {
        if (!selectedUser) {
            toast.error('No user selected');
            return;
        }

        const depositDeduct = depositDeductAmount ? parseFloat(depositDeductAmount) : undefined;
        const winningDeduct = winningDeductAmount ? parseFloat(winningDeductAmount) : undefined;

        if (!depositDeduct && !winningDeduct && !setDepositToZero && !setWinningToZero) {
            toast.error('Please enter deduction amounts or select balances to set to zero');
            return;
        }

        const token = getAuthToken();
        if (!token) return;

        try {
            setAddingBalance(true);
            const response = await adminApiService.updateUserBalance(
                token,
                selectedUser._id,
                depositDeduct,
                winningDeduct,
                setDepositToZero,
                setWinningToZero
            );

            if (response.success) {
                toast.success(response.message);
                setSelectedUser(null);
                setDepositDeductAmount('');
                setWinningDeductAmount('');
                setSetDepositToZero(false);
                setSetWinningToZero(false);
                setShowAddMoneyDialog(false);
                fetchDashboardData();
            }
        } catch (error: any) {
            toast.error(error.message || 'Failed to update balance');
        } finally {
            setAddingBalance(false);
        }
    };

    // Group disputes by roomId
    const groupedDisputes = disputes.reduce((acc, dispute) => {
        if (!acc[dispute.roomId]) {
            acc[dispute.roomId] = [];
        }
        acc[dispute.roomId].push(dispute);
        return acc;
    }, {} as Record<string, Dispute[]>);


    if (loading && !stats) {
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
                            onClick={() => navigate('/')}
                            className="p-2 hover:bg-muted rounded-md transition-colors"
                        >
                            <ArrowLeft className="h-5 w-5" />
                        </button>
                        <h1 className="text-lg font-bold">Admin Dashboard</h1>
                    </div>
                    <Button
                        onClick={fetchDashboardData}
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
                {/* Stats Cards */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4 lg:mb-6">
                    <Card className="border-l-4 border-l-primary">
                        <CardContent className="p-3 lg:p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-xs text-muted-foreground mb-1">Users</p>
                                    <p className="text-xl lg:text-2xl font-bold">{stats?.totalUsers || 0}</p>
                                </div>
                                <Users className="h-8 w-8 lg:h-10 lg:w-10 text-primary opacity-20" />
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-l-4 border-l-yellow-500">
                        <CardContent className="p-3 lg:p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-xs text-muted-foreground mb-1">Pending</p>
                                    <p className="text-xl lg:text-2xl font-bold">{stats?.withdrawals.pending.count || 0}</p>
                                    <p className="text-xs text-muted-foreground flex items-center gap-0.5">
                                        <IndianRupee className="h-3 w-3" />
                                        {stats?.withdrawals.pending.amount || 0}
                                    </p>
                                </div>
                                <Clock className="h-8 w-8 lg:h-10 lg:w-10 text-yellow-500 opacity-20" />
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-l-4 border-l-green-500">
                        <CardContent className="p-3 lg:p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-xs text-muted-foreground mb-1">Success</p>
                                    <p className="text-xl lg:text-2xl font-bold">{stats?.withdrawals.success || 0}</p>
                                </div>
                                <CheckCircle className="h-8 w-8 lg:h-10 lg:w-10 text-green-500 opacity-20" />
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-l-4 border-l-red-500">
                        <CardContent className="p-3 lg:p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-xs text-muted-foreground mb-1">Cancelled</p>
                                    <p className="text-xl lg:text-2xl font-bold">{stats?.withdrawals.cancelled || 0}</p>
                                </div>
                                <XCircle className="h-8 w-8 lg:h-10 lg:w-10 text-red-500 opacity-20" />
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Tabs for Withdrawals, Rooms, and Disputes */}
                <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
                    <TabsList className="grid w-full grid-cols-4">
                        <TabsTrigger value="withdrawals" className="gap-2">
                            <IndianRupee className="h-4 w-4" />
                            Withdrawals
                        </TabsTrigger>
                        <TabsTrigger value="rooms" className="gap-2">
                            <Users className="h-4 w-4" />
                            Rooms
                        </TabsTrigger>
                        <TabsTrigger value="disputes" className="gap-2">
                            <AlertTriangle className="h-4 w-4" />
                            Disputes
                        </TabsTrigger>
                        <TabsTrigger value="add-balance" className="gap-2">
                            <Users className="h-4 w-4" />
                            Add Balance
                        </TabsTrigger>
                    </TabsList>

                    {/* Withdrawals Tab */}
                    <TabsContent value="withdrawals">
                        <Card>
                            <CardHeader className="p-3 lg:p-6">
                                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                                    <div>
                                        <CardTitle className="text-base lg:text-lg">Withdrawals</CardTitle>
                                        <CardDescription className="text-xs lg:text-sm">Manage withdrawal requests</CardDescription>
                                    </div>
                                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                                        <SelectTrigger className="w-full sm:w-[150px]">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="pending">Pending</SelectItem>
                                            <SelectItem value="success">Success</SelectItem>
                                            <SelectItem value="cancelled">Cancelled</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </CardHeader>
                            <CardContent className="p-0 lg:p-6 lg:pt-0">
                                {withdrawals.length === 0 ? (
                                    <p className="text-center text-muted-foreground py-8 text-sm">No withdrawals found</p>
                                ) : (
                                    <>
                                        {/* Desktop Table View */}
                                        <div className="hidden lg:block rounded-md border">
                                            <Table>
                                                <TableHeader>
                                                    <TableRow>
                                                        <TableHead>User</TableHead>
                                                        <TableHead>Amount</TableHead>
                                                        <TableHead>Method</TableHead>
                                                        <TableHead>Details</TableHead>
                                                        <TableHead>Status</TableHead>
                                                        <TableHead>Date</TableHead>
                                                        <TableHead className="text-right">Actions</TableHead>
                                                    </TableRow>
                                                </TableHeader>
                                                <TableBody>
                                                    {withdrawals.map((withdrawal) => (
                                                        <TableRow key={withdrawal.transactionId}>
                                                            <TableCell>
                                                                <div>
                                                                    <p className="font-medium text-sm">{withdrawal.user.fullName}</p>
                                                                    <p className="text-xs text-muted-foreground">@{withdrawal.user.username}</p>
                                                                    <p className="text-xs text-muted-foreground">{withdrawal.user.mobileNumber}</p>
                                                                </div>
                                                            </TableCell>
                                                            <TableCell>
                                                                <div className="flex items-center gap-1 font-semibold">
                                                                    <IndianRupee className="h-3.5 w-3.5" />
                                                                    {withdrawal.amount}
                                                                </div>
                                                            </TableCell>
                                                            <TableCell>
                                                                <span className="text-sm capitalize">{withdrawal.withdrawMethod}</span>
                                                            </TableCell>
                                                            <TableCell>
                                                                <div className="text-xs space-y-0.5 max-w-[200px]">
                                                                    {withdrawal.upiId && (
                                                                        <p className="truncate">UPI: {withdrawal.upiId}</p>
                                                                    )}
                                                                    {withdrawal.bankAccountNumber && (
                                                                        <p className="truncate">A/C: {withdrawal.bankAccountNumber}</p>
                                                                    )}
                                                                </div>
                                                            </TableCell>
                                                            <TableCell>
                                                                <Badge className={`${getStatusColor(withdrawal.status)} text-white text-xs`}>
                                                                    {getStatusIcon(withdrawal.status)}
                                                                    <span className="ml-1 capitalize">{withdrawal.status}</span>
                                                                </Badge>
                                                            </TableCell>
                                                            <TableCell>
                                                                <span className="text-xs text-muted-foreground">
                                                                    {new Date(withdrawal.createdAt).toLocaleDateString()}
                                                                </span>
                                                            </TableCell>
                                                            <TableCell className="text-right">
                                                                <div className="flex justify-end gap-2">
                                                                    {withdrawal.status === 'pending' && (
                                                                        <>
                                                                            <Button
                                                                                onClick={() => handleStatusUpdate(withdrawal.transactionId, 'success')}
                                                                                disabled={updating === withdrawal.transactionId}
                                                                                size="sm"
                                                                                className="bg-green-600 hover:bg-green-700 h-8 px-3"
                                                                            >
                                                                                <CheckCircle className="h-3.5 w-3.5" />
                                                                            </Button>
                                                                            <Button
                                                                                onClick={() => handleStatusUpdate(withdrawal.transactionId, 'cancelled')}
                                                                                disabled={updating === withdrawal.transactionId}
                                                                                size="sm"
                                                                                variant="destructive"
                                                                                className="h-8 px-3"
                                                                            >
                                                                                <XCircle className="h-3.5 w-3.5" />
                                                                            </Button>
                                                                        </>
                                                                    )}
                                                                    {withdrawal.status === 'cancelled' && (
                                                                        <Button
                                                                            onClick={() => handleStatusUpdate(withdrawal.transactionId, 'pending')}
                                                                            disabled={updating === withdrawal.transactionId}
                                                                            size="sm"
                                                                            variant="outline"
                                                                            className="h-8"
                                                                        >
                                                                            <Clock className="h-3.5 w-3.5 mr-1" />
                                                                            Reprocess
                                                                        </Button>
                                                                    )}
                                                                </div>
                                                            </TableCell>
                                                        </TableRow>
                                                    ))}
                                                </TableBody>
                                            </Table>
                                        </div>

                                        {/* Mobile Card View */}
                                        <div className="lg:hidden space-y-2 p-3">
                                            {withdrawals.map((withdrawal) => (
                                                <Card key={withdrawal.transactionId} className="border">
                                                    <CardContent className="p-3">
                                                        <div className="space-y-2">
                                                            <div className="flex items-start justify-between gap-2">
                                                                <div className="flex-1 min-w-0">
                                                                    <p className="font-semibold text-sm truncate">{withdrawal.user.fullName}</p>
                                                                    <p className="text-xs text-muted-foreground truncate">@{withdrawal.user.username}</p>
                                                                    <p className="text-xs text-muted-foreground">{withdrawal.user.mobileNumber}</p>
                                                                </div>
                                                                <Badge className={`${getStatusColor(withdrawal.status)} text-white text-xs flex items-center gap-1 shrink-0`}>
                                                                    {getStatusIcon(withdrawal.status)}
                                                                    <span className="capitalize">{withdrawal.status}</span>
                                                                </Badge>
                                                            </div>

                                                            <div className="flex items-center gap-1 text-lg font-bold">
                                                                <IndianRupee className="h-4 w-4" />
                                                                {withdrawal.amount}
                                                            </div>

                                                            <div className="bg-muted p-2 rounded text-xs space-y-1">
                                                                <p><span className="text-muted-foreground">Method:</span> <span className="font-medium capitalize">{withdrawal.withdrawMethod}</span></p>
                                                                {withdrawal.upiId && (
                                                                    <p className="truncate"><span className="text-muted-foreground">UPI:</span> <span className="font-medium">{withdrawal.upiId}</span></p>
                                                                )}
                                                                {withdrawal.bankAccountNumber && (
                                                                    <p className="truncate"><span className="text-muted-foreground">A/C:</span> <span className="font-medium">{withdrawal.bankAccountNumber}</span></p>
                                                                )}
                                                                <p className="text-muted-foreground">
                                                                    {new Date(withdrawal.createdAt).toLocaleString('en-IN', {
                                                                        day: '2-digit',
                                                                        month: 'short',
                                                                        year: 'numeric',
                                                                        hour: '2-digit',
                                                                        minute: '2-digit'
                                                                    })}
                                                                </p>
                                                            </div>

                                                            {withdrawal.status === 'pending' && (
                                                                <div className="flex gap-2 pt-1">
                                                                    <Button
                                                                        onClick={() => handleStatusUpdate(withdrawal.transactionId, 'success')}
                                                                        disabled={updating === withdrawal.transactionId}
                                                                        className="flex-1 bg-green-600 hover:bg-green-700 h-8 text-xs"
                                                                    >
                                                                        <CheckCircle className="h-3.5 w-3.5 mr-1" />
                                                                        Approve
                                                                    </Button>
                                                                    <Button
                                                                        onClick={() => handleStatusUpdate(withdrawal.transactionId, 'cancelled')}
                                                                        disabled={updating === withdrawal.transactionId}
                                                                        variant="destructive"
                                                                        className="flex-1 h-8 text-xs"
                                                                    >
                                                                        <XCircle className="h-3.5 w-3.5 mr-1" />
                                                                        Reject
                                                                    </Button>
                                                                </div>
                                                            )}

                                                            {withdrawal.status === 'cancelled' && (
                                                                <Button
                                                                    onClick={() => handleStatusUpdate(withdrawal.transactionId, 'pending')}
                                                                    disabled={updating === withdrawal.transactionId}
                                                                    variant="outline"
                                                                    className="w-full h-8 text-xs"
                                                                >
                                                                    <Clock className="h-3.5 w-3.5 mr-1" />
                                                                    Move to Pending
                                                                </Button>
                                                            )}
                                                        </div>
                                                    </CardContent>
                                                </Card>
                                            ))}
                                        </div>
                                    </>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* Rooms Tab */}
                    <TabsContent value="rooms">
                        <Card>
                            <CardHeader className="p-3 lg:p-6">
                                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                                    <div>
                                        <CardTitle className="text-base lg:text-lg">Room Management</CardTitle>
                                        <CardDescription className="text-xs lg:text-sm">Manage all game rooms</CardDescription>
                                    </div>
                                    <Select value={roomStatusFilter} onValueChange={setRoomStatusFilter}>
                                        <SelectTrigger className="w-full sm:w-[150px]">
                                            <SelectValue />
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
                            </CardHeader>
                            <CardContent className="p-0 lg:p-6 lg:pt-0">
                                {roomsLoading ? (
                                    <div className="flex justify-center py-8">
                                        <RefreshCw className="h-6 w-6 animate-spin text-primary" />
                                    </div>
                                ) : rooms.length === 0 ? (
                                    <p className="text-center text-muted-foreground py-8 text-sm">No rooms found</p>
                                ) : (
                                    <>
                                        <div className="overflow-x-auto rounded-md border">
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
                                                    {rooms.map((room) => (
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
                                                                {room.players.filter((p: any) => p.userId).length}/2
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
                                                                            handleRoomStatusUpdate(room.roomId, value as any)
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
                                                    ))}
                                                </TableBody>
                                            </Table>
                                        </div>

                                        {/* Pagination */}
                                        {totalRoomPages > 1 && (
                                            <div className="flex items-center justify-center gap-2 mt-4">
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => setRoomPage(p => Math.max(1, p - 1))}
                                                    disabled={roomPage === 1}
                                                >
                                                    Previous
                                                </Button>
                                                <span className="text-sm">
                                                    Page {roomPage} of {totalRoomPages}
                                                </span>
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => setRoomPage(p => Math.min(totalRoomPages, p + 1))}
                                                    disabled={roomPage === totalRoomPages}
                                                >
                                                    Next
                                                </Button>
                                            </div>
                                        )}
                                    </>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* Disputes Tab */}
                    <TabsContent value="disputes">
                        <Card>
                            <CardHeader className="p-3 lg:p-6">
                                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                                    <div>
                                        <CardTitle className="text-base lg:text-lg">Disputes</CardTitle>
                                        <CardDescription className="text-xs lg:text-sm">Manage room result disputes (grouped by room)</CardDescription>
                                    </div>
                                    <Select value={disputeStatusFilter} onValueChange={setDisputeStatusFilter}>
                                        <SelectTrigger className="w-full sm:w-[150px]">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="pending">Pending</SelectItem>
                                            <SelectItem value="verified">Verified</SelectItem>
                                            <SelectItem value="rejected">Rejected</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </CardHeader>
                            <CardContent className="p-3 lg:p-6 lg:pt-0">
                                {Object.keys(groupedDisputes).length === 0 ? (
                                    <p className="text-center text-muted-foreground py-8 text-sm">No disputes found</p>
                                ) : (
                                    <div className="space-y-3">
                                        {Object.entries(groupedDisputes).map(([roomId, roomDisputes]) => {
                                            const isExpanded = expandedRooms.has(roomId);
                                            const allPending = roomDisputes.every(d => d.status === 'pending');

                                            return (
                                                <Card key={roomId} className="border-2">
                                                    <Collapsible open={isExpanded} onOpenChange={() => toggleRoomExpand(roomId)}>
                                                        <CardContent className="p-0">
                                                            {/* Room Header - Always Visible */}
                                                            <CollapsibleTrigger asChild>
                                                                <div className="p-4 hover:bg-muted/50 cursor-pointer transition-colors">
                                                                    <div className="flex items-start justify-between gap-3">
                                                                        <div className="flex-1 space-y-2">
                                                                            <div className="flex items-center gap-2 flex-wrap">
                                                                                <span className="font-mono font-semibold text-sm lg:text-base">{roomId}</span>
                                                                                <Badge variant="outline" className="text-xs">
                                                                                    {roomDisputes.length} {roomDisputes.length === 1 ? 'Dispute' : 'Disputes'}
                                                                                </Badge>
                                                                                {allPending && (
                                                                                    <Badge className="bg-yellow-500 text-xs">Pending</Badge>
                                                                                )}
                                                                            </div>
                                                                            <div className="text-xs lg:text-sm text-muted-foreground">
                                                                                Click to view all disputes for this room
                                                                            </div>
                                                                        </div>
                                                                        <div className="flex flex-col items-end gap-2">
                                                                            {roomDisputes[0]?.ludoRoomCode && (
                                                                                <div className="flex items-center gap-2">
                                                                                    <span className="text-xs text-muted-foreground">Ludo Code:</span>
                                                                                    <Badge variant="secondary" className="font-mono text-xs font-semibold">
                                                                                        {roomDisputes[0].ludoRoomCode}
                                                                                    </Badge>
                                                                                </div>
                                                                            )}
                                                                            <div className="flex items-center gap-2">
                                                                                {allPending && (
                                                                                    <Button
                                                                                        onClick={(e) => {
                                                                                            e.stopPropagation();
                                                                                            handleViewDispute(roomId);
                                                                                        }}
                                                                                        size="sm"
                                                                                        className="gap-1"
                                                                                    >
                                                                                        Resolve
                                                                                    </Button>
                                                                                )}
                                                                                {isExpanded ? (
                                                                                    <ChevronUp className="h-5 w-5 text-muted-foreground" />
                                                                                ) : (
                                                                                    <ChevronDown className="h-5 w-5 text-muted-foreground" />
                                                                                )}
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </CollapsibleTrigger>

                                                            {/* Expanded Content - Show All Disputes */}
                                                            <CollapsibleContent>
                                                                <div className="border-t">
                                                                    {roomDisputes.map((dispute, index) => (
                                                                        <div
                                                                            key={dispute.disputeId}
                                                                            className={`p-4 ${index !== 0 ? 'border-t' : ''} bg-muted/20`}
                                                                        >
                                                                            <div className="space-y-3">
                                                                                {/* User Info */}
                                                                                <div className="flex items-start justify-between gap-3">
                                                                                    <div className="flex-1 space-y-1">
                                                                                        <p className="font-semibold text-sm lg:text-base">
                                                                                            {dispute.claimedBy.fullName}
                                                                                        </p>
                                                                                        <p className="text-xs text-muted-foreground">
                                                                                            @{dispute.claimedBy.username}
                                                                                        </p>
                                                                                        <p className="text-xs font-medium text-foreground">
                                                                                            📱 {dispute.claimedBy.mobileNumber}
                                                                                        </p>
                                                                                        <p className="text-xs text-muted-foreground">
                                                                                            Ludo: {dispute.ludoUsername}
                                                                                        </p>
                                                                                    </div>
                                                                                    <div className="flex flex-col gap-2 items-end">
                                                                                        <Badge className={dispute.claimType === 'win' ? 'bg-green-500' : 'bg-red-500'}>
                                                                                            {dispute.claimType.toUpperCase()}
                                                                                        </Badge>
                                                                                        <Badge className={`${getStatusColor(dispute.status)} text-white text-xs`}>
                                                                                            {dispute.status}
                                                                                        </Badge>
                                                                                    </div>
                                                                                </div>

                                                                                {/* Screenshot */}
                                                                                {dispute.claimType === 'win' && (
                                                                                    <div className="space-y-2">
                                                                                        <p className="text-sm font-medium">Screenshot Evidence:</p>
                                                                                        <div className="relative group">
                                                                                            <img
                                                                                                src={adminApiService.getDisputeScreenshotUrl(dispute.disputeId)}
                                                                                                alt={`${dispute.claimedBy.fullName}'s win screenshot`}
                                                                                                className="w-full rounded-lg border-2 cursor-pointer hover:opacity-90 transition-opacity"
                                                                                                onClick={() => openScreenshotModal(
                                                                                                    adminApiService.getDisputeScreenshotUrl(dispute.disputeId),
                                                                                                    dispute.claimedBy.fullName
                                                                                                )}
                                                                                            />
                                                                                            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/30 rounded-lg">
                                                                                                <div className="bg-white rounded-full p-3">
                                                                                                    <ZoomIn className="h-6 w-6 text-black" />
                                                                                                </div>
                                                                                            </div>
                                                                                        </div>
                                                                                        <p className="text-xs text-muted-foreground text-center">
                                                                                            Click image to zoom
                                                                                        </p>
                                                                                    </div>
                                                                                )}

                                                                                {/* Date */}
                                                                                <p className="text-xs text-muted-foreground">
                                                                                    Claimed: {new Date(dispute.createdAt).toLocaleString()}
                                                                                </p>

                                                                                {/* Admin Notes if verified/rejected */}
                                                                                {dispute.adminNotes && (
                                                                                    <div className="bg-muted p-2 rounded text-xs">
                                                                                        <p className="font-medium mb-1">Admin Notes:</p>
                                                                                        <p>{dispute.adminNotes}</p>
                                                                                    </div>
                                                                                )}
                                                                            </div>
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            </CollapsibleContent>
                                                        </CardContent>
                                                    </Collapsible>
                                                </Card>
                                            );
                                        })}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* Add Balance Tab */}
                    <TabsContent value="add-balance">
                        <Card>
                            <CardHeader className="p-3 lg:p-6">
                                <CardTitle className="text-base lg:text-lg">Manage User Balances</CardTitle>
                                <CardDescription className="text-xs lg:text-sm">
                                    View all users and add deposit balance
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="p-3 lg:p-6 space-y-4">
                                <div className="space-y-2">
                                    <Input
                                        type="text"
                                        placeholder="Search by name, username, or mobile number..."
                                        value={userSearch}
                                        onChange={(e) => {
                                            setUserSearch(e.target.value);
                                            setUserPage(1);
                                        }}
                                        className="w-full"
                                    />
                                </div>

                                {loading ? (
                                    <div className="flex justify-center py-8">
                                        <RefreshCw className="h-8 w-8 animate-spin text-primary" />
                                    </div>
                                ) : usersWithWallet.length === 0 ? (
                                    <p className="text-center text-muted-foreground text-sm py-8">
                                        No users found
                                    </p>
                                ) : (
                                    <>
                                        <div className="overflow-x-auto">
                                            <Table>
                                                <TableHeader>
                                                    <TableRow>
                                                        <TableHead className="text-xs">Name</TableHead>
                                                        <TableHead className="text-xs">Mobile</TableHead>
                                                        <TableHead className="text-xs text-right">Wallet Balance</TableHead>
                                                        <TableHead className="text-xs text-center">Action</TableHead>
                                                    </TableRow>
                                                </TableHeader>
                                                <TableBody>
                                                    {usersWithWallet.map((user) => (
                                                        <TableRow key={user._id}>
                                                            <TableCell className="text-xs">
                                                                <div>
                                                                    <p className="font-medium">{user.fullName}</p>
                                                                    <p className="text-muted-foreground text-[10px]">@{user.username}</p>
                                                                </div>
                                                            </TableCell>
                                                            <TableCell className="text-xs">{user.mobileNumber}</TableCell>
                                                            <TableCell className="text-xs text-right">
                                                                <div className="flex flex-col items-end">
                                                                    <p className="font-bold text-green-600">₹{user.wallet.totalBalance.toFixed(2)}</p>
                                                                    <p className="text-[10px] text-muted-foreground">
                                                                        D: ₹{user.wallet.depositBalance.toFixed(2)} | W: ₹{user.wallet.winningBalance.toFixed(2)}
                                                                    </p>
                                                                </div>
                                                            </TableCell>
                                                            <TableCell className="text-center">
                                                                <Button
                                                                    size="sm"
                                                                    onClick={() => {
                                                                        setSelectedUser(user);
                                                                        setDepositAmount('');
                                                                        setDepositDeductAmount('');
                                                                        setWinningDeductAmount('');
                                                                        setSetDepositToZero(false);
                                                                        setSetWinningToZero(false);
                                                                        setBalanceOperation('add');
                                                                        setShowAddMoneyDialog(true);
                                                                    }}
                                                                    className="h-7 text-xs"
                                                                >
                                                                    Add Money
                                                                </Button>
                                                            </TableCell>
                                                        </TableRow>
                                                    ))}
                                                </TableBody>
                                            </Table>
                                        </div>

                                        {/* Pagination */}
                                        <div className="flex items-center justify-between pt-4 border-t">
                                            <p className="text-xs text-muted-foreground">
                                                Showing {((userPage - 1) * 10) + 1} to {Math.min(userPage * 10, totalUsers)} of {totalUsers} users
                                            </p>
                                            <div className="flex gap-2">
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() => setUserPage(prev => Math.max(1, prev - 1))}
                                                    disabled={userPage === 1}
                                                >
                                                    Previous
                                                </Button>
                                                <div className="flex items-center gap-1 px-3 text-xs">
                                                    Page {userPage} of {totalUserPages}
                                                </div>
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() => setUserPage(prev => Math.min(totalUserPages, prev + 1))}
                                                    disabled={userPage === totalUserPages}
                                                >
                                                    Next
                                                </Button>
                                            </div>
                                        </div>
                                    </>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>

                {/* Resolve Dispute Dialog */}
                <Dialog open={showResolveDialog} onOpenChange={setShowResolveDialog}>
                    <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                            <DialogTitle>Resolve Dispute - Room {selectedDispute?.roomId}</DialogTitle>
                            <DialogDescription>
                                Review all claims and select the winner
                            </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                            {selectedDispute?.disputes.map((dispute) => (
                                <Card key={dispute.disputeId} className={selectedWinnerId === dispute.claimedBy.id ? 'border-green-500 border-2' : ''}>
                                    <CardContent className="p-4 space-y-3">
                                        <div className="flex items-start justify-between">
                                            <div>
                                                <p className="font-semibold">{dispute.claimedBy.fullName}</p>
                                                <p className="text-sm text-muted-foreground">@{dispute.claimedBy.username}</p>
                                                <p className="text-sm text-muted-foreground">{dispute.claimedBy.mobileNumber}</p>
                                            </div>
                                            <Badge className={dispute.claimType === 'win' ? 'bg-green-500' : 'bg-red-500'}>
                                                {dispute.claimType}
                                            </Badge>
                                        </div>

                                        <div>
                                            <p className="text-sm">
                                                <span className="text-muted-foreground">Ludo Username:</span> {dispute.ludoUsername}
                                            </p>
                                            <p className="text-xs text-muted-foreground">
                                                Claimed: {new Date(dispute.createdAt).toLocaleString()}
                                            </p>
                                        </div>

                                        {dispute.claimType === 'win' && (
                                            <div>
                                                <p className="text-sm font-medium mb-2">Screenshot:</p>
                                                <div className="relative group cursor-pointer">
                                                    <img
                                                        src={adminApiService.getDisputeScreenshotUrl(dispute.disputeId)}
                                                        alt="Dispute screenshot"
                                                        className="w-full rounded-md border hover:opacity-90 transition-opacity"
                                                        onClick={() => openScreenshotModal(
                                                            adminApiService.getDisputeScreenshotUrl(dispute.disputeId),
                                                            dispute.claimedBy.fullName
                                                        )}
                                                    />
                                                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/20 rounded-md">
                                                        <div className="bg-white rounded-full p-2">
                                                            <ZoomIn className="h-5 w-5 text-black" />
                                                        </div>
                                                    </div>
                                                </div>
                                                <p className="text-xs text-muted-foreground text-center mt-1">Click to zoom</p>
                                            </div>
                                        )}

                                        {dispute.claimType === 'win' && (
                                            <Button
                                                onClick={() => setSelectedWinnerId(dispute.claimedBy.id)}
                                                variant={selectedWinnerId === dispute.claimedBy.id ? 'default' : 'outline'}
                                                className="w-full"
                                            >
                                                {selectedWinnerId === dispute.claimedBy.id ? '✓ Selected as Winner' : 'Select as Winner'}
                                            </Button>
                                        )}
                                    </CardContent>
                                </Card>
                            ))}

                            <div className="space-y-2">
                                <label className="text-sm font-medium">Admin Notes (Optional)</label>
                                <Textarea
                                    value={adminNotes}
                                    onChange={(e) => setAdminNotes(e.target.value)}
                                    placeholder="Add notes about your decision..."
                                    rows={3}
                                />
                            </div>

                            <div className="flex gap-2">
                                <Button
                                    onClick={handleResolveDispute}
                                    disabled={!selectedWinnerId}
                                    className="flex-1"
                                >
                                    Resolve Dispute
                                </Button>
                                <Button
                                    variant="ghost"
                                    onClick={() => {
                                        setShowResolveDialog(false);
                                        setSelectedDispute(null);
                                        setSelectedWinnerId('');
                                        setAdminNotes('');
                                    }}
                                >
                                    Cancel
                                </Button>
                            </div>
                        </div>
                    </DialogContent>
                </Dialog>

                {/* Screenshot Zoom Modal */}
                <Dialog open={screenshotModal.isOpen} onOpenChange={(open) => setScreenshotModal({ ...screenshotModal, isOpen: open })}>
                    <DialogContent className="max-w-[95vw] max-h-[95vh] p-0">
                        <div className="relative w-full h-full bg-black">
                            {/* Close button */}
                            <button
                                onClick={() => setScreenshotModal({ isOpen: false, url: '', userName: '' })}
                                className="absolute top-4 right-4 z-50 bg-white rounded-full p-2 hover:bg-gray-200 transition-colors"
                            >
                                <X className="h-5 w-5 text-black" />
                            </button>

                            {/* Image */}
                            <div className="p-4 max-h-[95vh] overflow-auto">
                                <div className="mb-3 text-center">
                                    <p className="text-white font-semibold text-lg">{screenshotModal.userName}</p>
                                    <p className="text-gray-300 text-sm">Win Claim Screenshot</p>
                                </div>
                                <img
                                    src={screenshotModal.url}
                                    alt={`${screenshotModal.userName}'s screenshot`}
                                    className="w-full h-auto object-contain"
                                    style={{ maxHeight: 'calc(95vh - 120px)' }}
                                />
                            </div>
                        </div>
                    </DialogContent>
                </Dialog>

                {/* Add/Deduct Money Dialog */}
                <Dialog open={showAddMoneyDialog} onOpenChange={setShowAddMoneyDialog}>
                    <DialogContent className="sm:max-w-md">
                        <DialogHeader>
                            <DialogTitle>Manage User Balance</DialogTitle>
                            <DialogDescription>
                                {balanceOperation === 'add' ? 'Add deposit balance' : 'Deduct balance or set to zero'} for {selectedUser?.fullName}
                            </DialogDescription>
                        </DialogHeader>
                        {selectedUser && (
                            <div className="space-y-4">
                                <div className="bg-muted p-3 rounded-lg space-y-1">
                                    <p className="text-sm font-medium">{selectedUser.fullName}</p>
                                    <p className="text-xs text-muted-foreground">@{selectedUser.username}</p>
                                    <p className="text-xs text-muted-foreground">{selectedUser.mobileNumber}</p>
                                    <div className="mt-2 space-y-1">
                                        <p className="text-sm font-bold text-green-600">
                                            Total: ₹{selectedUser.wallet.totalBalance.toFixed(2)}
                                        </p>
                                        <p className="text-xs text-muted-foreground">
                                            Deposit: ₹{selectedUser.wallet.depositBalance.toFixed(2)} | Winning: ₹{selectedUser.wallet.winningBalance.toFixed(2)}
                                        </p>
                                    </div>
                                </div>

                                {/* Operation Type Toggle */}
                                <div className="flex gap-2">
                                    <Button
                                        variant={balanceOperation === 'add' ? 'default' : 'outline'}
                                        onClick={() => setBalanceOperation('add')}
                                        className="flex-1"
                                        size="sm"
                                    >
                                        Add Money
                                    </Button>
                                    <Button
                                        variant={balanceOperation === 'deduct' ? 'default' : 'outline'}
                                        onClick={() => setBalanceOperation('deduct')}
                                        className="flex-1"
                                        size="sm"
                                    >
                                        Deduct/Reset
                                    </Button>
                                </div>

                                {balanceOperation === 'add' ? (
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Amount (₹)</label>
                                        <Input
                                            type="number"
                                            placeholder="Enter amount to add"
                                            value={depositAmount}
                                            onChange={(e) => setDepositAmount(e.target.value)}
                                            min="1"
                                            step="1"
                                            autoFocus
                                        />
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium">Deduct from Deposit Balance (₹)</label>
                                            <Input
                                                type="number"
                                                placeholder="Enter amount to deduct"
                                                value={depositDeductAmount}
                                                onChange={(e) => setDepositDeductAmount(e.target.value)}
                                                min="0"
                                                step="1"
                                                disabled={setDepositToZero}
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <label className="text-sm font-medium">Deduct from Winning Balance (₹)</label>
                                            <Input
                                                type="number"
                                                placeholder="Enter amount to deduct"
                                                value={winningDeductAmount}
                                                onChange={(e) => setWinningDeductAmount(e.target.value)}
                                                min="0"
                                                step="1"
                                                disabled={setWinningToZero}
                                            />
                                        </div>

                                        <div className="space-y-2 pt-2 border-t">
                                            <label className="flex items-center space-x-2 cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    checked={setDepositToZero}
                                                    onChange={(e) => {
                                                        setSetDepositToZero(e.target.checked);
                                                        if (e.target.checked) setDepositDeductAmount('');
                                                    }}
                                                    className="rounded"
                                                />
                                                <span className="text-sm">Set Deposit Balance to Zero</span>
                                            </label>
                                            <label className="flex items-center space-x-2 cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    checked={setWinningToZero}
                                                    onChange={(e) => {
                                                        setSetWinningToZero(e.target.checked);
                                                        if (e.target.checked) setWinningDeductAmount('');
                                                    }}
                                                    className="rounded"
                                                />
                                                <span className="text-sm">Set Winning Balance to Zero</span>
                                            </label>
                                        </div>
                                    </div>
                                )}

                                <div className="flex gap-2">
                                    <Button
                                        variant="outline"
                                        onClick={() => {
                                            setShowAddMoneyDialog(false);
                                            setSelectedUser(null);
                                            setDepositAmount('');
                                            setDepositDeductAmount('');
                                            setWinningDeductAmount('');
                                            setSetDepositToZero(false);
                                            setSetWinningToZero(false);
                                        }}
                                        disabled={addingBalance}
                                        className="flex-1"
                                    >
                                        Cancel
                                    </Button>
                                    <Button
                                        onClick={balanceOperation === 'add' ? handleAddBalance : handleDeductBalance}
                                        disabled={
                                            addingBalance ||
                                            (balanceOperation === 'add' && (!depositAmount || parseFloat(depositAmount) <= 0)) ||
                                            (balanceOperation === 'deduct' && !depositDeductAmount && !winningDeductAmount && !setDepositToZero && !setWinningToZero)
                                        }
                                        className="flex-1"
                                    >
                                        {addingBalance ? (
                                            <>
                                                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                                                Processing...
                                            </>
                                        ) : (
                                            <>
                                                <IndianRupee className="h-4 w-4 mr-2" />
                                                {balanceOperation === 'add' ? 'Add Money' : 'Update Balance'}
                                            </>
                                        )}
                                    </Button>
                                </div>
                            </div>
                        )}
                    </DialogContent>
                </Dialog>

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
                                <label className="text-sm font-medium">Cancellation Reason</label>
                                <Textarea
                                    value={cancelReason}
                                    onChange={(e) => setCancelReason(e.target.value)}
                                    placeholder="Enter reason for cancellation..."
                                    className="mt-2"
                                    rows={4}
                                />
                            </div>
                            <div className="flex gap-2">
                                <Button
                                    variant="outline"
                                    onClick={() => {
                                        setShowCancelDialog(false);
                                        setSelectedRoom(null);
                                        setCancelReason('');
                                    }}
                                    className="flex-1"
                                >
                                    Cancel
                                </Button>
                                <Button
                                    variant="destructive"
                                    onClick={handleCancelRoom}
                                    disabled={updating === selectedRoom?.roomId}
                                    className="flex-1"
                                >
                                    {updating === selectedRoom?.roomId ? (
                                        <>
                                            <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                                            Cancelling...
                                        </>
                                    ) : (
                                        'Cancel Room'
                                    )}
                                </Button>
                            </div>
                        </div>
                    </DialogContent>
                </Dialog>

            </main>
        </div>
    );
};

export default AdminDashboard;
