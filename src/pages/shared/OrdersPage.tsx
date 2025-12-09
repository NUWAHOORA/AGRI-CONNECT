import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import { supabase } from '@/integrations/supabase/client';
import { ShoppingCart, Loader2, User } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { formatDistanceToNow } from 'date-fns';

interface Order {
  id: string;
  listing_id: string;
  buyer_id: string;
  farmer_id: string;
  quantity: number;
  total_price: number;
  status: string;
  buyer_message: string | null;
  created_at: string;
  buyer_name?: string;
  farmer_name?: string;
  commodity_name?: string;
}

export function OrdersPage() {
  const { user, role } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-UG', {
      style: 'currency',
      currency: 'UGX',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'confirmed':
        return <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100">Confirmed</Badge>;
      case 'cancelled':
        return <Badge variant="destructive">Cancelled</Badge>;
      case 'completed':
        return <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100">Completed</Badge>;
      default:
        return <Badge variant="secondary">Pending</Badge>;
    }
  };

  useEffect(() => {
    const fetchOrders = async () => {
      if (!user) return;

      // Admin sees all orders
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching orders:', error);
        setIsLoading(false);
        return;
      }

      // Fetch names and commodity info
      const ordersWithDetails = await Promise.all(
        (data || []).map(async (order) => {
          const [buyerRes, farmerRes, listingRes] = await Promise.all([
            supabase.from('profiles').select('full_name').eq('id', order.buyer_id).maybeSingle(),
            supabase.from('profiles').select('full_name').eq('id', order.farmer_id).maybeSingle(),
            supabase.from('produce_listings').select('commodity_id').eq('id', order.listing_id).maybeSingle(),
          ]);

          let commodityName = 'Unknown';
          if (listingRes.data?.commodity_id) {
            const { data: commodity } = await supabase
              .from('commodities')
              .select('name')
              .eq('id', listingRes.data.commodity_id)
              .maybeSingle();
            commodityName = commodity?.name || 'Unknown';
          }

          return {
            ...order,
            buyer_name: buyerRes.data?.full_name || 'Unknown',
            farmer_name: farmerRes.data?.full_name || 'Unknown',
            commodity_name: commodityName,
          };
        })
      );

      setOrders(ordersWithDetails);
      setIsLoading(false);
    };

    fetchOrders();
  }, [user]);

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
        <h1 className="text-2xl font-bold text-foreground">All Orders</h1>
        <p className="text-muted-foreground">Monitor all order transactions</p>
      </div>

      {/* Orders List */}
      <div className="space-y-4">
        {orders.length === 0 ? (
          <div className="bg-card rounded-xl p-12 border border-border text-center">
            <ShoppingCart className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No orders yet</p>
          </div>
        ) : (
          orders.map((order) => (
            <div key={order.id} className="bg-card rounded-xl p-6 border border-border">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="font-semibold text-foreground">{order.commodity_name}</span>
                    {getStatusBadge(order.status)}
                  </div>
                  
                  <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Buyer</p>
                      <div className="flex items-center gap-1">
                        <User className="h-3 w-3" />
                        <span className="font-medium">{order.buyer_name}</span>
                      </div>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Farmer</p>
                      <div className="flex items-center gap-1">
                        <User className="h-3 w-3" />
                        <span className="font-medium">{order.farmer_name}</span>
                      </div>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Quantity</p>
                      <p className="font-medium">{order.quantity}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Total</p>
                      <p className="font-medium text-primary">{formatCurrency(order.total_price)}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Date</p>
                      <p className="font-medium">{formatDistanceToNow(new Date(order.created_at), { addSuffix: true })}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
