import { useState } from 'react';
import { useBuyerData } from '@/hooks/useBuyerData';
import { useCommodities } from '@/hooks/useCommodities';
import { Package, Loader2, MapPin, User, Search, ShoppingCart, Plus, Minus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Badge } from '@/components/ui/badge';
import { formatDistanceToNow } from 'date-fns';

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

export function MarketplacePage() {
  const { 
    listings, 
    isLoading, 
    cart, 
    addToCart, 
    removeFromCart, 
    updateCartQuantity, 
    getCartTotal,
    createOrdersFromCart 
  } = useBuyerData();
  const { commodities } = useCommodities();
  const [searchTerm, setSearchTerm] = useState('');
  const [commodityFilter, setCommodityFilter] = useState<string>('all');
  const [selectedListing, setSelectedListing] = useState<Listing | null>(null);
  const [orderQuantity, setOrderQuantity] = useState('');
  const [showCart, setShowCart] = useState(false);
  const [showCheckout, setShowCheckout] = useState(false);
  const [paymentType, setPaymentType] = useState<'pay_now' | 'pay_on_delivery'>('pay_now');
  const [deliveryLocation, setDeliveryLocation] = useState('');
  const [orderMessage, setOrderMessage] = useState('');
  const [isOrdering, setIsOrdering] = useState(false);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-UG', {
      style: 'currency',
      currency: 'UGX',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const filteredListings = listings.filter((listing) => {
    const matchesSearch = 
      listing.commodity_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      listing.farmer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      listing.location.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCommodity = commodityFilter === 'all' || listing.commodity_id === commodityFilter;

    return matchesSearch && matchesCommodity;
  });

  const handleAddToCart = () => {
    if (!selectedListing || !orderQuantity) return;
    addToCart(selectedListing, parseFloat(orderQuantity));
    setSelectedListing(null);
    setOrderQuantity('');
  };

  const handleCheckout = async () => {
    if (!deliveryLocation) {
      return;
    }
    
    setIsOrdering(true);
    const success = await createOrdersFromCart(paymentType, deliveryLocation, orderMessage);
    setIsOrdering(false);
    
    if (success) {
      setShowCheckout(false);
      setShowCart(false);
      setDeliveryLocation('');
      setOrderMessage('');
      setPaymentType('pay_now');
    }
  };

  const cartItemCount = cart.reduce((sum, item) => sum + 1, 0);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Marketplace</h1>
          <p className="text-muted-foreground">Browse available produce from farmers</p>
        </div>
        <Button variant="outline" className="relative" onClick={() => setShowCart(true)}>
          <ShoppingCart className="h-5 w-5" />
          {cartItemCount > 0 && (
            <Badge className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 text-xs">
              {cartItemCount}
            </Badge>
          )}
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by produce, farmer, or location..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={commodityFilter} onValueChange={setCommodityFilter}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="All Commodities" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Commodities</SelectItem>
            {commodities.map((c) => (
              <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Listings Grid */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredListings.length === 0 ? (
          <div className="col-span-full text-center py-12">
            <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No produce available</p>
          </div>
        ) : (
          filteredListings.map((listing) => (
            <div key={listing.id} className="bg-card rounded-xl p-6 border border-border hover:border-primary/50 transition-colors">
              <div className="mb-4">
                <h3 className="font-semibold text-lg text-foreground">{listing.commodity_name}</h3>
                <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
                  <User className="h-3 w-3" />
                  {listing.farmer_name}
                </div>
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <MapPin className="h-3 w-3" />
                  {listing.location}
                </div>
              </div>
              
              <div className="space-y-2 mb-4">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Available:</span>
                  <span className="font-medium">{listing.quantity} {listing.commodity_unit}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Price:</span>
                  <span className="font-bold text-primary">{formatCurrency(listing.price_per_unit)}/{listing.commodity_unit}</span>
                </div>
              </div>

              {listing.description && (
                <p className="text-sm text-muted-foreground mb-4 line-clamp-2">{listing.description}</p>
              )}
              
              <div className="flex items-center justify-between pt-4 border-t border-border">
                <p className="text-xs text-muted-foreground">
                  {formatDistanceToNow(new Date(listing.created_at), { addSuffix: true })}
                </p>
                <Button size="sm" onClick={() => setSelectedListing(listing)}>
                  <ShoppingCart className="h-4 w-4 mr-1" />
                  Add to Cart
                </Button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add to Cart Dialog */}
      <Dialog open={!!selectedListing} onOpenChange={() => setSelectedListing(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add to Cart</DialogTitle>
          </DialogHeader>
          {selectedListing && (
            <div className="space-y-4 pt-4">
              <div className="p-4 bg-muted/50 rounded-lg">
                <h4 className="font-semibold">{selectedListing.commodity_name}</h4>
                <p className="text-sm text-muted-foreground">From: {selectedListing.farmer_name}</p>
                <p className="text-sm text-muted-foreground">Available: {selectedListing.quantity} {selectedListing.commodity_unit}</p>
                <p className="text-sm font-medium text-primary">
                  {formatCurrency(selectedListing.price_per_unit)} per {selectedListing.commodity_unit}
                </p>
              </div>
              
              <div>
                <Label htmlFor="quantity">Quantity ({selectedListing.commodity_unit})</Label>
                <Input
                  id="quantity"
                  type="number"
                  max={selectedListing.quantity}
                  placeholder={`Max: ${selectedListing.quantity}`}
                  value={orderQuantity}
                  onChange={(e) => setOrderQuantity(e.target.value)}
                />
              </div>

              {orderQuantity && (
                <div className="p-4 bg-primary/10 rounded-lg">
                  <div className="flex justify-between items-center">
                    <span className="font-medium">Subtotal:</span>
                    <span className="text-xl font-bold text-primary">
                      {formatCurrency(parseFloat(orderQuantity) * selectedListing.price_per_unit)}
                    </span>
                  </div>
                </div>
              )}
              
              <Button 
                onClick={handleAddToCart} 
                className="w-full"
                disabled={!orderQuantity || parseFloat(orderQuantity) > selectedListing.quantity}
              >
                <ShoppingCart className="h-4 w-4 mr-2" />
                Add to Cart
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Cart Dialog */}
      <Dialog open={showCart} onOpenChange={setShowCart}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Shopping Cart</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            {cart.length === 0 ? (
              <div className="text-center py-8">
                <ShoppingCart className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">Your cart is empty</p>
              </div>
            ) : (
              <>
                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {cart.map((item) => (
                    <div key={item.listing.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                      <div className="flex-1">
                        <p className="font-medium">{item.listing.commodity_name}</p>
                        <p className="text-sm text-muted-foreground">{item.listing.farmer_name}</p>
                        <p className="text-sm text-primary font-medium">
                          {formatCurrency(item.listing.price_per_unit)}/{item.listing.commodity_unit}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => updateCartQuantity(item.listing.id, item.quantity - 1)}
                        >
                          <Minus className="h-3 w-3" />
                        </Button>
                        <span className="w-12 text-center font-medium">{item.quantity}</span>
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => updateCartQuantity(item.listing.id, item.quantity + 1)}
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive"
                          onClick={() => removeFromCart(item.listing.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
                
                <div className="p-4 bg-primary/10 rounded-lg">
                  <div className="flex justify-between items-center">
                    <span className="font-medium text-lg">Total:</span>
                    <span className="text-2xl font-bold text-primary">{formatCurrency(getCartTotal())}</span>
                  </div>
                </div>

                <Button 
                  className="w-full" 
                  onClick={() => {
                    setShowCart(false);
                    setShowCheckout(true);
                  }}
                >
                  Proceed to Checkout
                </Button>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Checkout Dialog */}
      <Dialog open={showCheckout} onOpenChange={setShowCheckout}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Checkout</DialogTitle>
          </DialogHeader>
          <div className="space-y-6 pt-4">
            {/* Order Summary */}
            <div className="p-4 bg-muted/50 rounded-lg">
              <h4 className="font-semibold mb-2">Order Summary</h4>
              <div className="space-y-1 text-sm">
                {cart.map((item) => (
                  <div key={item.listing.id} className="flex justify-between">
                    <span>{item.listing.commodity_name} x {item.quantity} {item.listing.commodity_unit}</span>
                    <span>{formatCurrency(item.quantity * item.listing.price_per_unit)}</span>
                  </div>
                ))}
                <div className="flex justify-between font-bold pt-2 border-t border-border mt-2">
                  <span>Total</span>
                  <span className="text-primary">{formatCurrency(getCartTotal())}</span>
                </div>
              </div>
            </div>

            {/* Delivery Location */}
            <div>
              <Label htmlFor="delivery">Delivery Location *</Label>
              <Textarea
                id="delivery"
                placeholder="Enter your full delivery address (area, landmark, district)..."
                value={deliveryLocation}
                onChange={(e) => setDeliveryLocation(e.target.value)}
                rows={3}
              />
            </div>

            {/* Payment Type */}
            <div>
              <Label className="mb-3 block">Payment Method</Label>
              <RadioGroup value={paymentType} onValueChange={(v) => setPaymentType(v as 'pay_now' | 'pay_on_delivery')}>
                <div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-muted/50">
                  <RadioGroupItem value="pay_now" id="pay_now" />
                  <Label htmlFor="pay_now" className="flex-1 cursor-pointer">
                    <span className="font-medium">Pay Now (Mobile Money)</span>
                    <p className="text-sm text-muted-foreground">Pay via MTN MoMo or Airtel Money</p>
                  </Label>
                </div>
                <div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-muted/50">
                  <RadioGroupItem value="pay_on_delivery" id="pay_on_delivery" />
                  <Label htmlFor="pay_on_delivery" className="flex-1 cursor-pointer">
                    <span className="font-medium">Pay on Delivery</span>
                    <p className="text-sm text-muted-foreground">Pay when produce is delivered</p>
                  </Label>
                </div>
              </RadioGroup>
            </div>

            {/* Message */}
            <div>
              <Label htmlFor="message">Message to Farmer(s) (Optional)</Label>
              <Textarea
                id="message"
                placeholder="Any special requests or delivery instructions..."
                value={orderMessage}
                onChange={(e) => setOrderMessage(e.target.value)}
              />
            </div>

            <Button 
              onClick={handleCheckout} 
              className="w-full"
              disabled={!deliveryLocation || isOrdering}
            >
              {isOrdering ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : null}
              {paymentType === 'pay_now' ? 'Place Order & Pay' : 'Place Order (Pay on Delivery)'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
