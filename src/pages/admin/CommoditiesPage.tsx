import { useState } from 'react';
import { useCommodities } from '@/hooks/useCommodities';
import { TrendingUp, Plus, Loader2, Edit2, Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { formatDistanceToNow } from 'date-fns';

export function CommoditiesPage() {
  const { commodities, isLoading, addCommodity, updateCommodityPrice } = useCommodities();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newCommodity, setNewCommodity] = useState({ name: '', unit: 'kg', price: '' });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editPrice, setEditPrice] = useState('');

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-UG', {
      style: 'currency',
      currency: 'UGX',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const handleAddCommodity = async () => {
    if (!newCommodity.name || !newCommodity.price) return;
    
    const success = await addCommodity(
      newCommodity.name,
      newCommodity.unit,
      parseFloat(newCommodity.price)
    );
    
    if (success) {
      setNewCommodity({ name: '', unit: 'kg', price: '' });
      setIsAddDialogOpen(false);
    }
  };

  const handleUpdatePrice = async (id: string) => {
    if (!editPrice) return;
    
    const success = await updateCommodityPrice(id, parseFloat(editPrice));
    
    if (success) {
      setEditingId(null);
      setEditPrice('');
    }
  };

  const startEditing = (id: string, currentPrice: number) => {
    setEditingId(id);
    setEditPrice(currentPrice.toString());
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
          <h1 className="text-2xl font-bold text-foreground">Commodities</h1>
          <p className="text-muted-foreground">Manage commodity prices</p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Commodity
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Commodity</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div>
                <Label htmlFor="name">Commodity Name</Label>
                <Input
                  id="name"
                  placeholder="e.g., Maize"
                  value={newCommodity.name}
                  onChange={(e) => setNewCommodity({ ...newCommodity, name: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="unit">Unit</Label>
                <Input
                  id="unit"
                  placeholder="e.g., kg, bags"
                  value={newCommodity.unit}
                  onChange={(e) => setNewCommodity({ ...newCommodity, unit: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="price">Current Price (UGX)</Label>
                <Input
                  id="price"
                  type="number"
                  placeholder="e.g., 3000"
                  value={newCommodity.price}
                  onChange={(e) => setNewCommodity({ ...newCommodity, price: e.target.value })}
                />
              </div>
              <Button onClick={handleAddCommodity} className="w-full">
                Add Commodity
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Commodities Grid */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {commodities.length === 0 ? (
          <p className="text-muted-foreground text-center py-8 col-span-full">No commodities added yet</p>
        ) : (
          commodities.map((commodity) => (
            <div key={commodity.id} className="bg-card rounded-xl p-6 border border-border">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-primary" />
                  <h3 className="font-semibold text-foreground">{commodity.name}</h3>
                </div>
                <span className="text-xs text-muted-foreground">per {commodity.unit}</span>
              </div>
              
              {editingId === commodity.id ? (
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    value={editPrice}
                    onChange={(e) => setEditPrice(e.target.value)}
                    className="text-lg font-bold"
                  />
                  <Button size="icon" variant="ghost" onClick={() => handleUpdatePrice(commodity.id)}>
                    <Check className="h-4 w-4 text-green-600" />
                  </Button>
                  <Button size="icon" variant="ghost" onClick={() => setEditingId(null)}>
                    <X className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <p className="text-2xl font-bold text-foreground">
                    {formatCurrency(commodity.current_price)}
                  </p>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => startEditing(commodity.id, commodity.current_price)}
                  >
                    <Edit2 className="h-4 w-4" />
                  </Button>
                </div>
              )}
              
              <p className="text-xs text-muted-foreground mt-2">
                Updated {formatDistanceToNow(new Date(commodity.updated_at), { addSuffix: true })}
              </p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
