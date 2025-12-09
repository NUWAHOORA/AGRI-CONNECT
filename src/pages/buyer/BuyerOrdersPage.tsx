import { useState } from 'react';
import { useBuyerData } from '@/hooks/useBuyerData';
import { useAuth } from '@/lib/auth-context';
import { ShoppingCart, Loader2, User, CreditCard, Phone, FileText, Receipt } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { formatDistanceToNow } from 'date-fns';
import { ReceiptDialog } from '@/components/ReceiptDialog';

interface Order {
  id: string;
  listing_id: string;
  farmer_id: string;
  farmer_name?: string;
  commodity_name?: string;
  quantity: number;
  total_price: number;
  status: string;
  payment_type?: string;
  delivery_location?: string | null;
  buyer_message: string | null;
  created_at: string;
}

export function BuyerOrdersPage() {
  const { orders, payments, isLoading, createPayment, refreshData } = useBuyerData();
  const { profile } = useAuth();
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<string>('mtn_momo');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isPaying, setIsPaying] = useState(false);
  const [receiptOrder, setReceiptOrder] = useState<Order | null>(null);
  const [receiptType, setReceiptType] = useState<'receipt' | 'invoice'>('receipt');

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-UG', {
      style: 'currency',
      currency: 'UGX',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'paid':
        return <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100">Paid</Badge>;
      case 'completed':
        return <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100">Completed</Badge>;
      case 'cancelled':
        return <Badge variant="destructive">Cancelled</Badge>;
      default:
        return <Badge variant="secondary">Pending</Badge>;
    }
  };

  const handlePayment = async () => {
    if (!selectedOrder || !paymentMethod || !phoneNumber) return;
    
    setIsPaying(true);
    const success = await createPayment(
      selectedOrder.id,
      selectedOrder.farmer_id,
      selectedOrder.total_price,
      paymentMethod,
      phoneNumber
    );
    setIsPaying(false);
    
    if (success) {
      setSelectedOrder(null);
      setPhoneNumber('');
      refreshData();
    }
  };

  const getOrderPayment = (orderId: string) => payments.find(p => p.order_id === orderId);

  const getReceiptData = (order: Order) => {
    const payment = getOrderPayment(order.id);
    return {
      id: order.id,
      orderDate: order.created_at,
      buyerName: profile?.full_name || 'Unknown',
      buyerPhone: profile?.phone || '',
      farmerName: order.farmer_name || 'Unknown',
      commodityName: order.commodity_name || 'Unknown',
      quantity: order.quantity,
      unit: 'kg',
      pricePerUnit: order.total_price / order.quantity,
      totalPrice: order.total_price,
      paymentMethod: payment?.payment_method,
      paymentStatus: order.status,
      deliveryLocation: order.delivery_location || undefined,
      transactionId: payment?.id?.slice(0, 8).toUpperCase(),
    };
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
        <h1 className="text-2xl font-bold text-foreground">My Orders</h1>
        <p className="text-muted-foreground">Track and pay for your orders</p>
      </div>

      <div className="space-y-4">
        {orders.length === 0 ? (
          <div className="bg-card rounded-xl p-12 border border-border text-center">
            <ShoppingCart className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No orders yet. Visit the Marketplace to place an order!</p>
          </div>
        ) : (
          orders.map((order) => (
            <div key={order.id} className="bg-card rounded-xl p-6 border border-border">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <span className="font-semibold text-foreground">{order.commodity_name}</span>
                    {getStatusBadge(order.status)}
                    {order.payment_type === 'pay_on_delivery' && <Badge variant="outline">Pay on Delivery</Badge>}
                  </div>
                  <div className="flex items-center gap-1 text-sm text-muted-foreground mb-3">
                    <User className="h-3 w-3" />
                    Farmer: {order.farmer_name}
                  </div>
                  <div className="grid sm:grid-cols-3 gap-4 text-sm">
                    <div><p className="text-muted-foreground">Quantity</p><p className="font-medium">{order.quantity} kg</p></div>
                    <div><p className="text-muted-foreground">Total Price</p><p className="font-medium text-primary">{formatCurrency(order.total_price)}</p></div>
                    <div><p className="text-muted-foreground">Ordered</p><p className="font-medium">{formatDistanceToNow(new Date(order.created_at), { addSuffix: true })}</p></div>
                  </div>
                </div>
                
                <div className="flex flex-wrap gap-2">
                  <Button size="sm" variant="outline" onClick={() => { setReceiptOrder(order); setReceiptType('invoice'); }}>
                    <FileText className="h-4 w-4 mr-1" />Invoice
                  </Button>
                  {(order.status === 'paid' || order.status === 'completed') && (
                    <Button size="sm" variant="outline" onClick={() => { setReceiptOrder(order); setReceiptType('receipt'); }}>
                      <Receipt className="h-4 w-4 mr-1" />Receipt
                    </Button>
                  )}
                  {order.status === 'pending' && order.payment_type !== 'pay_on_delivery' && (
                    <Button size="sm" onClick={() => setSelectedOrder(order)}>
                      <CreditCard className="h-4 w-4 mr-1" />Pay Now
                    </Button>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      <Dialog open={!!selectedOrder} onOpenChange={() => setSelectedOrder(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Make Payment</DialogTitle></DialogHeader>
          {selectedOrder && (
            <div className="space-y-4 pt-4">
              <div className="p-4 bg-muted/50 rounded-lg">
                <h4 className="font-semibold">{selectedOrder.commodity_name}</h4>
                <p className="text-lg font-bold text-primary mt-2">{formatCurrency(selectedOrder.total_price)}</p>
              </div>
              <div>
                <Label>Payment Method</Label>
                <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="mtn_momo">MTN Mobile Money</SelectItem>
                    <SelectItem value="airtel_money">Airtel Money</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="phone">Phone Number</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input id="phone" placeholder="0771234567" value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} className="pl-10" />
                </div>
              </div>
              <Button onClick={handlePayment} className="w-full" disabled={!phoneNumber || isPaying}>
                {isPaying ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <CreditCard className="h-4 w-4 mr-2" />}
                Pay {formatCurrency(selectedOrder.total_price)}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <ReceiptDialog open={!!receiptOrder} onOpenChange={() => setReceiptOrder(null)} receipt={receiptOrder ? getReceiptData(receiptOrder) : null} type={receiptType} />
    </div>
  );
}
