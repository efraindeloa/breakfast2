-- Renombrar columna a "notice" (avisos genéricos, no solo alérgenos)
ALTER TABLE products
RENAME COLUMN allergen_notice TO notice;

COMMENT ON COLUMN products.notice IS 'Aviso opcional por producto. Se muestra en el detalle del producto al comensal.';
