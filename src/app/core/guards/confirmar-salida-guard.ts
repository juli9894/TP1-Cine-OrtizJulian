import { CanDeactivateFn } from '@angular/router';

export interface ComponenteConCambiosSinGuardar {
    hayCambiosSinGuardar(): boolean;
}

export const confirmarSalidaGuard: CanDeactivateFn<ComponenteConCambiosSinGuardar> = (componente) => {
    if (componente.hayCambiosSinGuardar()) {
        return confirm('Tenés cambios sin guardar. ¿Seguro que querés salir?');
    }
    return true;
};
