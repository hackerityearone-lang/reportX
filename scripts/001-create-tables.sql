-- Stock Management Platform Database Schema
-- For Rwandan drink business

-- Products table (Ibicuruzwa)
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  brand TEXT NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 0,
  minimum_stock_level INTEGER NOT NULL DEFAULT 10,
  image_url TEXT,
  price_per_unit DECIMAL(10, 2) NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Stock transactions table (for tracking stock in/out)
CREATE TABLE stock_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  transaction_type TEXT NOT NULL CHECK (transaction_type IN ('IN', 'OUT')),
  quantity INTEGER NOT NULL,
  payment_type TEXT CHECK (payment_type IN ('CASH', 'CREDIT') OR transaction_type = 'IN'),
  unit_price DECIMAL(10, 2),
  total_amount DECIMAL(10, 2),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Credits table (Amadeni / Ideni)
CREATE TABLE credits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_name TEXT NOT NULL,
  phone_number TEXT,
  transaction_id UUID REFERENCES stock_transactions(id) ON DELETE SET NULL,
  amount_owed DECIMAL(10, 2) NOT NULL,
  amount_paid DECIMAL(10, 2) NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'PARTIAL', 'PAID')),
  due_date DATE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Credit payments table (tracking payments on credits)
CREATE TABLE credit_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  credit_id UUID NOT NULL REFERENCES credits(id) ON DELETE CASCADE,
  amount DECIMAL(10, 2) NOT NULL,
  payment_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  notes TEXT,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE
);

-- User profiles table (for role management)
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  role TEXT NOT NULL DEFAULT 'MANAGER' CHECK (role IN ('MANAGER', 'BOSS')),
  status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'APPROVED', 'BLOCKED')),
  phone_number TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security on all tables
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE credits ENABLE ROW LEVEL SECURITY;
ALTER TABLE credit_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- RLS Policies for products
CREATE POLICY "Users can view their own products" ON products FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own products" ON products FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own products" ON products FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own products" ON products FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for stock_transactions
CREATE POLICY "Users can view their own transactions" ON stock_transactions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own transactions" ON stock_transactions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own transactions" ON stock_transactions FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own transactions" ON stock_transactions FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for credits
CREATE POLICY "Users can view their own credits" ON credits FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own credits" ON credits FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own credits" ON credits FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own credits" ON credits FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for credit_payments
CREATE POLICY "Users can view their own credit payments" ON credit_payments FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own credit payments" ON credit_payments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own credit payments" ON credit_payments FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own credit payments" ON credit_payments FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for profiles
CREATE POLICY "Users can view their own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can insert their own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update their own profile" ON profiles FOR UPDATE USING (auth.uid() = id);

-- Create indexes for better performance
CREATE INDEX idx_products_user_id ON products(user_id);
CREATE INDEX idx_stock_transactions_user_id ON stock_transactions(user_id);
CREATE INDEX idx_stock_transactions_product_id ON stock_transactions(product_id);
CREATE INDEX idx_stock_transactions_created_at ON stock_transactions(created_at);
CREATE INDEX idx_credits_user_id ON credits(user_id);
CREATE INDEX idx_credits_status ON credits(status);
CREATE INDEX idx_credit_payments_credit_id ON credit_payments(credit_id);

-- Function to update product quantity after stock transaction
CREATE OR REPLACE FUNCTION update_product_quantity()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.transaction_type = 'IN' THEN
    UPDATE products SET quantity = quantity + NEW.quantity, updated_at = NOW() WHERE id = NEW.product_id;
  ELSIF NEW.transaction_type = 'OUT' THEN
    UPDATE products SET quantity = quantity - NEW.quantity, updated_at = NOW() WHERE id = NEW.product_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for automatic quantity update
CREATE TRIGGER trigger_update_product_quantity
AFTER INSERT ON stock_transactions
FOR EACH ROW
EXECUTE FUNCTION update_product_quantity();

-- Function to update credit status and amount
CREATE OR REPLACE FUNCTION update_credit_status()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE credits 
  SET 
    amount_paid = (SELECT COALESCE(SUM(amount), 0) FROM credit_payments WHERE credit_id = NEW.credit_id),
    status = CASE 
      WHEN (SELECT COALESCE(SUM(amount), 0) FROM credit_payments WHERE credit_id = NEW.credit_id) >= amount_owed THEN 'PAID'
      WHEN (SELECT COALESCE(SUM(amount), 0) FROM credit_payments WHERE credit_id = NEW.credit_id) > 0 THEN 'PARTIAL'
      ELSE 'PENDING'
    END,
    updated_at = NOW()
  WHERE id = NEW.credit_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for automatic credit status update
CREATE TRIGGER trigger_update_credit_status
AFTER INSERT ON credit_payments
FOR EACH ROW
EXECUTE FUNCTION update_credit_status();
