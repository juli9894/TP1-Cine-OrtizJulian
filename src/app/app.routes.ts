import { Routes } from '@angular/router';
import { Registro } from './features/auth/registro/registro';
import { Login } from './features/auth/login/login';
import { Home } from './features/home/home';
import { PeliculaDetalle } from './features/pelicula-detalle/pelicula-detalle';
import { soloInvitadoGuard } from './core/guards/solo-invitado-guard';

export const routes: Routes = [
    { path: 'registro', component: Registro, canActivate: [soloInvitadoGuard] },
    { path: 'login', component: Login, canActivate: [soloInvitadoGuard] },
    { path: 'peliculas/:id', component: PeliculaDetalle },  
    { path: '', component: Home },
];