import { Routes } from '@angular/router';
import { Registro } from './features/auth/registro/registro';
import { Login } from './features/auth/login/login';
import { soloInvitadoGuard } from './core/guards/solo-invitado-guard';

export const routes: Routes = [
    { path: 'registro', component: Registro, canActivate: [soloInvitadoGuard] },
    { path: 'login', component: Login, canActivate: [soloInvitadoGuard] },
];