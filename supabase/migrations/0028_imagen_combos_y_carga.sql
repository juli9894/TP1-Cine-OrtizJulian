-- Imagen (opcional) para cada combo.
alter table combos add column if not exists imagen_url text;

-- Carga de las imagenes de public/candy/
update productos set imagen_url = '/candy/Pochoclo-grande.png' where nombre = 'Pochoclo grande';
update productos set imagen_url = '/candy/Pochoclo-chico.png' where nombre = 'Pochoclo chico';
update productos set imagen_url = '/candy/Gaseosa-grande.png' where nombre = 'Gaseosa grande';
update productos set imagen_url = '/candy/Gaseosa-chica.png' where nombre = 'Gaseosa chica linea coca';
update productos set imagen_url = '/candy/Nachos-con-queso.png' where nombre = 'Nachos';
update combos set imagen_url = '/candy/Combo-familia.png' where nombre = 'Combo Clásico Editado';
update combos set imagen_url = '/candy/Combo-mega-recargado.png' where nombre = 'Combo Duo Editado';
