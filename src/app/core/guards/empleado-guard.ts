import { inject } from '@angular/core';
import { CanMatchFn, Router } from '@angular/router';
import { AuthService } from '../services/auth';
import { PerfilesService } from '../services/perfiles';

export const empleadoGuard: CanMatchFn = async () => {
    const authService = inject(AuthService);
    const perfilesService = inject(PerfilesService);
    const router = inject(Router);

    const usuario = await authService.obtenerUsuarioActual();
    if (usuario === null) {
        return router.createUrlTree(['/']);
    }

    try {
        const perfil = await perfilesService.obtenerPorId(usuario.id);
        // Un admin tambien puede validar entradas -- no hace falta una
        // cuenta separada de tipo "empleado" para probarlo en la defensa.
        if (perfil.rol !== 'empleado' && perfil.rol !== 'admin') {
            return router.createUrlTree(['/']);
        }
    } catch {
        return router.createUrlTree(['/']);
    }

    return true;
};
