-- =====================================================
-- Rename ALL columns to snake_case
-- Run this script in pgAdmin to convert existing columns
-- =====================================================

-- Sales table
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='Sales' AND column_name='Id') THEN
        ALTER TABLE public."Sales" RENAME COLUMN "Id" TO id;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='Sales' AND column_name='CustomerId') THEN
        ALTER TABLE public."Sales" RENAME COLUMN "CustomerId" TO customer_id;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='Sales' AND column_name='ProductId') THEN
        ALTER TABLE public."Sales" RENAME COLUMN "ProductId" TO product_id;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='Sales' AND column_name='Quantity') THEN
        ALTER TABLE public."Sales" RENAME COLUMN "Quantity" TO quantity;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='Sales' AND column_name='Amount') THEN
        ALTER TABLE public."Sales" RENAME COLUMN "Amount" TO amount;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='Sales' AND column_name='SaleDate') THEN
        ALTER TABLE public."Sales" RENAME COLUMN "SaleDate" TO sale_date;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='Sales' AND column_name='CreatedBy') THEN
        ALTER TABLE public."Sales" RENAME COLUMN "CreatedBy" TO created_by;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='Sales' AND column_name='CashierName') THEN
        ALTER TABLE public."Sales" RENAME COLUMN "CashierName" TO cashier_name;
    END IF;
END $$;

-- Customers table
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='Customers' AND column_name='Id') THEN
        ALTER TABLE public."Customers" RENAME COLUMN "Id" TO id;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='Customers' AND column_name='Name') THEN
        ALTER TABLE public."Customers" RENAME COLUMN "Name" TO name;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='Customers' AND column_name='Email') THEN
        ALTER TABLE public."Customers" RENAME COLUMN "Email" TO email;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='Customers' AND column_name='Phone') THEN
        ALTER TABLE public."Customers" RENAME COLUMN "Phone" TO phone;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='Customers' AND column_name='Address') THEN
        ALTER TABLE public."Customers" RENAME COLUMN "Address" TO address;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='Customers' AND column_name='Company') THEN
        ALTER TABLE public."Customers" RENAME COLUMN "Company" TO company;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='Customers' AND column_name='CreatedAt') THEN
        ALTER TABLE public."Customers" RENAME COLUMN "CreatedAt" TO created_at;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='Customers' AND column_name='UpdatedAt') THEN
        ALTER TABLE public."Customers" RENAME COLUMN "UpdatedAt" TO updated_at;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='Customers' AND column_name='CreatedBy') THEN
        ALTER TABLE public."Customers" RENAME COLUMN "CreatedBy" TO created_by;
    END IF;
END $$;

-- Users table
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='Users' AND column_name='Id') THEN
        ALTER TABLE public."Users" RENAME COLUMN "Id" TO id;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='Users' AND column_name='Username') THEN
        ALTER TABLE public."Users" RENAME COLUMN "Username" TO username;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='Users' AND column_name='Email') THEN
        ALTER TABLE public."Users" RENAME COLUMN "Email" TO email;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='Users' AND column_name='PasswordHash') THEN
        ALTER TABLE public."Users" RENAME COLUMN "PasswordHash" TO password_hash;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='Users' AND column_name='Role') THEN
        ALTER TABLE public."Users" RENAME COLUMN "Role" TO role;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='Users' AND column_name='CreatedAt') THEN
        ALTER TABLE public."Users" RENAME COLUMN "CreatedAt" TO created_at;
    END IF;
END $$;

-- Products table
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='Products' AND column_name='Id') THEN
        ALTER TABLE public."Products" RENAME COLUMN "Id" TO id;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='Products' AND column_name='Name') THEN
        ALTER TABLE public."Products" RENAME COLUMN "Name" TO name;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='Products' AND column_name='SKU') THEN
        ALTER TABLE public."Products" RENAME COLUMN "SKU" TO sku;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='Products' AND column_name='Price') THEN
        ALTER TABLE public."Products" RENAME COLUMN "Price" TO price;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='Products' AND column_name='Stock') THEN
        ALTER TABLE public."Products" RENAME COLUMN "Stock" TO stock;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='Products' AND column_name='IsActive') THEN
        ALTER TABLE public."Products" RENAME COLUMN "IsActive" TO is_active;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='Products' AND column_name='CreatedAt') THEN
        ALTER TABLE public."Products" RENAME COLUMN "CreatedAt" TO created_at;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='Products' AND column_name='UpdatedAt') THEN
        ALTER TABLE public."Products" RENAME COLUMN "UpdatedAt" TO updated_at;
    END IF;
