import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import { supabase } from '@/integrations/supabase/client';
import { CreditCard, Loader2, Phone, CheckCircle, Clock, XCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { formatDistanceToNow } from 'date-fns';

interface Payment {
  id: string;
  order_id: string;
  buyer_id: string;
  farmer_id: string;
  amount: number;
  payment_method: string;
  status: string;
  phone_number: string;
  transaction_id: string | null;
  created_at: string;
  buyer_name?: string;
  farmer_name?: string;
}

export function PaymentsPage() {
  const { user, role } = useAuth();
  const [payments, setPayments] = useState<Payment[]>([]);
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
      case 'completed':
        return (
          <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100">
            <CheckCircle className="h-3 w-3 mr-1" />
            Completed
          </Badge>
        );
      case 'failed':
        return (
          <Badge variant="destructive">
            <XCircle className="h-3 w-3 mr-1" />
            Failed
          </Badge>
        );
      default:
        return (
          <Badge variant="secondary">
            <Clock className="h-3 w-3 mr-1" />
            Pending
          </Badge>
        );
    }
  };

  const getPaymentMethodLabel = (method: string) => {
    switch (method) {
      case 'mtn_mobile_money':
        return 'MTN Mobile Money';
      case 'airtel_money':
        return 'Airtel Money';
      default:
        return method;
    }
  };

  useEffect(() => {
    const fetchPayments = async () => {
      if (!user) return;

      let query = supabase.from('payments').select('*').order('created_at', { ascending: false });

      // Filter based on role
      if (role === 'farmer') {
        query = query.eq('farmer_id', user.id);
      } else if (role === 'buyer') {
        query = query.eq('buyer_id', user.id);
      }
      // Admin sees all

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching payments:', error);
        setIsLoading(false);
        return;
      }

      // Fetch names
      const paymentsWithNames = await Promise.all(
        (data || []).map(async (payment) => {
          const [buyerRes, farmerRes] = await Promise.all([
            supabase.from('profiles').select('full_name').eq('id', payment.buyer_id).maybeSingle(),
            supabase.from('profiles').select('full_name').eq('id', payment.farmer_id).maybeSingle(),
          ]);

          return {
            ...payment,
            buyer_name: buyerRes.data?.full_name || 'Unknown',
            farmer_name: farmerRes.data?.full_name || 'Unknown',
          };
        })
      );

      setPayments(paymentsWithNames);
      setIsLoading(false);
    };

    fetchPayments();
  }, [user, role]);

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
        <h1 className="text-2xl font-bold text-foreground">
          {role === 'admin' ? 'All Payments' : 'Payments'}
        </h1>
        <p className="text-muted-foreground">
          {role === 'admin' ? 'Monitor all payment transactions' : 'View your payment history'}
        </p>
      </div>

      {/* Payments List */}
      <div className="space-y-4">
        {payments.length === 0 ? (
          <div className="bg-card rounded-xl p-12 border border-border text-center">
            <CreditCard className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No payments yet</p>
          </div>
        ) : (
          payments.map((payment) => (
            <div key={payment.id} className="bg-card rounded-xl p-6 border border-border">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="font-semibold text-lg text-foreground">
                      {formatCurrency(payment.amount)}
                    </span>
                    {getStatusBadge(payment.status)}
                  </div>
                  
                  <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Method</p>
                      <p className="font-medium">{getPaymentMethodLabel(payment.payment_method)}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Phone</p>
                      <div className="flex items-center gap-1">
                        <Phone className="h-3 w-3" />
                        <span className="font-medium">{payment.phone_number}</span>
                      </div>
                    </div>
                    {(role === 'admin' || role === 'farmer') && (
                      <div>
                        <p className="text-muted-foreground">Buyer</p>
                        <p className="font-medium">{payment.buyer_name}</p>
                      </div>
                    )}
                    {(role === 'admin' || role === 'buyer') && (
                      <div>
                        <p className="text-muted-foreground">Farmer</p>
                        <p className="font-medium">{payment.farmer_name}</p>
                      </div>
                    )}
                  </div>
                  
                  {payment.transaction_id && (
                    <p className="text-xs text-muted-foreground mt-2">
                      Transaction ID: {payment.transaction_id}
                    </p>
                  )}
                </div>
                
                <div className="text-right">
                  <p className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(payment.created_at), { addSuffix: true })}
                  </p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
