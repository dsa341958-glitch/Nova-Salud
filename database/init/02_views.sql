USE botica_nova_salud;

CREATE OR REPLACE VIEW v_stock_producto AS
SELECT p.id AS producto_id, p.nombre, p.stock_minimo,
       COALESCE(SUM(l.stock_actual), 0) AS stock_total
FROM productos p
LEFT JOIN lotes l ON l.producto_id = p.id
                 AND l.activo = 1
                 AND l.fecha_vencimiento > CURDATE()
WHERE p.activo = 1
GROUP BY p.id, p.nombre, p.stock_minimo;


CREATE OR REPLACE VIEW v_productos_bajo_stock AS
SELECT * FROM v_stock_producto WHERE stock_total <= stock_minimo;


CREATE OR REPLACE VIEW v_lotes_por_vencer AS
SELECT l.id AS lote_id, p.nombre, l.codigo_lote, l.fecha_vencimiento, l.stock_actual,
       DATEDIFF(l.fecha_vencimiento, CURDATE()) AS dias_restantes
FROM lotes l JOIN productos p ON p.id = l.producto_id
WHERE l.activo = 1 AND l.stock_actual > 0
  AND l.fecha_vencimiento <= DATE_ADD(CURDATE(), INTERVAL 60 DAY);