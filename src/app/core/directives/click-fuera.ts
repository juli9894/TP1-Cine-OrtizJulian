import { Directive, ElementRef, HostListener, inject, output } from '@angular/core';

// Directiva de atributo que emite un evento cuando se hace click fuera del elemento al que se aplica.
@Directive({
    selector: '[appClickFuera]',
})
export class ClickFueraDirective {
    clicFuera = output<void>();

    private readonly elementRef = inject(ElementRef<HTMLElement>);

    @HostListener('document:click', ['$event'])
    alDetectarClick(evento: MouseEvent): void {
        //clickDentroDelPanel?
        const clickDentroDelPanel = this.elementRef.nativeElement.contains(evento.target as Node);
        //si es fuera emitimos el evento.
        if (!clickDentroDelPanel) {
            this.clicFuera.emit();
        }
    }
}
