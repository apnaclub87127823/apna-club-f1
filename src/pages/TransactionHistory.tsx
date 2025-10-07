import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Download, IndianRupee } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { getAuthToken } from '@/lib/auth';
import { format } from 'date-fns';
import { apiService } from '@/lib/api';

interface Transaction {
    _id: string;
    type: 'deposit' | 'withdraw' | 'winning' | 'penalty' | 'referral';
    amount: number;
    status: 'pending' | 'success' | 'failed';
    description: string;
    createdAt: string;
}

const TransactionHistory = () => {
    const navigate = useNavigate();
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    useEffect(() => {
        fetchTransactions();
    }, [page]);

    const fetchTransactions = async () => {
        setLoading(true);
        try {
            const token = getAuthToken();
            if (!token) {
                navigate('/login');
                return;
            }

            const data = await apiService.getTransactionHistory(token, page, 10);

            if (data.success && data.data) {
                const historyData = data.data as { transactions: Transaction[], totalPages: number };
                setTransactions(historyData.transactions);
                setTotalPages(historyData.totalPages);
            }
        } catch (error) {
            console.error('Failed to fetch transactions:', error);
        } finally {
            setLoading(false);
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'success':
                return 'text-green-600';
            case 'pending':
                return 'text-yellow-600';
            case 'failed':
                return 'text-red-600';
            default:
                return 'text-muted-foreground';
        }
    };

    const getTypeColor = (type: string) => {
        switch (type) {
            case 'deposit':
                return 'text-green-600';
            case 'withdraw':
                return 'text-red-600';
            case 'winning':
                return 'text-blue-600';
            case 'referral':
                return 'text-purple-600';
            case 'penalty':
                return 'text-orange-600';
            default:
                return 'text-foreground';
        }
    };

    return (
        <div className="min-h-screen bg-background">
            {/* Header */}
            <header className="flex items-center justify-between px-4 py-6 max-w-md mx-auto bg-header-pink">
                <div className="flex items-center gap-2">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => navigate('/wallet')}
                        className="p-1 hover:bg-muted"
                    >
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                    <h1 className="text-lg font-semibold">Transaction History</h1>
                </div>

                <Button
                    variant="outline"
                    className="text-xs px-3 py-1 border-blue-500 text-blue-500 hover:bg-blue-500 hover:text-white h-8 flex items-center gap-1"
                >
                    <Download className="h-3 w-3" />
                    Install App
                </Button>
            </header>

            <div className="max-w-md mx-auto px-4 py-6 space-y-4">
                {loading ? (
                    <div className="text-center py-8">
                        <p className="text-muted-foreground">Loading transactions...</p>
                    </div>
                ) : transactions.length === 0 ? (
                    <Card>
                        <CardContent className="p-6 text-center">
                            <p className="text-muted-foreground">No transactions found</p>
                        </CardContent>
                    </Card>
                ) : (
                    <>
                        {transactions.map((transaction) => (
                            <Card key={transaction._id}>
                                <CardContent className="p-4">
                                    <div className="flex items-center justify-between mb-2">
                                        <div>
                                            <p className={`font-semibold capitalize ${getTypeColor(transaction.type)}`}>
                                                {transaction.type}
                                            </p>
                                            <p className="text-sm text-muted-foreground">
                                                {format(new Date(transaction.createdAt), 'dd MMM yyyy, hh:mm a')}
                                            </p>
                                        </div>
                                        <div className="text-right">
                                            <div className="flex items-center justify-end font-bold text-lg">
                                                {transaction.type === 'withdraw' || transaction.type === 'penalty' ? '-' : '+'}
                                                <IndianRupee className="h-4 w-4" />
                                                {transaction.amount}
                                            </div>
                                            <p className={`text-sm capitalize ${getStatusColor(transaction.status)}`}>
                                                {transaction.status}
                                            </p>
                                        </div>
                                    </div>
                                    <p className="text-sm text-muted-foreground">
                                        {transaction.description}
                                    </p>
                                </CardContent>
                            </Card>
                        ))}

                        {/* Pagination */}
                        {totalPages > 1 && (
                            <div className="flex items-center justify-center gap-2 mt-6">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                                    disabled={page === 1}
                                >
                                    Previous
                                </Button>
                                <span className="text-sm text-muted-foreground">
                                    Page {page} of {totalPages}
                                </span>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                                    disabled={page === totalPages}
                                >
                                    Next
                                </Button>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
};

export default TransactionHistory;
