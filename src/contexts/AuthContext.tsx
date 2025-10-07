import React, { createContext, useContext, useState, useEffect } from 'react';
import { getAuthToken, getUser, logout as authLogout } from '@/lib/auth';

interface User {
    id: string;
    fullName: string;
    username: string;
    mobileNumber: string;
    referCode: string;
    role?: 'user' | 'admin';
}

interface AuthContextType {
    user: User | null;
    isAuthenticated: boolean;
    logout: () => void;
    setUser: (user: User | null) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);

    useEffect(() => {
        // Check for existing authentication on app load
        const token = getAuthToken();
        const savedUser = getUser();

        if (token && savedUser) {
            setUser(savedUser);
        }
    }, []);

    const logout = () => {
        authLogout();
        setUser(null);
    };

    const value = {
        user,
        isAuthenticated: !!user,
        logout,
        setUser,
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};