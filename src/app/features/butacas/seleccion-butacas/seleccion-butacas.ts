import { Component, computed, inject, input, OnInit, signal, OnDestroy, NgZone } from '@angular/core';
import { FuncionesService } from '../../../core/services/funciones';
import { ButacasService } from '../../../core/services/butacas';
import { ReservasService } from '../../../core/services/reservas';
import { AuthService } from '../../../core/services/auth';
import { Funcion } from '../../../core/models/funcion';
import { Butaca } from '../../../core/models/butaca';
import { PrecioButaca } from '../../../core/models/precio-butaca';
import { RecargoFormato } from '../../../core/models/recargo-formato';
import { ReservaCreada } from '../../../core/models/reserva';
import { Subscription } from 'rxjs';

@Component({
    selector: 'app-seleccion-butacas',
    styleUrl: './seleccion-butacas.css',
    templateUrl: './seleccion-butacas.html',
})
export class SeleccionButacas implements OnInit, OnDestroy {
    private readonly funcionesService = inject(FuncionesService);
    private readonly butacasService = inject(ButacasService);
    private readonly reservasService = inject(ReservasService);
    private readonly authService = inject(AuthService);
    private readonly ngZone = inject(NgZone);

    id = input.required<string>();

    funcion = signal<Funcion | null>(null);
    butacas = signal<Butaca[]>([]);
    idsOcupados = signal<number[]>([]);
    idsSeleccionados = signal<number[]>([]);
    precios = signal<PrecioButaca[]>([]);
    recargos = signal<RecargoFormato[]>([]);
    reservaConfirmada = signal<ReservaCreada | null>(null);
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

    butacasSeleccionadas = computed(() =>
        this.butacas().filter((butaca) => this.idsSeleccionados().includes(butaca.id)),
    );

    total = computed(() => {
        const funcion = this.funcion();
        if (!funcion) return 0;

        return this.reservasService.calcularTotal(
            funcion,
            this.butacasSeleccionadas(),
            this.precios(),
            this.recargos(),
        );
    });

    async ngOnInit(): Promise<void> {
        const funcionId = Number(this.id());

        try {
            const funcion = await this.funcionesService.obtenerPorId(funcionId);
            this.funcion.set(funcion);

            this.butacas.set(await this.butacasService.obtenerButacasDeSala(funcion.salaId));
            this.idsOcupados.set(await this.butacasService.obtenerIdsOcupados(funcionId));

            const { precios, recargos } = await this.reservasService.obtenerTarifas();
            this.precios.set(precios);
            this.recargos.set(recargos);

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

    async confirmarCompra(): Promise<void> {
        const funcion = this.funcion();
        if (!funcion || this.idsSeleccionados().length === 0) return;

        this.errorMensaje.set('');

        try {
            const usuarioId = this.authService.usuarioActual()?.id ?? null;

            const reserva = await this.reservasService.crear(
                funcion,
                this.butacasSeleccionadas(),
                usuarioId,
                this.total(),
            );

            this.reservaConfirmada.set(reserva);
        } catch (err) {
            this.errorMensaje.set('No pudimos confirmar la compra. Probá de nuevo.');
        }
    }

    ngOnDestroy(): void {
        this.suscripcion?.unsubscribe();
    }
}