END $$;

-- CustomerTraffic table
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='CustomerTraffic' AND column_name='Id') THEN
        ALTER TABLE public."CustomerTraffic" RENAME COLUMN "Id" TO id;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='CustomerTraffic' AND column_name='CustomerId') THEN
        ALTER TABLE public."CustomerTraffic" RENAME COLUMN "CustomerId" TO customer_id;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='CustomerTraffic' AND column_name='Source') THEN
        ALTER TABLE public."CustomerTraffic" RENAME COLUMN "Source" TO source;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='CustomerTraffic' AND column_name='Campaign') THEN
        ALTER TABLE public."CustomerTraffic" RENAME COLUMN "Campaign" TO campaign;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='CustomerTraffic' AND column_name='VisitDate') THEN
        ALTER TABLE public."CustomerTraffic" RENAME COLUMN "VisitDate" TO visit_date;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='CustomerTraffic' AND column_name='Page') THEN
        ALTER TABLE public."CustomerTraffic" RENAME COLUMN "Page" TO page;
    END IF;
END $$;

-- SalesTransactionItems table
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='SalesTransactionItems' AND column_name='Id') THEN
        ALTER TABLE public."SalesTransactionItems" RENAME COLUMN "Id" TO id;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='SalesTransactionItems' AND column_name='TransactionId') THEN
        ALTER TABLE public."SalesTransactionItems" RENAME COLUMN "TransactionId" TO transaction_id;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='SalesTransactionItems' AND column_name='ProductId') THEN
        ALTER TABLE public."SalesTransactionItems" RENAME COLUMN "ProductId" TO product_id;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='SalesTransactionItems' AND column_name='Quantity') THEN
        ALTER TABLE public."SalesTransactionItems" RENAME COLUMN "Quantity" TO quantity;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='SalesTransactionItems' AND column_name='Price') THEN
        ALTER TABLE public."SalesTransactionItems" RENAME COLUMN "Price" TO price;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='SalesTransactionItems' AND column_name='SubTotal') THEN
        ALTER TABLE public."SalesTransactionItems" RENAME COLUMN "SubTotal" TO sub_total;
    END IF;
END $$;

-- Expenses table (handle both quoted and unquoted table names)
DO $$
BEGIN
    -- Check for lowercase table name first
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND LOWER(table_name)='expenses' AND column_name='Id') THEN
        EXECUTE format('ALTER TABLE %I RENAME COLUMN "Id" TO id', (SELECT table_name FROM information_schema.tables WHERE table_schema='public' AND LOWER(table_name)='expenses' LIMIT 1));
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND LOWER(table_name)='expenses' AND column_name='Amount') THEN
        EXECUTE format('ALTER TABLE %I RENAME COLUMN "Amount" TO amount', (SELECT table_name FROM information_schema.tables WHERE table_schema='public' AND LOWER(table_name)='expenses' LIMIT 1));
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND LOWER(table_name)='expenses' AND column_name='Description') THEN
        EXECUTE format('ALTER TABLE %I RENAME COLUMN "Description" TO description', (SELECT table_name FROM information_schema.tables WHERE table_schema='public' AND LOWER(table_name)='expenses' LIMIT 1));
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND LOWER(table_name)='expenses' AND column_name='ExpenseDate') THEN
        EXECUTE format('ALTER TABLE %I RENAME COLUMN "ExpenseDate" TO expense_date', (SELECT table_name FROM information_schema.tables WHERE table_schema='public' AND LOWER(table_name)='expenses' LIMIT 1));
    END IF;
END $$;

