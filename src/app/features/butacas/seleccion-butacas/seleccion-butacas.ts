import { Component, computed, inject, input, OnInit, signal, OnDestroy, NgZone } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FuncionesService } from '../../../core/services/funciones';
import { ButacasService } from '../../../core/services/butacas';
import { ReservasService } from '../../../core/services/reservas';
import { CarritoCandyService } from '../../../core/services/carrito-candy';
import { PeliculasService } from '../../../core/services/peliculas';
import { PerfilesService } from '../../../core/services/perfiles';
import { CuponesService } from '../../../core/services/cupones';
import { AuthService } from '../../../core/services/auth';
import { SalasService } from '../../../core/services/salas';
import { generarTicketPdf } from '../../../core/services/ticket-pdf';
import { Funcion } from '../../../core/models/funcion';
import { Butaca } from '../../../core/models/butaca';
import { PrecioButaca } from '../../../core/models/precio-butaca';
import { RecargoFormato } from '../../../core/models/recargo-formato';
import { Perfil } from '../../../core/models/perfil';
import { Cupon } from '../../../core/models/cupon';
import { Sala } from '../../../core/models/sala';
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
    imports: [RouterLink],
    selector: 'app-seleccion-butacas',
    styleUrl: './seleccion-butacas.css',
    templateUrl: './seleccion-butacas.html',
})
export class SeleccionButacas implements OnInit, OnDestroy {
    private readonly funcionesService = inject(FuncionesService);
    private readonly butacasService = inject(ButacasService);
    private readonly reservasService = inject(ReservasService);
    // Carrito de candy bar: es el MISMO service (y las mismas signals) que usa
    // el widget flotante de app.html. Por eso lo que el usuario cargó en el
    // candy bar desde el Home sigue estando acá — no son dos carritos, es
    // uno solo compartido entre pantallas.
    protected readonly carritoCandy = inject(CarritoCandyService);
    private readonly peliculasService = inject(PeliculasService);
    private readonly perfilesService = inject(PerfilesService);
    private readonly cuponesService = inject(CuponesService);
    private readonly authService = inject(AuthService);
    private readonly salasService = inject(SalasService);
    private readonly ngZone = inject(NgZone);

    id = input.required<string>();

    funcion = signal<Funcion | null>(null);
    pelicula = signal<Pelicula | null>(null);
    sala = signal<Sala | null>(null);
    butacas = signal<Butaca[]>([]);
    idsOcupados = signal<number[]>([]);
    idsSeleccionados = signal<number[]>([]);
    precios = signal<PrecioButaca[]>([]);
    recargos = signal<RecargoFormato[]>([]);
    perfil = signal<Perfil | null>(null);
    cupon = signal<Cupon | null>(null);
    usarCredito = signal(false);
    candyBarAbierto = signal(false);
    resumenAbierto = signal(false);
    reservaConfirmada = signal<ReservaCreada | null>(null);
    errorMensaje = signal('');
    generandoPdf = signal(false);
    private suscripcion?: Subscription;

    // Foto de lo que había en el carrito de candy en el momento exacto de
    // confirmar la compra. Hace falta porque, apenas se confirma, vaciamos
    // el carrito compartido (carritoCandy.vaciar()) para que quede listo
    // para la próxima compra — así que la pantalla de "¡Compra confirmada!"
    // no puede seguir leyendo el carrito en vivo, tiene que leer esta copia.
    itemsUltimaCompra = signal<string[]>([]);

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

    subtotal = computed(() => {
        const funcion = this.funcion();
        if (!funcion) return 0;
        const totalButacas = this.reservasService.calcularTotal(
            funcion,
            this.butacasSeleccionadas(),
            this.precios(),
            this.recargos(),
        );
        return totalButacas + this.carritoCandy.subtotal();
    });

    descuento = computed(() => this.reservasService.calcularDescuento(this.subtotal(), this.cupon()));

    // Plata interna disponible (cancelaciones + canjes), y cuánto de eso se va a
    // descontar en esta compra si el usuario tilda "usar mi saldo disponible".
    // Se tapa en 0 el resto: ni el cupón ni el crédito pueden dejar el total negativo.
    creditoDisponible = computed(() => {
        const perfil = this.perfil();
        return perfil ? perfil.saldo_credito : 0;
    });

    creditoAplicado = computed(() => {
        if (!this.usarCredito()) return 0;
        const restante = this.subtotal() - this.descuento();
        return Math.min(this.creditoDisponible(), restante);
    });

    total = computed(() => this.subtotal() - this.descuento() - this.creditoAplicado());

    // Textos derivados para mostrar en la pantalla de confirmación y en el PDF
    // (la misma info, calculada una sola vez en vez de duplicar el .map en los dos lugares).
    horarioFormateado = computed(() => {
        const funcion = this.funcion();
        return funcion ? new Date(funcion.horario).toLocaleString('es-AR') : '';
    });

    butacasTextos = computed(() =>
        this.butacasSeleccionadas().map((b) => `Fila ${b.fila}, Butaca ${b.columna}`),
    );

