import React from 'react';
import { Copy, Share, Users, Gift, TrendingUp, Clipboard, Wallet } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import Header from '@/components/Header';
import { useProfile } from '@/hooks/useProfile';

const ReferEarn = () => {
    const { toast } = useToast();
    const { profile, loading } = useProfile();

    const referralCode = profile?.referCode || '';
    const referralEarning = profile?.referralEarning || 0;
    const totalReferrals = Math.floor(referralEarning / 20); // Assuming ₹20 per referral

    const handleCopyCode = () => {
        navigator.clipboard.writeText(referralCode);
        toast({
            title: "Copied!",
            description: "Referral code copied to clipboard",
        });
    };

    const handleWhatsAppShare = () => {
        const referralLink = `${window.location.origin}/signup?refercode=${referralCode}`;
        const message = `Join APNA Club using my referral code and get instant bonus! 🎁\n\nClick here to sign up: ${referralLink}`;
        const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
        window.open(whatsappUrl, '_blank');
    };

    const handleCopyToClipboard = () => {
        const referralLink = `${window.location.origin}/signup?refercode=${referralCode}`;
        navigator.clipboard.writeText(referralLink);
        toast({
            title: "Copied!",
            description: "Referral link copied to clipboard",
        });
    };

    return (
        <div className="min-h-screen bg-gradient-to-b from-background to-background/95">
            <Header isLoggedIn={true} showTermsButton={false} showScrollingBanners={false} />

            <div className="max-w-md mx-auto px-4 py-4 space-y-4">
                {/* Reward Banner */}
                <div className="relative overflow-hidden bg-gradient-to-r from-primary to-primary/80 rounded-xl p-4 shadow-lg">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-3xl"></div>
                    <div className="relative z-10 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="bg-white/20 p-2.5 rounded-lg backdrop-blur">
                                <Gift className="h-6 w-6 text-white" />
                            </div>
                            <div>
                                <p className="text-white/90 text-xs font-medium">Earn Per Referral</p>
                                <p className="text-white text-2xl font-bold">₹20</p>
                            </div>
                        </div>
                        <div className="text-white/90 text-sm">
                            <p className="text-xs">Instant Credit</p>
                            <p className="font-semibold">To Wallet</p>
                        </div>
                    </div>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-2 gap-3">
                    <div className="bg-card border rounded-lg p-3 shadow-sm">
                        <div className="flex items-center justify-between mb-1">
                            <Users className="h-4 w-4 text-primary" />
                            <TrendingUp className="h-3 w-3 text-green-500" />
                        </div>
                        <p className="text-xs text-muted-foreground">Total Referrals</p>
                        <p className="text-xl font-bold text-foreground">{totalReferrals}</p>
                    </div>

                    <div className="bg-card border rounded-lg p-3 shadow-sm">
                        <div className="flex items-center justify-between mb-1">
                            <Wallet className="h-4 w-4 text-primary" />
                            <span className="text-xs text-green-500 font-medium">+₹20</span>
                        </div>
                        <p className="text-xs text-muted-foreground">Total Earned</p>
                        <p className="text-xl font-bold text-foreground">₹{referralEarning}</p>
                    </div>
                </div>

                {/* Referral Code Card */}
                <div className="bg-card border rounded-lg p-4 shadow-sm">
                    <h3 className="text-center text-sm font-semibold text-foreground mb-3">
                        Your Referral Code
                    </h3>

                    {loading ? (
                        <div className="text-center py-2">
                            <p className="text-xs text-muted-foreground">Loading...</p>
                        </div>
                    ) : (
                        <>
                            <div className="flex items-center gap-2 mb-3">
                                <div className="flex-1 bg-muted/50 rounded-lg px-3 py-2 flex items-center gap-2 border border-border">
                                    <Copy className="h-3.5 w-3.5 text-muted-foreground" />
                                    <span className="text-foreground font-mono text-sm font-semibold">{referralCode || 'N/A'}</span>
                                </div>
                                <Button
                                    onClick={handleCopyCode}
                                    disabled={!referralCode}
                                    size="sm"
                                    className="bg-primary hover:bg-primary/90 text-primary-foreground px-4 h-9"
                                >
                                    COPY
                                </Button>
                            </div>

                            <div className="flex gap-2">
                                <Button
                                    onClick={handleWhatsAppShare}
                                    size="sm"
                                    className="flex-1 bg-green-500 hover:bg-green-600 text-white h-9"
                                >
                                    <Share className="h-3.5 w-3.5 mr-1" />
                                    WhatsApp
                                </Button>

                                <Button
                                    onClick={handleCopyToClipboard}
                                    variant="secondary"
                                    size="sm"
                                    className="flex-1 h-9"
                                >
                                    <Clipboard className="h-3.5 w-3.5 mr-1" />
                                    Copy Link
                                </Button>
                            </div>
                        </>
                    )}
                </div>

                {/* How it Works - Compact */}
                <div className="bg-gradient-to-br from-card to-card/95 border rounded-lg p-4 shadow-sm">
                    <h3 className="text-sm font-semibold text-foreground mb-2 flex items-center gap-2">
                        <div className="h-1.5 w-1.5 bg-primary rounded-full"></div>
                        How to Earn
                    </h3>

                    <div className="space-y-2">
                        <div className="flex items-start gap-2">
                            <span className="text-xs font-bold text-primary mt-0.5">1.</span>
                            <p className="text-xs text-muted-foreground">
                                Share your referral code with friends
                            </p>
                        </div>
                        <div className="flex items-start gap-2">
                            <span className="text-xs font-bold text-primary mt-0.5">2.</span>
                            <p className="text-xs text-muted-foreground">
                                Get <span className="font-semibold text-foreground">₹20 instantly</span> when they sign up
                            </p>
                        </div>
                        <div className="flex items-start gap-2">
                            <span className="text-xs font-bold text-primary mt-0.5">3.</span>
                            <p className="text-xs text-muted-foreground">
                                Earn <span className="font-semibold text-foreground">1% commission</span> on their winnings
                            </p>
                        </div>
                    </div>

                    <div className="mt-3 p-2 bg-primary/10 rounded-lg">
                        <p className="text-xs text-center text-primary font-medium">
                            No limit on referrals - Earn unlimited!
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ReferEarn;

