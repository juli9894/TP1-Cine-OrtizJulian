import { inject } from '@angular/core';
import { CanMatchFn, Router } from '@angular/router';
import { AuthService } from '../services/auth';
import { PerfilesService } from '../services/perfiles';

export const adminGuard: CanMatchFn = async () => {
    const authService = inject(AuthService);
    const perfilesService = inject(PerfilesService);
    const router = inject(Router);

    const usuario = authService.usuarioActual();
    if (usuario === null) {
        return router.parseUrl('/');
    }

    try {
        const perfil = await perfilesService.obtenerPorId(usuario.id);
        if (perfil.rol !== 'admin') {
            return router.parseUrl('/');
        }
    } catch {
        return router.parseUrl('/');
    }

    return true;
};