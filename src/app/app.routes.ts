import { Routes } from '@angular/router';
import { soloInvitadoGuard } from './core/guards/solo-invitado-guard';
import { adminGuard } from './core/guards/admin-guard';
import { empleadoGuard } from './core/guards/empleado-guard';

export const routes: Routes = [
    {
        path: 'empleado',
        loadComponent: () =>
            import('./features/empleado/validar-entrada/validar-entrada').then((m) => m.ValidarEntrada),
        canMatch: [empleadoGuard],
    },
    {
        path: 'registro',
        loadComponent: () => import('./features/auth/registro/registro').then((m) => m.Registro),
        canActivate: [soloInvitadoGuard],
    },
    {
        path: 'login',
        loadComponent: () => import('./features/auth/login/login').then((m) => m.Login),
        canActivate: [soloInvitadoGuard],
    },
    {
        path: 'peliculas/:id',
        loadComponent: () => import('./features/pelicula-detalle/pelicula-detalle').then((m) => m.PeliculaDetalle),
    },
    {
        path: 'funciones/:id/butacas',
        loadComponent: () =>
            import('./features/butacas/seleccion-butacas/seleccion-butacas').then((m) => m.SeleccionButacas),
    },
    {
        path: 'admin',
        loadComponent: () => import('./features/admin/admin-menu/admin-menu').then((m) => m.AdminMenu),
        canMatch: [adminGuard],
    },
    {
        path: 'admin/precios-butacas',
        loadComponent: () => import('./features/admin/precios-butacas/precios-butacas').then((m) => m.PreciosButacas),
        canMatch: [adminGuard],
    },
    {
        path: 'admin/funciones/nueva',
        loadComponent: () =>
            import('./features/admin/formulario-funcion/formulario-funcion').then((m) => m.FormularioFuncion),
        canMatch: [adminGuard],
    },
    {
        path: 'admin/funciones/:id/editar',
        loadComponent: () =>
            import('./features/admin/formulario-funcion/formulario-funcion').then((m) => m.FormularioFuncion),
        canMatch: [adminGuard],
    },
    {
        path: 'admin/funciones',
        loadComponent: () => import('./features/admin/lista-funciones/lista-funciones').then((m) => m.ListaFunciones),
        canMatch: [adminGuard],
    },
    {
        path: 'admin/salas/nueva',
        loadComponent: () => import('./features/admin/formulario-sala/formulario-sala').then((m) => m.FormularioSala),
        canMatch: [adminGuard],
    },
    {
        path: 'admin/salas/:id/editar',
        loadComponent: () => import('./features/admin/formulario-sala/formulario-sala').then((m) => m.FormularioSala),
        canMatch: [adminGuard],
    },
    {
        path: 'admin/salas',
        loadComponent: () => import('./features/admin/lista-salas/lista-salas').then((m) => m.ListaSalas),
        canMatch: [adminGuard],
    },
    {
        path: 'admin/peliculas/nueva',
        loadComponent: () =>
            import('./features/admin/formulario-pelicula/formulario-pelicula').then((m) => m.FormularioPelicula),
        canMatch: [adminGuard],
    },
    {
        path: 'admin/peliculas/:id/editar',
        loadComponent: () =>
            import('./features/admin/formulario-pelicula/formulario-pelicula').then((m) => m.FormularioPelicula),
        canMatch: [adminGuard],
    },
    {
        path: 'admin/peliculas',
        loadComponent: () => import('./features/admin/lista-peliculas/lista-peliculas').then((m) => m.ListaPeliculas),
        canMatch: [adminGuard],
    },
    {
        path: 'admin/productos/nuevo',
        loadComponent: () =>
            import('./features/admin/formulario-producto/formulario-producto').then((m) => m.FormularioProducto),
        canMatch: [adminGuard],
    },
    {
        path: 'admin/productos/:id/editar',
        loadComponent: () =>
            import('./features/admin/formulario-producto/formulario-producto').then((m) => m.FormularioProducto),
        canMatch: [adminGuard],
    },
    {
        path: 'admin/productos',
        loadComponent: () => import('./features/admin/lista-productos/lista-productos').then((m) => m.ListaProductos),
        canMatch: [adminGuard],
    },
    {
        path: 'admin/combos/nuevo',
        loadComponent: () => import('./features/admin/formulario-combo/formulario-combo').then((m) => m.FormularioCombo),
        canMatch: [adminGuard],
    },
    {
        path: 'admin/combos/:id/editar',
        loadComponent: () => import('./features/admin/formulario-combo/formulario-combo').then((m) => m.FormularioCombo),
        canMatch: [adminGuard],
    },
    {
        path: 'admin/combos',
        loadComponent: () => import('./features/admin/lista-combos/lista-combos').then((m) => m.ListaCombos),
        canMatch: [adminGuard],
    },
    {
        path: 'admin/cupones',
        loadComponent: () => import('./features/admin/cupones/cupones').then((m) => m.Cupones),
        canMatch: [adminGuard],
    },
    {
        path: 'admin/reportes',
        loadComponent: () => import('./features/admin/reportes/reportes').then((m) => m.Reportes),
        canMatch: [adminGuard],
    },
    {
        path: 'admin/graficos',
        loadComponent: () => import('./features/admin/graficos/graficos').then((m) => m.Graficos),
        canMatch: [adminGuard],
    },
    {
        path: 'admin/auditoria',
        loadComponent: () =>
            import('./features/admin/lista-auditoria/lista-auditoria').then((m) => m.ListaAuditoria),
        canMatch: [adminGuard],
    },
    {
        path: 'perfil',
        loadComponent: () => import('./features/perfil-usuario/perfil-usuario').then((m) => m.PerfilUsuario),
    },
    {
        path: 'mis-reservas',
        loadComponent: () => import('./features/mis-reservas/mis-reservas').then((m) => m.MisReservas),
    },
    {   path: '', 
        loadComponent: () => import('./features/home/home').then((m) => m.Home), pathMatch: 'full' },
    {   path: '**', redirectTo: '' },
];
