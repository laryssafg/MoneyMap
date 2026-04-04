-- SUPABASE SCHEMA FOR FINANCIAL DASHBOARD

-- Accounts Table
CREATE TABLE accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  bank TEXT NOT NULL,
  balance DECIMAL(15, 2) DEFAULT 0,
  type TEXT CHECK (type IN ('PF', 'PJ')),
  logo_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Cards Table
CREATE TABLE cards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  bank TEXT NOT NULL,
  limit_value DECIMAL(15, 2) NOT NULL,
  used DECIMAL(15, 2) DEFAULT 0,
  due_date INTEGER,
  closing_day INTEGER DEFAULT 1,
  type TEXT CHECK (type IN ('PF', 'PJ')),
  logo_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Card Invoices Table
CREATE TABLE card_invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  card_id UUID REFERENCES cards(id) ON DELETE CASCADE,
  reference_month INTEGER NOT NULL,
  reference_year INTEGER NOT NULL,
  due_date TEXT NOT NULL,
  total_amount DECIMAL(15, 2) DEFAULT 0,
  user_share DECIMAL(15, 2) DEFAULT 0,
  third_party_share DECIMAL(15, 2) DEFAULT 0,
  third_party_name TEXT,
  status TEXT CHECK (status IN ('paid', 'open', 'overdue', 'planned', 'empty')),
  is_current_month BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Card Expenses Table
CREATE TABLE card_expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  card_id UUID REFERENCES cards(id) ON DELETE CASCADE,
  invoice_id UUID REFERENCES card_invoices(id) ON DELETE CASCADE,
  expense_date TEXT NOT NULL,
  category TEXT,
  description TEXT NOT NULL,
  merchant_name TEXT,
  city TEXT,
  country TEXT,
  amount DECIMAL(15, 2) NOT NULL,
  installments INTEGER DEFAULT 1,
  current_installment INTEGER DEFAULT 1,
  owner_type TEXT CHECK (owner_type IN ('user', 'third_party')),
  owner_name TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Debts Table
CREATE TABLE debts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  total_value DECIMAL(15, 2) NOT NULL,
  remaining_value DECIMAL(15, 2) NOT NULL,
  due_date TEXT,
  priority TEXT CHECK (priority IN ('MAX', 'HIGH', 'MEDIUM', 'LOW')),
  category TEXT,
  type TEXT CHECK (type IN ('PF', 'PJ')),
  status TEXT CHECK (status IN ('PAID', 'PENDING', 'OVERDUE', 'NEGOTIATING')),
  installments_total INTEGER,
  installments_paid INTEGER,
  installments_value DECIMAL(15, 2),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Investments Table
CREATE TABLE investments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  institution TEXT NOT NULL,
  value DECIMAL(15, 2) DEFAULT 0,
  type TEXT CHECK (type IN ('PF', 'PJ')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Goals Table
CREATE TABLE goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  target_value DECIMAL(15, 2) NOT NULL,
  current_value DECIMAL(15, 2) DEFAULT 0,
  deadline TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Transactions Table
CREATE TABLE transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  description TEXT NOT NULL,
  amount DECIMAL(15, 2) NOT NULL,
  date TEXT NOT NULL,
  category TEXT,
  type TEXT CHECK (type IN ('PF', 'PJ')),
  flow_type TEXT CHECK (flow_type IN ('INCOME', 'EXPENSE')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Profile Table
CREATE TABLE profile (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  monthly_income DECIMAL(15, 2) DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Initial Data (Optional)
-- INSERT INTO profile (monthly_income) VALUES (2000);
