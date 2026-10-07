-- Catalogo de canje de puntos (valores configurables) + historial de
-- canjes. El canje acredita el valor equivalente como saldo_credito --

create table catalogo_puntos (
    id serial primary key,
    descripcion text not null,
    puntos_requeridos integer not null,
    valor_credito numeric not null,
    activo boolean not null default true
);

insert into catalogo_puntos (descripcion, puntos_requeridos, valor_credito) values
    ('Entrada gratis (canje por credito)', 4000, 4000),
    ('Combo de candy gratis (canje por credito)', 2500, 2500);

create table historial_canjes (
    id serial primary key,
    usuario_id uuid not null references perfiles(id) on delete cascade,
    catalogo_id integer not null references catalogo_puntos(id),
    puntos_gastados integer not null,
    credito_otorgado numeric not null,
    created_at timestamptz not null default now()
);

create or replace function canjear_puntos(p_usuario_id uuid, p_catalogo_id integer)
returns void as $$
declare
    v_puntos_requeridos integer;
    v_valor_credito numeric;
    v_activo boolean;
    v_saldo_actual integer;
begin
    select puntos_requeridos, valor_credito, activo
    into v_puntos_requeridos, v_valor_credito, v_activo
    from catalogo_puntos
    where id = p_catalogo_id;

    if v_puntos_requeridos is null or not v_activo then
        raise exception 'Este canje no esta disponible';
    end if;

    select saldo_puntos into v_saldo_actual from perfiles where id = p_usuario_id;

    if v_saldo_actual is null or v_saldo_actual < v_puntos_requeridos then
        raise exception 'No tenes puntos suficientes para este canje';
    end if;

    update perfiles
    set saldo_puntos = saldo_puntos - v_puntos_requeridos,
        saldo_credito = saldo_credito + v_valor_credito
    where id = p_usuario_id;

    insert into historial_canjes (usuario_id, catalogo_id, puntos_gastados, credito_otorgado)
    values (p_usuario_id, p_catalogo_id, v_puntos_requeridos, v_valor_credito);
end;
$$ language plpgsql;
