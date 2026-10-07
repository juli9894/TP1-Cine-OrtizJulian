-- Cambio de nombres de productos y combos para que sean más claros para el usuario final.
update productos set nombre = 'Bebida Grande' where nombre = 'Gaseosa grande';
update productos set nombre = 'Bebida Pequeña' where nombre = 'Gaseosa chica linea coca';
update productos set nombre = 'Pochoclo Grande' where nombre = 'Pochoclo grande';
update productos set nombre = 'Pochoclo Pequeño' where nombre = 'Pochoclo chico';
update productos set nombre = 'Nachos con Queso' where nombre = 'Nachos';

update combos
    set nombre = 'Combo Familia', descripcion = '2 Pochoclos XL + 4 Bebidas Peq'
    where nombre = 'Combo Clásico Editado';
update combos
    set nombre = 'Combo Recargado', descripcion = '1 Pochoclo XL + 2 Bebidas Peq'
    where nombre = 'Combo Duo Editado';
