// ==========================================
// Activity Log Context - Track User Actions
// ==========================================

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from './AuthContext';

// Activity types
export type ActivityType =
    | 'login'
    | 'logout'
    | 'sale_completed'
    | 'inventory_added'
    | 'inventory_updated'
    | 'inventory_restocked'
    | 'product_added'
    | 'product_updated'
    | 'product_deleted';

// Activity log entry
export interface ActivityLog {
    id: string;
    userId: string;
    userName: string;
    userRole: string;
    type: ActivityType;
    description: string;
    details?: Record<string, unknown>;
    timestamp: Date;
}

// Activity context type
interface ActivityContextType {
    activities: ActivityLog[];
    logActivity: (type: ActivityType, description: string, details?: Record<string, unknown>) => void;
    getActivitiesByUser: (userId: string) => ActivityLog[];
    getActivitiesByType: (type: ActivityType) => ActivityLog[];
    clearActivities: () => void;
}

const ActivityContext = createContext<ActivityContextType | null>(null);

const STORAGE_KEY = 'coffee_pos_activities';

// Activity Provider
export function ActivityProvider({ children }: { children: ReactNode }) {
    const { user } = useAuth();
    const [activities, setActivities] = useState<ActivityLog[]>([]);

    // Load activities from storage on mount
    useEffect(() => {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
            try {
                const parsed = JSON.parse(stored);
                setActivities(parsed.map((a: ActivityLog) => ({
                    ...a,
                    timestamp: new Date(a.timestamp),
                })));
            } catch {
                localStorage.removeItem(STORAGE_KEY);
            }
        }
    }, []);

    // Save activities to storage
    useEffect(() => {
        if (activities.length > 0) {
            // Keep only last 500 activities
            const trimmed = activities.slice(-500);
            localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
        }
    }, [activities]);

    // Log a new activity
    const logActivity = (type: ActivityType, description: string, details?: Record<string, unknown>) => {
        if (!user) return;

        const newActivity: ActivityLog = {
            id: `act_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            userId: user.id,
            userName: user.name,
            userRole: user.role,
            type,
            description,
            details,
            timestamp: new Date(),
        };

        setActivities(prev => [...prev, newActivity]);
    };

    // Get activities by user
    const getActivitiesByUser = (userId: string) => {
        return activities.filter(a => a.userId === userId);
    };

    // Get activities by type
    const getActivitiesByType = (type: ActivityType) => {
        return activities.filter(a => a.type === type);
    };

    // Clear all activities
    const clearActivities = () => {
        setActivities([]);
        localStorage.removeItem(STORAGE_KEY);
    };

    const value: ActivityContextType = {
        activities,
        logActivity,
        getActivitiesByUser,
        getActivitiesByType,
        clearActivities,
    };

    return <ActivityContext.Provider value={value}>{children}</ActivityContext.Provider>;
}

// Hook to use activity context
export function useActivity() {
    const context = useContext(ActivityContext);
    if (!context) {
        throw new Error('useActivity must be used within an ActivityProvider');
    }
    return context;
}

export default ActivityContext;
