import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowLeft, Download, IndianRupee, AlertTriangle, Info, Loader2 } from 'lucide-react';
import { z } from 'zod';
import { useToast } from '@/hooks/use-toast';
import { getAuthToken } from '@/lib/auth';
import { useWallet } from '@/hooks/useWallet';
import { apiService } from '@/lib/api';
import { useProfile } from '@/hooks/useProfile';

const depositSchema = z.object({
    amount: z.number()
        .min(100, "Minimum deposit amount is ₹100")
        .max(20000, "Maximum deposit amount is ₹20,000")
});

const DepositMoney = () => {
    const navigate = useNavigate();
    const { toast } = useToast();
    const { refetch: refetchWallet } = useWallet();
    const { profile } = useProfile();
    const [searchParams] = useSearchParams();
    const [amount, setAmount] = useState('');
    const [error, setError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isVerifying, setIsVerifying] = useState(false);
    const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
    const [pendingOrderId, setPendingOrderId] = useState<string | null>(null);

    const quickAmounts = [100, 200, 500, 1000, 2000];

    // Check for pending order on mount
    useEffect(() => {
        const orderId = searchParams.get('orderId');
        if (orderId) {
            setPendingOrderId(orderId);
            startPolling(orderId);
        }

        // Cleanup polling on unmount
        return () => {
            if (pollingIntervalRef.current) {
                clearInterval(pollingIntervalRef.current);
            }
        };
    }, [searchParams]);

    const startPolling = (orderId: string) => {
        setIsVerifying(true);
        checkPaymentStatus(orderId);

        // Poll every 3 seconds
        pollingIntervalRef.current = setInterval(() => {
            checkPaymentStatus(orderId);
        }, 3000);

        // Stop polling after 5 minutes
        setTimeout(() => {
            if (pollingIntervalRef.current) {
                clearInterval(pollingIntervalRef.current);
                setIsVerifying(false);
                toast({
                    title: "Verification Timeout",
                    description: "Payment verification is taking longer than expected. Please check your transaction history.",
                    variant: "destructive",
                });
            }
        }, 300000); // 5 minutes
    };

    const checkPaymentStatus = async (orderId: string) => {
        try {
            const token = getAuthToken();
            if (!token) return;

            const response = await apiService.checkZapupiStatus(token, orderId);

            if (response.success && response.data) {
                if (response.data.status === 'success') {
                    // Payment successful
                    if (pollingIntervalRef.current) {
                        clearInterval(pollingIntervalRef.current);
                    }
                    setIsVerifying(false);
                    setPendingOrderId(null);

                    toast({
                        title: "Payment Successful!",
                        description: `₹${response.data.amount || 0} has been added to your wallet.`,
                    });

                    refetchWallet();
                    navigate('/wallet');
                } else if (response.data.status === 'failed') {
                    // Payment failed
                    if (pollingIntervalRef.current) {
                        clearInterval(pollingIntervalRef.current);
                    }
                    setIsVerifying(false);
                    setPendingOrderId(null);

                    toast({
                        title: "Payment Failed",
                        description: "Your payment was not successful. Please try again.",
                        variant: "destructive",
                    });
                }
                // If pending, continue polling
            }
        } catch (error) {
            console.error('Error checking payment status:', error);
        }
    };

    const handleQuickAmount = (quickAmount: number) => {
        setAmount(quickAmount.toString());
        setError('');
    };

    const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value.replace(/\D/g, ''); // Remove non-digits
        setAmount(value);
        setError('');
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsSubmitting(true);

        try {
            // Parse amount to number
            const amountNumber = parseInt(amount) || 0;

            // Validate amount
            const validatedData = depositSchema.parse({ amount: amountNumber });
            console.log('Deposit validation passed:', validatedData);

            const token = getAuthToken();
            if (!token) {
                toast({
                    title: "Error",
                    description: "Please login to continue",
                    variant: "destructive",
                });
                navigate('/login');
                setIsSubmitting(false);
                return;
            }

            console.log('Making deposit API call with amount:', validatedData.amount);

            // Make API call
            const data = await apiService.deposit(token, validatedData.amount);
            console.log('Deposit API response:', data);

            if (data.success && data.data) {
                // Store order ID and redirect to payment
                const orderId = data.data.orderId;

                toast({
                    title: "Redirecting to Payment",
                    description: "You will be redirected to complete the payment.",
                });

                // If amount > 500, send WhatsApp message to admin
                if (validatedData.amount > 500 && profile) {
                    const adminNumber = '917014079906'; // +91 70140 79906
                    const message = `My name is ${profile.fullName} and mobile number is ${profile.mobileNumber}. I want to add ₹${validatedData.amount} in this number.`;
                    const whatsappUrl = `https://wa.me/${adminNumber}?text=${encodeURIComponent(message)}`;
                    
                    // Open WhatsApp in new tab
                    window.open(whatsappUrl, '_blank');
                }

                // Redirect to payment URL
                window.location.href = data.data.paymentUrl;
            } else {
                const errorMessage = data.message || 'Failed to create payment order';
                console.error('Deposit failed:', errorMessage);
                setError(errorMessage);
                toast({
                    title: "Error",
                    description: errorMessage,
                    variant: "destructive",
                });
            }

        } catch (err) {
            console.error('Deposit error:', err);
            let errorMessage = 'Failed to process deposit. Please try again.';

            if (err instanceof z.ZodError) {
                errorMessage = err.errors[0].message;
            } else if (err instanceof Error) {
                errorMessage = err.message;
            }

            setError(errorMessage);
            toast({
                title: "Error",
                description: errorMessage,
                variant: "destructive",
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen bg-background">
            {/* Header */}
            <header className="flex items-center justify-between px-4 py-6 max-w-md mx-auto bg-header-pink">
                <div className="flex items-center gap-2">
                    <button className="p-1 hover:bg-muted rounded-md transition-colors">
                        <div className="w-6 h-6 flex flex-col gap-1 justify-center">
                            <div className="w-4 h-0.5 bg-foreground"></div>
                            <div className="w-4 h-0.5 bg-foreground"></div>
                            <div className="w-4 h-0.5 bg-foreground"></div>
                        </div>
                    </button>
                    <img
                        src="/nk-logo.png"
                        alt="NK Club Logo"
                        className="h-8 w-8 object-contain"
                    />
                </div>

                <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1 bg-white border border-gray-200 rounded-md px-2 py-1 shadow-sm">
                        <IndianRupee className="h-4 w-4 text-gray-700" />
                        <span className="text-gray-900 font-semibold text-sm">0</span>
                    </div>
                    <Button
                        variant="outline"
                        className="text-xs px-3 py-1 border-blue-500 text-blue-500 hover:bg-blue-500 hover:text-white h-8 flex items-center gap-1"
                    >
                        <Download className="h-3 w-3" />
                        Install App
                    </Button>
                </div>
            </header>

            <div className="max-w-md mx-auto px-4 py-6">
                {/* Payment Verification Status */}
                {isVerifying && pendingOrderId && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                        <div className="flex items-center gap-3">
                            <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />
                            <div>
                                <h4 className="text-blue-900 font-semibold text-sm">Verifying Payment</h4>
                                <p className="text-blue-600 text-xs mt-1">
                                    Please wait while we verify your payment. This may take a few moments.
                                </p>
                            </div>
                        </div>
                    </div>
                )}
                {/* Back Button */}
                <div className="mb-6">
                    <Button
                        onClick={() => navigate('/wallet')}
                        variant="ghost"
                        className="text-blue-500 hover:text-blue-600 hover:bg-blue-50 px-0 flex items-center gap-2"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Back
                    </Button>
                </div>

                {/* Deposit Safety Rule Warning */}
                <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6">
                    <div className="flex items-start gap-2">
                        <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                        <div>
                            <h4 className="text-red-700 font-semibold text-sm mb-1">Deposit Safety Rule</h4>
                            <p className="text-red-600 text-xs">
                                डिपॉज़िट करने से अपने UPI/Bank अकाउंट से करें। किसी और के अकाउंट से पेमेंट करने पर राशि <span className="font-semibold">Hold</span> कर दी जाएगी। यह नियम आपके फंड्स की सुरक्षा के लिए है।
                            </p>
                        </div>
                    </div>
                </div>

                {/* Deposit Form */}
                <Card>
                    <CardHeader className="bg-green-500 text-white">
                        <CardTitle className="text-lg font-medium">Deposit Money</CardTitle>
                    </CardHeader>
                    <CardContent className="p-6">
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="space-y-4">
                                <label className="text-sm font-medium text-foreground">Enter Amount</label>

                                <div className="relative">
                                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground">₹</span>
                                    <Input
                                        type="text"
                                        inputMode="numeric"
                                        value={amount}
                                        onChange={handleAmountChange}
                                        className={`pl-8 text-lg ${error ? 'border-red-500' : ''}`}
                                        placeholder="0"
                                    />
                                </div>

                                <div className="flex justify-between text-xs text-muted-foreground">
                                    <span>Minimum: ₹100</span>
                                    <span>Maximum: ₹20,000</span>
                                </div>

                                {error && (
                                    <p className="text-sm text-red-500">{error}</p>
                                )}

                                {/* Quick Amount Buttons */}
                                <div className="flex flex-wrap gap-2">
                                    {quickAmounts.map((quickAmount) => (
                                        <Button
                                            key={quickAmount}
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            onClick={() => handleQuickAmount(quickAmount)}
                                            className="border-blue-500 text-blue-500 hover:bg-blue-500 hover:text-white"
                                        >
                                            +{quickAmount}
                                        </Button>
                                    ))}
                                </div>
                            </div>

                            <Button
                                type="submit"
                                disabled={isSubmitting || isVerifying || !amount || parseInt(amount) < 100 || parseInt(amount) > 20000}
                                className="w-full bg-blue-500 hover:bg-blue-600 text-white py-3 rounded-md font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isSubmitting ? (
                                    <>
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin inline" />
                                        Processing...
                                    </>
                                ) : isVerifying ? (
                                    <>
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin inline" />
                                        Verifying...
                                    </>
                                ) : (
                                    'Proceed to Pay'
                                )}
                            </Button>
                        </form>
                    </CardContent>
                </Card>

                {/* Important Information */}
                <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mt-6">
                    <div className="flex items-start gap-2">
                        <Info className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
                        <div>
                            <h4 className="text-blue-700 font-semibold text-sm mb-1">Important Information</h4>
                            <p className="text-blue-600 text-xs">
                                प्रिय यूज़र, वर्तमान में डिपॉज़िट के लिए कृपया सीधा <span className="font-semibold text-green-600">Paytm App</span> से पेमेंट करें। इससे आपको वात्-वात छूट पेमेंट करने की जरूरत नहीं पड़ेगी और प्रक्रिया <span className="font-semibold text-green-600">तेज़ एवं बेहतर</span> होगी।
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DepositMoney;