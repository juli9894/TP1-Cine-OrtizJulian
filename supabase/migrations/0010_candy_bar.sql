-- Catalogo de candy bar y combos (Sprint: candy bar).
create table productos (
    id serial primary key,
    nombre text not null,
    categoria text not null,
    precio numeric not null,
    activo boolean not null default true
);

create table combos (
    id serial primary key,
    nombre text not null,
    descripcion text not null,
    precio numeric not null,
    activo boolean not null default true
);

create table reserva_productos (
    id serial primary key,
    reserva_id integer not null references reservas(id) on delete cascade,
    producto_id integer not null references productos(id),
    cantidad integer not null default 1
);

create table reserva_combos (
    id serial primary key,
    reserva_id integer not null references reservas(id) on delete cascade,
    combo_id integer not null references combos(id),
    cantidad integer not null default 1
);

insert into productos (nombre, categoria, precio) values
    ('Pochoclo chico', 'Pochoclos', 2500),
    ('Pochoclo grande', 'Pochoclos', 3500),
    ('Gaseosa chica', 'Bebidas', 2000),
    ('Gaseosa grande', 'Bebidas', 2800),
    ('Nachos', 'Snacks', 3000);

insert into combos (nombre, descripcion, precio) values
    ('Combo Clásico', 'Pochoclo grande + gaseosa grande', 5500),
    ('Combo Duo', '2 gaseosas chicas + nachos', 6000);