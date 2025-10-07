import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useNavigate, useLocation } from 'react-router-dom';
import Header from '@/components/Header';
import { apiService } from '@/lib/api';
import { setAuthToken, setUser as setUserStorage } from '@/lib/auth';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

const OtpVerify = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { toast } = useToast();
    const { setUser } = useAuth();

    const phoneNumber = location.state?.phoneNumber || '7489301982';
    const type = location.state?.type || 'login'; // 'login' or 'signup'
    const [otp, setOtp] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleVerifyOtp = async () => {
        if (otp.length !== 6) {
            toast({
                title: "Invalid OTP",
                description: "Please enter a valid 6-digit OTP",
                variant: "destructive"
            });
            return;
        }

        setIsLoading(true);
        try {
            let response;

            if (type === 'signup') {
                response = await apiService.verifySignupOTP(phoneNumber, otp);
            } else {
                response = await apiService.verifyLoginOTP(phoneNumber, otp);
            }

            if (response.success && response.token) {
                // Store auth token and user data
                setAuthToken(response.token);
                if (response.user) {
                    setUserStorage(response.user);
                    setUser(response.user);
                }

                toast({
                    title: "Success",
                    description: response.message,
                });

                // Navigate to dashboard/home
                navigate('/', { replace: true });
            }
        } catch (error: any) {
            toast({
                title: "Error",
                description: error.message || "Failed to verify OTP",
                variant: "destructive"
            });
        } finally {
            setIsLoading(false);
        }
    };

    const handleChangeNumber = () => {
        navigate('/login');
    };

    return (
        <div className="min-h-screen bg-background">
            {/* Header */}
            <Header />

            {/* Main Content */}
            <main className="px-6 pt-8">
                <div className="w-full max-w-md mx-auto">
                    {/* Title */}
                    <h1 className="text-2xl font-semibold text-foreground mb-8 text-left">
                        Enter OTP
                    </h1>

                    {/* Phone Number Display */}
                    <div className="mb-6">
                        <div className="p-3 bg-muted rounded-lg border">
                            <span className="text-foreground font-medium">{phoneNumber}</span>
                        </div>
                    </div>

                    {/* OTP Input */}
                    <div className="mb-8">
                        <Input
                            type="text"
                            value={otp}
                            onChange={(e) => {
                                const value = e.target.value.replace(/\D/g, '');
                                if (value.length <= 6) {
                                    setOtp(value);
                                }
                            }}
                            placeholder="Enter OTP"
                            className="py-3 px-4 text-base h-12 w-full text-center tracking-widest"
                            maxLength={6}
                        />
                    </div>

                    {/* Verify OTP Button */}
                    <div className="mb-6">
                        <Button
                            variant="otp"
                            size="lg"
                            onClick={handleVerifyOtp}
                            className="w-full py-4 text-base font-semibold h-12"
                            disabled={otp.length !== 6 || isLoading}
                        >
                            {isLoading ? 'VERIFYING...' : 'VERIFY OTP'}
                        </Button>
                    </div>

                    {/* Change Number Button */}
                    <div className="mb-8 text-center">
                        <button
                            onClick={handleChangeNumber}
                            className="text-foreground font-medium hover:text-primary transition-colors"
                        >
                            CHANGE NUMBER
                        </button>
                    </div>

                    {/* Dice Icons */}
                    <div className="flex justify-center mb-8">
                        <div className="flex gap-4">
                            <div className="w-12 h-12 bg-muted rounded-lg flex items-center justify-center">
                                <div className="grid grid-cols-2 gap-1">
                                    <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                                    <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                                    <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                                    <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                                </div>
                            </div>
                            <div className="w-12 h-12 bg-muted rounded-lg flex items-center justify-center">
                                <div className="grid grid-cols-2 gap-1">
                                    <div className="w-2 h-2 bg-muted-foreground rounded-full"></div>
                                    <div className="w-2 h-2 bg-muted-foreground rounded-full"></div>
                                    <div className="w-2 h-2 bg-transparent rounded-full"></div>
                                    <div className="w-2 h-2 bg-muted-foreground rounded-full"></div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Terms and Conditions */}
                    <div className="px-2">
                        <p className="text-sm text-muted-foreground text-center leading-relaxed">
                            By continuing, I hereby confirm that I am 18 years of age or above and I am not playing from Assam, Telangana, Nagaland, Andhra Pradesh, Sikkim and outside India and I agree to the{' '}
                            <a href="/terms" className="text-link-blue hover:underline">
                                Terms and Conditions
                            </a>
                            {' '}and{' '}
                            <a href="#" className="text-link-blue hover:underline">
                                Privacy Policy
                            </a>
                            {' '}.
                        </p>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default OtpVerify;

