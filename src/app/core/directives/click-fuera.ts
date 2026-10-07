import { Directive, ElementRef, HostListener, inject, output } from '@angular/core';

// Directiva de atributo (no estructural, no envuelve el elemento en un
// <ng-template> como haria *ngIf -- solo le agrega comportamiento al
// elemento tal cual esta). Se aplica sobre el panel que se quiere poder
// cerrar clickeando afuera: `<aside appClickFuera (clicFuera)="cerrar()">`.
//
// Reemplaza el patron que se repetia a mano en 3 pantallas (seleccion de
// butacas, candy bar flotante, proximamente): un <div class="overlay">
// de fondo, puesto ahi solo para capturar el click y cerrar el panel.
// Con la directiva, el overlay sigue existiendo para el oscurecido visual,
// pero ya no necesita su propio (click) -- cualquier click fuera del panel,
// sea sobre el overlay o sobre cualquier otra cosa de la pagina, lo cierra.
@Directive({
    selector: '[appClickFuera]',
})
export class ClickFueraDirective {
    clicFuera = output<void>();

    private readonly elementRef = inject(ElementRef<HTMLElement>);

    @HostListener('document:click', ['$event'])
    alDetectarClick(evento: MouseEvent): void {
        const clickDentroDelPanel = this.elementRef.nativeElement.contains(evento.target as Node);
        if (!clickDentroDelPanel) {
            this.clicFuera.emit();
        }
    }
}
