import { useAuth } from '@/lib/auth-context';
import { useBuyerData } from '@/hooks/useBuyerData';
import { Package, ShoppingCart, CreditCard, Search, Loader2 } from 'lucide-react';

export function BuyerDashboard() {
  const { profile } = useAuth();
  const { stats, isLoading } = useBuyerData();

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
        <p className="text-muted-foreground">Browse produce and manage your orders</p>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Available Produce', value: stats.availableProduce.toString(), icon: Package, color: 'text-primary' },
          { label: 'My Orders', value: stats.myOrders.toString(), icon: ShoppingCart, color: 'text-secondary' },
          { label: 'Total Spent', value: formatCurrency(stats.totalSpent), icon: CreditCard, color: 'text-accent' },
          { label: 'Commodities', value: stats.commodities.toString(), icon: Search, color: 'text-primary' },
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
        <h2 className="text-lg font-semibold text-foreground mb-4">Start Shopping</h2>
        <p className="text-muted-foreground">
          Visit the Marketplace to browse available produce from verified farmers across Uganda.
        </p>
      </div>
    </div>
  );
}
