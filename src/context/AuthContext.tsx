// ==========================================
// Auth Context - User Authentication & Roles
// ==========================================

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import database from '../database';
import { User, UserRole } from '../types';

// Auth context type
interface AuthContextType {
    user: User | null;
    users: User[];
    isAuthenticated: boolean;
    isAdmin: boolean;
    isStaff: boolean;
    login: (username: string, password: string) => Promise<{ success: boolean; error?: string }>;
    logout: () => void;
    addUser: (user: Omit<User, 'id'>) => Promise<{ success: boolean; error?: string }>;
    deleteUser: (id: string) => Promise<{ success: boolean; error?: string }>;
    loading: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

// Auth Provider
export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);

    // Load users and check session
    useEffect(() => {
        const initAuth = async () => {
            try {
                // 1. Load users from database
                const fetchedUsers = await database.getUsers();
                setUsers(fetchedUsers);

                // 2. Check for existing session
                const savedUser = localStorage.getItem('coffee_pos_user');
                if (savedUser) {
                    try {
                        const parsedUser = JSON.parse(savedUser);
                        // Validate if user still exists in DB
                        // In a real app, we would validate a token here.
                        // For this simple app, we check if ID exists in fetched list (if available)
                        // or just trust local storage for "remember me" until first protected action fails.
                        setUser(parsedUser);
                    } catch {
                        localStorage.removeItem('coffee_pos_user');
                    }
                }
            } catch (error) {
                console.error('Failed to initialize auth:', error);
                // Fallback to empty or show error?
            } finally {
                setLoading(false);
            }
        };

        initAuth();
    }, []);

    // Login function
    const login = async (username: string, password: string): Promise<{ success: boolean; error?: string }> => {
        try {
            // Fetch fresh user data to ensure password is correct
            // Note: In production, password checking should happen on server-side (Supabase Auth).
            // But since we are using a custom table 'users' as requested, we fetch and check.
            const foundUser = await database.getUserByUsername(username);

            if (!foundUser) {
                return { success: false, error: 'اسم المستخدم غير موجود' };
            }

            if (foundUser.password !== password) {
                return { success: false, error: 'كلمة المرور غير صحيحة' };
            }

            // Remove password from session object
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const { password: _, ...userWithoutPassword } = foundUser;

            setUser(userWithoutPassword as User);
            localStorage.setItem('coffee_pos_user', JSON.stringify(userWithoutPassword));
            return { success: true };
        } catch (error: any) {
            console.error('Login error:', error);
            // DEBUG: Return actual error message
            return { success: false, error: `Login Error: ${error?.message || error}` };
        }
    };

    // Logout function
    const logout = () => {
        setUser(null);
        localStorage.removeItem('coffee_pos_user');
    };

    // Add User function
    const addUser = async (newUser: Omit<User, 'id'>): Promise<{ success: boolean; error?: string }> => {
        try {
            // Check if username exists (Client side check for speed, DB constraint also exists)
            // But we should re-fetch or trust local list.
            if (users.some(u => u.username.toLowerCase() === newUser.username.toLowerCase())) {
                return { success: false, error: 'اسم المستخدم موجود بالفعل' };
            }

            const activeUser = await database.addUser(newUser);

            // Update local state
            setUsers(prev => [...prev, activeUser]);
            return { success: true };
        } catch (error) {
            console.error('Add user error:', error);
            return { success: false, error: 'فشل إضافة المستخدم' };
        }
    };

    // Delete User function
    const deleteUser = async (id: string): Promise<{ success: boolean; error?: string }> => {
        try {
            const userToDelete = users.find(u => u.id === id);

            if (!userToDelete) {
                return { success: false, error: 'المستخدم غير موجود' };
            }

            // Prevent deleting the last admin
            if (userToDelete.role === 'admin') {
                const adminCount = users.filter(u => u.role === 'admin').length;
                if (adminCount <= 1) {
                    return { success: false, error: 'لا يمكن حذف آخر مدير في النظام' };
                }
            }

            // Prevent deleting current logged in user
            if (user?.id === id) {
                return { success: false, error: 'لا يمكنك حذف الحساب الحالي' };
            }

            await database.deleteUser(id);

            // Update local state
            setUsers(prev => prev.filter(u => u.id !== id));
            return { success: true };
        } catch (error) {
            console.error('Delete user error:', error);
            return { success: false, error: 'فشل حذف المستخدم' };
        }
    };

    const value: AuthContextType = {
        user,
        users,
        isAuthenticated: !!user,
        isAdmin: user?.role === 'admin',
        isStaff: user?.role === 'staff',
        login,
        logout,
        addUser,
        deleteUser,
        loading,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// Hook to use auth context
export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}

export default AuthContext;
