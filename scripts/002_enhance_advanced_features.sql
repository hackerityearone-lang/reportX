-- Advanced Stock Management Features
-- Migration: Add advanced stock out, customer, and reporting tables

-- 1. CREATE CUSTOMERS TABLE (independent customer records)
CREATE TABLE IF NOT EXISTS customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  total_credit DECIMAL(12, 2) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_archived BOOLEAN DEFAULT FALSE
);

-- 2. ENHANCE STOCK TRANSACTIONS TABLE
-- Ensure all required columns exist for advanced invoicing
DO $$
BEGIN
  ALTER TABLE stock_transactions
  ADD COLUMN IF NOT EXISTS total_amount DECIMAL(10, 2);
EXCEPTION WHEN OTHERS THEN NULL; END $$;

DO $$
BEGIN
  ALTER TABLE stock_transactions
  ADD COLUMN IF NOT EXISTS customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS phone TEXT,
  ADD COLUMN IF NOT EXISTS invoice_number TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS selling_price DECIMAL(10, 2),
  ADD COLUMN IF NOT EXISTS buying_price DECIMAL(10, 2),
  ADD COLUMN IF NOT EXISTS profit DECIMAL(10, 2),
  ADD COLUMN IF NOT EXISTS total_profit DECIMAL(10, 2),
  ADD COLUMN IF NOT EXISTS is_cancelled BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS cancelled_at TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS cancelled_reason TEXT;
EXCEPTION WHEN OTHERS THEN
  -- Column might already exist or other issue, continue
  NULL;
END $$;

-- 3. CREATE STOCK OUT ITEMS TABLE (for multiple products in one transaction)
CREATE TABLE IF NOT EXISTS stock_out_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_id UUID NOT NULL REFERENCES stock_transactions(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  selling_price DECIMAL(10, 2) NOT NULL,
  buying_price DECIMAL(10, 2) NOT NULL,
  profit_per_unit DECIMAL(10, 2) GENERATED ALWAYS AS (selling_price - buying_price) STORED,
  subtotal DECIMAL(10, 2) GENERATED ALWAYS AS (quantity * selling_price) STORED,
  subtotal_profit DECIMAL(10, 2) GENERATED ALWAYS AS (quantity * (selling_price - buying_price)) STORED,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. ENHANCE CREDITS TABLE to track customers better
ALTER TABLE credits
ADD COLUMN IF NOT EXISTS customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS payment_due_date DATE;

-- 5. ENHANCE CREDIT PAYMENTS TABLE (if it exists)
DO $$ 
BEGIN
  ALTER TABLE credit_payments
  ADD COLUMN IF NOT EXISTS customer_id UUID REFERENCES customers(id) ON DELETE CASCADE;
EXCEPTION WHEN undefined_table THEN
  -- Table doesn't exist, continue
  NULL;
END $$;

-- 6. CREATE AUDIT LOG TABLE (for tracking who did what)
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  table_name TEXT NOT NULL,
  record_id UUID,
  old_values JSONB,
  new_values JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. CREATE DAILY REPORT TABLE (for caching daily reports)
CREATE TABLE IF NOT EXISTS daily_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  report_date DATE NOT NULL,
  total_cash_income DECIMAL(12, 2) DEFAULT 0,
  total_credit_issued DECIMAL(12, 2) DEFAULT 0,
  total_profit DECIMAL(12, 2) DEFAULT 0,
  total_stock_value DECIMAL(12, 2) DEFAULT 0,
  total_units_sold INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, report_date)
);

-- ENABLE RLS on new tables
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_out_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_reports ENABLE ROW LEVEL SECURITY;

-- RLS POLICIES FOR CUSTOMERS
DO $$
BEGIN
  CREATE POLICY "Users can view their own customers" ON customers 
    FOR SELECT USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$
