import { useAuth } from '@/lib/auth-context';
import { useFarmerData } from '@/hooks/useFarmerData';
import { Package, ShoppingCart, CreditCard, TrendingUp, Loader2 } from 'lucide-react';

export function FarmerDashboard() {
  const { profile } = useAuth();
  const { stats, isLoading } = useFarmerData();

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-UG', {
      style: 'currency',
      currency: 'UGX',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Welcome, {profile?.full_name}!</h1>
        <p className="text-muted-foreground">Manage your produce listings and orders</p>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Active Listings', value: stats.activeListings.toString(), icon: Package, color: 'text-primary' },
          { label: 'Pending Orders', value: stats.pendingOrders.toString(), icon: ShoppingCart, color: 'text-secondary' },
          { label: 'Total Earnings', value: formatCurrency(stats.totalEarnings), icon: CreditCard, color: 'text-accent' },
          { label: 'This Month', value: formatCurrency(stats.monthlyEarnings), icon: TrendingUp, color: 'text-primary' },
        ].map((stat, index) => (
          <div key={index} className="bg-card rounded-xl p-6 border border-border">
            <div className="flex items-center justify-between mb-4">
              <stat.icon className={`h-6 w-6 ${stat.color}`} />
            </div>
            <p className="text-2xl font-bold text-foreground">{stat.value}</p>
            <p className="text-sm text-muted-foreground">{stat.label}</p>
          </div>
        ))}
      </div>

      <div className="bg-card rounded-xl p-6 border border-border">
        <h2 className="text-lg font-semibold text-foreground mb-4">Quick Actions</h2>
        <p className="text-muted-foreground">
          Use the sidebar to add new produce listings, view orders, and track payments.
        </p>
      </div>
    </div>
  );
}
