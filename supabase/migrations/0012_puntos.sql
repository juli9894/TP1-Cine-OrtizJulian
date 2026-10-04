alter table perfiles
    add column if not exists saldo_puntos integer not null default 0;

create or replace function sumar_puntos(p_usuario_id uuid, p_puntos integer)
returns void as $$
begin
    update perfiles
    set saldo_puntos = saldo_puntos + p_puntos
    where id = p_usuario_id;
end;
$$ language plpgsql;