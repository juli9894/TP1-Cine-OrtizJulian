import { Component, computed, inject, input, OnInit, signal, OnDestroy, NgZone } from '@angular/core';
import { FuncionesService } from '../../../core/services/funciones';
import { ButacasService } from '../../../core/services/butacas';
import { Funcion } from '../../../core/models/funcion';
import { Butaca } from '../../../core/models/butaca';
import { Subscription } from 'rxjs';

@Component({
    selector: 'app-seleccion-butacas',
    styleUrl: './seleccion-butacas.css',
    templateUrl: './seleccion-butacas.html',
})
export class SeleccionButacas implements OnInit, OnDestroy {
    private readonly funcionesService = inject(FuncionesService);
    private readonly butacasService = inject(ButacasService);
    private readonly ngZone = inject(NgZone);

    id = input.required<string>();

    funcion = signal<Funcion | null>(null);
    butacas = signal<Butaca[]>([]);
    idsOcupados = signal<number[]>([]);
    idsSeleccionados = signal<number[]>([]);
    errorMensaje = signal('');
    private suscripcion?: Subscription;

    filas = computed(() => {
        const todasLasFilas: Butaca[][] = [];
        let filaActual: Butaca[] = [];
        let letraActual = '';

        for (const butaca of this.butacas()) {
            if (butaca.fila !== letraActual) {
                if (filaActual.length > 0) {
                    todasLasFilas.push(filaActual);
                }

                filaActual = [];
                letraActual = butaca.fila;
            }

            filaActual.push(butaca);
        }

        if (filaActual.length > 0) {
            todasLasFilas.push(filaActual);
        }

        return todasLasFilas;
    });

    async ngOnInit(): Promise<void> {
        const funcionId = Number(this.id());

        try {
            const funcion = await this.funcionesService.obtenerPorId(funcionId);
            this.funcion.set(funcion);

            this.butacas.set(await this.butacasService.obtenerButacasDeSala(funcion.salaId));
            this.idsOcupados.set(await this.butacasService.obtenerIdsOcupados(funcionId));

            this.suscripcion = this.butacasService
                .suscribirseAButacasOcupadas(funcionId)
                .subscribe((ids) => {
                    this.ngZone.run(() => {
                        this.idsOcupados.set(ids);
                    });
                });
        } catch (err) {
            this.errorMensaje.set('No pudimos encontrar esta función.');
        }
    }

    onClickButaca(butaca: Butaca): void {
        if (this.idsOcupados().includes(butaca.id)) return;

        const seleccionadas = this.idsSeleccionados();

        if (seleccionadas.includes(butaca.id)) {
            this.idsSeleccionados.set(seleccionadas.filter((id) => id !== butaca.id));
        } else {
            this.idsSeleccionados.set([...seleccionadas, butaca.id]);
        }
    }

    ngOnDestroy(): void {
        this.suscripcion?.unsubscribe();
    }
}