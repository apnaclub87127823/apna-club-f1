import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '@/components/Header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Gamepad2, TrendingUp, AlertCircle, IndianRupee, User, Phone, Edit2, Check, X } from 'lucide-react';
import { useProfile } from '@/hooks/useProfile';
import { useToast } from '@/hooks/use-toast';
import { apiService } from '@/lib/api';
import { getAuthToken } from '@/lib/auth';
import defaultAvatar from '@/assets/default-avatar.png';

const Profile = () => {
    const navigate = useNavigate();
    const { profile, loading, refetch } = useProfile();
    const { toast } = useToast();
    const [username, setUsername] = useState('');
    const [isEditing, setIsEditing] = useState(false);
    const [isUpdating, setIsUpdating] = useState(false);

    React.useEffect(() => {
        if (profile?.username && !isEditing) {
            setUsername(profile.username);
        }
    }, [profile, isEditing]);

    const handleUpdateUsername = async () => {
        const trimmedUsername = username.trim();

        if (!trimmedUsername) {
            toast({
                title: "Error",
                description: "Please enter a username",
                variant: "destructive",
            });
            return;
        }

        if (trimmedUsername === profile?.username) {
            setIsEditing(false);
            return;
        }

        if (trimmedUsername.length < 3 || trimmedUsername.length > 20) {
            toast({
                title: "Error",
                description: "Username must be 3-20 characters",
                variant: "destructive",
            });
            return;
        }

        if (!/^[a-zA-Z0-9_-]+$/.test(trimmedUsername)) {
            toast({
                title: "Error",
                description: "Only letters, numbers, underscores, and hyphens allowed",
                variant: "destructive",
            });
            return;
        }

        setIsUpdating(true);
        try {
            const token = getAuthToken();
            if (!token) {
                navigate('/login');
                return;
            }

            const response = await apiService.updateProfile(token, { username: trimmedUsername });

            if (response.success) {
                toast({
                    title: "Success",
                    description: "Username updated!",
                });
                refetch();
                setIsEditing(false);
            }
        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to update username",
                variant: "destructive",
            });
        } finally {
            setIsUpdating(false);
        }
    };

    const handleCancelEdit = () => {
        setUsername(profile?.username || '');
        setIsEditing(false);
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-b from-background to-background/95">
                <Header isLoggedIn={true} showTermsButton={false} showScrollingBanners={false} />
                <div className="max-w-md mx-auto px-4 py-4">
                    <div className="animate-pulse space-y-3">
                        <div className="h-20 bg-muted rounded-lg"></div>
                        <div className="h-32 bg-muted rounded-lg"></div>
                    </div>
                </div>
            </div>
        );
    }

    const getInitials = () => {
        if (!profile?.fullName) return 'U';
        return profile.fullName
            .split(' ')
            .map(n => n[0])
            .join('')
            .toUpperCase()
            .slice(0, 2);
    };


    return (
        <div className="min-h-screen bg-gradient-to-b from-background to-background/95">
            <Header isLoggedIn={true} showTermsButton={false} showScrollingBanners={false} />

            <div className="max-w-md mx-auto px-4 py-3 space-y-3">
                {/* Profile Header - Compact */}
                <div className="bg-gradient-to-r from-primary to-primary/80 rounded-xl p-4 shadow-lg">
                    <div className="flex items-center gap-3">
                        <Avatar className="w-14 h-14 border-2 border-white/20">
                            <AvatarImage src={defaultAvatar} alt="Profile" />
                            <AvatarFallback className="bg-white/20 text-white text-sm font-bold backdrop-blur">
                                {getInitials()}
                            </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                            <p className="text-white text-lg font-semibold">{profile?.fullName || 'User'}</p>
                            <p className="text-white/80 text-xs">@{profile?.username || 'not-set'}</p>
                        </div>
                    </div>
                </div>

                {/* Account Details - Compact */}
                <div className="bg-card border rounded-lg shadow-sm divide-y divide-border">
                    {/* Username Field */}
                    <div className="p-3">
                        <div className="flex items-center justify-between mb-1.5">
                            <div className="flex items-center gap-2">
                                <User className="h-3.5 w-3.5 text-muted-foreground" />
                                <label className="text-xs font-medium text-foreground">Username</label>
                            </div>
                            {!isEditing && (
                                <button
                                    onClick={() => setIsEditing(true)}
                                    className="text-primary hover:text-primary/80"
                                >
                                    <Edit2 className="h-3 w-3" />
                                </button>
                            )}
                        </div>
                        {isEditing ? (
                            <div className="flex gap-1.5">
                                <Input
                                    type="text"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    placeholder="Enter username"
                                    className="h-7 text-sm"
                                    disabled={isUpdating}
                                />
                                <Button
                                    size="sm"
                                    onClick={handleUpdateUsername}
                                    disabled={isUpdating}
                                    className="h-7 px-2"
                                >
                                    <Check className="h-3 w-3" />
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={handleCancelEdit}
                                    disabled={isUpdating}
                                    className="h-7 px-2"
                                >
                                    <X className="h-3 w-3" />
                                </Button>
                            </div>
                        ) : (
                            <p className="text-sm text-foreground">{profile?.username || 'Not set'}</p>
                        )}
                    </div>

                    {/* Mobile Number */}
                    <div className="p-3">
                        <div className="flex items-center gap-2 mb-1">
                            <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                            <label className="text-xs font-medium text-foreground">Mobile</label>
                        </div>
                        <p className="text-sm text-foreground">{profile?.mobileNumber || 'N/A'}</p>
                    </div>
                </div>

                {/* Statistics Grid - Compact */}
                <div className="grid grid-cols-2 gap-2">
                    <div className="bg-card border rounded-lg p-3 shadow-sm">
                        <div className="flex items-center justify-between mb-1">
                            <Gamepad2 className="h-4 w-4 text-primary" />
                            <span className="text-xs text-muted-foreground">Games</span>
                        </div>
                        <p className="text-xl font-bold text-foreground">{profile?.gamesPlayed || 0}</p>
                    </div>

                    <div className="bg-card border rounded-lg p-3 shadow-sm">
                        <div className="flex items-center justify-between mb-1">
                            <IndianRupee className="h-4 w-4 text-green-500" />
                            <span className="text-xs text-muted-foreground">Earned</span>
                        </div>
                        <p className="text-xl font-bold text-foreground">₹{profile?.earning || 0}</p>
                    </div>

                    <div className="bg-card border rounded-lg p-3 shadow-sm">
                        <div className="flex items-center justify-between mb-1">
                            <TrendingUp className="h-4 w-4 text-blue-500" />
                            <span className="text-xs text-muted-foreground">Referral</span>
                        </div>
                        <p className="text-xl font-bold text-foreground">₹{profile?.referralEarning || 0}</p>
                    </div>

                    <div className="bg-card border rounded-lg p-3 shadow-sm">
                        <div className="flex items-center justify-between mb-1">
                            <AlertCircle className="h-4 w-4 text-red-500" />
                            <span className="text-xs text-muted-foreground">Penalty</span>
                        </div>
                        <p className="text-xl font-bold text-foreground">₹{profile?.penalty || 0}</p>
                    </div>
                </div>

                {/* Quick Actions */}
                <div className="flex gap-2">
                    <Button
                        onClick={() => navigate('/refer-earn')}
                        className="flex-1 h-8 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-primary-foreground text-xs"
                    >
                        Refer & Earn
                    </Button>
                    <Button
                        onClick={() => navigate('/support')}
                        variant="outline"
                        className="flex-1 h-8 text-xs"
                    >
                        Get Support
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default Profile;
