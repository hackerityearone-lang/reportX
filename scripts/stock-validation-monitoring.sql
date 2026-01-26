-- Stock Consistency Validation and Monitoring
-- This script provides comprehensive validation and monitoring tools

-- Function 1: Comprehensive stock validation
CREATE OR REPLACE FUNCTION comprehensive_stock_validation()
RETURNS TABLE(
    product_id UUID,
    product_name TEXT,
    brand TEXT,
    quantity INTEGER,
    boxes_in_stock INTEGER,
    remaining_pieces INTEGER,
    pieces_per_box INTEGER,
    calculated_total_pieces INTEGER,
    is_quantity_negative BOOLEAN,
    is_remaining_pieces_valid BOOLEAN,
    is_stock_consistent BOOLEAN,
    validation_status TEXT,
    recommended_action TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.id,
        p.name,
        p.brand,
        p.quantity,
        p.boxes_in_stock,
        COALESCE(p.remaining_pieces, 0) as remaining_pieces,
        COALESCE(p.pieces_per_box, 1) as pieces_per_box,
        (p.boxes_in_stock * COALESCE(p.pieces_per_box, 1)) + COALESCE(p.remaining_pieces, 0) as calculated_total_pieces,
        (p.quantity < 0) as is_quantity_negative,
        (COALESCE(p.remaining_pieces, 0) < COALESCE(p.pieces_per_box, 1)) as is_remaining_pieces_valid,
        (p.quantity = (p.boxes_in_stock * COALESCE(p.pieces_per_box, 1)) + COALESCE(p.remaining_pieces, 0)) as is_stock_consistent,
        CASE 
            WHEN p.quantity < 0 THEN 'CRITICAL - NEGATIVE STOCK'
            WHEN p.quantity != (p.boxes_in_stock * COALESCE(p.pieces_per_box, 1)) + COALESCE(p.remaining_pieces, 0) THEN 'ERROR - INCONSISTENT'
            WHEN COALESCE(p.remaining_pieces, 0) >= COALESCE(p.pieces_per_box, 1) THEN 'WARNING - INVALID REMAINING PIECES'
            ELSE 'OK'
        END as validation_status,
        CASE 
            WHEN p.quantity < 0 THEN 'Recalculate from transaction history or set to 0'
            WHEN p.quantity != (p.boxes_in_stock * COALESCE(p.pieces_per_box, 1)) + COALESCE(p.remaining_pieces, 0) THEN 'Synchronize derived fields with quantity'
            WHEN COALESCE(p.remaining_pieces, 0) >= COALESCE(p.pieces_per_box, 1) THEN 'Convert excess pieces to boxes'
            ELSE 'No action needed'
        END as recommended_action
    FROM products p
    WHERE p.is_archived = FALSE OR p.is_archived IS NULL;
END;
$$ LANGUAGE plpgsql;

-- Function 2: Auto-fix stock inconsistencies
CREATE OR REPLACE FUNCTION auto_fix_stock_inconsistencies()
RETURNS TABLE(
    product_id UUID,
    product_name TEXT,
    old_quantity INTEGER,
    new_quantity INTEGER,
    old_boxes INTEGER,
    new_boxes INTEGER,
    old_remaining INTEGER,
    new_remaining INTEGER,
    fix_applied TEXT
) AS $$
DECLARE
    product_record RECORD;
    new_boxes INTEGER;
    new_remaining INTEGER;
BEGIN
    FOR product_record IN 
        SELECT * FROM comprehensive_stock_validation() 
        WHERE validation_status != 'OK'
    LOOP
        -- Calculate correct values
        IF product_record.is_quantity_negative THEN
            -- Set to 0 if negative (could be enhanced to recalculate from transactions)
            UPDATE products 
            SET quantity = 0, boxes_in_stock = 0, remaining_pieces = 0, updated_at = NOW()
            WHERE id = product_record.product_id;
            
            RETURN QUERY SELECT 
                product_record.product_id,
                product_record.product_name,
                product_record.quantity,
                0,
                product_record.boxes_in_stock,
                0,
                product_record.remaining_pieces,
                0,
                'Reset negative stock to zero'::TEXT;
                
        ELSIF NOT product_record.is_stock_consistent THEN
            -- Use quantity as source of truth, recalculate derived fields
            new_boxes := FLOOR(product_record.quantity / product_record.pieces_per_box);
            new_remaining := product_record.quantity % product_record.pieces_per_box;
            
            UPDATE products 
            SET boxes_in_stock = new_boxes, remaining_pieces = new_remaining, updated_at = NOW()
            WHERE id = product_record.product_id;
            
            RETURN QUERY SELECT 
                product_record.product_id,
                product_record.product_name,
                product_record.quantity,
                product_record.quantity,
                product_record.boxes_in_stock,
                new_boxes,
                product_record.remaining_pieces,
                new_remaining,
                'Synchronized derived fields with quantity'::TEXT;
                
        ELSIF NOT product_record.is_remaining_pieces_valid THEN
            -- Convert excess remaining pieces to boxes
            new_boxes := product_record.boxes_in_stock + FLOOR(product_record.remaining_pieces / product_record.pieces_per_box);
            new_remaining := product_record.remaining_pieces % product_record.pieces_per_box;
            
            UPDATE products 
            SET boxes_in_stock = new_boxes, remaining_pieces = new_remaining, updated_at = NOW()
            WHERE id = product_record.product_id;
            
            RETURN QUERY SELECT 
                product_record.product_id,
                product_record.product_name,
                product_record.quantity,
                product_record.quantity,
                product_record.boxes_in_stock,
                new_boxes,
                product_record.remaining_pieces,
                new_remaining,
                'Converted excess pieces to boxes'::TEXT;
        END IF;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Function 3: Stock audit report
CREATE OR REPLACE FUNCTION generate_stock_audit_report()
RETURNS TABLE(
    audit_date TIMESTAMP,
    total_products BIGINT,
    products_with_issues BIGINT,
    negative_stock_count BIGINT,
    inconsistent_stock_count BIGINT,
    invalid_remaining_pieces_count BIGINT,
    total_stock_value DECIMAL,
    issues_summary TEXT
) AS $$
DECLARE
    validation_results RECORD;
BEGIN
    SELECT 
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE validation_status != 'OK') as with_issues,
        COUNT(*) FILTER (WHERE is_quantity_negative) as negative,
        COUNT(*) FILTER (WHERE NOT is_stock_consistent) as inconsistent,
        COUNT(*) FILTER (WHERE NOT is_remaining_pieces_valid) as invalid_remaining
    INTO validation_results
    FROM comprehensive_stock_validation();
    
    RETURN QUERY SELECT 
        NOW() as audit_date,
        validation_results.total,
        validation_results.with_issues,
        validation_results.negative,
        validation_results.inconsistent,
        validation_results.invalid_remaining,
        COALESCE(SUM(p.quantity * p.buy_price_per_piece), 0) as total_stock_value,
        CASE 
            WHEN validation_results.with_issues = 0 THEN 'All products have consistent stock values'
            ELSE format('%s products need attention: %s negative, %s inconsistent, %s invalid remaining pieces',
                validation_results.with_issues,
                validation_results.negative,
                validation_results.inconsistent,
                validation_results.invalid_remaining)
        END as issues_summary
    FROM products p
    WHERE p.is_archived = FALSE OR p.is_archived IS NULL;
