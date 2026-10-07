-- Julian redefinio los nombres "de cara al cliente" del candy bar y los
-- combos para que se lean mejor en el menu. Solo cambia nombre/descripcion,
-- no toca precio, categoria ni las imagenes ya cargadas en 0028.
update productos set nombre = 'Bebida Grande' where nombre = 'Gaseosa grande';
update productos set nombre = 'Bebida Pequeña' where nombre = 'Gaseosa chica linea coca';
update productos set nombre = 'Pochoclo Grande' where nombre = 'Pochoclo grande';
update productos set nombre = 'Pochoclo Pequeño' where nombre = 'Pochoclo chico';
update productos set nombre = 'Nachos con Queso' where nombre = 'Nachos';

-- "Combo Clasico Editado" ya tenia la imagen de familia (0028) y
-- "Combo Duo Editado" la de recargado -- coincide con lo que Julian pidio
-- para cada nombre nuevo, no hace falta tocar imagen_url de nuevo.
update combos
    set nombre = 'Combo Familia', descripcion = '2 Pochoclos XL + 4 Bebidas Peq'
    where nombre = 'Combo Clásico Editado';
update combos
    set nombre = 'Combo Recargado', descripcion = '1 Pochoclo XL + 2 Bebidas Peq'
    where nombre = 'Combo Duo Editado';
