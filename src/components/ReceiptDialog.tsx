import { useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Printer, Download } from 'lucide-react';
import { format } from 'date-fns';

interface ReceiptData {
  id: string;
  orderDate: string;
  buyerName: string;
  buyerPhone: string;
  farmerName: string;
  commodityName: string;
  quantity: number;
  unit: string;
  pricePerUnit: number;
  totalPrice: number;
  paymentMethod?: string;
  paymentStatus: string;
  deliveryLocation?: string;
  transactionId?: string;
}

interface ReceiptDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  receipt: ReceiptData | null;
  type: 'receipt' | 'invoice';
}

export function ReceiptDialog({ open, onOpenChange, receipt, type }: ReceiptDialogProps) {
  const printRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    if (printRef.current) {
      const printContent = printRef.current.innerHTML;
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(`
          <html>
            <head>
              <title>${type === 'receipt' ? 'Receipt' : 'Invoice'} - ${receipt?.id}</title>
              <style>
                body { font-family: Arial, sans-serif; padding: 20px; max-width: 400px; margin: 0 auto; }
                .header { text-align: center; margin-bottom: 20px; border-bottom: 2px solid #333; padding-bottom: 10px; }
                .header h1 { margin: 0; color: #2d5016; }
                .header p { margin: 5px 0; color: #666; }
                .section { margin-bottom: 15px; }
                .section-title { font-weight: bold; color: #333; margin-bottom: 5px; border-bottom: 1px solid #ddd; padding-bottom: 3px; }
                .row { display: flex; justify-content: space-between; margin: 5px 0; }
                .label { color: #666; }
                .value { font-weight: 500; }
                .total { font-size: 1.2em; font-weight: bold; color: #2d5016; border-top: 2px solid #333; padding-top: 10px; margin-top: 10px; }
                .footer { text-align: center; margin-top: 20px; padding-top: 15px; border-top: 1px dashed #999; color: #666; font-size: 0.9em; }
                .status { padding: 3px 8px; border-radius: 4px; font-size: 0.85em; }
                .status-paid { background: #d4edda; color: #155724; }
                .status-pending { background: #fff3cd; color: #856404; }
                @media print { body { print-color-adjust: exact; -webkit-print-color-adjust: exact; } }
              </style>
            </head>
            <body>
              ${printContent}
            </body>
          </html>
        `);
        printWindow.document.close();
        printWindow.print();
      }
    }
  };

  if (!receipt) return null;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-UG', {
      style: 'currency',
      currency: 'UGX',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{type === 'receipt' ? 'Payment Receipt' : 'Order Invoice'}</DialogTitle>
        </DialogHeader>
        
        <div ref={printRef} className="bg-white text-black p-4 rounded-lg">
          {/* Header */}
          <div className="header text-center mb-4 pb-3 border-b-2 border-primary">
            <h1 className="text-xl font-bold text-primary">AGRI-CONNECT</h1>
            <p className="text-sm text-muted-foreground">Agricultural Marketplace</p>
            <p className="text-xs text-muted-foreground mt-1">
              {type === 'receipt' ? 'PAYMENT RECEIPT' : 'ORDER INVOICE'}
            </p>
          </div>

          {/* Document Info */}
          <div className="section mb-4">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">{type === 'receipt' ? 'Receipt' : 'Invoice'} #:</span>
              <span className="font-medium">{receipt.id.slice(0, 8).toUpperCase()}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Date:</span>
              <span className="font-medium">{format(new Date(receipt.orderDate), 'dd MMM yyyy, HH:mm')}</span>
            </div>
            {receipt.transactionId && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Transaction ID:</span>
                <span className="font-medium">{receipt.transactionId}</span>
              </div>
            )}
          </div>

          {/* Parties */}
          <div className="section mb-4">
            <p className="font-semibold text-sm border-b pb-1 mb-2">Parties</p>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Buyer:</span>
              <span className="font-medium">{receipt.buyerName}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Seller:</span>
              <span className="font-medium">{receipt.farmerName}</span>
            </div>
          </div>

          {/* Order Details */}
          <div className="section mb-4">
            <p className="font-semibold text-sm border-b pb-1 mb-2">Order Details</p>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Item:</span>
              <span className="font-medium">{receipt.commodityName}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Quantity:</span>
              <span className="font-medium">{receipt.quantity} {receipt.unit}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Unit Price:</span>
              <span className="font-medium">{formatCurrency(receipt.pricePerUnit)}</span>
            </div>
          </div>

          {/* Delivery */}
          {receipt.deliveryLocation && (
            <div className="section mb-4">
              <p className="font-semibold text-sm border-b pb-1 mb-2">Delivery</p>
              <p className="text-sm">{receipt.deliveryLocation}</p>
            </div>
          )}

          {/* Payment */}
          <div className="section mb-4">
            <p className="font-semibold text-sm border-b pb-1 mb-2">Payment</p>
            {receipt.paymentMethod && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Method:</span>
                <span className="font-medium">
                  {receipt.paymentMethod === 'mtn_momo' ? 'MTN Mobile Money' : 'Airtel Money'}
                </span>
              </div>
            )}
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Status:</span>
              <span className={`status ${receipt.paymentStatus === 'success' || receipt.paymentStatus === 'paid' ? 'status-paid' : 'status-pending'}`}>
                {receipt.paymentStatus === 'success' || receipt.paymentStatus === 'paid' ? 'PAID' : 'PENDING'}
              </span>
            </div>
          </div>

          {/* Total */}
          <div className="total flex justify-between items-center pt-3 mt-3 border-t-2 border-primary">
            <span className="text-lg font-bold">TOTAL:</span>
            <span className="text-xl font-bold text-primary">{formatCurrency(receipt.totalPrice)}</span>
          </div>

          {/* Footer */}
          <div className="footer text-center mt-4 pt-3 border-t border-dashed text-xs text-muted-foreground">
            <p>Thank you for using AGRI-CONNECT!</p>
            <p className="mt-1">For support: support@agri-connect.ug</p>
          </div>
        </div>

        <div className="flex gap-2 mt-4">
          <Button onClick={handlePrint} className="flex-1">
            <Printer className="h-4 w-4 mr-2" />
            Print {type === 'receipt' ? 'Receipt' : 'Invoice'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
