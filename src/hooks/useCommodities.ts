import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Commodity {
  id: string;
  name: string;
  unit: string;
  current_price: number;
  created_at: string;
  updated_at: string;
}

export function useCommodities() {
  const [commodities, setCommodities] = useState<Commodity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const fetchCommodities = async () => {
    const { data, error } = await supabase
      .from('commodities')
      .select('*')
      .order('name', { ascending: true });

    if (error) {
      console.error('Error fetching commodities:', error);
      return [];
    }

    return data || [];
  };

  const addCommodity = async (name: string, unit: string, currentPrice: number) => {
    const { error } = await supabase
      .from('commodities')
      .insert({ name, unit, current_price: currentPrice });

    if (error) {
      toast({
        title: 'Error',
        description: 'Failed to add commodity',
        variant: 'destructive',
      });
      return false;
    }

    toast({
      title: 'Success',
      description: 'Commodity added successfully',
    });
    
    await refreshData();
    return true;
  };

  const updateCommodityPrice = async (id: string, newPrice: number) => {
    const { error } = await supabase
      .from('commodities')
      .update({ current_price: newPrice })
      .eq('id', id);

    if (error) {
      toast({
        title: 'Error',
        description: 'Failed to update price',
        variant: 'destructive',
      });
      return false;
    }

    toast({
      title: 'Success',
      description: 'Price updated successfully',
    });
    
    await refreshData();
    return true;
  };

  const refreshData = async () => {
    setIsLoading(true);
    const data = await fetchCommodities();
    setCommodities(data);
    setIsLoading(false);
  };

  useEffect(() => {
    refreshData();
  }, []);

  return {
    commodities,
    isLoading,
    addCommodity,
    updateCommodityPrice,
    refreshData,
  };
}
