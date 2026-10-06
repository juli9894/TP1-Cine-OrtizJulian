import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth';

export const soloInvitadoGuard: CanActivateFn = async () => {
    const authService = inject(AuthService);
    const router = inject(Router);

    const usuario = await authService.obtenerUsuarioActual();
    if (usuario === null) {
        return true;
    }

    return router.createUrlTree(['/']);
};
