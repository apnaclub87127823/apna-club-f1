import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Download, IndianRupee, CheckCircle, AlertTriangle, Heart } from 'lucide-react';
import { z } from 'zod';
import { useToast } from '@/hooks/use-toast';
import { getAuthToken } from '@/lib/auth';
import { useWallet } from '@/hooks/useWallet';
import { apiService } from '@/lib/api';

const withdrawalSchema = z.object({
    amount: z.number()
        .min(200, "Minimum withdrawal amount is ₹200")
        .max(100000, "Maximum withdrawal amount is ₹1,00,000"),
    upiId: z.string()
        .trim()
        .min(1, "UPI ID is required")
        .regex(/^[\w.-]+@[\w.-]+$/, "Please enter a valid UPI ID")
});

const WithdrawMoney = () => {
    const navigate = useNavigate();
    const { toast } = useToast();
    const { wallet, refetch: refetchWallet } = useWallet();
    const [amount, setAmount] = useState('');
    const [upiId, setUpiId] = useState('');
    const [paymentMode, setPaymentMode] = useState('upi');
    const [error, setError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

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

            // Validate inputs
            const validatedData = withdrawalSchema.parse({
                amount: amountNumber,
                upiId
            });
            console.log('Withdrawal validation passed:', validatedData);

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

            console.log('Making withdraw API call:', {
                amount: validatedData.amount,
                type: paymentMode,
                upiId: validatedData.upiId
            });

            // Make API call
            const data = await apiService.withdraw(
                token,
                validatedData.amount,
                paymentMode as 'upi',
                validatedData.upiId
            );
            console.log('Withdrawal API response:', data);

            if (data.success) {
                toast({
                    title: "Success",
                    description: data.message || "Withdrawal request submitted successfully!",
                });
                refetchWallet();
                navigate('/wallet');
            } else {
                const errorMessage = data.message || 'Failed to submit withdrawal request';
                console.error('Withdrawal failed:', errorMessage);
                setError(errorMessage);
                toast({
                    title: "Error",
                    description: errorMessage,
                    variant: "destructive",
                });
            }

        } catch (err) {
            console.error('Withdrawal error:', err);
            let errorMessage = 'Failed to submit withdrawal request. Please try again.';

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
                        <span className="text-gray-900 font-semibold text-sm">{wallet?.totalBalance || 0}</span>
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

            <div className="max-w-md mx-auto px-4 py-6 space-y-6">
                {/* Payment Mode Card */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg font-medium text-center">Payment Mode</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {/* Withdrawal Chips Header */}
                        <div className="bg-gray-500 text-white text-center py-2 rounded-t-md">
                            <span className="text-sm font-medium">Available Balance: ₹{wallet?.winningBalance || 0}</span>
                        </div>

                        <div className="flex justify-between text-xs text-muted-foreground px-4">
                            <span>Minimum: 200</span>
                            <span>Maximum: 1,00,000</span>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            {/* Payment Method Select */}
                            <div className="space-y-2">
                                <Select value={paymentMode} onValueChange={setPaymentMode}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="upi">
                                            <div className="flex items-center gap-2">
                                                <span>UPI (Instant</span>
                                                <span className="text-orange-500">⚡</span>
                                                <span>)</span>
                                            </div>
                                        </SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Amount Field */}
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-foreground">Amount</label>
                                <Input
                                    type="text"
                                    inputMode="numeric"
                                    value={amount}
                                    onChange={handleAmountChange}
                                    placeholder="Enter amount"
                                    className={error ? 'border-red-500' : ''}
                                />
                            </div>

                            {/* UPI ID Field */}
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-foreground">UPI ID</label>
                                <Input
                                    type="text"
                                    value={upiId}
                                    onChange={(e) => {
                                        setUpiId(e.target.value);
                                        setError('');
                                    }}
                                    placeholder="Enter UPI ID"
                                    className={error ? 'border-red-500' : ''}
                                />
                            </div>

                            {error && (
                                <p className="text-sm text-red-500">{error}</p>
                            )}

                            <Button
                                type="submit"
                                disabled={isSubmitting || !amount || !upiId}
                                className="w-full bg-blue-500 hover:bg-blue-600 text-white py-3 rounded-md font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isSubmitting ? 'Submitting...' : 'Submit Withdrawal'}
                            </Button>
                        </form>
                    </CardContent>
                </Card>

                {/* Information Section */}
                <div className="bg-cyan-50 border border-cyan-200 rounded-lg p-4">
                    <div className="space-y-2 text-xs">
                        <p className="text-cyan-800">
                            <span className="font-semibold">Dear User,</span>
                        </p>
                        <p className="text-cyan-800">
                            कृपया धैर्य रखें जब तक आपका <span className="font-semibold text-green-600">Withdrawal Successfully Complete</span> नहीं हो जाता।
                        </p>
                        <div className="flex items-start gap-1">
                            <AlertTriangle className="w-3 h-3 text-orange-500 flex-shrink-0 mt-0.5" />
                            <span className="text-cyan-800">
                                हम आपसे निवेदन करते हैं कि इस दौरान लगे-बाम <span className="font-semibold text-red-600">Message</span> न करें।
                            </span>
                        </div>
                        <div className="flex items-start gap-1">
                            <CheckCircle className="w-3 h-3 text-green-500 flex-shrink-0 mt-0.5" />
                            <span className="text-cyan-800">
                                आपका payment हमारे पास बिल्कुल <span className="font-semibold text-green-600">Safe & Secure</span> है और withdrawal उसी <span className="font-semibold text-blue-600">Account</span> में किया जाएगा जिससे आपने deposit किया था।
                            </span>
                        </div>
                        <div className="flex items-center gap-1 justify-center pt-2">
                            <Heart className="w-4 h-4 text-blue-500" />
                            <span className="text-blue-600 font-semibold">Thank you for choosing APNAClub.</span>
                            <span className="text-cyan-800">हम हमेशा आपके साथ हैं।</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default WithdrawMoney;