END;
$$ LANGUAGE plpgsql;

-- Function 4: Transaction-based stock recalculation
CREATE OR REPLACE FUNCTION recalculate_stock_from_transactions(p_product_id UUID DEFAULT NULL)
RETURNS TABLE(
    product_id UUID,
    product_name TEXT,
    old_quantity INTEGER,
    calculated_quantity INTEGER,
    difference INTEGER,
    recalculation_applied BOOLEAN
) AS $$
DECLARE
    product_record RECORD;
    calculated_stock INTEGER;
BEGIN
    FOR product_record IN 
        SELECT p.id, p.name, p.quantity, p.pieces_per_box
        FROM products p
        WHERE (p_product_id IS NULL OR p.id = p_product_id)
          AND (p.is_archived = FALSE OR p.is_archived IS NULL)
    LOOP
        -- Calculate stock from transaction history
        SELECT COALESCE(
            SUM(
                CASE 
                    WHEN st.type = 'IN' THEN 
                        CASE 
                            WHEN st.unit_sold = 'box' THEN st.quantity * product_record.pieces_per_box
                            ELSE st.quantity 
                        END
                    WHEN st.type = 'OUT' THEN 
                        -CASE 
                            WHEN st.unit_sold = 'box' THEN st.quantity * product_record.pieces_per_box
                            ELSE st.quantity 
                        END
                    ELSE 0
                END
            ), 0
        ) INTO calculated_stock
        FROM stock_transactions st
        WHERE st.product_id = product_record.id
          AND st.is_cancelled = FALSE 
          AND COALESCE(st.is_deleted, FALSE) = FALSE;
        
        -- Apply recalculation if there's a difference
        IF calculated_stock != product_record.quantity THEN
            UPDATE products 
            SET quantity = GREATEST(0, calculated_stock),
                updated_at = NOW()
            WHERE id = product_record.id;
            
            RETURN QUERY SELECT 
                product_record.id,
                product_record.name,
                product_record.quantity,
                GREATEST(0, calculated_stock),
                calculated_stock - product_record.quantity,
                TRUE;
        ELSE
            RETURN QUERY SELECT 
                product_record.id,
                product_record.name,
                product_record.quantity,
                calculated_stock,
                0,
                FALSE;
        END IF;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Grant permissions
