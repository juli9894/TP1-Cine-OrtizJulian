import { Component, computed, inject, input, OnInit, signal, OnDestroy, NgZone } from '@angular/core';
import { FuncionesService } from '../../../core/services/funciones';
import { ButacasService } from '../../../core/services/butacas';
import { ReservasService, ProductoSeleccionado, ComboSeleccionado } from '../../../core/services/reservas';
import { ProductosService } from '../../../core/services/productos';
import { CombosService } from '../../../core/services/combos';
import { PeliculasService } from '../../../core/services/peliculas';
import { PerfilesService } from '../../../core/services/perfiles';
import { AuthService } from '../../../core/services/auth';
import { Funcion } from '../../../core/models/funcion';
import { Butaca } from '../../../core/models/butaca';
import { PrecioButaca } from '../../../core/models/precio-butaca';
import { RecargoFormato } from '../../../core/models/recargo-formato';
import { Producto } from '../../../core/models/producto';
import { Combo } from '../../../core/models/combo';
import { Pelicula } from '../../../core/models/pelicula';
import { ReservaCreada } from '../../../core/models/reserva';
import { Subscription } from 'rxjs';

function calcularEdad(fechaNacimiento: string): number {
    const hoy = new Date();
    const nacimiento = new Date(fechaNacimiento);
    let edad = hoy.getFullYear() - nacimiento.getFullYear();
    const cumplioEsteAnio =
        hoy.getMonth() > nacimiento.getMonth() ||
        (hoy.getMonth() === nacimiento.getMonth() && hoy.getDate() >= nacimiento.getDate());
    if (!cumplioEsteAnio) edad--;
    return edad;
}

@Component({
    selector: 'app-seleccion-butacas',
    styleUrl: './seleccion-butacas.css',
    templateUrl: './seleccion-butacas.html',
})
export class SeleccionButacas implements OnInit, OnDestroy {
    private readonly funcionesService = inject(FuncionesService);
    private readonly butacasService = inject(ButacasService);
    private readonly reservasService = inject(ReservasService);
    private readonly productosService = inject(ProductosService);
    private readonly combosService = inject(CombosService);
    private readonly peliculasService = inject(PeliculasService);
    private readonly perfilesService = inject(PerfilesService);
    private readonly authService = inject(AuthService);
    private readonly ngZone = inject(NgZone);

    id = input.required<string>();

    funcion = signal<Funcion | null>(null);
    pelicula = signal<Pelicula | null>(null);
    butacas = signal<Butaca[]>([]);
    idsOcupados = signal<number[]>([]);
    idsSeleccionados = signal<number[]>([]);
    precios = signal<PrecioButaca[]>([]);
    recargos = signal<RecargoFormato[]>([]);
    productos = signal<Producto[]>([]);
    combos = signal<Combo[]>([]);
    cantidadesProductos = signal<Record<number, number>>({});
    cantidadesCombos = signal<Record<number, number>>({});
    reservaConfirmada = signal<ReservaCreada | null>(null);
    errorMensaje = signal('');
    private suscripcion?: Subscription;

    edadMinima = computed(() => {
        const pelicula = this.pelicula();
        if (!pelicula) return 0;
        if (pelicula.clasificacion === '+18') return 18;
        if (pelicula.clasificacion === '+13') return 13;
        return 0;
    });

    filas = computed(() => {
        const porFila = new Map<string, Butaca[]>();
        for (const butaca of this.butacas()) {
            const lista = porFila.get(butaca.fila) ?? [];
            lista.push(butaca);
            porFila.set(butaca.fila, lista);
        }
        return Array.from(porFila.values()).map((fila) =>
            fila.sort((a, b) => a.columna - b.columna),
        );
    });

    butacasSeleccionadas = computed(() =>
        this.butacas().filter((butaca) => this.idsSeleccionados().includes(butaca.id)),
    );

    productosPorCategoria = computed(() => {
        const grupos = new Map<string, Producto[]>();
        for (const producto of this.productos()) {
            const lista = grupos.get(producto.categoria) ?? [];
            lista.push(producto);
            grupos.set(producto.categoria, lista);
        }
        return Array.from(grupos.entries());
    });

