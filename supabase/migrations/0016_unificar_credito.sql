update perfiles set saldo_credito = saldo_credito + saldo_canje;

alter table perfiles drop column if exists saldo_canje;

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

-- aplicar_credito vuelve a una sola columna, sin el reparto credito/canje.
create or replace function aplicar_credito(p_usuario_id uuid, p_monto numeric)
returns void as $$
declare
    v_saldo_credito numeric;
begin
    if p_monto <= 0 then
        return;
    end if;

    select saldo_credito into v_saldo_credito from perfiles where id = p_usuario_id;

    if v_saldo_credito is null then
        raise exception 'Perfil no encontrado';
    end if;

    if v_saldo_credito < p_monto then
        raise exception 'No tenes credito suficiente';
    end if;

    update perfiles set saldo_credito = saldo_credito - p_monto where id = p_usuario_id;
end;
$$ language plpgsql;
