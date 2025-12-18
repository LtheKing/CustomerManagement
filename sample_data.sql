-- =====================================================
-- Sample Data for Customer Management Database
-- PostgreSQL 18
-- =====================================================
-- This script inserts sample data into all tables
-- Make sure to run database_schema.sql first!
-- =====================================================

-- Clear existing data (optional - uncomment if you want to reset)
-- TRUNCATE TABLE "SalesTransactionItems" CASCADE;
-- TRUNCATE TABLE "Sales" CASCADE;
-- TRUNCATE TABLE "CustomerTraffic" CASCADE;
-- TRUNCATE TABLE "Customers" CASCADE;
-- TRUNCATE TABLE "Products" CASCADE;
-- TRUNCATE TABLE "Users" CASCADE;

-- =====================================================
-- 1. USERS (No dependencies - insert first)
-- =====================================================
INSERT INTO "Users" ("Id", "Username", "Email", "PasswordHash", "Role", "CreatedAt") VALUES
('11111111-1111-1111-1111-111111111111', 'admin', 'admin@customermanagement.com', '$2a$11$KIXQZqJZqJZqJZqJZqJZqO', 'Admin', CURRENT_TIMESTAMP - INTERVAL '30 days'),
('22222222-2222-2222-2222-222222222222', 'sales_manager', 'sales@customermanagement.com', '$2a$11$KIXQZqJZqJZqJZqJZqJZqO', 'SalesManager', CURRENT_TIMESTAMP - INTERVAL '25 days'),
('33333333-3333-3333-3333-333333333333', 'sales_rep1', 'john.doe@customermanagement.com', '$2a$11$KIXQZqJZqJZqJZqJZqJZqO', 'SalesRep', CURRENT_TIMESTAMP - INTERVAL '20 days'),
('44444444-4444-4444-4444-444444444444', 'sales_rep2', 'jane.smith@customermanagement.com', '$2a$11$KIXQZqJZqJZqJZqJZqJZqO', 'SalesRep', CURRENT_TIMESTAMP - INTERVAL '18 days')
ON CONFLICT ("Id") DO NOTHING;

