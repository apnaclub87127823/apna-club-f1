// Auth utility functions for token management
export const getAuthToken = (): string | null => {
    return localStorage.getItem('authToken');
};

export const setAuthToken = (token: string): void => {
    localStorage.setItem('authToken', token);
};

export const removeAuthToken = (): void => {
    localStorage.removeItem('authToken');
};

export const getUser = () => {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
};

export const setUser = (user: any): void => {
    localStorage.setItem('user', JSON.stringify(user));
};

export const removeUser = (): void => {
    localStorage.removeItem('user');
};

export const isAuthenticated = (): boolean => {
    return !!getAuthToken();
};

export const logout = (): void => {
    removeAuthToken();
    removeUser();
};