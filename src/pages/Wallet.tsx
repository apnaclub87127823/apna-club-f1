import React from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '@/components/Header';
import { Button } from '@/components/ui/button';
import { ArrowUpRight, ArrowDownLeft, Wallet as WalletIcon, Clock, Plus, TrendingUp, ChevronRight } from 'lucide-react';
import { useWallet } from '@/hooks/useWallet';

const Wallet = () => {
    const navigate = useNavigate();
    const { wallet, loading } = useWallet();

    return (
        <div className="min-h-screen bg-gradient-to-b from-background to-background/95">
            <Header isLoggedIn={true} showTermsButton={false} showScrollingBanners={false} />

            <div className="max-w-md mx-auto px-4 py-3 space-y-3">
                {/* Main Balance Card - Gradient */}
                <div className="relative overflow-hidden bg-gradient-to-r from-primary to-primary/80 rounded-xl p-4 shadow-lg">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-3xl"></div>
                    <div className="relative z-10">
                        <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                                <div className="bg-white/20 p-2 rounded-lg backdrop-blur">
                                    <WalletIcon className="h-5 w-5 text-white" />
                                </div>
                                <div>
                                    <p className="text-white/80 text-xs">Total Balance</p>
                                    <p className="text-white text-2xl font-bold">
                                        ₹{loading ? '...' : wallet.totalBalance}
                                    </p>
                                </div>
                            </div>
                            <Button
                                onClick={() => navigate('/wallet/history')}
                                variant="ghost"
                                size="sm"
                                className="text-white hover:bg-white/20 p-2"
                            >
                                <Clock className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Balance Breakdown - Compact Cards */}
                <div className="grid grid-cols-2 gap-2">
                    {/* Deposit Balance */}
                    <div className="bg-card border rounded-lg p-3 shadow-sm">
                        <div className="flex items-center justify-between mb-1.5">
                            <ArrowDownLeft className="h-4 w-4 text-green-500" />
                            <span className="text-[10px] font-medium text-green-500 bg-green-50 px-1.5 py-0.5 rounded">
                                Active
                            </span>
                        </div>
                        <p className="text-xs text-muted-foreground mb-0.5">Deposit</p>
                        <p className="text-lg font-bold text-foreground">
                            ₹{loading ? '...' : wallet.depositBalance}
                        </p>
                        <Button
                            onClick={() => navigate('/wallet/deposit')}
                            size="sm"
                            className="w-full mt-2 h-7 bg-green-500 hover:bg-green-600 text-white text-xs"
                        >
                            <Plus className="h-3 w-3 mr-1" />
                            Add Cash
                        </Button>
                    </div>

                    {/* Winning Balance */}
                    <div className="bg-card border rounded-lg p-3 shadow-sm">
                        <div className="flex items-center justify-between mb-1.5">
                            <TrendingUp className="h-4 w-4 text-blue-500" />
                            <span className="text-[10px] font-medium text-blue-500 bg-blue-50 px-1.5 py-0.5 rounded">
                                Winning
                            </span>
                        </div>
                        <p className="text-xs text-muted-foreground mb-0.5">Winning</p>
                        <p className="text-lg font-bold text-foreground">
                            ₹{loading ? '...' : wallet.winningBalance}
                        </p>
                        <Button
                            onClick={() => navigate('/wallet/withdraw')}
                            size="sm"
                            className="w-full mt-2 h-7 bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white text-xs"
                        >
                            <ArrowUpRight className="h-3 w-3 mr-1" />
                            Withdraw
                        </Button>
                    </div>
                </div>

                {/* Quick Actions */}
                <div className="bg-card border rounded-lg shadow-sm divide-y divide-border">
                    <button
                        onClick={() => navigate('/wallet/history')}
                        className="w-full flex items-center justify-between p-3 hover:bg-muted/30 transition-colors"
                    >
                        <div className="flex items-center gap-2.5">
                            <div className="bg-primary/10 p-1.5 rounded-lg">
                                <Clock className="h-4 w-4 text-primary" />
                            </div>
                            <div className="text-left">
                                <p className="text-sm font-medium text-foreground">Transaction History</p>
                                <p className="text-xs text-muted-foreground">View all transactions</p>
                            </div>
                        </div>
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    </button>

                    <button
                        onClick={() => navigate('/wallet/deposit')}
                        className="w-full flex items-center justify-between p-3 hover:bg-muted/30 transition-colors"
                    >
                        <div className="flex items-center gap-2.5">
                            <div className="bg-green-500/10 p-1.5 rounded-lg">
                                <Plus className="h-4 w-4 text-green-500" />
                            </div>
                            <div className="text-left">
                                <p className="text-sm font-medium text-foreground">Quick Deposit</p>
                                <p className="text-xs text-muted-foreground">Add money instantly</p>
                            </div>
                        </div>
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    </button>
                </div>

                {/* Info Box */}
                <div className="bg-gradient-to-br from-card to-card/95 border rounded-lg p-3 shadow-sm">
                    <div className="flex items-start gap-2">
                        <div className="h-1.5 w-1.5 bg-primary rounded-full mt-1.5"></div>
                        <div className="flex-1">
                            <p className="text-xs text-muted-foreground">
                                <span className="font-semibold text-foreground">Tip:</span> Keep funds in deposit balance for quick game entry. Winnings are automatically credited to your wallet.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Wallet;
