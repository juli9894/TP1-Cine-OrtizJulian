-- "Proximamente" + alertas + preventa.
-- Una pelicula ahora tiene fecha de estreno. Mientras falte mucho para esa
-- fecha, no se vende (aparece en "Proximamente"); en la ventana de preventa
-- (configurable por pelicula, dias_preventa) se vende a un precio especial
-- opcional (precio_preventa); despues del estreno, precio normal de siempre.
--
-- default current_date en fecha_estreno: las peliculas que ya existen quedan
-- "estrenadas hoy" -- es decir, siguen vendiendose normal, sin romper nada
-- de lo que ya esta cargado.
alter table peliculas
    add column if not exists fecha_estreno date not null default current_date,
    add column if not exists dias_preventa integer not null default 7,
    add column if not exists precio_preventa numeric null;

-- Alertas de "avisame cuando salga a la venta". Una fila por usuario+pelicula, con un flag para
-- saber si ya se le mostro el aviso una vez que la preventa abrio.
create table if not exists alertas_proximamente (
    id bigint generated always as identity primary key,
    usuario_id uuid not null references perfiles (id) on delete cascade,
    pelicula_id bigint not null references peliculas (id) on delete cascade,
    creada_at timestamptz not null default now(),
    notificada boolean not null default false,
    unique (usuario_id, pelicula_id)
);
