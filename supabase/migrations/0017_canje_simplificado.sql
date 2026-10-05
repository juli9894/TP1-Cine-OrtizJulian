-- El canje de puntos ya no es por un catalogo
-- de recompensas con costos distintos (entrada/candy) -- las dos opciones que
-- habia entregaban exactamente lo mismo (credito interno) a la misma tasa
-- 1 punto = $1, asi que tener un catalogo con varios items era redundante. Un
-- solo boton "Canjear puntos por credito" que canjea TODO el saldo acumulado de
-- una vez cubre lo mismo con mucho menos superficie de codigo.

-- La tasa de conversion se guarda en una tabla de una sola fila (en vez de un
-- numero fijo en el codigo), para que siga siendo "configurable" como pide el
-- enunciado, sin necesitar un catalogo completo de items.
create table configuracion_puntos (
    id integer primary key default 1,
    valor_por_punto numeric not null default 1,
    constraint una_sola_fila check (id = 1)
);

insert into configuracion_puntos (id, valor_por_punto) values (1, 1);

-- catalogo_id ya no tiene sentido sin el catalogo -- se borra la columna antes
-- de borrar la tabla que referenciaba (si no, la foreign key lo impide).
alter table historial_canjes drop column if exists catalogo_id;
drop table if exists catalogo_puntos;

-- La firma vieja (con p_catalogo_id) se reemplaza por una sola uuid -- como
-- cambia la cantidad de parametros, hay que borrar la version anterior a mano
-- (un "create or replace" con otra firma crea una funcion nueva en vez de
-- reemplazar la vieja, y quedarian las dos).
drop function if exists canjear_puntos(uuid, integer);

-- Canjea TODO el saldo de puntos acumulado por credito interno, a la tasa
-- configurada en configuracion_puntos. Atomico por el mismo motivo que el resto
-- de las funciones de saldo (sumar_puntos, cancelar_reserva, aplicar_credito):
-- leer y escribir el saldo en un solo paso evita que dos pedidos de canje casi
-- simultaneos de la misma cuenta se pisen.
create or replace function canjear_puntos(p_usuario_id uuid)
returns void as $$
declare
    v_saldo_puntos integer;
    v_valor_por_punto numeric;
    v_credito numeric;
begin
    select saldo_puntos into v_saldo_puntos from perfiles where id = p_usuario_id;

    if v_saldo_puntos is null or v_saldo_puntos <= 0 then
        raise exception 'No tenes puntos para canjear';
    end if;

    select valor_por_punto into v_valor_por_punto from configuracion_puntos where id = 1;
    v_credito := v_saldo_puntos * v_valor_por_punto;

    update perfiles
    set saldo_puntos = 0,
        saldo_credito = saldo_credito + v_credito
    where id = p_usuario_id;

    insert into historial_canjes (usuario_id, puntos_gastados, credito_otorgado)
    values (p_usuario_id, v_saldo_puntos, v_credito);
end;
$$ language plpgsql;
