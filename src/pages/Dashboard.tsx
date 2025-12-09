import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/lib/auth-context';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { FarmerDashboard } from '@/components/dashboard/FarmerDashboard';
import { BuyerDashboard } from '@/components/dashboard/BuyerDashboard';
import { AdminDashboard } from '@/components/dashboard/AdminDashboard';
import { PendingApproval } from '@/components/dashboard/PendingApproval';
import { Loader2 } from 'lucide-react';

// Admin pages
import { UsersPage } from '@/pages/admin/UsersPage';
import { CommoditiesPage } from '@/pages/admin/CommoditiesPage';

// Farmer pages
import { ListingsPage } from '@/pages/farmer/ListingsPage';
import { FarmerOrdersPage } from '@/pages/farmer/FarmerOrdersPage';

// Buyer pages
import { MarketplacePage } from '@/pages/buyer/MarketplacePage';
import { BuyerOrdersPage } from '@/pages/buyer/BuyerOrdersPage';

// Shared pages
import { PaymentsPage } from '@/pages/shared/PaymentsPage';
import { OrdersPage } from '@/pages/shared/OrdersPage';
import { SettingsPage } from '@/pages/shared/SettingsPage';

export default function Dashboard() {
  const { user, role, isLoading, isApproved, profile } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (!isLoading && !user) {
      navigate('/auth');
    }
  }, [user, isLoading, navigate]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  // Show pending approval screen for non-approved users (except admins)
  if (!isApproved && role !== 'admin') {
    return (
      <DashboardLayout>
        <PendingApproval status={profile?.account_status || 'pending'} />
      </DashboardLayout>
    );
  }

  // Get the current sub-route
  const path = location.pathname;

  const renderContent = () => {
    // Settings page for all users
    if (path === '/dashboard/settings') return <SettingsPage />;

    // Admin routes
    if (role === 'admin') {
      if (path === '/dashboard/users') return <UsersPage />;
      if (path === '/dashboard/commodities') return <CommoditiesPage />;
      if (path === '/dashboard/orders') return <OrdersPage />;
      if (path === '/dashboard/payments') return <PaymentsPage />;
      return <AdminDashboard />;
    }

    // Farmer routes
    if (role === 'farmer') {
      if (path === '/dashboard/listings') return <ListingsPage />;
      if (path === '/dashboard/orders') return <FarmerOrdersPage />;
      if (path === '/dashboard/payments') return <PaymentsPage />;
      return <FarmerDashboard />;
    }

    // Buyer routes
    if (role === 'buyer') {
      if (path === '/dashboard/marketplace') return <MarketplacePage />;
      if (path === '/dashboard/orders') return <BuyerOrdersPage />;
      if (path === '/dashboard/payments') return <PaymentsPage />;
      return <BuyerDashboard />;
    }

    return null;
  };

  return (
    <DashboardLayout>
      {renderContent()}
    </DashboardLayout>
  );
}
