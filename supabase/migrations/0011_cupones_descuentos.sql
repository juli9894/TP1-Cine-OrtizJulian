-- Cupones de descuento automaticos
-- Se agrega el tipo 'mayor50' y se siembran los valores iniciales de porcentaje, editables
-- a futuro desde un CRUD de admin (todavia no construido).
insert into cupones (tipo, porcentaje_descuento, activo) values
    ('bienvenida', 15, true),
    ('mayor50', 20, true);