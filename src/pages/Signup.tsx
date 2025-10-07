import React, { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import Header from '@/components/Header';
import { apiService } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

const Signup = () => {
    const navigate = useNavigate();
    const { toast } = useToast();
    const [searchParams] = useSearchParams();
    const [phoneNumber, setPhoneNumber] = useState('');
    const [fullName, setFullName] = useState('');
    const [referralCode, setReferralCode] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    // Get referral code from URL parameter on mount
    useEffect(() => {
        const referCodeFromUrl = searchParams.get('refercode');
        if (referCodeFromUrl) {
            setReferralCode(referCodeFromUrl);
        }
    }, [searchParams]);

    const handleSendOTP = async () => {
        if (!fullName.trim()) {
            toast({
                title: "Missing Information",
                description: "Please enter your full name",
                variant: "destructive"
            });
            return;
        }

        if (phoneNumber.length !== 10) {
            toast({
                title: "Invalid Phone Number",
                description: "Please enter a valid 10-digit phone number",
                variant: "destructive"
            });
            return;
        }

        setIsLoading(true);
        try {
            const response = await apiService.signup(
                fullName.trim(),
                phoneNumber,
                referralCode.trim() || undefined
            );

            if (response.success) {
                toast({
                    title: "OTP Sent",
                    description: response.message,
                });

                // Navigate to OTP verification with signup data
                navigate('/otp-verify', {
                    state: {
                        phoneNumber: response.mobileNumber || phoneNumber,
                        type: 'signup',
                        fullName,
                        referralCode
                    }
                });
            }
        } catch (error: any) {
            toast({
                title: "Error",
                description: error.message || "Failed to send OTP",
                variant: "destructive"
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-background">
            {/* Header */}
            <Header />

            {/* Main Content */}
            <main className="px-6 pt-8">
                <div className="w-full max-w-md mx-auto">
                    {/* Title */}
                    <h1 className="text-2xl font-semibold text-foreground mb-12 text-left">
                        Sign-up
                    </h1>

                    {/* Form */}
                    <div className="space-y-6">
                        {/* Phone Number Input */}
                        <div className="relative">
                            <div className="flex w-full">
                                <div className="flex items-center px-3 py-2 bg-muted border border-r-0 rounded-l-lg text-muted-foreground font-bold min-w-[60px] h-10">
                                    +91
                                </div>
                                <Input
                                    type="tel"
                                    value={phoneNumber}
                                    onChange={(e) => {
                                        const value = e.target.value.replace(/\D/g, '');
                                        if (value.length <= 10) {
                                            setPhoneNumber(value);
                                        }
                                    }}
                                    className="rounded-l-none border-l-0 py-2 px-3 text-base h-10 flex-1"
                                    placeholder="Enter 10-digit mobile number"
                                    maxLength={10}
                                />
                            </div>
                        </div>

                        {/* Full Name Input */}
                        <div>
                            <Input
                                type="text"
                                value={fullName}
                                onChange={(e) => setFullName(e.target.value)}
                                placeholder="Enter full name"
                                className="py-2 px-3 text-base h-10 w-full"
                            />
                        </div>

                        {/* Referral Code Input */}
                        <div>
                            <Input
                                type="text"
                                value={referralCode}
                                onChange={(e) => setReferralCode(e.target.value)}
                                placeholder="Enter refer code (optional)"
                                className="py-2 px-3 text-base font-medium h-10 w-full"
                            />
                        </div>

                        {/* Send OTP Button */}
                        <div className="pt-4">
                            <Button
                                variant="otp"
                                size="lg"
                                onClick={handleSendOTP}
                                className="w-full py-4 text-base font-semibold"
                                disabled={!fullName.trim() || phoneNumber.length !== 10 || isLoading}
                            >
                                {isLoading ? 'SENDING...' : 'SEND OTP'}
                            </Button>
                        </div>

                        {/* Terms and Conditions */}
                        <div className="pt-6">
                            <p className="text-sm text-text-light text-center leading-relaxed">
                                By continuing, I confirm I am 18+ and not playing from Assam, Telangana, Nagaland, Andhra Pradesh, Sikkim, or outside India. I agree to the{' '}
                                <a href="#" className="text-link-blue hover:underline">
                                    Terms and Conditions
                                </a>
                                {' '}and{' '}
                                <a href="#" className="text-link-blue hover:underline">
                                    Privacy Policy
                                </a>
                                .
                            </p>
                        </div>

                        {/* Login Link */}
                        <div className="pt-4 text-center">
                            <p className="text-sm text-muted-foreground">
                                Already have an account?{' '}
                                <Link to="/login" className="text-link-blue hover:underline font-semibold">
                                    Login
                                </Link>
                            </p>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default Signup;