-- =====================================================
-- 2. PRODUCTS (No dependencies - insert second)
-- =====================================================
INSERT INTO "Products" ("Id", "Name", "SKU", "Price", "Stock", "IsActive", "CreatedAt", "UpdatedAt") VALUES
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Software License - Basic', 'SW-LIC-BASIC', 299.99, 100, true, CURRENT_TIMESTAMP - INTERVAL '60 days', NULL),
('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Software License - Professional', 'SW-LIC-PRO', 599.99, 75, true, CURRENT_TIMESTAMP - INTERVAL '60 days', NULL),
('cccccccc-cccc-cccc-cccc-cccccccccccc', 'Cloud Service - Starter', 'CLOUD-STARTER', 49.99, 200, true, CURRENT_TIMESTAMP - INTERVAL '55 days', NULL),
('dddddddd-dddd-dddd-dddd-dddddddddddd', 'Cloud Service - Enterprise', 'CLOUD-ENTERPRISE', 199.99, 50, true, CURRENT_TIMESTAMP - INTERVAL '55 days', NULL),
('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 'Consulting Services', 'CONSULT-HOURLY', 150.00, 1000, true, CURRENT_TIMESTAMP - INTERVAL '50 days', NULL),
('ffffffff-ffff-ffff-ffff-ffffffffffff', 'Support Package - Basic', 'SUPPORT-BASIC', 99.99, 500, true, CURRENT_TIMESTAMP - INTERVAL '45 days', NULL),
('11111111-1111-1111-1111-111111111112', 'Support Package - Premium', 'SUPPORT-PREMIUM', 299.99, 300, true, CURRENT_TIMESTAMP - INTERVAL '45 days', NULL),
('22222222-2222-2222-2222-222222222223', 'Training Course', 'TRAIN-STD', 499.99, 100, true, CURRENT_TIMESTAMP - INTERVAL '40 days', NULL),
('33333333-3333-3333-3333-333333333334', 'Hardware Device', 'HW-DEVICE-01', 1299.99, 25, true, CURRENT_TIMESTAMP - INTERVAL '35 days', NULL),
('44444444-4444-4444-4444-444444444445', 'Hardware Device - Pro', 'HW-DEVICE-PRO', 2499.99, 15, true, CURRENT_TIMESTAMP - INTERVAL '35 days', NULL)
ON CONFLICT ("Id") DO NOTHING;

-- =====================================================
-- 3. CUSTOMERS (Depends on Users)
-- =====================================================
INSERT INTO "Customers" ("Id", "Name", "Email", "Phone", "Address", "Company", "CreatedAt", "UpdatedAt", "CreatedBy") VALUES
('aaaaaaaa-1111-1111-1111-111111111111', 'Acme Corporation', 'contact@acme.com', '+1-555-0101', '123 Business Ave, New York, NY 10001', 'Acme Corporation', CURRENT_TIMESTAMP - INTERVAL '15 days', CURRENT_TIMESTAMP - INTERVAL '5 days', '11111111-1111-1111-1111-111111111111'),
('bbbbbbbb-2222-2222-2222-222222222222', 'TechStart Inc', 'info@techstart.com', '+1-555-0102', '456 Innovation St, San Francisco, CA 94105', 'TechStart Inc', CURRENT_TIMESTAMP - INTERVAL '12 days', CURRENT_TIMESTAMP - INTERVAL '3 days', '22222222-2222-2222-2222-222222222222'),
('cccccccc-3333-3333-3333-333333333333', 'Global Solutions Ltd', 'sales@globalsolutions.com', '+1-555-0103', '789 Enterprise Blvd, Chicago, IL 60601', 'Global Solutions Ltd', CURRENT_TIMESTAMP - INTERVAL '10 days', CURRENT_TIMESTAMP - INTERVAL '1 day', '33333333-3333-3333-3333-333333333333'),
('dddddddd-4444-4444-4444-444444444444', 'Future Dynamics', 'contact@futuredynamics.com', '+1-555-0104', '321 Future Way, Austin, TX 73301', 'Future Dynamics', CURRENT_TIMESTAMP - INTERVAL '8 days', NULL, '44444444-4444-4444-4444-444444444444'),
('eeeeeeee-5555-5555-5555-555555555555', 'Innovation Hub', 'hello@innovationhub.com', '+1-555-0105', '654 Creative Lane, Seattle, WA 98101', 'Innovation Hub', CURRENT_TIMESTAMP - INTERVAL '6 days', CURRENT_TIMESTAMP - INTERVAL '2 days', '11111111-1111-1111-1111-111111111111'),
('ffffffff-6666-6666-6666-666666666666', 'Digital Ventures', 'info@digitalventures.com', '+1-555-0106', '987 Digital Drive, Boston, MA 02101', 'Digital Ventures', CURRENT_TIMESTAMP - INTERVAL '4 days', NULL, '22222222-2222-2222-2222-222222222222'),
('11111111-7777-7777-7777-777777777777', 'Smart Systems Co', 'sales@smartsystems.com', '+1-555-0107', '147 Tech Park, Denver, CO 80202', 'Smart Systems Co', CURRENT_TIMESTAMP - INTERVAL '14 days', CURRENT_TIMESTAMP - INTERVAL '4 days', '33333333-3333-3333-3333-333333333333'),
('22222222-8888-8888-8888-888888888888', 'NextGen Industries', 'contact@nextgen.com', '+1-555-0108', '258 Modern Ave, Miami, FL 33101', 'NextGen Industries', CURRENT_TIMESTAMP - INTERVAL '11 days', NULL, '44444444-4444-4444-4444-444444444444')
ON CONFLICT ("Id") DO NOTHING;

-- =====================================================
-- 4. SALES (Depends on Customers, Products, Users)
-- =====================================================
INSERT INTO "Sales" ("Id", "CustomerId", "ProductId", "Quantity", "Amount", "SaleDate", "CreatedBy") VALUES
-- Sales for Acme Corporation
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa01', 'aaaaaaaa-1111-1111-1111-111111111111', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 5, 1499.95, CURRENT_TIMESTAMP - INTERVAL '10 days', '11111111-1111-1111-1111-111111111111'),
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa02', 'aaaaaaaa-1111-1111-1111-111111111111', 'cccccccc-cccc-cccc-cccc-cccccccccccc', 10, 499.90, CURRENT_TIMESTAMP - INTERVAL '8 days', '22222222-2222-2222-2222-222222222222'),
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa03', 'aaaaaaaa-1111-1111-1111-111111111111', 'ffffffff-ffff-ffff-ffff-ffffffffffff', 2, 199.98, CURRENT_TIMESTAMP - INTERVAL '5 days', '33333333-3333-3333-3333-333333333333'),

-- Sales for TechStart Inc
('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbb01', 'bbbbbbbb-2222-2222-2222-222222222222', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 3, 1799.97, CURRENT_TIMESTAMP - INTERVAL '9 days', '22222222-2222-2222-2222-222222222222'),
('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbb02', 'bbbbbbbb-2222-2222-2222-222222222222', 'dddddddd-dddd-dddd-dddd-dddddddddddd', 1, 199.99, CURRENT_TIMESTAMP - INTERVAL '7 days', '33333333-3333-3333-3333-333333333333'),
('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbb03', 'bbbbbbbb-2222-2222-2222-222222222222', 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 20, 3000.00, CURRENT_TIMESTAMP - INTERVAL '4 days', '44444444-4444-4444-4444-444444444444'),

-- Sales for Global Solutions Ltd
('cccccccc-cccc-cccc-cccc-cccccccccc01', 'cccccccc-3333-3333-3333-333333333333', '33333333-3333-3333-3333-333333333334', 2, 2599.98, CURRENT_TIMESTAMP - INTERVAL '11 days', '33333333-3333-3333-3333-333333333333'),
('cccccccc-cccc-cccc-cccc-cccccccccc02', 'cccccccc-3333-3333-3333-333333333333', '11111111-1111-1111-1111-111111111112', 1, 299.99, CURRENT_TIMESTAMP - INTERVAL '6 days', '33333333-3333-3333-3333-333333333333'),
('cccccccc-cccc-cccc-cccc-cccccccccc03', 'cccccccc-3333-3333-3333-333333333333', '22222222-2222-2222-2222-222222222223', 1, 499.99, CURRENT_TIMESTAMP - INTERVAL '3 days', '44444444-4444-4444-4444-444444444444'),

-- Sales for Future Dynamics
('dddddddd-dddd-dddd-dddd-dddddddddd01', 'dddddddd-4444-4444-4444-444444444444', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 10, 2999.90, CURRENT_TIMESTAMP - INTERVAL '7 days', '44444444-4444-4444-4444-444444444444'),
('dddddddd-dddd-dddd-dddd-dddddddddd02', 'dddddddd-4444-4444-4444-444444444444', 'cccccccc-cccc-cccc-cccc-cccccccccccc', 5, 249.95, CURRENT_TIMESTAMP - INTERVAL '2 days', '11111111-1111-1111-1111-111111111111'),

-- Sales for Innovation Hub
('eeeeeeee-eeee-eeee-eeee-eeeeeeeeee01', 'eeeeeeee-5555-5555-5555-555555555555', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 2, 1199.98, CURRENT_TIMESTAMP - INTERVAL '5 days', '11111111-1111-1111-1111-111111111111'),
('eeeeeeee-eeee-eeee-eeee-eeeeeeeeee02', 'eeeeeeee-5555-5555-5555-555555555555', 'dddddddd-dddd-dddd-dddd-dddddddddddd', 3, 599.97, CURRENT_TIMESTAMP - INTERVAL '1 day', '22222222-2222-2222-2222-222222222222'),

-- Sales for Digital Ventures
('ffffffff-ffff-ffff-ffff-ffffffffff01', 'ffffffff-6666-6666-6666-666666666666', '44444444-4444-4444-4444-444444444445', 1, 2499.99, CURRENT_TIMESTAMP - INTERVAL '3 days', '22222222-2222-2222-2222-222222222222'),
('ffffffff-ffff-ffff-ffff-ffffffffff02', 'ffffffff-6666-6666-6666-666666666666', 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 15, 2250.00, CURRENT_TIMESTAMP - INTERVAL '1 day', '33333333-3333-3333-3333-333333333333'),

-- Sales for Smart Systems Co
('11111111-1111-1111-1111-111111111113', '11111111-7777-7777-7777-777777777777', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 8, 2399.92, CURRENT_TIMESTAMP - INTERVAL '12 days', '33333333-3333-3333-3333-333333333333'),
('11111111-1111-1111-1111-111111111114', '11111111-7777-7777-7777-777777777777', 'ffffffff-ffff-ffff-ffff-ffffffffffff', 3, 299.97, CURRENT_TIMESTAMP - INTERVAL '9 days', '33333333-3333-3333-3333-333333333333'),

-- Sales for NextGen Industries
('22222222-2222-2222-2222-222222222224', '22222222-8888-8888-8888-888888888888', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 1, 599.99, CURRENT_TIMESTAMP - INTERVAL '8 days', '44444444-4444-4444-4444-444444444444'),
('22222222-2222-2222-2222-222222222225', '22222222-8888-8888-8888-888888888888', 'cccccccc-cccc-cccc-cccc-cccccccccccc', 12, 599.88, CURRENT_TIMESTAMP - INTERVAL '6 days', '44444444-4444-4444-4444-444444444444')
ON CONFLICT ("Id") DO NOTHING;

-- =====================================================
-- 5. CUSTOMER TRAFFIC (Depends on Customers)
-- =====================================================
INSERT INTO "CustomerTraffic" ("Id", "CustomerId", "Source", "Campaign", "VisitDate", "Page") VALUES
-- Traffic for Acme Corporation
('aaaaaaaa-1111-1111-1111-111111111112', 'aaaaaaaa-1111-1111-1111-111111111111', 'Google', 'Summer Sale', CURRENT_TIMESTAMP - INTERVAL '20 days', '/home'),
('aaaaaaaa-1111-1111-1111-111111111113', 'aaaaaaaa-1111-1111-1111-111111111111', 'Facebook', 'New Product Launch', CURRENT_TIMESTAMP - INTERVAL '18 days', '/products'),
('aaaaaaaa-1111-1111-1111-111111111114', 'aaaaaaaa-1111-1111-1111-111111111111', 'Direct', NULL, CURRENT_TIMESTAMP - INTERVAL '15 days', '/pricing'),
('aaaaaaaa-1111-1111-1111-111111111115', 'aaaaaaaa-1111-1111-1111-111111111111', 'LinkedIn', 'Webinar Series', CURRENT_TIMESTAMP - INTERVAL '12 days', '/contact'),
('aaaaaaaa-1111-1111-1111-111111111116', 'aaaaaaaa-1111-1111-1111-111111111111', 'Email Campaign', 'Holiday Special', CURRENT_TIMESTAMP - INTERVAL '10 days', '/about'),

-- Traffic for TechStart Inc
('bbbbbbbb-2222-2222-2222-222222222223', 'bbbbbbbb-2222-2222-2222-222222222222', 'Google', 'Free Trial', CURRENT_TIMESTAMP - INTERVAL '17 days', '/home'),
('bbbbbbbb-2222-2222-2222-222222222224', 'bbbbbbbb-2222-2222-2222-222222222222', 'Referral', NULL, CURRENT_TIMESTAMP - INTERVAL '14 days', '/products'),
('bbbbbbbb-2222-2222-2222-222222222225', 'bbbbbbbb-2222-2222-2222-222222222222', 'Banner Ad', 'Demo Request', CURRENT_TIMESTAMP - INTERVAL '11 days', '/demo'),
('bbbbbbbb-2222-2222-2222-222222222226', 'bbbbbbbb-2222-2222-2222-222222222222', 'Facebook', 'Summer Sale', CURRENT_TIMESTAMP - INTERVAL '8 days', '/pricing'),

-- Traffic for Global Solutions Ltd
('cccccccc-3333-3333-3333-333333333334', 'cccccccc-3333-3333-3333-333333333333', 'Direct', NULL, CURRENT_TIMESTAMP - INTERVAL '19 days', '/home'),
('cccccccc-3333-3333-3333-333333333335', 'cccccccc-3333-3333-3333-333333333333', 'LinkedIn', 'New Product Launch', CURRENT_TIMESTAMP - INTERVAL '16 days', '/products'),
('cccccccc-3333-3333-3333-333333333336', 'cccccccc-3333-3333-3333-333333333333', 'Email Campaign', 'Holiday Special', CURRENT_TIMESTAMP - INTERVAL '13 days', '/contact'),
('cccccccc-3333-3333-3333-333333333337', 'cccccccc-3333-3333-3333-333333333333', 'Google', 'Webinar Series', CURRENT_TIMESTAMP - INTERVAL '9 days', '/support'),

-- Traffic for Future Dynamics
('dddddddd-4444-4444-4444-444444444445', 'dddddddd-4444-4444-4444-444444444444', 'Facebook', 'Free Trial', CURRENT_TIMESTAMP - INTERVAL '15 days', '/home'),
('dddddddd-4444-4444-4444-444444444446', 'dddddddd-4444-4444-4444-444444444444', 'Referral', NULL, CURRENT_TIMESTAMP - INTERVAL '12 days', '/products'),
('dddddddd-4444-4444-4444-444444444447', 'dddddddd-4444-4444-4444-444444444444', 'Banner Ad', 'Demo Request', CURRENT_TIMESTAMP - INTERVAL '7 days', '/demo'),

-- Traffic for Innovation Hub
('eeeeeeee-5555-5555-5555-555555555556', 'eeeeeeee-5555-5555-5555-555555555555', 'Google', 'Summer Sale', CURRENT_TIMESTAMP - INTERVAL '13 days', '/home'),
('eeeeeeee-5555-5555-5555-555555555557', 'eeeeeeee-5555-5555-5555-555555555555', 'LinkedIn', 'New Product Launch', CURRENT_TIMESTAMP - INTERVAL '10 days', '/products'),
('eeeeeeee-5555-5555-5555-555555555558', 'eeeeeeee-5555-5555-5555-555555555555', 'Direct', NULL, CURRENT_TIMESTAMP - INTERVAL '6 days', '/pricing'),

-- Traffic for Digital Ventures
('ffffffff-6666-6666-6666-666666666667', 'ffffffff-6666-6666-6666-666666666666', 'Email Campaign', 'Holiday Special', CURRENT_TIMESTAMP - INTERVAL '11 days', '/home'),
('ffffffff-6666-6666-6666-666666666668', 'ffffffff-6666-6666-6666-666666666666', 'Facebook', 'Webinar Series', CURRENT_TIMESTAMP - INTERVAL '8 days', '/contact'),
('ffffffff-6666-6666-6666-666666666669', 'ffffffff-6666-6666-6666-666666666666', 'Google', 'Free Trial', CURRENT_TIMESTAMP - INTERVAL '4 days', '/demo'),

-- Traffic for Smart Systems Co
('11111111-7777-7777-7777-777777777778', '11111111-7777-7777-7777-777777777777', 'Referral', NULL, CURRENT_TIMESTAMP - INTERVAL '18 days', '/home'),
('11111111-7777-7777-7777-777777777779', '11111111-7777-7777-7777-777777777777', 'Banner Ad', 'Demo Request', CURRENT_TIMESTAMP - INTERVAL '14 days', '/products'),
('11111111-7777-7777-7777-777777777780', '11111111-7777-7777-7777-777777777777', 'LinkedIn', 'New Product Launch', CURRENT_TIMESTAMP - INTERVAL '10 days', '/pricing'),

-- Traffic for NextGen Industries
('22222222-8888-8888-8888-888888888889', '22222222-8888-8888-8888-888888888888', 'Direct', NULL, CURRENT_TIMESTAMP - INTERVAL '16 days', '/home'),
('22222222-8888-8888-8888-888888888890', '22222222-8888-8888-8888-888888888888', 'Email Campaign', 'Holiday Special', CURRENT_TIMESTAMP - INTERVAL '12 days', '/products'),
('22222222-8888-8888-8888-888888888891', '22222222-8888-8888-8888-888888888888', 'Google', 'Summer Sale', CURRENT_TIMESTAMP - INTERVAL '7 days', '/contact'),

-- Anonymous traffic (CustomerId is NULL)
('99999999-9999-9999-9999-999999999991', NULL, 'Google', 'Free Trial', CURRENT_TIMESTAMP - INTERVAL '5 days', '/home'),
('99999999-9999-9999-9999-999999999992', NULL, 'Facebook', 'Demo Request', CURRENT_TIMESTAMP - INTERVAL '3 days', '/products'),
('99999999-9999-9999-9999-999999999993', NULL, 'Direct', NULL, CURRENT_TIMESTAMP - INTERVAL '1 day', '/pricing')
ON CONFLICT ("Id") DO NOTHING;

-- =====================================================
-- 6. SALES TRANSACTION ITEMS (Depends on Sales, Products)
-- =====================================================
-- Multi-item transactions for some sales
INSERT INTO "SalesTransactionItems" ("Id", "TransactionId", "ProductId", "Quantity", "Price", "SubTotal") VALUES
-- Transaction items for Acme Corporation's first sale (multi-item)
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa11', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa01', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 3, 299.99, 899.97),
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa12', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa01', 'cccccccc-cccc-cccc-cccc-cccccccccccc', 2, 49.99, 99.98),
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa13', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa01', 'ffffffff-ffff-ffff-ffff-ffffffffffff', 1, 99.99, 99.99),

