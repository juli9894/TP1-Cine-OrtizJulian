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

export const routes: Routes = [
    { path: 'registro', component: Registro, canActivate: [soloInvitadoGuard] },
    { path: 'login', component: Login, canActivate: [soloInvitadoGuard] },
    { path: 'peliculas/:id', component: PeliculaDetalle },
    { path: 'funciones/:id/butacas', component: SeleccionButacas },
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
    { path: '', component: Home, pathMatch: 'full' },
];