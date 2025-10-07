import React from 'react';
import { X, User, FileText, ChevronRight, Wallet, Play, Users, Clock, MessageSquare, LogOut, Shield } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import nkLogo from '@/assets/nk-logo.png';
interface AppSidebarProps {
    isOpen: boolean;
    onClose: () => void;
    isLoggedIn?: boolean;
}

const AppSidebar = ({ isOpen, onClose, isLoggedIn = false }: AppSidebarProps) => {
    const navigate = useNavigate();
    const { logout, user } = useAuth();

    const loggedInMenuItems = [
        {
            icon: User,
            title: 'My Profile',
            onClick: () => {
                navigate('/profile');
                onClose();
            }
        },
        {
            icon: Wallet,
            title: 'Wallet',
            onClick: () => {
                navigate('/wallet');
                onClose();
            }
        },
        {
            icon: Play,
            title: 'Play',
            onClick: () => {
                navigate('/');
                onClose();
            }
        },
        {
            icon: Users,
            title: 'Refer & Earn',
            onClick: () => {
                navigate('/refer-earn');
                onClose();
            }
        },
        {
            icon: Clock,
            title: 'History',
            onClick: () => {
                navigate('/history');
                onClose();
            }
        },
        // {
        //     icon: Play,
        //     title: 'Game History',
        //     onClick: () => {
        //         navigate('/game-history');
        //         onClose();
        //     }
        // },
        {
            icon: MessageSquare,
            title: 'Support',
            onClick: () => {
                navigate('/support');
                onClose();
            }
        },
        {
            icon: FileText,
            title: 'Legal Terms',
            onClick: () => {
                navigate('/terms');
                onClose();
            }
        },
        ...(user?.role === 'admin' ? [{
            icon: Shield,
            title: 'Admin Dashboard',
            onClick: () => {
                navigate('/admin');
                onClose();
            }
        }] : [])
    ];

    const guestMenuItems = [
        {
            icon: User,
            title: 'Login',
            onClick: () => {
                navigate('/login');
                onClose();
            }
        },
        {
            icon: User,
            title: 'Sign Up',
            onClick: () => {
                navigate('/signup');
                onClose();
            }
        },
        {
            icon: FileText,
            title: 'Legal Terms',
            onClick: () => {
                navigate('/terms');
                onClose();
            }
        }
    ];

    const menuItems = isLoggedIn ? loggedInMenuItems : guestMenuItems;

    return (
        <>
            {/* Overlay */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-black bg-opacity-50 z-40 animate-fade-in"
                    onClick={onClose}
                />
            )}

            {/* Sidebar */}
            <div className={`
        fixed left-0 top-0 h-full w-80 bg-background border-r shadow-lg z-50
        transform transition-transform duration-300 ease-out flex flex-col
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b">
                    <div className="flex items-center gap-2">
                        <img
                            src={nkLogo}
                            alt="NK Club Logo"
                            className="h-8 w-8 object-contain"
                        />
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-muted rounded-md transition-colors"
                    >
                        <X className="h-5 w-5 text-muted-foreground" />
                    </button>
                </div>

                {/* Menu Items */}
                <div className="flex-1 p-4">
                    <nav className="space-y-1">
                        {menuItems.map((item, index) => (
                            <button
                                key={index}
                                onClick={item.onClick}
                                className="w-full flex items-center justify-between p-3 hover:bg-muted rounded-lg transition-colors group"
                            >
                                <div className="flex items-center gap-3">
                                    <item.icon className="h-5 w-5 text-foreground" />
                                    <span className="text-sm font-medium">{item.title}</span>
                                </div>
                                <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                            </button>
                        ))}
                    </nav>
                </div>

                {/* Logout Button for Logged In Users */}
                {isLoggedIn && (
                    <div className="p-4">
                        <button
                            onClick={() => {
                                logout();
                                navigate('/');
                                onClose();
                            }}
                            className="w-full flex items-center justify-center gap-2 p-3 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors"
                        >
                            <LogOut className="h-4 w-4" />
                            <span className="text-sm font-medium">Logout</span>
                        </button>
                    </div>
                )}
            </div>
        </>
    );
};


export default AppSidebar;
