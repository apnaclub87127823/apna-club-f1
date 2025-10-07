import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowLeft, Download, IndianRupee, Info, AlertTriangle } from 'lucide-react';
import { z } from 'zod';

const aadhaarSchema = z.object({
    aadhaarNumber: z.string()
        .trim()
        .length(12, "Aadhaar number must be exactly 12 digits")
        .regex(/^\d{12}$/, "Aadhaar number must contain only digits")
});

const KycVerification = () => {
    const navigate = useNavigate();
    const [aadhaarNumber, setAadhaarNumber] = useState('');
    const [error, setError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsSubmitting(true);

        try {
            // Validate input
            const validatedData = aadhaarSchema.parse({ aadhaarNumber });

            // Here you would typically submit to your backend/Supabase
            console.log('KYC request submitted with Aadhaar:', validatedData.aadhaarNumber);

            // Simulate API call
            await new Promise(resolve => setTimeout(resolve, 1000));

            // For now, just show success and navigate back
            alert('KYC request submitted successfully!');
            navigate('/profile');

        } catch (err) {
            if (err instanceof z.ZodError) {
                setError(err.errors[0].message);
            } else {
                setError('Failed to submit KYC request. Please try again.');
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleAadhaarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value.replace(/\D/g, ''); // Remove non-digits
        if (value.length <= 12) {
            setAadhaarNumber(value);
            setError('');
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
                {/* Navigation Buttons */}
                <div className="flex items-center justify-between mb-6">
                    <Button
                        onClick={() => navigate('/profile')}
                        className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md flex items-center gap-2"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Back
                    </Button>

                    <Button
                        variant="outline"
                        className="border-blue-500 text-blue-500 hover:bg-blue-500 hover:text-white px-4 py-2 rounded-md flex items-center gap-2"
                    >
                        <Info className="w-4 h-4" />
                        Guide
                    </Button>
                </div>

                {/* Warning Message */}
                <div className="bg-yellow-100 border border-yellow-300 rounded-lg p-4 mb-6">
                    <div className="flex items-start gap-2">
                        <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                        <div className="text-sm text-yellow-800">
                            <span className="font-semibold">IMPORTANT :-</span> आप केवल उसी बैंक खाते में पैसे निकाल सकते हैं जिसका नाम आपके KYC Document के नाम से मिलता है।
                        </div>
                    </div>
                </div>

                {/* KYC Form */}
                <Card>
                    <CardContent className="p-6">
                        <h2 className="text-lg font-semibold text-foreground mb-6">KYC</h2>

                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="space-y-2">
                                <label htmlFor="aadhaar" className="text-sm font-medium text-foreground">
                                    Aadhaar Number
                                </label>
                                <Input
                                    id="aadhaar"
                                    type="text"
                                    placeholder="Enter Aadhaar Card Number"
                                    value={aadhaarNumber}
                                    onChange={handleAadhaarChange}
                                    className={`${error ? 'border-red-500' : ''}`}
                                    maxLength={12}
                                />
                                {error && (
                                    <p className="text-sm text-red-500">{error}</p>
                                )}
                            </div>

                            <div className="text-xs text-muted-foreground">
                                By Continuing, you agree to our{' '}
                                <button
                                    type="button"
                                    onClick={() => navigate('/terms')}
                                    className="text-blue-500 underline hover:text-blue-600"
                                >
                                    Legal Terms
                                </button>{' '}
                                and you are 18 years or older.
                            </div>

                            <Button
                                type="submit"
                                disabled={isSubmitting || !aadhaarNumber || aadhaarNumber.length !== 12}
                                className="w-full bg-blue-500 hover:bg-blue-600 text-white py-3 rounded-md font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isSubmitting ? 'Submitting...' : 'Request for KYC'}
                            </Button>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

export default KycVerification;
