import { Routes } from '@angular/router';
import { Registro } from './features/auth/registro/registro';
import { Login } from './features/auth/login/login';
import { Home } from './features/home/home';
import { PeliculaDetalle } from './features/pelicula-detalle/pelicula-detalle';
import { soloInvitadoGuard } from './core/guards/solo-invitado-guard';
import { SeleccionButacas } from './features/butacas/seleccion-butacas/seleccion-butacas';
import { FormularioFuncion } from './features/admin/formulario-funcion/formulario-funcion';
import { adminGuard } from './core/guards/admin-guard';
import { FormularioSala } from './features/admin/formulario-sala/formulario-sala';
import { ListaSalas } from './features/admin/lista-salas/lista-salas';
import { ListaFunciones } from './features/admin/lista-funciones/lista-funciones';
import { FormularioPelicula } from './features/admin/formulario-pelicula/formulario-pelicula';
import { ListaPeliculas } from './features/admin/lista-peliculas/lista-peliculas';
import { PreciosButacas } from './features/admin/precios-butacas/precios-butacas';
import { ListaProductos } from './features/admin/lista-productos/lista-productos';
import { FormularioProducto } from './features/admin/formulario-producto/formulario-producto';
import { ListaCombos } from './features/admin/lista-combos/lista-combos';
import { FormularioCombo } from './features/admin/formulario-combo/formulario-combo';
import { MisReservas } from './features/mis-reservas/mis-reservas';
import { PerfilUsuario } from './features/perfil-usuario/perfil-usuario';
import { AdminMenu } from './features/admin/admin-menu/admin-menu';

export const routes: Routes = [
    { path: 'registro', component: Registro, canActivate: [soloInvitadoGuard] },
    { path: 'login', component: Login, canActivate: [soloInvitadoGuard] },
    { path: 'peliculas/:id', component: PeliculaDetalle },
    { path: 'funciones/:id/butacas', component: SeleccionButacas },
    { path: 'admin', component: AdminMenu, canMatch: [adminGuard] },
    { path: 'admin/precios-butacas', component: PreciosButacas, canMatch: [adminGuard] },
    { path: 'admin/funciones/nueva', component: FormularioFuncion, canMatch: [adminGuard] },
    { path: 'admin/funciones/:id/editar', component: FormularioFuncion, canMatch: [adminGuard] },
    { path: 'admin/funciones', component: ListaFunciones, canMatch: [adminGuard] },
    { path: 'admin/salas/nueva', component: FormularioSala, canMatch: [adminGuard] },
    { path: 'admin/salas/:id/editar', component: FormularioSala, canMatch: [adminGuard] },
    { path: 'admin/salas', component: ListaSalas, canMatch: [adminGuard] },
    { path: 'admin/peliculas/nueva', component: FormularioPelicula, canMatch: [adminGuard] },
    { path: 'admin/peliculas/:id/editar', component: FormularioPelicula, canMatch: [adminGuard] },
    { path: 'admin/peliculas', component: ListaPeliculas, canMatch: [adminGuard] },
    { path: 'admin/productos/nuevo', component: FormularioProducto, canMatch: [adminGuard] },
    { path: 'admin/productos/:id/editar', component: FormularioProducto, canMatch: [adminGuard] },
    { path: 'admin/productos', component: ListaProductos, canMatch: [adminGuard] },
    { path: 'admin/combos/nuevo', component: FormularioCombo, canMatch: [adminGuard] },
    { path: 'admin/combos/:id/editar', component: FormularioCombo, canMatch: [adminGuard] },
    { path: 'admin/combos', component: ListaCombos, canMatch: [adminGuard] },
    { path: 'perfil', component: PerfilUsuario },
    { path: 'mis-reservas', component: MisReservas },
    { path: '', component: Home, pathMatch: 'full' },
];