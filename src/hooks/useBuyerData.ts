import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth-context';
import { useToast } from '@/hooks/use-toast';

interface Listing {
  id: string;
  farmer_id: string;
  farmer_name?: string;
  commodity_id: string;
  commodity_name?: string;
  commodity_unit?: string;
  quantity: number;
  price_per_unit: number;
  location: string;
  description: string | null;
  is_available: boolean;
  created_at: string;
}

interface CartItem {
  listing: Listing;
  quantity: number;
}

interface Order {
  id: string;
  listing_id: string;
  farmer_id: string;
  farmer_name?: string;
  commodity_name?: string;
  quantity: number;
  total_price: number;
  status: string;
  payment_type: string;
  delivery_location: string | null;
  buyer_message: string | null;
  created_at: string;
}

interface Payment {
  id: string;
  order_id: string;
  amount: number;
  payment_method: string;
  status: string;
  phone_number: string;
  created_at: string;
}

interface BuyerStats {
  availableProduce: number;
  myOrders: number;
  totalSpent: number;
  commodities: number;
}

export function useBuyerData() {
  const { user } = useAuth();
  const [listings, setListings] = useState<Listing[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [stats, setStats] = useState<BuyerStats>({
    availableProduce: 0,
    myOrders: 0,
    totalSpent: 0,
    commodities: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const fetchListings = async () => {
    const { data, error } = await supabase
      .from('produce_listings')
      .select('*')
      .eq('is_available', true)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching listings:', error);
      return [];
    }

    // Fetch commodity and farmer details
    const listingsWithDetails = await Promise.all(
      (data || []).map(async (listing) => {
        const [commodityRes, farmerRes] = await Promise.all([
          supabase.from('commodities').select('name, unit').eq('id', listing.commodity_id).maybeSingle(),
          supabase.from('profiles').select('full_name').eq('id', listing.farmer_id).maybeSingle(),
        ]);
        
        return {
          ...listing,
          commodity_name: commodityRes.data?.name || 'Unknown',
          commodity_unit: commodityRes.data?.unit || 'kg',
          farmer_name: farmerRes.data?.full_name || 'Unknown Farmer',
        };
      })
    );

    return listingsWithDetails;
  };

  const fetchOrders = async () => {
    if (!user) return [];

    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .eq('buyer_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching orders:', error);
      return [];
    }

    // Fetch farmer names and commodity names
    const ordersWithDetails = await Promise.all(
      (data || []).map(async (order) => {
        const [farmerRes, listingRes] = await Promise.all([
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
          farmer_name: farmerRes.data?.full_name || 'Unknown Farmer',
          commodity_name: commodityName,
          payment_type: order.payment_type || 'pay_now',
          delivery_location: order.delivery_location || null,
        };
      })
    );

    return ordersWithDetails;
  };

  const fetchPayments = async () => {
    if (!user) return [];

    const { data, error } = await supabase
      .from('payments')
      .select('*')
      .eq('buyer_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching payments:', error);
      return [];
    }

    return data || [];
  };

  const fetchStats = async () => {
    if (!user) return { availableProduce: 0, myOrders: 0, totalSpent: 0, commodities: 0 };

    const [listingsRes, ordersRes, paymentsRes, commoditiesRes] = await Promise.all([
      supabase.from('produce_listings').select('id', { count: 'exact', head: true }).eq('is_available', true),
      supabase.from('orders').select('id', { count: 'exact', head: true }).eq('buyer_id', user.id),
      supabase.from('payments').select('amount').eq('buyer_id', user.id).eq('status', 'success'),
      supabase.from('commodities').select('id', { count: 'exact', head: true }),
    ]);

    const totalSpent = (paymentsRes.data || []).reduce((sum, p) => sum + Number(p.amount), 0);

    return {
      availableProduce: listingsRes.count || 0,
      myOrders: ordersRes.count || 0,
      totalSpent,
      commodities: commoditiesRes.count || 0,
    };
  };

  // Cart functions
  const addToCart = (listing: Listing, quantity: number) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.listing.id === listing.id);
      if (existing) {
        return prev.map((item) =>
          item.listing.id === listing.id
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      }
      return [...prev, { listing, quantity }];
    });
    toast({
      title: 'Added to Cart',
      description: `${quantity} ${listing.commodity_unit} of ${listing.commodity_name} added`,
    });
  };

  const removeFromCart = (listingId: string) => {
    setCart((prev) => prev.filter((item) => item.listing.id !== listingId));
  };

  const updateCartQuantity = (listingId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(listingId);
      return;
    }
    setCart((prev) =>
      prev.map((item) =>
        item.listing.id === listingId ? { ...item, quantity } : item
      )
    );
  };

  const clearCart = () => {
    setCart([]);
  };

  const getCartTotal = () => {
    return cart.reduce((sum, item) => sum + item.quantity * item.listing.price_per_unit, 0);
  };

  const createOrder = async (
    listing: Listing,
    quantity: number,
    message: string,
    paymentType: 'pay_now' | 'pay_on_delivery' = 'pay_now',
    deliveryLocation?: string
  ) => {
    if (!user) return false;

    const totalPrice = quantity * listing.price_per_unit;

    const { error } = await supabase
      .from('orders')
      .insert({
        buyer_id: user.id,
        farmer_id: listing.farmer_id,
        listing_id: listing.id,
        quantity,
        total_price: totalPrice,
        buyer_message: message || null,
        payment_type: paymentType,
        delivery_location: deliveryLocation || null,
      });

    if (error) {
      toast({
        title: 'Error',
        description: 'Failed to create order',
        variant: 'destructive',
      });
      return false;
    }

    toast({
      title: 'Success',
      description: 'Order placed successfully',
    });
    
    await refreshData();
    return true;
  };

  const createOrdersFromCart = async (
    paymentType: 'pay_now' | 'pay_on_delivery',
    deliveryLocation: string,
    message?: string
  ) => {
    if (!user || cart.length === 0) return false;

    const orders = cart.map((item) => ({
      buyer_id: user.id,
      farmer_id: item.listing.farmer_id,
      listing_id: item.listing.id,
      quantity: item.quantity,
      total_price: item.quantity * item.listing.price_per_unit,
      buyer_message: message || null,
      payment_type: paymentType,
      delivery_location: deliveryLocation,
    }));

    const { error } = await supabase.from('orders').insert(orders);

    if (error) {
      toast({
        title: 'Error',
        description: 'Failed to create orders',
        variant: 'destructive',
      });
      return false;
    }

    clearCart();
    toast({
      title: 'Success',
      description: `${orders.length} order(s) placed successfully`,
    });
    
    await refreshData();
    return true;
  };

  const createPayment = async (orderId: string, farmerId: string, amount: number, paymentMethod: string, phoneNumber: string) => {
    if (!user) return false;

    const { error } = await supabase
      .from('payments')
      .insert({
        order_id: orderId,
        buyer_id: user.id,
        farmer_id: farmerId,
        amount,
        payment_method: paymentMethod as 'mtn_momo' | 'airtel_money',
        phone_number: phoneNumber,
      });

    if (error) {
      toast({
        title: 'Error',
        description: 'Failed to initiate payment',
        variant: 'destructive',
      });
      return false;
    }

    // Update order status to paid
    await supabase
      .from('orders')
      .update({ status: 'paid' })
      .eq('id', orderId);

    toast({
      title: 'Payment Initiated',
      description: 'Please check your phone for the payment prompt',
    });
    
    await refreshData();
    return true;
  };

  const refreshData = async () => {
    setIsLoading(true);
    const [listingsData, ordersData, paymentsData, statsData] = await Promise.all([
      fetchListings(),
      fetchOrders(),
      fetchPayments(),
      fetchStats(),
    ]);
    setListings(listingsData);
    setOrders(ordersData);
    setPayments(paymentsData);
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
    payments,
    cart,
    stats,
    isLoading,
    addToCart,
    removeFromCart,
    updateCartQuantity,
    clearCart,
    getCartTotal,
    createOrder,
    createOrdersFromCart,
    createPayment,
    refreshData,
  };
}
