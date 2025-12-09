import { useState } from 'react';
import { useFarmerData } from '@/hooks/useFarmerData';
import { useCommodities } from '@/hooks/useCommodities';
import { Package, Plus, Loader2, Trash2, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { formatDistanceToNow } from 'date-fns';
import { useAuth } from '@/lib/auth-context';

export function ListingsPage() {
  const { profile } = useAuth();
  const { listings, isLoading, createListing, deleteListing } = useFarmerData();
  const { commodities } = useCommodities();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newListing, setNewListing] = useState({
    commodityId: '',
    quantity: '',
    pricePerUnit: '',
    location: profile?.location || '',
    description: '',
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-UG', {
      style: 'currency',
      currency: 'UGX',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const handleCreateListing = async () => {
    if (!newListing.commodityId || !newListing.quantity || !newListing.pricePerUnit || !newListing.location) return;
    
    const success = await createListing(
      newListing.commodityId,
      parseFloat(newListing.quantity),
      parseFloat(newListing.pricePerUnit),
      newListing.location,
      newListing.description
    );
    
    if (success) {
      setNewListing({
        commodityId: '',
        quantity: '',
        pricePerUnit: '',
        location: profile?.location || '',
        description: '',
      });
      setIsAddDialogOpen(false);
    }
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">My Produce Listings</h1>
          <p className="text-muted-foreground">Manage your available produce</p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Listing
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Listing</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div>
                <Label>Commodity</Label>
                <Select
                  value={newListing.commodityId}
                  onValueChange={(value) => setNewListing({ ...newListing, commodityId: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select commodity" />
                  </SelectTrigger>
                  <SelectContent>
                    {commodities.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name} (per {c.unit})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="quantity">Quantity</Label>
                  <Input
                    id="quantity"
                    type="number"
                    placeholder="e.g., 100"
                    value={newListing.quantity}
                    onChange={(e) => setNewListing({ ...newListing, quantity: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="price">Price per Unit (UGX)</Label>
                  <Input
                    id="price"
                    type="number"
                    placeholder="e.g., 3500"
                    value={newListing.pricePerUnit}
                    onChange={(e) => setNewListing({ ...newListing, pricePerUnit: e.target.value })}
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="location">Location</Label>
                <Input
                  id="location"
                  placeholder="e.g., Kampala, Uganda"
                  value={newListing.location}
                  onChange={(e) => setNewListing({ ...newListing, location: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="description">Description (Optional)</Label>
                <Textarea
                  id="description"
                  placeholder="Describe your produce..."
                  value={newListing.description}
                  onChange={(e) => setNewListing({ ...newListing, description: e.target.value })}
                />
              </div>
              <Button onClick={handleCreateListing} className="w-full">
                Create Listing
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Listings Grid */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {listings.length === 0 ? (
          <div className="col-span-full text-center py-12">
            <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No listings yet. Add your first produce!</p>
          </div>
        ) : (
          listings.map((listing) => (
            <div key={listing.id} className="bg-card rounded-xl p-6 border border-border">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="font-semibold text-foreground">{listing.commodity_name}</h3>
                  <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
                    <MapPin className="h-3 w-3" />
                    {listing.location}
                  </div>
                </div>
                <Badge variant={listing.is_available ? 'default' : 'secondary'}>
                  {listing.is_available ? 'Available' : 'Sold Out'}
                </Badge>
              </div>
              
              <div className="space-y-2 mb-4">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Quantity:</span>
                  <span className="font-medium">{listing.quantity}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Price/Unit:</span>
                  <span className="font-medium">{formatCurrency(listing.price_per_unit)}</span>
                </div>
              </div>

              {listing.description && (
                <p className="text-sm text-muted-foreground mb-4 line-clamp-2">{listing.description}</p>
              )}
              
              <div className="flex items-center justify-between pt-4 border-t border-border">
                <p className="text-xs text-muted-foreground">
                  {formatDistanceToNow(new Date(listing.created_at), { addSuffix: true })}
                </p>
                <Button
                  size="icon"
                  variant="ghost"
                  className="text-destructive hover:text-destructive"
                  onClick={() => deleteListing(listing.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
