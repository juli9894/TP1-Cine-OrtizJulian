-- Recargo adicional por formato de funcion
-- El formato es un atributo de la FUNCION, no de la sala -- una sala no
-- tiene un formato fijo, la misma sala puede tener una funcion en 2D hoy
-- y otra en 3D manana. El recargo se
-- modela aparte de precios_butaca, como un monto que se SUMA al precio
-- base de la butaca segun el formato de la funcion elegida.
create table recargos_formato (
    formato text primary key check (formato in ('2D', '3D', '4D', '5D')),
    recargo numeric not null
);

insert into recargos_formato (formato, recargo) values
    ('2D', 0),
    ('3D', 1500),
    ('4D', 3000),
    ('5D', 4500);