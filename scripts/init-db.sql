-- Medical Devices Marketplace Database Initialization
-- This script sets up the initial database structure and configurations

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "pg_trgm"; -- For full-text search
CREATE EXTENSION IF NOT EXISTS "btree_gin"; -- For composite indexes

-- Set default configuration
ALTER DATABASE medical_devices_db SET timezone TO 'UTC';

-- Create schemas if needed
CREATE SCHEMA IF NOT EXISTS audit;
CREATE SCHEMA IF NOT EXISTS analytics;

-- Set search path
SET search_path TO public, audit, analytics;

-- Create audit trigger function
CREATE OR REPLACE FUNCTION audit.audit_trigger_function()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        INSERT INTO audit.audit_log (
            table_name,
            operation,
            user_id,
            new_data,
            created_at
        ) VALUES (
            TG_TABLE_NAME,
            TG_OP,
            current_setting('app.current_user_id', true)::TEXT,
            row_to_json(NEW),
            NOW()
        );
        RETURN NEW;
    ELSIF TG_OP = 'UPDATE' THEN
        INSERT INTO audit.audit_log (
            table_name,
            operation,
            user_id,
            old_data,
            new_data,
            created_at
        ) VALUES (
            TG_TABLE_NAME,
            TG_OP,
            current_setting('app.current_user_id', true)::TEXT,
            row_to_json(OLD),
            row_to_json(NEW),
            NOW()
        );
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        INSERT INTO audit.audit_log (
            table_name,
            operation,
            user_id,
            old_data,
            created_at
        ) VALUES (
            TG_TABLE_NAME,
            TG_OP,
            current_setting('app.current_user_id', true)::TEXT,
            row_to_json(OLD),
            NOW()
        );
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create audit log table
CREATE TABLE IF NOT EXISTS audit.audit_log (
    id SERIAL PRIMARY KEY,
    table_name VARCHAR(50) NOT NULL,
    operation VARCHAR(10) NOT NULL,
    user_id TEXT,
    old_data JSONB,
    new_data JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for audit log
CREATE INDEX idx_audit_log_table_name ON audit.audit_log(table_name);
CREATE INDEX idx_audit_log_operation ON audit.audit_log(operation);
CREATE INDEX idx_audit_log_user_id ON audit.audit_log(user_id);
CREATE INDEX idx_audit_log_created_at ON audit.audit_log(created_at);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW."updatedAt" = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to generate order numbers
CREATE OR REPLACE FUNCTION generate_order_number()
RETURNS TEXT AS $$
DECLARE
    current_year TEXT;
    current_month TEXT;
    sequence_number INT;
    order_number TEXT;
BEGIN
    current_year := TO_CHAR(NOW(), 'YYYY');
    current_month := TO_CHAR(NOW(), 'MM');
    
    -- Get the next sequence number for this month
    SELECT COUNT(*) + 1 INTO sequence_number
    FROM "Order"
    WHERE DATE_TRUNC('month', "createdAt") = DATE_TRUNC('month', NOW());
    
    -- Format: ORD-YYYY-MM-XXXXX
    order_number := 'ORD-' || current_year || '-' || current_month || '-' || LPAD(sequence_number::TEXT, 5, '0');
    
    RETURN order_number;
END;
$$ LANGUAGE plpgsql;

-- Function to calculate product rating
CREATE OR REPLACE FUNCTION calculate_product_rating(product_id TEXT)
RETURNS NUMERIC AS $$
DECLARE
    avg_rating NUMERIC;
BEGIN
    SELECT AVG(rating)::NUMERIC(3,2) INTO avg_rating
    FROM "ProductReview"
    WHERE "productId" = product_id;
    
    RETURN COALESCE(avg_rating, 0);
END;
$$ LANGUAGE plpgsql;

-- Function to update product rating after review
CREATE OR REPLACE FUNCTION update_product_rating()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE "Product"
    SET rating = calculate_product_rating(NEW."productId")
    WHERE id = NEW."productId";
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create materialized view for product search
CREATE MATERIALIZED VIEW IF NOT EXISTS product_search_view AS
SELECT 
    p.id,
    p.name,
    p."nameAr",
    p.description,
    p."descriptionAr",
    p.sku,
    p.category,
    p.price,
    p.rating,
    p.status,
    p."supplierId",
    s."companyName" as supplier_name,
    to_tsvector('english', 
        COALESCE(p.name, '') || ' ' || 
        COALESCE(p.description, '') || ' ' || 
        COALESCE(p.sku, '') || ' ' ||
        COALESCE(p.category::TEXT, '')
    ) as search_vector,
    to_tsvector('arabic', 
        COALESCE(p."nameAr", '') || ' ' || 
        COALESCE(p."descriptionAr", '')
    ) as search_vector_ar
FROM "Product" p
LEFT JOIN "EquipmentSupplier" s ON p."supplierId" = s.id
WHERE p.status = 'ACTIVE' AND p."isPublished" = true;

-- Create indexes for search
CREATE INDEX idx_product_search_vector ON product_search_view USING gin(search_vector);
CREATE INDEX idx_product_search_vector_ar ON product_search_view USING gin(search_vector_ar);
CREATE INDEX idx_product_search_category ON product_search_view(category);
CREATE INDEX idx_product_search_price ON product_search_view(price);
CREATE INDEX idx_product_search_rating ON product_search_view(rating);

-- Function to refresh search view
CREATE OR REPLACE FUNCTION refresh_product_search_view()
RETURNS void AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY product_search_view;
END;
$$ LANGUAGE plpgsql;

-- Analytics views
CREATE OR REPLACE VIEW analytics.daily_sales AS
SELECT 
    DATE("createdAt") as date,
    COUNT(*) as order_count,
    SUM(total) as total_revenue,
    AVG(total) as average_order_value
FROM "Order"
WHERE status NOT IN ('CANCELLED', 'REFUNDED')
GROUP BY DATE("createdAt");

CREATE OR REPLACE VIEW analytics.product_performance AS
SELECT 
    p.id,
    p.name,
    p.category,
    COUNT(DISTINCT oi."orderId") as order_count,
    SUM(oi.quantity) as units_sold,
    SUM(oi.total) as revenue,
    p.rating,
    p.views
FROM "Product" p
LEFT JOIN "OrderItem" oi ON p.id = oi."productId"
GROUP BY p.id, p.name, p.category, p.rating, p.views;

CREATE OR REPLACE VIEW analytics.customer_lifetime_value AS
SELECT 
    u.id,
    u.email,
    u."userType",
    COUNT(DISTINCT o.id) as total_orders,
    SUM(o.total) as lifetime_value,
    AVG(o.total) as average_order_value,
    MAX(o."createdAt") as last_order_date
FROM "User" u
LEFT JOIN "Order" o ON u.id = o."userId"
WHERE o.status = 'DELIVERED'
GROUP BY u.id, u.email, u."userType";

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_email ON "User"(email);
CREATE INDEX IF NOT EXISTS idx_user_type ON "User"("userType");
CREATE INDEX IF NOT EXISTS idx_user_status ON "User"(status);

CREATE INDEX IF NOT EXISTS idx_product_supplier ON "Product"("supplierId");
CREATE INDEX IF NOT EXISTS idx_product_category ON "Product"(category);
CREATE INDEX IF NOT EXISTS idx_product_status ON "Product"(status);
CREATE INDEX IF NOT EXISTS idx_product_sku ON "Product"(sku);

CREATE INDEX IF NOT EXISTS idx_order_user ON "Order"("userId");
CREATE INDEX IF NOT EXISTS idx_order_number ON "Order"("orderNumber");
CREATE INDEX IF NOT EXISTS idx_order_status ON "Order"(status);
CREATE INDEX IF NOT EXISTS idx_order_created ON "Order"("createdAt");

CREATE INDEX IF NOT EXISTS idx_review_product ON "ProductReview"("productId");
CREATE INDEX IF NOT EXISTS idx_review_user ON "ProductReview"("userId");
CREATE INDEX IF NOT EXISTS idx_review_rating ON "ProductReview"(rating);

-- Grant permissions
GRANT USAGE ON SCHEMA audit TO medical_admin;
GRANT USAGE ON SCHEMA analytics TO medical_admin;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO medical_admin;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA audit TO medical_admin;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA analytics TO medical_admin;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO medical_admin;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA audit TO medical_admin;

-- Initial configuration data
INSERT INTO public."SystemSetting" (id, key, value, type, description, "createdAt", "updatedAt")
VALUES 
    (gen_random_uuid(), 'maintenance_mode', '"false"', 'BOOLEAN', 'Site maintenance mode', NOW(), NOW()),
    (gen_random_uuid(), 'max_upload_size', '10485760', 'NUMBER', 'Maximum file upload size in bytes (10MB)', NOW(), NOW()),
    (gen_random_uuid(), 'session_timeout', '3600', 'NUMBER', 'Session timeout in seconds (1 hour)', NOW(), NOW())
ON CONFLICT (key) DO NOTHING;

-- Success message
DO $$
BEGIN
    RAISE NOTICE 'Database initialization completed successfully!';
END $$;