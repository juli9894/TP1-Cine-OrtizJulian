import { CanDeactivateFn } from '@angular/router';

// Interfaz minima que tiene que cumplir cualquier componente que use este
// guard: no importa que pantalla sea, con tal de que sepa contestar "me
// dejaron algo sin guardar?".
export interface ComponenteConCambiosSinGuardar {
    hayCambiosSinGuardar(): boolean;
}

// canDeactivate: a diferencia de canActivate/canMatch (deciden si se puede
// ENTRAR a una ruta), este guard corre cuando Angular esta por dejar la
// ruta ACTUAL -- confirma antes de abandonar un formulario con cambios sin
// guardar (atras del navegador, un link del menu, etc.), para no perder lo
// que ya se cargo por un click accidental. Generico: sirve para cualquier
// componente que implemente ComponenteConCambiosSinGuardar, no hace falta
// un guard por pantalla.
export const confirmarSalidaGuard: CanDeactivateFn<ComponenteConCambiosSinGuardar> = (componente) => {
    if (componente.hayCambiosSinGuardar()) {
        return confirm('Tenés cambios sin guardar. ¿Seguro que querés salir sin guardarlos?');
    }
    return true;
};
