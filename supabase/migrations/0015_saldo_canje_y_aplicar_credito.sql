-- Separa el saldo del canje de puntos del credito por cancelaciones, y agrega
-- la funcion que faltaba para poder gastar ese credito en una compra nueva.

alter table perfiles
    add column if not exists saldo_canje numeric not null default 0;

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
        saldo_canje = saldo_canje + v_valor_credito
    where id = p_usuario_id;

    insert into historial_canjes (usuario_id, catalogo_id, puntos_gastados, credito_otorgado)
    values (p_usuario_id, p_catalogo_id, v_puntos_requeridos, v_valor_credito);
end;
$$ language plpgsql;

-- Gastar el credito interno (por cancelacion y/o por canje de puntos) como
-- descuento en una compra nueva 
create or replace function aplicar_credito(p_usuario_id uuid, p_monto numeric)
returns void as $$
declare
    v_saldo_credito numeric;
    v_saldo_canje numeric;
    v_de_credito numeric;
    v_de_canje numeric;
begin
    if p_monto <= 0 then
        return;
    end if;

    select saldo_credito, saldo_canje into v_saldo_credito, v_saldo_canje
    from perfiles where id = p_usuario_id;

    if v_saldo_credito is null then
        raise exception 'Perfil no encontrado';
    end if;

    if (v_saldo_credito + v_saldo_canje) < p_monto then
        raise exception 'No tenes credito suficiente';
    end if;

    v_de_credito := least(v_saldo_credito, p_monto);
    v_de_canje := p_monto - v_de_credito;

    update perfiles
    set saldo_credito = saldo_credito - v_de_credito,
        saldo_canje = saldo_canje - v_de_canje
    where id = p_usuario_id;
end;
$$ language plpgsql;
