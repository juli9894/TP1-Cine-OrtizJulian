-- Log de auditoria: registro inmutable de acciones criticas (creacion de
-- funciones, cambio de precios, validacion de QR), con fecha/hora/usuario,
-- tal como pide el enunciado. No tiene update ni delete desde la app (solo
-- insert + select) -- "inmutable" se logra simplemente no exponiendo
-- ningun camino de edicion/borrado desde el cliente, mismo criterio liviano
-- que el resto del proyecto (sin RLS todavia, documentado como decision de
-- alcance en el resto de las migraciones).
create table if not exists log_auditoria (
    id bigint generated always as identity primary key,
    usuario_id uuid references auth.users(id),
    usuario_email text,
    accion text not null,
    detalle text,
    created_at timestamptz not null default now()
);

create index if not exists log_auditoria_created_at_idx on log_auditoria (created_at desc);
