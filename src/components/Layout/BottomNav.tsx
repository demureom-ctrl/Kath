// ==========================================
// Bottom Navigation Component - Light Theme
// ==========================================

import { ReactNode } from 'react';

interface NavItem {
    id: string;
    label: string;
    icon: ReactNode;
    adminOnly?: boolean;
}

interface BottomNavProps {
    activeTab: string;
    onTabChange: (tabId: string) => void;
    alertCount?: number;
    isAdmin?: boolean;
}

// SVG Icons as components
const POSIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect width="20" height="14" x="2" y="5" rx="2" />
        <path d="M2 10h20" />
    </svg>
);

const InventoryIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="m7.5 4.27 9 5.15" />
        <path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" />
        <path d="m3.3 7 8.7 5 8.7-5" />
        <path d="M12 22V12" />
    </svg>
);

const MenuIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 11H3" />
        <path d="M21 6H3" />
        <path d="M21 16H3" />
        <path d="M17 21H3" />
    </svg>
);

const ReportsIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 3v18h18" />
        <path d="m19 9-5 5-4-4-3 3" />
    </svg>
);

const UsersIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
);

const WasteIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 6h18" />
        <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
        <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
        <line x1="10" y1="11" x2="10" y2="17" />
        <line x1="14" y1="11" x2="14" y2="17" />
    </svg>
);

const KitchenIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2" />
        <path d="M7 2v20" />
        <path d="M21 15V2v0a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3" />
    </svg>
);

const PurchaseIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" />
        <path d="M3 6h18" />
        <path d="M16 10a4 4 0 0 1-8 0" />
    </svg>
);

const QRIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect width="5" height="5" x="3" y="3" rx="1" />
        <rect width="5" height="5" x="16" y="3" rx="1" />
        <rect width="5" height="5" x="3" y="16" rx="1" />
        <path d="M21 16h-3a2 2 0 0 0-2 2v3" />
        <path d="M21 21v.01" />
        <path d="M12 7v3a2 2 0 0 1-2 2H7" />
        <path d="M3 12h.01" />
        <path d="M12 3h.01" />
        <path d="M12 16v.01" />
        <path d="M16 12h1" />
        <path d="M21 12v.01" />
        <path d="M12 21v-1" />
    </svg>
);

const navItems: NavItem[] = [
    { id: 'pos', label: 'البيع', icon: <POSIcon /> },
    { id: 'kitchen', label: 'المطبخ', icon: <KitchenIcon /> },
    { id: 'qr', label: 'QR طلب', icon: <QRIcon /> },
    { id: 'inventory', label: 'المخزون', icon: <InventoryIcon />, adminOnly: true },
    { id: 'purchases', label: 'المشتريات', icon: <PurchaseIcon />, adminOnly: true },
    { id: 'menu', label: 'القائمة', icon: <MenuIcon />, adminOnly: true },
    { id: 'reports', label: 'التقارير', icon: <ReportsIcon />, adminOnly: true },
    { id: 'users', label: 'المستخدمين', icon: <UsersIcon />, adminOnly: true },
    { id: 'waste', label: 'الهدر', icon: <WasteIcon />, adminOnly: true },
];

export function BottomNav({ activeTab, onTabChange, alertCount = 0, isAdmin = false }: BottomNavProps) {
    // Filter items based on user role
    const visibleItems = navItems.filter(item => !item.adminOnly || isAdmin);

    return (
        <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg safe-area-inset-bottom z-50">
            <div className="flex justify-around items-center h-20 px-1 max-w-lg mx-auto overflow-x-auto">
                {visibleItems.map((item) => {
                    const isActive = activeTab === item.id;
                    const showBadge = item.id === 'reports' && alertCount > 0;
                    const isPOS = item.id === 'pos';

                    return (
                        <button
                            key={item.id}
                            onClick={() => onTabChange(item.id)}
                            className={`
                relative flex flex-col items-center justify-center min-w-[4rem] w-full h-16 rounded-xl
                transition-all duration-300 ease-out
                ${isPOS
                                    ? isActive
                                        ? 'text-white bg-gradient-to-t from-[#e67e22] to-[#f39c12] scale-105 shadow-md shadow-orange-300/50'
                                        : 'text-[#e67e22] bg-orange-50 hover:bg-orange-100'
                                    : isActive
                                        ? 'text-[#556c33] bg-[#556c33]/10 scale-105'
                                        : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'
                                }
              `}
                        >
                            <div className={`
                transition-transform duration-300
                ${isActive ? 'scale-105' : 'scale-90'}
              `}>
                                {item.icon}
                            </div>
                            <span className={`
                text-[11px] mt-1 font-semibold truncate w-full text-center
                ${isPOS
                                    ? isActive ? 'text-white' : 'text-[#e67e22]'
                                    : isActive ? 'text-[#556c33]' : 'text-gray-500'
                                }
              `}>
                                {item.label}
                            </span>

                            {/* Alert badge */}
                            {showBadge && (
                                <span className="absolute top-1 right-2 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center animate-pulse">
                                    {alertCount > 9 ? '!' : alertCount}
                                </span>
                            )}

                            {/* Active indicator */}
                            {isActive && (
                                <div className={`absolute -bottom-1 w-6 h-1 rounded-full ${isPOS ? 'bg-[#e67e22]' : 'bg-[#556c33]'}`} />
                            )}
                        </button>
                    );
                })}
            </div>
        </nav>
    );
}

export default BottomNav;
