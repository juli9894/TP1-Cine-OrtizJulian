-- Log de auditoria: registro inmutable de acciones criticas (creacion de
-- funciones, cambio de precios, validacion de QR), con fecha/hora/usuario.
-- No tiene update ni delete desde la app (solo
-- insert + select).
create table if not exists log_auditoria (
    id bigint generated always as identity primary key,
    usuario_id uuid references auth.users(id),
    usuario_email text,
    accion text not null,
    detalle text,
    created_at timestamptz not null default now()
);

create index if not exists log_auditoria_created_at_idx on log_auditoria (created_at desc);
