-- Precio por tipo de butaca (Sprint: compra de entradas).
-- Vive en una tabla propia -- no hardcodeado en el frontend -- porque es un
-- dato de negocio que puede cambiar sin tocar codigo (ej: el cine sube el
-- precio de las VIP), y el admin lo va a poder editar desde la app.

create table precios_butaca (
    tipo text primary key check (tipo in ('normal', 'accesible', 'vip')),
    precio numeric not null
);

insert into precios_butaca (tipo, precio) values
    ('normal', 4000),
    ('accesible', 4000),
    ('vip', 7000);