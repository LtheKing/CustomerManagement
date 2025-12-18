-- =====================================================
-- Customer Management Database Schema
-- PostgreSQL 18
-- =====================================================
-- This script creates all tables for the Customer Management system
-- Run this script in pgAdmin or psql to create the database schema
-- =====================================================

-- Enable UUID extension (required for gen_random_uuid())
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
-- Optional extension if you want uuid_generate_v4() (some scripts use it)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- Table: Users
-- =====================================================
CREATE TABLE IF NOT EXISTS "Users" (
    "Id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "Username" VARCHAR(50) NOT NULL,
    "Email" VARCHAR(100) NOT NULL,
    "PasswordHash" VARCHAR(255) NOT NULL,
    "Role" VARCHAR(50) NOT NULL,
    "CreatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Unique indexes for Users
CREATE UNIQUE INDEX IF NOT EXISTS "IX_Users_Username" ON "Users" ("Username");
CREATE UNIQUE INDEX IF NOT EXISTS "IX_Users_Email" ON "Users" ("Email");

-- =====================================================
-- Table: Products
-- =====================================================
CREATE TABLE IF NOT EXISTS "Products" (
    "Id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "Name" VARCHAR(100) NOT NULL,
    "SKU" VARCHAR(50) NOT NULL,
    "Price" DECIMAL(18,2) NOT NULL,
    "Stock" INTEGER NOT NULL DEFAULT 0,
    "IsActive" BOOLEAN NOT NULL DEFAULT true,
    "CreatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "UpdatedAt" TIMESTAMP NULL
);

-- Unique index for Products SKU
CREATE UNIQUE INDEX IF NOT EXISTS "IX_Products_SKU" ON "Products" ("SKU");

-- =====================================================
-- Table: Customers
-- =====================================================
CREATE TABLE IF NOT EXISTS "Customers" (
    "Id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "Name" VARCHAR(100) NOT NULL,
    "Email" VARCHAR(100) NULL,
    "Phone" VARCHAR(20) NULL,
    "Address" VARCHAR(255) NULL,
    "Company" VARCHAR(100) NULL,
    "CreatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "UpdatedAt" TIMESTAMP NULL,
    "CreatedBy" UUID NOT NULL,
    
    -- Foreign Key Constraints
    CONSTRAINT "FK_Customers_Users_CreatedBy" 
        FOREIGN KEY ("CreatedBy") 
        REFERENCES "Users"("Id") 
        ON DELETE RESTRICT
);

-- Index for Customers CreatedBy
CREATE INDEX IF NOT EXISTS "IX_Customers_CreatedBy" ON "Customers" ("CreatedBy");

-- =====================================================
-- Table: Sales
-- =====================================================
CREATE TABLE IF NOT EXISTS "Sales" (
    "Id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "CustomerId" UUID NOT NULL,
    "ProductId" UUID NOT NULL,
    "Quantity" INTEGER NOT NULL DEFAULT 0,
    "Amount" DECIMAL(18,2) NOT NULL,
    "SaleDate" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "CreatedBy" UUID NOT NULL,
    
    -- Foreign Key Constraints
    CONSTRAINT "FK_Sales_Customers_CustomerId" 
        FOREIGN KEY ("CustomerId") 
        REFERENCES "Customers"("Id") 
        ON DELETE RESTRICT,
    
    CONSTRAINT "FK_Sales_Products_ProductId" 
        FOREIGN KEY ("ProductId") 
        REFERENCES "Products"("Id") 
        ON DELETE RESTRICT,
    
    CONSTRAINT "FK_Sales_Users_CreatedBy" 
        FOREIGN KEY ("CreatedBy") 
        REFERENCES "Users"("Id") 
        ON DELETE RESTRICT
);

-- Indexes for Sales
CREATE INDEX IF NOT EXISTS "IX_Sales_CustomerId" ON "Sales" ("CustomerId");
CREATE INDEX IF NOT EXISTS "IX_Sales_ProductId" ON "Sales" ("ProductId");
CREATE INDEX IF NOT EXISTS "IX_Sales_CreatedBy" ON "Sales" ("CreatedBy");
CREATE INDEX IF NOT EXISTS "IX_Sales_SaleDate" ON "Sales" ("SaleDate");

-- =====================================================
-- Table: CustomerTraffic
-- =====================================================
CREATE TABLE IF NOT EXISTS "CustomerTraffic" (
    "Id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "CustomerId" UUID NULL,
    "Source" VARCHAR(50) NOT NULL,
    "Campaign" VARCHAR(100) NULL,
    "VisitDate" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "Page" VARCHAR(200) NULL,
    
    -- Foreign Key Constraints
    CONSTRAINT "FK_CustomerTraffic_Customers_CustomerId" 
        FOREIGN KEY ("CustomerId") 
        REFERENCES "Customers"("Id") 
        ON DELETE SET NULL
);

-- Index for CustomerTraffic
CREATE INDEX IF NOT EXISTS "IX_CustomerTraffic_CustomerId" ON "CustomerTraffic" ("CustomerId");
CREATE INDEX IF NOT EXISTS "IX_CustomerTraffic_VisitDate" ON "CustomerTraffic" ("VisitDate");

-- =====================================================
-- Table: SalesTransactionItems
-- =====================================================
CREATE TABLE IF NOT EXISTS "SalesTransactionItems" (
    "Id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "TransactionId" UUID NOT NULL,
    "ProductId" UUID NOT NULL,
    "Quantity" INTEGER NOT NULL,
    "Price" DECIMAL(18,2) NOT NULL,
    "SubTotal" DECIMAL(18,2) NOT NULL,
    
    -- Foreign Key Constraints
    CONSTRAINT "FK_SalesTransactionItems_Sales_TransactionId" 
        FOREIGN KEY ("TransactionId") 
        REFERENCES "Sales"("Id") 
        ON DELETE CASCADE,
    
    CONSTRAINT "FK_SalesTransactionItems_Products_ProductId" 
        FOREIGN KEY ("ProductId") 
        REFERENCES "Products"("Id") 
        ON DELETE RESTRICT
);

-- Indexes for SalesTransactionItems
CREATE INDEX IF NOT EXISTS "IX_SalesTransactionItems_TransactionId" ON "SalesTransactionItems" ("TransactionId");
CREATE INDEX IF NOT EXISTS "IX_SalesTransactionItems_ProductId" ON "SalesTransactionItems" ("ProductId");

-- =====================================================
-- Additional Tables (Cash / Expenses)
-- Note: these were created with unquoted identifiers in your query,
-- so PostgreSQL stores them as lowercase.
-- =====================================================

CREATE TABLE IF NOT EXISTS capitalcash (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    balance NUMERIC(18,2) NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS expenses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    description VARCHAR(255) NOT NULL,
    amount NUMERIC(18,2) NOT NULL,
    expensedate TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add CashierName to Sales table (quoted table + quoted column)
ALTER TABLE IF EXISTS public."Sales"
    ADD COLUMN IF NOT EXISTS "CashierName" character varying;

CREATE TABLE IF NOT EXISTS salesallocation (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    salestransactionid UUID NOT NULL,
    tocapital NUMERIC(18,2) NOT NULL CHECK (tocapital >= 0),
    toowner NUMERIC(18,2) NOT NULL CHECK (toowner >= 0),
    allocationdate TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS ix_salesallocation_salestransactionid ON salesallocation (salestransactionid);

CREATE TABLE IF NOT EXISTS cashflow (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    flowtype VARCHAR(20) NOT NULL,
    referenceid UUID NOT NULL,
    amount NUMERIC(18,2) NOT NULL,
    flowdate TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS ix_cashflow_flowdate ON cashflow (flowdate);
CREATE INDEX IF NOT EXISTS ix_cashflow_flowtype ON cashflow (flowtype);

-- =====================================================
-- End of Schema Creation
-- =====================================================

-- Verification: List all created tables
-- SELECT table_name 
-- FROM information_schema.tables 
-- WHERE table_schema = 'public' 
-- ORDER BY table_name;

