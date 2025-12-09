-- Add delivery_location and payment_type to orders table
ALTER TABLE public.orders 
ADD COLUMN delivery_location TEXT,
ADD COLUMN payment_type TEXT DEFAULT 'pay_now' CHECK (payment_type IN ('pay_now', 'pay_on_delivery'));

-- Update comments
COMMENT ON COLUMN public.orders.delivery_location IS 'Buyer delivery address';
COMMENT ON COLUMN public.orders.payment_type IS 'Payment type: pay_now or pay_on_delivery';