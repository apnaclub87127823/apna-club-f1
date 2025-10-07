import React, { useState, useEffect } from 'react';
import { Menu, Info, IndianRupee } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import AppSidebar from './AppSidebar';
import { useWallet } from '@/hooks/useWallet';
import nkLogo from '@/assets/nk-logo.png';
interface HeaderProps {
    showTermsButton?: boolean;
    isLoggedIn?: boolean;
    showScrollingBanners?: boolean;
}

const Header = ({ showTermsButton = true, isLoggedIn = false, showScrollingBanners = true }: HeaderProps) => {
    const navigate = useNavigate();
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [scrollPosition, setScrollPosition] = useState(0);
    const { wallet } = useWallet();

    const scrollingText = "📞 Support Available on WhatsApp 🙏 आपके सहयोग के लिए धन्यवाद 🙏 .......................... 🎮 Guest Rule 👉 यदि साइट पर रूम कोड देने के बाद Guest Join होता है, तो Real Players आने के बाद ही मैच शुरू करें। ........... ✨ APNA Club के साथ जुड़े रहो और अपने दोस्तों को जोड़ो, आपको Best Service मिलेगी।";

    useEffect(() => {
        if (isLoggedIn) {
            const interval = setInterval(() => {
                setScrollPosition(prev => prev + 1);
            }, 50);
            return () => clearInterval(interval);
        }
    }, [isLoggedIn]);

    return (
        <>
            <AppSidebar
                isOpen={sidebarOpen}
                onClose={() => setSidebarOpen(false)}
                isLoggedIn={isLoggedIn}
            />
            <div className="w-full">
                {/* Main Header */}
                <header className="flex items-center justify-between px-4 py-6 max-w-md mx-auto bg-header-pink">
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setSidebarOpen(true)}
                            className="p-1 hover:bg-muted rounded-md transition-colors"
                        >
                            <Menu className="h-6 w-6 text-foreground" />
                        </button>
                        <button
                            onClick={() => navigate('/')}
                            className="hover:opacity-80 transition-opacity"
                        >
                            <img
                                src={nkLogo}
                                alt="APNA Club Logo"
                                className="h-8 w-8 object-contain"
                            />
                        </button>
                    </div>

                    <div className="flex items-center gap-2">
                        {isLoggedIn && (
                            <button
                                onClick={() => navigate('/wallet')}
                                className="flex items-center gap-1 bg-white border border-black rounded-md px-2 py-1 shadow-sm hover:bg-gray-50 transition-colors"
                            >
                                <IndianRupee className="h-3 w-3 text-gray-700 font-bold" />
                                <span className="text-gray-900 font-semibold text-sm leading-4">{wallet.totalBalance}</span>
                            </button>
                        )}

                        {showTermsButton && !isLoggedIn && (
                            <Button
                                variant="outline"
                                onClick={() => navigate('/terms')}
                                className="text-xs px-2 py-1 border-muted-foreground text-muted-foreground hover:bg-black hover:text-white h-7 flex items-center gap-1"
                            >
                                <Info className="h-3 w-3" />
                                Terms
                            </Button>
                        )}
                    </div>
                </header>

                {/* Red Banner with scrolling text */}
                <div className="bg-red-600 text-white py-2 overflow-hidden max-w-md mx-auto">
                    <div className="animate-scroll-left whitespace-nowrap text-sm font-medium">
                        APNA Club में आपका स्वागत है! हमारे साथ खेलो और पाओ बेहतर इनाम! अपने दो
                    </div>
                </div>

                {/* Info Box */}
                {isLoggedIn && showScrollingBanners && (
                    <div className="max-w-md mx-auto px-4 py-2">
                        <div className="bg-yellow-100 border border-yellow-300 rounded-lg p-3 text-xs">
                            <div className="text-gray-800 leading-relaxed">
                                {scrollingText}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </>
    );
};

export default Header;

// nk