-- SalesAllocation table (handle both quoted and unquoted table names)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND LOWER(table_name)='salesallocation' AND column_name='Id') THEN
        EXECUTE format('ALTER TABLE %I RENAME COLUMN "Id" TO id', (SELECT table_name FROM information_schema.tables WHERE table_schema='public' AND LOWER(table_name)='salesallocation' LIMIT 1));
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND LOWER(table_name)='salesallocation' AND column_name='SalesTransactionId') THEN
        EXECUTE format('ALTER TABLE %I RENAME COLUMN "SalesTransactionId" TO sales_transaction_id', (SELECT table_name FROM information_schema.tables WHERE table_schema='public' AND LOWER(table_name)='salesallocation' LIMIT 1));
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND LOWER(table_name)='salesallocation' AND column_name='ToCapital') THEN
        EXECUTE format('ALTER TABLE %I RENAME COLUMN "ToCapital" TO to_capital', (SELECT table_name FROM information_schema.tables WHERE table_schema='public' AND LOWER(table_name)='salesallocation' LIMIT 1));
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND LOWER(table_name)='salesallocation' AND column_name='ToOwner') THEN
        EXECUTE format('ALTER TABLE %I RENAME COLUMN "ToOwner" TO to_owner', (SELECT table_name FROM information_schema.tables WHERE table_schema='public' AND LOWER(table_name)='salesallocation' LIMIT 1));
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND LOWER(table_name)='salesallocation' AND column_name='AllocationDate') THEN
        EXECUTE format('ALTER TABLE %I RENAME COLUMN "AllocationDate" TO allocation_date', (SELECT table_name FROM information_schema.tables WHERE table_schema='public' AND LOWER(table_name)='salesallocation' LIMIT 1));
    END IF;
END $$;

-- CashFlow table (handle both quoted and unquoted table names)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND LOWER(table_name)='cashflow' AND column_name='Id') THEN
        EXECUTE format('ALTER TABLE %I RENAME COLUMN "Id" TO id', (SELECT table_name FROM information_schema.tables WHERE table_schema='public' AND LOWER(table_name)='cashflow' LIMIT 1));
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND LOWER(table_name)='cashflow' AND column_name='FlowType') THEN
        EXECUTE format('ALTER TABLE %I RENAME COLUMN "FlowType" TO flow_type', (SELECT table_name FROM information_schema.tables WHERE table_schema='public' AND LOWER(table_name)='cashflow' LIMIT 1));
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND LOWER(table_name)='cashflow' AND column_name='ReferenceId') THEN
        EXECUTE format('ALTER TABLE %I RENAME COLUMN "ReferenceId" TO reference_id', (SELECT table_name FROM information_schema.tables WHERE table_schema='public' AND LOWER(table_name)='cashflow' LIMIT 1));
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND LOWER(table_name)='cashflow' AND column_name='Amount') THEN
        EXECUTE format('ALTER TABLE %I RENAME COLUMN "Amount" TO amount', (SELECT table_name FROM information_schema.tables WHERE table_schema='public' AND LOWER(table_name)='cashflow' LIMIT 1));
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND LOWER(table_name)='cashflow' AND column_name='FlowDate') THEN
        EXECUTE format('ALTER TABLE %I RENAME COLUMN "FlowDate" TO flow_date', (SELECT table_name FROM information_schema.tables WHERE table_schema='public' AND LOWER(table_name)='cashflow' LIMIT 1));
    END IF;
END $$;

-- CapitalCash table (handle both quoted and unquoted table names)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND LOWER(table_name)='capitalcash' AND column_name='Id') THEN
        EXECUTE format('ALTER TABLE %I RENAME COLUMN "Id" TO id', (SELECT table_name FROM information_schema.tables WHERE table_schema='public' AND LOWER(table_name)='capitalcash' LIMIT 1));
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND LOWER(table_name)='capitalcash' AND column_name='Balance') THEN
        EXECUTE format('ALTER TABLE %I RENAME COLUMN "Balance" TO balance', (SELECT table_name FROM information_schema.tables WHERE table_schema='public' AND LOWER(table_name)='capitalcash' LIMIT 1));
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND LOWER(table_name)='capitalcash' AND column_name='UpdatedAt') THEN
        EXECUTE format('ALTER TABLE %I RENAME COLUMN "UpdatedAt" TO updated_at', (SELECT table_name FROM information_schema.tables WHERE table_schema='public' AND LOWER(table_name)='capitalcash' LIMIT 1));
    END IF;
END $$;

-- =====================================================
-- Verification: Check all renamed columns
-- =====================================================
SELECT 
    table_name,
    column_name,
    data_type
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name IN ('Sales', 'Customers', 'Users', 'Products', 'CustomerTraffic', 'SalesTransactionItems', 'expenses', 'salesallocation', 'cashflow', 'capitalcash')
ORDER BY table_name, column_name;
