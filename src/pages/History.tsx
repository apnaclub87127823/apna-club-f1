import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '@/components/Header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowUpRight, ArrowDownLeft, TrendingUp, IndianRupee, Search, Filter, ChevronRight } from 'lucide-react';
import { apiService } from '@/lib/api';
import { getAuthToken } from '@/lib/auth';
import { useToast } from '@/hooks/use-toast';

interface Transaction {
    _id: string;
    type: 'deposit' | 'withdraw' | 'winning' | 'penalty' | 'referral';
    amount: number;
    status: 'pending' | 'success' | 'failed';
    description: string;
    withdrawMethod?: 'upi' | 'bank';
    upiId?: string;
    bankAccountNumber?: string;
    createdAt: string;
}

const History = () => {
    const navigate = useNavigate();
    const { toast } = useToast();
    const [activeFilter, setActiveFilter] = useState('All');
    const [searchTerm, setSearchTerm] = useState('');
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [loading, setLoading] = useState(false);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const limit = 10;

    const filters = [
        { id: 'All', label: 'All', color: 'bg-primary' },
        { id: 'withdraw', label: 'Withdraw', color: 'bg-red-500' },
        { id: 'deposit', label: 'Deposit', color: 'bg-green-500' },
        { id: 'referral', label: 'Referral', color: 'bg-blue-500' }
    ];

    const fetchTransactions = async () => {
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

            const filterType = activeFilter === 'All' ? undefined : activeFilter;
            const response = await apiService.getTransactionHistory(token, page, limit, filterType);

            if (response.success && response.data) {
                const data = response.data as any;
                setTransactions(data.transactions || []);
                setTotalPages(Math.ceil((data.total || 0) / limit));
            }
        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to fetch transaction history",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTransactions();
    }, [activeFilter, page]);

    const getTransactionIcon = (type: string) => {
        switch (type) {
            case 'deposit':
                return <ArrowDownLeft className="w-4 h-4 text-green-500" />;
            case 'withdraw':
                return <ArrowUpRight className="w-4 h-4 text-red-500" />;
            case 'referral':
                return <TrendingUp className="w-4 h-4 text-blue-500" />;
            case 'winning':
                return <IndianRupee className="w-4 h-4 text-green-500" />;
            case 'penalty':
                return <IndianRupee className="w-4 h-4 text-red-500" />;
            default:
                return <IndianRupee className="w-4 h-4 text-gray-500" />;
        }
    };

    const getStatusBadge = (status: string) => {
        const colors = {
            success: 'bg-green-100 text-green-700 border-green-200',
            failed: 'bg-red-100 text-red-700 border-red-200',
            pending: 'bg-orange-100 text-orange-700 border-orange-200'
        };
        return colors[status] || 'bg-gray-100 text-gray-700 border-gray-200';
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);

        if (date.toDateString() === today.toDateString()) {
            return `Today, ${date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}`;
        } else if (date.toDateString() === yesterday.toDateString()) {
            return `Yesterday, ${date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}`;
        }

        return date.toLocaleDateString('en-IN', {
            day: '2-digit',
            month: 'short',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const filteredTransactions = transactions.filter(transaction =>
        searchTerm === '' || transaction._id.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="min-h-screen bg-gradient-to-b from-background to-background/95">
            <Header isLoggedIn={true} showTermsButton={false} showScrollingBanners={false} />

            <div className="max-w-md mx-auto px-4 py-3 space-y-3">
                {/* Compact Filter Pills */}
                <div className="flex items-center gap-2 overflow-x-auto pb-2">
                    {filters.map((filter) => (
                        <Button
                            key={filter.id}
                            variant={activeFilter === filter.id ? "default" : "outline"}
                            size="sm"
                            onClick={() => setActiveFilter(filter.id)}
                            className={`h-7 px-3 text-xs rounded-full whitespace-nowrap transition-all ${activeFilter === filter.id
                                ? 'bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm'
                                : 'border-border text-muted-foreground hover:bg-muted/50'
                                }`}
                        >
                            {filter.label}
                        </Button>
                    ))}
                </div>

                {/* Compact Search Bar */}
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                    <Input
                        placeholder="Search transaction ID..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-9 h-8 text-sm bg-card border-border"
                    />
                </div>

                {/* Transactions List */}
                <div className="bg-card rounded-lg border shadow-sm">
                    {loading ? (
                        <div className="text-center py-8">
                            <div className="animate-pulse space-y-2 px-3">
                                {[1, 2, 3].map(i => (
                                    <div key={i} className="h-12 bg-muted rounded-lg"></div>
                                ))}
                            </div>
                        </div>
                    ) : filteredTransactions.length === 0 ? (
                        <div className="text-center py-8 px-4">
                            <div className="w-12 h-12 mx-auto bg-muted rounded-full flex items-center justify-center mb-3">
                                <Filter className="h-5 w-5 text-muted-foreground" />
                            </div>
                            <h3 className="text-sm font-medium text-foreground mb-1">No Transactions</h3>
                            <p className="text-xs text-muted-foreground">
                                Your history will appear here
                            </p>
                        </div>
                    ) : (
                        <div className="divide-y divide-border">
                            {filteredTransactions.map((transaction) => (
                                <div
                                    key={transaction._id}
                                    className="flex items-center justify-between p-3 hover:bg-muted/30 transition-colors"
                                >
                                    <div className="flex items-center gap-2.5 flex-1">
                                        <div className="w-8 h-8 bg-muted rounded-full flex items-center justify-center">
                                            {getTransactionIcon(transaction.type)}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-1.5">
                                                <p className="text-xs font-semibold text-foreground capitalize">
                                                    {transaction.type}
                                                </p>
                                                <span className={`px-1.5 py-0.5 text-[10px] font-medium rounded-full border ${getStatusBadge(transaction.status)}`}>
                                                    {transaction.status}
                                                </span>
                                            </div>
                                            <p className="text-[10px] text-muted-foreground mt-0.5">
                                                {formatDate(transaction.createdAt)}
                                            </p>
                                            {transaction.withdrawMethod && (
                                                <p className="text-[10px] text-muted-foreground">
                                                    via {transaction.withdrawMethod.toUpperCase()}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className={`text-sm font-bold ${transaction.type === 'deposit' ||
                                            transaction.type === 'winning' ||
                                            transaction.type === 'referral'
                                            ? 'text-green-500'
                                            : 'text-red-500'
                                            }`}>
                                            {transaction.type === 'deposit' ||
                                                transaction.type === 'winning' ||
                                                transaction.type === 'referral' ? '+' : '-'}₹{transaction.amount}
                                        </p>
                                        <p className="text-[10px] text-muted-foreground truncate max-w-[80px]">
                                            #{transaction._id.slice(-6)}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Compact Pagination */}
                {totalPages > 1 && (
                    <div className="flex items-center justify-center gap-1.5 pt-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setPage(p => Math.max(1, p - 1))}
                            disabled={page === 1}
                            className="h-7 px-2 text-xs"
                        >
                            Prev
                        </Button>

                        <div className="flex items-center gap-1">
                            {[...Array(Math.min(3, totalPages))].map((_, i) => {
                                const pageNum = page > 2 ? page - 1 + i : i + 1;
                                if (pageNum > totalPages) return null;
                                return (
                                    <Button
                                        key={pageNum}
                                        variant={pageNum === page ? "default" : "outline"}
                                        size="sm"
                                        onClick={() => setPage(pageNum)}
                                        className="h-7 w-7 p-0 text-xs"
                                    >
                                        {pageNum}
                                    </Button>
                                );
                            })}
                            {totalPages > 3 && page < totalPages - 1 && (
                                <>
                                    <span className="text-xs text-muted-foreground px-1">...</span>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setPage(totalPages)}
                                        className="h-7 w-7 p-0 text-xs"
                                    >
                                        {totalPages}
                                    </Button>
                                </>
                            )}
                        </div>

                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                            disabled={page === totalPages}
                            className="h-7 px-2 text-xs"
                        >
                            Next
                        </Button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default History;
