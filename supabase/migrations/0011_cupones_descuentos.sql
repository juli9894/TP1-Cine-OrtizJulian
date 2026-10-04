-- Cupones de descuento automaticos (Sprint: descuentos de checkout).
-- La tabla 'cupones' ya existia desde el Mail 1 (migracion 0001), con 'tipo'
-- pensado para extenderse ('bienvenida' por ahora). Se agrega el tipo
-- 'mayor50' y se siembran los valores iniciales de porcentaje, editables
-- a futuro desde un CRUD de admin (todavia no construido, es tarea aparte).
insert into cupones (tipo, porcentaje_descuento, activo) values
    ('bienvenida', 15, true),
    ('mayor50', 20, true);