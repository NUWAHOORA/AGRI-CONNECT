import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth-context';
import { useToast } from '@/hooks/use-toast';

interface Listing {
  id: string;
  commodity_id: string;
  commodity_name?: string;
  quantity: number;
  price_per_unit: number;
  location: string;
  description: string | null;
  is_available: boolean;
  created_at: string;
}

interface Order {
  id: string;
  listing_id: string;
  buyer_id: string;
  buyer_name?: string;
  quantity: number;
  total_price: number;
  status: string;
  buyer_message: string | null;
  created_at: string;
}

interface FarmerStats {
  activeListings: number;
  pendingOrders: number;
  totalEarnings: number;
  monthlyEarnings: number;
}

export function useFarmerData() {
  const { user } = useAuth();
  const [listings, setListings] = useState<Listing[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [stats, setStats] = useState<FarmerStats>({
    activeListings: 0,
    pendingOrders: 0,
    totalEarnings: 0,
    monthlyEarnings: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const fetchListings = async () => {
    if (!user) return [];

    const { data, error } = await supabase
      .from('produce_listings')
      .select(`
        id,
        commodity_id,
        quantity,
        price_per_unit,
        location,
        description,
        is_available,
        created_at
      `)
      .eq('farmer_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching listings:', error);
      return [];
    }

    // Fetch commodity names
    const listingsWithCommodities = await Promise.all(
      (data || []).map(async (listing) => {
        const { data: commodity } = await supabase
          .from('commodities')
          .select('name')
          .eq('id', listing.commodity_id)
          .maybeSingle();
        
        return {
          ...listing,
          commodity_name: commodity?.name || 'Unknown',
        };
      })
    );

    return listingsWithCommodities;
  };

  const fetchOrders = async () => {
    if (!user) return [];

    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .eq('farmer_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching orders:', error);
      return [];
    }

    // Fetch buyer names
    const ordersWithBuyers = await Promise.all(
      (data || []).map(async (order) => {
        const { data: profile } = await supabase
          .from('profiles')
          .select('full_name')
          .eq('id', order.buyer_id)
          .maybeSingle();
        
        return {
          ...order,
          buyer_name: profile?.full_name || 'Unknown',
        };
      })
    );

    return ordersWithBuyers;
  };

  const fetchStats = async () => {
    if (!user) return { activeListings: 0, pendingOrders: 0, totalEarnings: 0, monthlyEarnings: 0 };

    const [listingsRes, ordersRes, paymentsRes] = await Promise.all([
      supabase.from('produce_listings').select('id', { count: 'exact', head: true }).eq('farmer_id', user.id).eq('is_available', true),
      supabase.from('orders').select('id', { count: 'exact', head: true }).eq('farmer_id', user.id).eq('status', 'pending'),
      supabase.from('payments').select('amount').eq('farmer_id', user.id).eq('status', 'success'),
    ]);

    const totalEarnings = (paymentsRes.data || []).reduce((sum, p) => sum + Number(p.amount), 0);

    // Monthly earnings (current month)
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);
    
    const { data: monthlyPayments } = await supabase
      .from('payments')
      .select('amount')
      .eq('farmer_id', user.id)
      .eq('status', 'success')
      .gte('created_at', startOfMonth.toISOString());

    const monthlyEarnings = (monthlyPayments || []).reduce((sum, p) => sum + Number(p.amount), 0);

    return {
      activeListings: listingsRes.count || 0,
      pendingOrders: ordersRes.count || 0,
      totalEarnings,
      monthlyEarnings,
    };
  };

  const createListing = async (commodityId: string, quantity: number, pricePerUnit: number, location: string, description: string) => {
    if (!user) return false;

    const { error } = await supabase
      .from('produce_listings')
      .insert({
        farmer_id: user.id,
        commodity_id: commodityId,
        quantity,
        price_per_unit: pricePerUnit,
        location,
        description: description || null,
      });

    if (error) {
      toast({
        title: 'Error',
        description: 'Failed to create listing',
        variant: 'destructive',
      });
      return false;
    }

    toast({
      title: 'Success',
      description: 'Listing created successfully',
    });
    
    await refreshData();
    return true;
  };

  const updateOrderStatus = async (orderId: string, status: string) => {
    const { error } = await supabase
      .from('orders')
      .update({ status: status as 'pending' | 'cancelled' | 'completed' | 'paid' })
      .eq('id', orderId);

    if (error) {
      toast({
        title: 'Error',
        description: 'Failed to update order status',
        variant: 'destructive',
      });
      return false;
    }

    toast({
      title: 'Success',
      description: 'Order status updated',
    });
    
    await refreshData();
    return true;
  };

  const deleteListing = async (listingId: string) => {
    const { error } = await supabase
      .from('produce_listings')
      .delete()
      .eq('id', listingId);

    if (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete listing',
        variant: 'destructive',
      });
      return false;
    }

    toast({
      title: 'Success',
      description: 'Listing deleted',
    });
    
    await refreshData();
    return true;
  };

  const refreshData = async () => {
    setIsLoading(true);
    const [listingsData, ordersData, statsData] = await Promise.all([
      fetchListings(),
      fetchOrders(),
      fetchStats(),
    ]);
    setListings(listingsData);
    setOrders(ordersData);
    setStats(statsData);
    setIsLoading(false);
  };

  useEffect(() => {
    if (user) {
      refreshData();
    }
  }, [user]);

  return {
    listings,
    orders,
    stats,
    isLoading,
    createListing,
    updateOrderStatus,
    deleteListing,
    refreshData,
  };
}
