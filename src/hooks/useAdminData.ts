import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface PendingUser {
  id: string;
  full_name: string;
  phone: string;
  location: string;
  account_status: string;
  created_at: string;
  role: string;
}

interface DashboardStats {
  pendingUsers: number;
  totalListings: number;
  totalOrders: number;
  totalPayments: number;
}

export function useAdminData() {
  const [pendingUsers, setPendingUsers] = useState<PendingUser[]>([]);
  const [stats, setStats] = useState<DashboardStats>({
    pendingUsers: 0,
    totalListings: 0,
    totalOrders: 0,
    totalPayments: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const fetchPendingUsers = async () => {
    const { data, error } = await supabase
      .from('profiles')
      .select(`
        id,
        full_name,
        phone,
        location,
        account_status,
        created_at
      `)
      .eq('account_status', 'pending')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching pending users:', error);
      return [];
    }

    // Fetch roles for each user
    const usersWithRoles = await Promise.all(
      (data || []).map(async (user) => {
        const { data: roleData } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', user.id)
          .maybeSingle();
        
        return {
          ...user,
          role: roleData?.role || 'unknown',
        };
      })
    );

    return usersWithRoles;
  };

  const fetchStats = async () => {
    const [pendingRes, listingsRes, ordersRes, paymentsRes] = await Promise.all([
      supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('account_status', 'pending'),
      supabase.from('produce_listings').select('id', { count: 'exact', head: true }),
      supabase.from('orders').select('id', { count: 'exact', head: true }),
      supabase.from('payments').select('id', { count: 'exact', head: true }),
    ]);

    return {
      pendingUsers: pendingRes.count || 0,
      totalListings: listingsRes.count || 0,
      totalOrders: ordersRes.count || 0,
      totalPayments: paymentsRes.count || 0,
    };
  };

  const approveUser = async (userId: string) => {
    const { error } = await supabase
      .from('profiles')
      .update({ account_status: 'approved' })
      .eq('id', userId);

    if (error) {
      toast({
        title: 'Error',
        description: 'Failed to approve user',
        variant: 'destructive',
      });
      return false;
    }

    toast({
      title: 'Success',
      description: 'User approved successfully',
    });
    
    await refreshData();
    return true;
  };

  const rejectUser = async (userId: string) => {
    const { error } = await supabase
      .from('profiles')
      .update({ account_status: 'rejected' })
      .eq('id', userId);

    if (error) {
      toast({
        title: 'Error',
        description: 'Failed to reject user',
        variant: 'destructive',
      });
      return false;
    }

    toast({
      title: 'Success',
      description: 'User rejected',
    });
    
    await refreshData();
    return true;
  };

  const refreshData = async () => {
    setIsLoading(true);
    const [users, statsData] = await Promise.all([
      fetchPendingUsers(),
      fetchStats(),
    ]);
    setPendingUsers(users);
    setStats(statsData);
    setIsLoading(false);
  };

  useEffect(() => {
    refreshData();
  }, []);

  return {
    pendingUsers,
    stats,
    isLoading,
    approveUser,
    rejectUser,
    refreshData,
  };
}