    async ngOnInit(): Promise<void> {
        const funcionId = Number(this.id());
        try {
            const funcion = await this.funcionesService.obtenerPorId(funcionId);
            this.funcion.set(funcion);

            const [pelicula, sala] = await Promise.all([
                this.peliculasService.obtenerPorId(funcion.peliculaId),
                this.salasService.obtenerPorId(funcion.salaId),
            ]);
            this.pelicula.set(pelicula);
            this.sala.set(sala);

            this.butacas.set(await this.butacasService.obtenerButacasDeSala(funcion.salaId));
            this.idsOcupados.set(await this.butacasService.obtenerIdsOcupados(funcionId));

            const { precios, recargos } = await this.reservasService.obtenerTarifas();
            this.precios.set(precios);
            this.recargos.set(recargos);

            await this.carritoCandy.cargarCatalogoSiHaceFalta();

            const usuario = this.authService.usuarioActual();
            if (usuario) {
                const perfil = await this.perfilesService.obtenerPorId(usuario.id);
                this.perfil.set(perfil);

                const cantidadReservas = await this.reservasService.contarReservasDe(usuario.id);
                // El cupón de +50 tiene prioridad: aplica siempre que la edad alcance,
                // sin importar si es la primera compra (antes, "primera compra" le
                // ganaba a "mayor de 50" y nunca se llegaba a aplicar en ese caso).
                if (calcularEdad(perfil.fecha_nacimiento) >= 50) {
                    this.cupon.set(await this.cuponesService.obtenerPorTipo('mayor50'));
                } else if (cantidadReservas === 0) {
                    this.cupon.set(await this.cuponesService.obtenerPorTipo('bienvenida'));
                }
            }

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

    alternarCandyBar(): void {
        this.resumenAbierto.set(false);
        this.candyBarAbierto.update((abierto) => !abierto);
    }

    alternarResumen(): void {
        this.candyBarAbierto.set(false);
        this.resumenAbierto.update((abierto) => !abierto);
    }

    cerrarPaneles(): void {
        this.candyBarAbierto.set(false);
        this.resumenAbierto.set(false);
    }

    onToggleCredito(evento: Event): void {
        this.usarCredito.set((evento.target as HTMLInputElement).checked);
    }

    async confirmarCompra(): Promise<void> {
        const funcion = this.funcion();
        const pelicula = this.pelicula();
        const hayButacas = this.idsSeleccionados().length > 0;
        const hayCandy = this.carritoCandy.hayAlgoSeleccionado();

        // Esta pantalla ya no exige comprar entradas: también sirve para
        // despachar lo que haya en el carrito de candy (cargado acá mismo o
        // desde cualquier otra pantalla), sin elegir butacas.
        if (!funcion || !pelicula || (!hayButacas && !hayCandy)) return;
        this.errorMensaje.set('');

        const edadMinima = this.edadMinima();
        const usuario = this.authService.usuarioActual();
        const perfil = this.perfil();

        // La restricción de edad es por la película: solo aplica si
        // realmente se están comprando entradas para esa función.
        if (hayButacas && edadMinima > 0 && perfil) {
            const edad = calcularEdad(perfil.fecha_nacimiento);

            if (edad < edadMinima) {
                this.errorMensaje.set(
                    `Esta función es ${pelicula.clasificacion}: no podés comprar entradas (edad mínima ${edadMinima} años).`,
                );
                return;
            }
        }

        try {
            const usuarioId = usuario?.id ?? null;
            // Guardamos una foto de los items de candy ANTES de vaciar el
            // carrito, para poder mostrarla después en la confirmación.
            const itemsCandy = this.carritoCandy.itemsSeleccionados();

            // Si no se compró ninguna butaca, la reserva no queda atada a
            // esta función (funcion_id null) — es el mismo caso que comprar
            // candy bar independiente desde el widget flotante, solo que
            // acá el usuario lo hizo desde la pantalla de una función.
            const reserva = await this.reservasService.crear(
                hayButacas ? funcion : null,
                this.butacasSeleccionadas(),
                usuarioId,
                this.total(),
                this.carritoCandy.productosSeleccionados(),
                this.carritoCandy.combosSeleccionados(),
                this.cupon()?.id ?? null,
                this.creditoAplicado(),
            );
            this.itemsUltimaCompra.set(itemsCandy);
            this.carritoCandy.vaciar();
            this.reservaConfirmada.set(reserva);
        } catch (err) {
            this.errorMensaje.set('No pudimos confirmar la compra. Probá de nuevo.');
        }
    }

    async descargarEntrada(): Promise<void> {
        const funcion = this.funcion();
        const pelicula = this.pelicula();
        const reserva = this.reservaConfirmada();
        if (!funcion || !pelicula || !reserva) return;

        const huboButacas = this.butacasTextos().length > 0;

        this.generandoPdf.set(true);
        try {
            await generarTicketPdf({
                ...(huboButacas
                    ? {
                          pelicula: pelicula.titulo,
                          sala: this.sala()?.nombre ?? '',
                          horario: this.horarioFormateado(),
                          formato: funcion.formato,
                          idioma: funcion.idioma,
                          butacas: this.butacasTextos(),
                      }
                    : {}),
                items: this.itemsUltimaCompra(),
                total: reserva.total,
                qrCode: reserva.qrCode,
            });
        } catch (err) {
            this.errorMensaje.set('No pudimos generar el PDF. Probá de nuevo.');
        } finally {
            this.generandoPdf.set(false);
        }
    }

    ngOnDestroy(): void {
        this.suscripcion?.unsubscribe();
    }
}