GRANT EXECUTE ON FUNCTION comprehensive_stock_validation TO authenticated;
GRANT EXECUTE ON FUNCTION auto_fix_stock_inconsistencies TO authenticated;
GRANT EXECUTE ON FUNCTION generate_stock_audit_report TO authenticated;
GRANT EXECUTE ON FUNCTION recalculate_stock_from_transactions TO authenticated;

-- Create a view for easy monitoring
CREATE OR REPLACE VIEW stock_health_dashboard AS
SELECT 
    'Stock Health Summary' as metric_type,
    COUNT(*) as total_products,
    COUNT(*) FILTER (WHERE validation_status = 'OK') as healthy_products,
    COUNT(*) FILTER (WHERE validation_status LIKE 'CRITICAL%') as critical_issues,
    COUNT(*) FILTER (WHERE validation_status LIKE 'ERROR%') as error_issues,
    COUNT(*) FILTER (WHERE validation_status LIKE 'WARNING%') as warning_issues,
    ROUND(
        (COUNT(*) FILTER (WHERE validation_status = 'OK')::DECIMAL / COUNT(*)) * 100, 2
    ) as health_percentage
FROM comprehensive_stock_validation();

-- Usage examples and documentation
/*
-- Check all products for stock consistency issues:
SELECT * FROM comprehensive_stock_validation() WHERE validation_status != 'OK';

-- Auto-fix all stock inconsistencies:
SELECT * FROM auto_fix_stock_inconsistencies();

-- Generate audit report:
SELECT * FROM generate_stock_audit_report();

-- Recalculate stock from transactions for all products:
SELECT * FROM recalculate_stock_from_transactions();

-- Recalculate stock for specific product:
SELECT * FROM recalculate_stock_from_transactions('9f8e1b2d-71f7-4d8f-bb5d-cd674c104a5b');

-- Monitor stock health:
SELECT * FROM stock_health_dashboard;

-- Find products that need immediate attention:
SELECT product_name, validation_status, recommended_action 
FROM comprehensive_stock_validation() 
WHERE validation_status LIKE 'CRITICAL%' OR validation_status LIKE 'ERROR%';
*/