    productosSeleccionados = computed((): ProductoSeleccionado[] =>
        Object.entries(this.cantidadesProductos())
            .map(([id, cantidad]) => ({ productoId: Number(id), cantidad }))
            .filter((p) => p.cantidad > 0),
    );

    combosSeleccionados = computed((): ComboSeleccionado[] =>
        Object.entries(this.cantidadesCombos())
            .map(([id, cantidad]) => ({ comboId: Number(id), cantidad }))
            .filter((c) => c.cantidad > 0),
    );

    total = computed(() => {
        const funcion = this.funcion();
        if (!funcion) return 0;
        const totalButacas = this.reservasService.calcularTotal(
            funcion,
            this.butacasSeleccionadas(),
            this.precios(),
            this.recargos(),
        );
        const totalCandy = this.reservasService.calcularTotalCandy(
            this.productosSeleccionados(),
            this.combosSeleccionados(),
            this.productos(),
            this.combos(),
        );
        return totalButacas + totalCandy;
    });

    async ngOnInit(): Promise<void> {
        const funcionId = Number(this.id());
        try {
            const funcion = await this.funcionesService.obtenerPorId(funcionId);
            this.funcion.set(funcion);
            this.pelicula.set(await this.peliculasService.obtenerPorId(funcion.peliculaId));
            this.butacas.set(await this.butacasService.obtenerButacasDeSala(funcion.salaId));
            this.idsOcupados.set(await this.butacasService.obtenerIdsOcupados(funcionId));

            const { precios, recargos } = await this.reservasService.obtenerTarifas();
            this.precios.set(precios);
            this.recargos.set(recargos);

            const [productos, combos] = await Promise.all([
                this.productosService.obtenerActivos(),
                this.combosService.obtenerActivos(),
            ]);
            this.productos.set(productos);
            this.combos.set(combos);

            this.suscripcion = this.butacasService
                .suscribirseAButacasOcupadas(funcionId)
                .subscribe((ids) => {
                    this.ngZone.run(() => { this.idsOcupados.set(ids); });
                });
        } catch (err) {
            this.errorMensaje.set('No pudimos encontrar esta función.');
        }
    }

    onClickButaca(butaca: Butaca): void {
        if (this.idsOcupados().includes(butaca.id)) return;
        this.idsSeleccionados.update((ids) =>
            ids.includes(butaca.id) ? ids.filter((id) => id !== butaca.id) : [...ids, butaca.id],
        );
    }

    sumarProducto(id: number): void {
        this.cantidadesProductos.update((actual) => ({ ...actual, [id]: (actual[id] ?? 0) + 1 }));
    }

    restarProducto(id: number): void {
        this.cantidadesProductos.update((actual) => ({ ...actual, [id]: Math.max(0, (actual[id] ?? 0) - 1) }));
    }

    sumarCombo(id: number): void {
        this.cantidadesCombos.update((actual) => ({ ...actual, [id]: (actual[id] ?? 0) + 1 }));
    }

    restarCombo(id: number): void {
        this.cantidadesCombos.update((actual) => ({ ...actual, [id]: Math.max(0, (actual[id] ?? 0) - 1) }));
    }

    async confirmarCompra(): Promise<void> {
        const funcion = this.funcion();
        const pelicula = this.pelicula();
        if (!funcion || !pelicula || this.idsSeleccionados().length === 0) return;
        this.errorMensaje.set('');

        const edadMinima = this.edadMinima();
        const usuario = this.authService.usuarioActual();

        if (edadMinima > 0 && usuario) {
            try {
                const perfil = await this.perfilesService.obtenerPorId(usuario.id);
                const edad = calcularEdad(perfil.fecha_nacimiento);

                if (edad < edadMinima) {
                    this.errorMensaje.set(
                        `Esta función es ${pelicula.clasificacion}: no podés comprar entradas (edad mínima ${edadMinima} años).`,
                    );
                    return;
                }
            } catch (err) {
                this.errorMensaje.set('No pudimos validar tu edad. Probá de nuevo.');
                return;
            }
        }

        try {
            const usuarioId = usuario?.id ?? null;
            const reserva = await this.reservasService.crear(
                funcion,
                this.butacasSeleccionadas(),
                usuarioId,
                this.total(),
                this.productosSeleccionados(),
                this.combosSeleccionados(),
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