-- Transaction items for TechStart Inc's first sale (multi-item)
('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbb11', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbb01', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 2, 599.99, 1199.98),
('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbb12', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbb01', 'dddddddd-dddd-dddd-dddd-dddddddddddd', 1, 199.99, 199.99),
('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbb13', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbb01', 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 5, 150.00, 750.00),

-- Transaction items for Global Solutions Ltd's first sale (multi-item)
('cccccccc-cccc-cccc-cccc-cccccccccc11', 'cccccccc-cccc-cccc-cccc-cccccccccc01', '33333333-3333-3333-3333-333333333334', 1, 1299.99, 1299.99),
('cccccccc-cccc-cccc-cccc-cccccccccc12', 'cccccccc-cccc-cccc-cccc-cccccccccc01', '11111111-1111-1111-1111-111111111112', 1, 299.99, 299.99),
('cccccccc-cccc-cccc-cccc-cccccccccc13', 'cccccccc-cccc-cccc-cccc-cccccccccc01', '22222222-2222-2222-2222-222222222223', 1, 499.99, 499.99),

-- Transaction items for Innovation Hub's first sale (multi-item)
('eeeeeeee-eeee-eeee-eeee-eeeeeeeeee11', 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeee01', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 1, 599.99, 599.99),
('eeeeeeee-eeee-eeee-eeee-eeeeeeeeee12', 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeee01', 'dddddddd-dddd-dddd-dddd-dddddddddddd', 1, 199.99, 199.99),
('eeeeeeee-eeee-eeee-eeee-eeeeeeeeee13', 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeee01', 'ffffffff-ffff-ffff-ffff-ffffffffffff', 2, 99.99, 199.98),

-- Transaction items for Digital Ventures' first sale (multi-item)
('ffffffff-ffff-ffff-ffff-ffffffffff11', 'ffffffff-ffff-ffff-ffff-ffffffffff01', '44444444-4444-4444-4444-444444444445', 1, 2499.99, 2499.99),
('ffffffff-ffff-ffff-ffff-ffffffffff12', 'ffffffff-ffff-ffff-ffff-ffffffffff01', 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 10, 150.00, 1500.00),

-- Transaction items for Smart Systems Co's first sale (multi-item)
('11111111-1111-1111-1111-111111111115', '11111111-1111-1111-1111-111111111113', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 5, 299.99, 1499.95),
('11111111-1111-1111-1111-111111111116', '11111111-1111-1111-1111-111111111113', 'cccccccc-cccc-cccc-cccc-cccccccccccc', 3, 49.99, 149.97),
('11111111-1111-1111-1111-111111111117', '11111111-1111-1111-1111-111111111113', 'ffffffff-ffff-ffff-ffff-ffffffffffff', 2, 99.99, 199.98)
ON CONFLICT ("Id") DO NOTHING;

-- =====================================================
-- 7. CAPITAL CASH (No dependencies)
-- =====================================================
INSERT INTO capitalcash (id, balance, updated_at) VALUES
('55555555-5555-5555-5555-555555555555', 10000.00, NOW() - INTERVAL '7 days')
ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- 8. EXPENSES (No dependencies)
-- =====================================================
INSERT INTO expenses (id, description, amount, expensedate) VALUES
('66666666-6666-6666-6666-666666666661', 'Office rent', 1200.00, NOW() - INTERVAL '10 days'),
('66666666-6666-6666-6666-666666666662', 'Internet service', 80.00, NOW() - INTERVAL '9 days'),
('66666666-6666-6666-6666-666666666663', 'Marketing campaign', 450.00, NOW() - INTERVAL '5 days')
ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- 9. SALES ALLOCATION (Depends on Sales)
-- =====================================================
INSERT INTO salesallocation (id, salestransactionid, tocapital, toowner, allocationdate) VALUES
('77777777-7777-7777-7777-777777777771', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa01', 900.00, 199.95, NOW() - INTERVAL '9 days'),
('77777777-7777-7777-7777-777777777772', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbb01', 1200.00, 599.97, NOW() - INTERVAL '8 days'),
('77777777-7777-7777-7777-777777777773', 'cccccccc-cccc-cccc-cccc-cccccccccc01', 1500.00, 1099.98, NOW() - INTERVAL '10 days')
ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- 10. CASH FLOW (References Sales / Expenses / Owner Take)
-- =====================================================
INSERT INTO cashflow (id, flowtype, referenceid, amount, flowdate) VALUES
('88888888-8888-8888-8888-888888888881', 'SALE', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa01', 1499.95, NOW() - INTERVAL '10 days'),
('88888888-8888-8888-8888-888888888882', 'SALE', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbb01', 1799.97, NOW() - INTERVAL '9 days'),
('88888888-8888-8888-8888-888888888883', 'EXPENSE', '66666666-6666-6666-6666-666666666661', 1200.00, NOW() - INTERVAL '10 days'),
('88888888-8888-8888-8888-888888888884', 'EXPENSE', '66666666-6666-6666-6666-666666666663', 450.00, NOW() - INTERVAL '5 days'),
('88888888-8888-8888-8888-888888888885', 'OWNER_TAKE', '77777777-7777-7777-7777-777777777771', 199.95, NOW() - INTERVAL '9 days')
ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- Verification Queries
-- =====================================================

-- Count records in each table
SELECT 'Users' AS "Table", COUNT(*) AS "Count" FROM "Users"
UNION ALL
SELECT 'Products', COUNT(*) FROM "Products"
UNION ALL
SELECT 'Customers', COUNT(*) FROM "Customers"
UNION ALL
SELECT 'Sales', COUNT(*) FROM "Sales"
UNION ALL
SELECT 'CustomerTraffic', COUNT(*) FROM "CustomerTraffic"
UNION ALL
SELECT 'SalesTransactionItems', COUNT(*) FROM "SalesTransactionItems"
UNION ALL
SELECT 'CapitalCash', COUNT(*) FROM capitalcash
UNION ALL
SELECT 'Expenses', COUNT(*) FROM expenses
UNION ALL
SELECT 'SalesAllocation', COUNT(*) FROM salesallocation
UNION ALL
SELECT 'CashFlow', COUNT(*) FROM cashflow
ORDER BY "Table";

-- Sample query: Sales with customer and product details
SELECT 
    s."Id" AS "SaleId",
    c."Name" AS "CustomerName",
    p."Name" AS "ProductName",
    s."Quantity",
    s."Amount",
    s."SaleDate",
    u."Username" AS "CreatedBy"
FROM "Sales" s
INNER JOIN "Customers" c ON s."CustomerId" = c."Id"
INNER JOIN "Products" p ON s."ProductId" = p."Id"
INNER JOIN "Users" u ON s."CreatedBy" = u."Id"
ORDER BY s."SaleDate" DESC
LIMIT 10;

-- Sample query: Multi-item transactions
SELECT 
    s."Id" AS "TransactionId",
    c."Name" AS "CustomerName",
    COUNT(sti."Id") AS "ItemCount",
    SUM(sti."SubTotal") AS "TotalAmount"
FROM "Sales" s
INNER JOIN "Customers" c ON s."CustomerId" = c."Id"
LEFT JOIN "SalesTransactionItems" sti ON s."Id" = sti."TransactionId"
GROUP BY s."Id", c."Name"
HAVING COUNT(sti."Id") > 0
ORDER BY "TotalAmount" DESC;

