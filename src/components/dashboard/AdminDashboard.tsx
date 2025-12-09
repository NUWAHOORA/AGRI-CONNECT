import { useAdminData } from '@/hooks/useAdminData';
import { Users, Package, ShoppingCart, CreditCard, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatDistanceToNow } from 'date-fns';

export function AdminDashboard() {
  const { pendingUsers, stats, isLoading, approveUser, rejectUser } = useAdminData();

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
        <h1 className="text-2xl font-bold text-foreground">Admin Dashboard</h1>
        <p className="text-muted-foreground">Manage users, commodities, and monitor transactions</p>
      </div>

      {/* Stats */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Pending Users', value: stats.pendingUsers.toString(), icon: Users, color: 'text-secondary' },
          { label: 'Total Listings', value: stats.totalListings.toString(), icon: Package, color: 'text-primary' },
          { label: 'Total Orders', value: stats.totalOrders.toString(), icon: ShoppingCart, color: 'text-accent' },
          { label: 'Payments', value: stats.totalPayments.toString(), icon: CreditCard, color: 'text-primary' },
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

      {/* Pending Users */}
      <div className="bg-card rounded-xl p-6 border border-border">
        <h2 className="text-lg font-semibold text-foreground mb-4">Pending User Approvals</h2>
        
        {pendingUsers.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">No pending user approvals</p>
        ) : (
          <div className="space-y-4">
            {pendingUsers.map((user) => (
              <div key={user.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-muted/50 rounded-lg">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-semibold text-foreground">{user.full_name}</p>
                    <Badge variant="outline" className="capitalize">{user.role}</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">Phone: {user.phone}</p>
                  <p className="text-sm text-muted-foreground">Location: {user.location}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Registered {formatDistanceToNow(new Date(user.created_at), { addSuffix: true })}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={() => approveUser(user.id)}
                    className="bg-green-600 hover:bg-green-700 text-white"
                  >
                    <CheckCircle className="h-4 w-4 mr-1" />
                    Approve
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => rejectUser(user.id)}
                  >
                    <XCircle className="h-4 w-4 mr-1" />
                    Reject
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