BEGIN
  CREATE POLICY "Users can insert their own customers" ON customers 
    FOR INSERT WITH CHECK (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$
BEGIN
  CREATE POLICY "Users can update their own customers" ON customers 
    FOR UPDATE USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$
BEGIN
  CREATE POLICY "Users can delete their own customers" ON customers 
    FOR DELETE USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- RLS POLICIES FOR STOCK OUT ITEMS
DO $$
BEGIN
  CREATE POLICY "Users can view their own stock out items" ON stock_out_items 
    FOR SELECT USING (
      EXISTS (
        SELECT 1 FROM stock_transactions 
        WHERE stock_transactions.id = stock_out_items.transaction_id 
        AND stock_transactions.user_id = auth.uid()
      )
    );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$
BEGIN
  CREATE POLICY "Users can insert their own stock out items" ON stock_out_items 
    FOR INSERT WITH CHECK (
      EXISTS (
        SELECT 1 FROM stock_transactions 
        WHERE stock_transactions.id = stock_out_items.transaction_id 
        AND stock_transactions.user_id = auth.uid()
      )
    );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- RLS POLICIES FOR AUDIT LOGS
DO $$
BEGIN
  CREATE POLICY "Users can view their own audit logs" ON audit_logs 
    FOR SELECT USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$
BEGIN
  CREATE POLICY "Users can insert audit logs" ON audit_logs 
    FOR INSERT WITH CHECK (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- RLS POLICIES FOR DAILY REPORTS
DO $$
BEGIN
  CREATE POLICY "Users can view their own daily reports" ON daily_reports 
    FOR SELECT USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$
BEGIN
  CREATE POLICY "Users can insert their own daily reports" ON daily_reports 
    FOR INSERT WITH CHECK (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$
BEGIN
  CREATE POLICY "Users can update their own daily reports" ON daily_reports 
    FOR UPDATE USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- CREATE INDEXES for performance
CREATE INDEX IF NOT EXISTS idx_customers_user_id ON customers(user_id);
CREATE INDEX IF NOT EXISTS idx_customers_phone ON customers(phone);
CREATE INDEX IF NOT EXISTS idx_stock_out_items_transaction_id ON stock_out_items(transaction_id);
CREATE INDEX IF NOT EXISTS idx_stock_out_items_product_id ON stock_out_items(product_id);
CREATE INDEX IF NOT EXISTS idx_stock_transactions_customer_id ON stock_transactions(customer_id);
CREATE INDEX IF NOT EXISTS idx_stock_transactions_invoice ON stock_transactions(invoice_number);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_daily_reports_user_date ON daily_reports(user_id, report_date);
CREATE INDEX IF NOT EXISTS idx_credits_customer_id ON credits(customer_id);

-- FUNCTION: Generate unique invoice numbers
CREATE OR REPLACE FUNCTION generate_invoice_number()
RETURNS TEXT AS $$
DECLARE
  invoice_num TEXT;
  counter INTEGER;
BEGIN
  SELECT COALESCE(COUNT(*), 0) + 1 INTO counter 
  FROM stock_transactions 
  WHERE DATE(created_at) = CURRENT_DATE 
  AND transaction_type = 'OUT';
  
  invoice_num := 'INV-' || TO_CHAR(CURRENT_DATE, 'YYYYMMDD') || '-' || LPAD(counter::TEXT, 4, '0');
  RETURN invoice_num;
END;
$$ LANGUAGE plpgsql;

-- FUNCTION: Calculate daily report stats
CREATE OR REPLACE FUNCTION calculate_daily_report_stats(p_user_id UUID, p_report_date DATE)
RETURNS TABLE (
  total_cash DECIMAL,
  total_credit DECIMAL,
  total_profit DECIMAL,
  total_units INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COALESCE(SUM(CASE WHEN st.payment_type = 'CASH' THEN st.total_amount ELSE 0 END), 0),
    COALESCE(SUM(CASE WHEN st.payment_type = 'CREDIT' THEN st.total_amount ELSE 0 END), 0),
    COALESCE(SUM(st.total_profit), 0),
    COALESCE(SUM(st.quantity), 0)
  FROM stock_transactions st
  WHERE st.user_id = p_user_id
  AND st.transaction_type = 'OUT'
  AND DATE(st.created_at) = p_report_date
  AND st.is_cancelled = FALSE;
END;
$$ LANGUAGE plpgsql;

-- FUNCTION: Calculate customer total credit
CREATE OR REPLACE FUNCTION calculate_customer_total_credit(p_customer_id UUID)
RETURNS DECIMAL AS $$
DECLARE
  total_owed DECIMAL;
BEGIN
  SELECT COALESCE(SUM(c.amount_owed - c.amount_paid), 0) INTO total_owed
  FROM credits c
  WHERE c.customer_id = p_customer_id
  AND c.is_active = TRUE
  AND c.status != 'PAID';
  
  RETURN total_owed;
END;
$$ LANGUAGE plpgsql;

-- TRIGGER: Auto-generate invoice number
CREATE OR REPLACE FUNCTION auto_generate_invoice()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.transaction_type = 'OUT' AND NEW.invoice_number IS NULL THEN
    NEW.invoice_number := generate_invoice_number();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
BEGIN
  CREATE TRIGGER trigger_auto_invoice
  BEFORE INSERT ON stock_transactions
  FOR EACH ROW
  EXECUTE FUNCTION auto_generate_invoice();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- TRIGGER: Update customer total credit
CREATE OR REPLACE FUNCTION update_customer_credit()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
    UPDATE customers 
    SET total_credit = calculate_customer_total_credit(NEW.customer_id)
    WHERE id = NEW.customer_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
BEGIN
  CREATE TRIGGER trigger_update_customer_credit_on_transaction
  AFTER INSERT OR UPDATE ON stock_transactions
  FOR EACH ROW
  WHEN (NEW.customer_id IS NOT NULL AND NEW.payment_type = 'CREDIT')
  EXECUTE FUNCTION update_customer_credit();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$
BEGIN
  CREATE TRIGGER trigger_update_customer_credit_on_payment
  AFTER INSERT ON credit_payments
  FOR EACH ROW
  EXECUTE FUNCTION update_customer_credit();
EXCEPTION WHEN undefined_table THEN
  -- Table doesn't exist, skip this trigger
  NULL;
END $$;

-- TRIGGER: Log audit events
CREATE OR REPLACE FUNCTION audit_log_trigger()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO audit_logs (user_id, action, table_name, record_id, old_values, new_values)
  VALUES (
    COALESCE(auth.uid(), NEW.user_id),
    TG_OP,
    TG_TABLE_NAME,
    CASE WHEN TG_OP = 'DELETE' THEN OLD.id ELSE NEW.id END,
    CASE WHEN TG_OP = 'DELETE' OR TG_OP = 'UPDATE' THEN row_to_json(OLD) ELSE NULL END,
    CASE WHEN TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN row_to_json(NEW) ELSE NULL END
  );
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add audit triggers to key tables
DO $$
BEGIN
  CREATE TRIGGER audit_stock_transactions
  AFTER INSERT OR UPDATE OR DELETE ON stock_transactions
  FOR EACH ROW EXECUTE FUNCTION audit_log_trigger();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$
BEGIN
  CREATE TRIGGER audit_credits
  AFTER INSERT OR UPDATE OR DELETE ON credits
  FOR EACH ROW EXECUTE FUNCTION audit_log_trigger();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- STORED PROCEDURE: Get daily dashboard stats
CREATE OR REPLACE FUNCTION get_dashboard_stats(p_user_id UUID)
RETURNS TABLE (
  today_cash DECIMAL,
  today_credit DECIMAL,
  today_profit DECIMAL,
  total_customers BIGINT,
  pending_credit DECIMAL,
  low_stock_products BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COALESCE(SUM(CASE WHEN st.payment_type = 'CASH' AND DATE(st.created_at) = CURRENT_DATE THEN st.total_amount ELSE 0 END), 0),
    COALESCE(SUM(CASE WHEN st.payment_type = 'CREDIT' AND DATE(st.created_at) = CURRENT_DATE THEN st.total_amount ELSE 0 END), 0),
    COALESCE(SUM(CASE WHEN DATE(st.created_at) = CURRENT_DATE THEN st.total_profit ELSE 0 END), 0),
    COUNT(DISTINCT c.id),
    COALESCE(SUM(cr.amount_owed - cr.amount_paid), 0),
    COUNT(DISTINCT CASE WHEN p.quantity <= p.minimum_stock_level THEN p.id END)
  FROM stock_transactions st
  LEFT JOIN customers c ON st.customer_id = c.id
  LEFT JOIN credits cr ON cr.user_id = p_user_id AND cr.is_active = TRUE
  LEFT JOIN products p ON p.user_id = p_user_id
  WHERE st.user_id = p_user_id
  AND st.transaction_type = 'OUT'
  AND st.is_cancelled = FALSE;
END;
$$ LANGUAGE plpgsql;

-- Create materialized view for quick report generation
DO $$
BEGIN
  CREATE OR REPLACE VIEW transaction_summary AS
  SELECT
    st.id,
    st.invoice_number,
    st.user_id,
    st.customer_id,
    c.name as customer_name,
    c.phone as customer_phone,
    st.payment_type,
    st.total_amount,
    st.total_profit,
    st.quantity,
    DATE(st.created_at) as transaction_date,
    st.created_at,
    st.is_cancelled,
    COUNT(DISTINCT soi.id) as product_count
  FROM stock_transactions st
  LEFT JOIN customers c ON st.customer_id = c.id
  LEFT JOIN stock_out_items soi ON st.id = soi.transaction_id
  GROUP BY st.id, st.invoice_number, st.user_id, st.customer_id, c.name, c.phone, 
    st.payment_type, st.total_amount, st.total_profit, st.quantity, 
    st.created_at;
EXCEPTION WHEN OTHERS THEN
  -- View creation failed, likely due to schema differences
  NULL;
END $$;

-- Grants
GRANT EXECUTE ON FUNCTION generate_invoice_number TO authenticated;
GRANT EXECUTE ON FUNCTION calculate_daily_report_stats TO authenticated;
GRANT EXECUTE ON FUNCTION calculate_customer_total_credit TO authenticated;
GRANT EXECUTE ON FUNCTION get_dashboard_stats TO authenticated;
