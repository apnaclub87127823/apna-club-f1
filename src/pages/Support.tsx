import React from 'react';
import Header from '@/components/Header';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Shield, Zap, Headphones, MessageCircle, Instagram, MapPin } from 'lucide-react';

const Support = () => {
    return (
        <div className="min-h-screen bg-background">
            <Header isLoggedIn={true} showTermsButton={false} showScrollingBanners={false} />

            <div className="max-w-md mx-auto px-4 py-6 space-y-6">
                {/* Feature Highlights */}
                <div className="grid grid-cols-1 gap-4">
                    {/* Secure & Safe */}
                    <div className="text-center">
                        <div className="flex justify-center mb-3">
                            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                                <Shield className="w-6 h-6 text-blue-500" />
                            </div>
                        </div>
                        <h3 className="text-lg font-semibold text-foreground mb-1">Secure & Safe</h3>
                        <p className="text-sm text-muted-foreground">Bank-level security</p>
                        <p className="text-sm text-muted-foreground">for all transactions</p>
                    </div>

                    {/* Instant Processing */}
                    <div className="text-center">
                        <div className="flex justify-center mb-3">
                            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                                <Zap className="w-6 h-6 text-blue-500" />
                            </div>
                        </div>
                        <h3 className="text-lg font-semibold text-foreground mb-1">Instant</h3>
                        <h3 className="text-lg font-semibold text-foreground mb-1">Processing</h3>
                        <p className="text-sm text-muted-foreground">Withdrawals in 10</p>
                        <p className="text-sm text-muted-foreground">minutes or less</p>
                    </div>

                    {/* 24/7 Support */}
                    <div className="text-center">
                        <div className="flex justify-center mb-3">
                            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                                <Headphones className="w-6 h-6 text-blue-500" />
                            </div>
                        </div>
                        <h3 className="text-lg font-semibold text-foreground mb-1">24/7 Support</h3>
                        <p className="text-sm text-muted-foreground">Always available</p>
                        <p className="text-sm text-muted-foreground">when you need us</p>
                    </div>
                </div>

                {/* Support Options */}
                <div className="space-y-4 mt-8">
                    {/* Chat Support */}
                    <Card>
                        <CardContent className="p-6 text-center">
                            <div className="flex justify-center mb-4">
                                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                                    <MessageCircle className="w-8 h-8 text-green-500" />
                                </div>
                            </div>
                            <h3 className="text-xl font-semibold text-foreground mb-2">APNA Club Chat Support</h3>
                            <p className="text-sm text-muted-foreground mb-4">24/7 instant support on our platform</p>
                            <Button
                                className="w-full bg-green-500 hover:bg-green-600 text-white py-3 rounded-lg flex items-center justify-center gap-2"
                                onClick={() => window.open('https://wa.me/your-whatsapp-number', '_blank')}
                            >
                                <MessageCircle className="w-5 h-5" />
                                Chat Now
                            </Button>
                            <p className="text-xs text-muted-foreground mt-2">Click to start chatting</p>
                        </CardContent>
                    </Card>

                    {/* Instagram */}
                    <Card>
                        <CardContent className="p-6 text-center">
                            <div className="flex justify-center mb-4">
                                <div className="w-16 h-16 bg-gradient-to-br from-purple-400 via-pink-500 to-red-500 rounded-full flex items-center justify-center">
                                    <Instagram className="w-8 h-8 text-white" />
                                </div>
                            </div>
                            <h3 className="text-xl font-semibold text-foreground mb-2">Instagram</h3>
                            <p className="text-sm text-muted-foreground mb-4">Follow us for updates and promotions</p>
                            <Button
                                className="w-full bg-gradient-to-r from-orange-400 to-pink-500 hover:from-orange-500 hover:to-pink-600 text-white py-3 rounded-lg flex items-center justify-center gap-2"
                                onClick={() => window.open('https://instagram.com/nkclub_1', '_blank')}
                            >
                                <Instagram className="w-5 h-5" />
                                @nkclub_1
                            </Button>
                            <p className="text-xs text-muted-foreground mt-2">Latest news and updates</p>
                        </CardContent>
                    </Card>
                </div>

                {/* Office Address */}
                <div className="mt-12">
                    <h2 className="text-2xl font-bold text-center text-foreground mb-6">Our Office Address</h2>
                    <div className="text-center">
                        <div className="flex justify-center mb-4">
                            <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center">
                                <MapPin className="w-6 h-6 text-white" />
                            </div>
                        </div>
                        <h3 className="text-lg font-semibold text-foreground mb-2">APNA Club Office</h3>
                        <p className="text-sm text-muted-foreground">Pratapgarh, Alwar, Rajasthan 301027</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Support;

