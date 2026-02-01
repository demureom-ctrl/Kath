// ==========================================
// App Provider - Combines all Context Providers
// ==========================================

import { ReactNode } from 'react';
import { AuthProvider } from './AuthContext';
import { ActivityProvider } from './ActivityContext';
import { InventoryProvider } from './InventoryContext';
import { ProductsProvider } from './ProductsContext';
import { OrdersProvider } from './OrdersContext';
import { SalesProvider } from './SalesContext';
import { WasteProvider } from './WasteContext';

interface AppProviderProps {
    children: ReactNode;
}

export function AppProvider({ children }: AppProviderProps) {
    return (
        <AuthProvider>
            <ActivityProvider>
                <InventoryProvider>
                    <ProductsProvider>
                        <OrdersProvider>
                            <SalesProvider>
                                <WasteProvider>
                                    {children}
                                </WasteProvider>
                            </SalesProvider>
                        </OrdersProvider>
                    </ProductsProvider>
                </InventoryProvider>
            </ActivityProvider>
        </AuthProvider>
    );
}

export default AppProvider;
