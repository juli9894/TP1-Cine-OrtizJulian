-- Permite que una reserva exista sin estar atada a una función: hace falta
-- para comprar candy bar de forma independiente, sin elegir película/función.
alter table reservas alter column funcion_id drop not null;
