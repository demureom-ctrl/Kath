// ==========================================
// Coffee Shop POS - Main Application
// ==========================================

import { useState, useEffect } from 'react';
import { AppProvider } from './context/AppProvider';
import { BottomNav } from './components/Layout';
import { useInventory } from './context/InventoryContext';
import { useAuth } from './context/AuthContext';
import { useActivity } from './context/ActivityContext';
import { POSPage } from './pages/POSPage';
import { InventoryPage } from './pages/InventoryPage';
import { MenuPage } from './pages/MenuPage';
import { ReportsPage } from './pages/ReportsPage';
import { UsersPage } from './pages/UsersPage';
import { WastePage } from './pages/WastePage';
import { KitchenPage } from './pages/KitchenPage';
import { PurchasesPage } from './pages/PurchasesPage';
import { LoginPage } from './pages/LoginPage';
import { QRGeneratorPage } from './pages/QRGeneratorPage';
import { CustomerOrderPage } from './pages/CustomerOrderPage';
import { CustomersPage } from './pages/CustomersPage';

type TabId = 'pos' | 'kitchen' | 'inventory' | 'menu' | 'reports' | 'users' | 'waste' | 'purchases' | 'qr' | 'customers';

function AppContent() {
  const [activeTab, setActiveTab] = useState<TabId>('pos');
  const { lowStockAlerts } = useInventory();
  const { user, isAuthenticated, isAdmin, logout, loading } = useAuth();
  const { logActivity } = useActivity();

  // Log login activity when user authenticates
  useEffect(() => {
    if (isAuthenticated && user) {
      logActivity('login', `تسجيل دخول: ${user.name}`);
    }
  }, [isAuthenticated]);

  // Handle logout with activity logging
  const handleLogout = () => {
    logActivity('logout', `تسجيل خروج: ${user?.name}`);
    logout();
  };

  // Show loading spinner while checking auth
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-[#556c33] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Show login page if not authenticated
  if (!isAuthenticated) {
    return <LoginPage />;
  }

  const renderPage = () => {
    // Staff can only access POS, Kitchen, QR
    if (!isAdmin && activeTab !== 'pos' && activeTab !== 'kitchen' && activeTab !== 'qr') {
      return <POSPage />;
    }

    switch (activeTab) {
      case 'pos':
        return <POSPage />;
      case 'kitchen':
        return <KitchenPage />;
      case 'inventory':
        return <InventoryPage />;
      case 'menu':
        return <MenuPage />;
      case 'reports':
        return <ReportsPage />;
      case 'users':
        return <UsersPage />;
      case 'waste':
        return <WastePage />;
      case 'purchases':
        return <PurchasesPage />;
      case 'qr':
        return <QRGeneratorPage />;
      case 'customers':
        return <CustomersPage />;
      default:
        return <POSPage />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* User Header Bar */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-200 px-4 pb-2 safe-pt-header flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gradient-to-br from-[#556c33] to-[#3e4f24] rounded-lg flex items-center justify-center">
            <span className="text-sm">☕</span>
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-900">{user?.name}</p>
            <p className="text-xs text-gray-500">
              {isAdmin ? '🔑 مدير' : '👤 موظف'}
            </p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="px-3 py-1.5 bg-red-50 text-red-600 text-sm rounded-lg hover:bg-red-100 transition-colors"
        >
          خروج
        </button>
      </div>

      {/* Main Content - with top padding for user bar */}
      <div className="safe-pt-content">
        {renderPage()}
      </div>

      <BottomNav
        activeTab={activeTab}
        onTabChange={(tab) => setActiveTab(tab as TabId)}
        alertCount={lowStockAlerts.length}
        isAdmin={isAdmin}
      />
    </div>
  );
}

import { HashRouter, Routes, Route, useParams, Navigate } from 'react-router-dom';

// Wrapper for Customer Order Page to extract token from params
function CustomerOrderRoute() {
  const { token } = useParams<{ token: string }>();
  if (!token) return <Navigate to="/" />;
  return <CustomerOrderPage token={token} />;
}

function App() {
  return (
    <HashRouter>
      <Routes>
        <Route path="/order/:token" element={<CustomerOrderRoute />} />
        <Route path="/*" element={
          <AppProvider>
            <AppContent />
          </AppProvider>
        } />
      </Routes>
    </HashRouter>
  );
}

export default App;
