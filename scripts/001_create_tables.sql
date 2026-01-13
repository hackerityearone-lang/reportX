-- Products table for drinks inventory
CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  brand TEXT NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 0,
  min_stock_level INTEGER NOT NULL DEFAULT 10,
  image_url TEXT,
  price DECIMAL(10, 2) NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Profiles table for user management
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  role TEXT NOT NULL DEFAULT 'USER' CHECK (role IN ('USER', 'STOCK_BOSS')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Stock transactions table
CREATE TABLE IF NOT EXISTS stock_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('STOCK_IN', 'STOCK_OUT')),
  quantity INTEGER NOT NULL,
  payment_type TEXT CHECK (payment_type IN ('CASH', 'CREDIT')),
  customer_name TEXT,
  amount_owed DECIMAL(10, 2),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Credits (Ideni) table for tracking unpaid debts
CREATE TABLE IF NOT EXISTS credits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_id UUID NOT NULL REFERENCES stock_transactions(id) ON DELETE CASCADE,
  customer_name TEXT NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  is_paid BOOLEAN NOT NULL DEFAULT FALSE,
  paid_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- AI insights table for storing generated insights
CREATE TABLE IF NOT EXISTS ai_insights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL CHECK (type IN ('LOW_STOCK', 'UNUSUAL_ACTIVITY', 'RESTOCK', 'CREDIT_RISK', 'SALES_TREND')),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  priority TEXT NOT NULL DEFAULT 'MEDIUM' CHECK (priority IN ('LOW', 'MEDIUM', 'HIGH')),
  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE credits ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_insights ENABLE ROW LEVEL SECURITY;

-- Products policies (all authenticated users can view, only STOCK_BOSS can modify)
CREATE POLICY "Anyone can view products" ON products FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert products" ON products FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update products" ON products FOR UPDATE TO authenticated USING (true);

-- Profiles policies
CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);

-- Stock transactions policies
CREATE POLICY "Users can view all transactions" ON stock_transactions FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can insert transactions" ON stock_transactions FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- Credits policies
CREATE POLICY "Users can view all credits" ON credits FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can insert credits" ON credits FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Users can update credits" ON credits FOR UPDATE TO authenticated USING (true);

-- AI insights policies
CREATE POLICY "Users can view all insights" ON ai_insights FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can insert insights" ON ai_insights FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Users can update insights" ON ai_insights FOR UPDATE TO authenticated USING (true);
