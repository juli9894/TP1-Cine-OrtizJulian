import { Component, computed, inject, input, OnInit, signal, OnDestroy, NgZone } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ClickFueraDirective } from '../../../core/directives/click-fuera';
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
import { notaTotalPagado } from '../../../core/utils/pago';
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
import { calcularEstadoVenta } from '../../../core/utils/preventa';

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
    imports: [RouterLink, ClickFueraDirective],
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

    // Misma idea que itemsUltimaCompra: subtotal()/descuento()/creditoAplicado()
    // dependen de carritoCandy.subtotal(), que cambia apenas se vacía el carrito
    // al confirmar -- sin esta foto, la pantalla de "¡Compra confirmada!" (y el
    // PDF) mostrarían un desglose recalculado mal (candy en $0) en vez del real.
    resumenUltimaCompra = signal<{ subtotal: number; descuento: number; creditoAplicado: number } | null>(null);

    // Referencia directa a la función -- se usa desde el template.
    protected notaTotalPagado = notaTotalPagado;

    edadMinima = computed(() => {
        const pelicula = this.pelicula();
        if (!pelicula) return 0;
        if (pelicula.clasificacion === '+18') return 18;
        if (pelicula.clasificacion === '+13') return 13;
        return 0;
    });

    // Estado de venta de la pelicula (Proximamente / preventa / normal, ver
    // core/utils/preventa.ts) -- define si se puede comprar y a que precio.
    estadoVenta = computed(() => {
        const pelicula = this.pelicula();
        return pelicula ? calcularEstadoVenta(pelicula) : 'normal';
    });

    fechaAperturaPreventa = computed(() => {
        const pelicula = this.pelicula();
        if (!pelicula) return '';
        const apertura = new Date(pelicula.fechaEstreno);
        apertura.setDate(apertura.getDate() - pelicula.diasPreventa);
        return apertura.toLocaleDateString('es-AR');
    });

    // Precio BASE (butaca normal) de preventa, ya sumado el recargo de
    // formato de ESTA funcion -- lo que el cartel de "Estas comprando en
    // preventa" le muestra al usuario tiene que coincidir con lo que
    // despues paga por una butaca normal en el subtotal. Las VIP tienen su
    // propio recargo aparte (ver calcularTotalPreventa en ReservasService),
    // aclarado en el propio texto del cartel.
    precioPreventaPorEntrada = computed(() => {
        const pelicula = this.pelicula();
        const funcion = this.funcion();
        if (!pelicula || !funcion || pelicula.precioPreventa === null) return null;
        const recargoFormato = this.recargos().find((r) => r.formato === funcion.formato)?.recargo ?? 0;
        return pelicula.precioPreventa + recargoFormato;
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

        const pelicula = this.pelicula();
        // Durante la preventa, si la pelicula tiene un precio especial
        // configurado, ese precio reemplaza el precio de la butaca NORMAL
        // (el tipo base) -- pero tanto el recargo por tipo de butaca (VIP
        // sigue costando mas que normal/accesible, misma diferencia que
        // fuera de preventa) como el recargo por formato (2D/3D/4D/5D)
        // se siguen sumando igual que en una compra normal. Ver
        // calcularTotalPreventa() en ReservasService. A pedido de Julian,
        // que probo en vivo y esperaba ver esas dos diferencias reflejadas.
        const enPreventaConPrecio =
            pelicula && this.estadoVenta() === 'preventa' && pelicula.precioPreventa !== null;

        const totalButacas = enPreventaConPrecio
            ? this.reservasService.calcularTotalPreventa(
                  funcion,
                  this.butacasSeleccionadas(),
                  pelicula!.precioPreventa!,
                  this.precios(),
                  this.recargos(),
              )
            : this.reservasService.calcularTotal(
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

    alternarCandyBar(evento: MouseEvent): void {
        // stopPropagation: evita que este mismo click, al seguir burbujeando
        // hasta document, dispare ClickFueraDirective del panel de candy (el
        // boton que lo abre esta FUERA del <aside>) y lo cierre apenas se abre.
        evento.stopPropagation();
        this.resumenAbierto.set(false);
        this.candyBarAbierto.update((abierto) => !abierto);
    }

    alternarResumen(evento: MouseEvent): void {
        evento.stopPropagation();
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

        // Si todavia no abrio la preventa, no se vende ni una entrada para
        // esta funcion -- el candy bar independiente (sin butacas) si se
        // puede seguir comprando igual, no depende del estreno de ninguna
        // pelicula puntual.
        if (hayButacas && this.estadoVenta() === 'proximamente') {
            this.errorMensaje.set(
                `Las entradas de ${pelicula.titulo} salen a la venta el ${this.fechaAperturaPreventa()}.`,
            );
            return;
        }

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
            // Guardamos una foto de los items de candy Y del desglose de pago
            // ANTES de vaciar el carrito, para poder mostrarlos después en la
            // confirmación (ver resumenUltimaCompra arriba).
            const itemsCandy = this.carritoCandy.itemsSeleccionados();
            const subtotalCompra = this.subtotal();
            const descuentoCompra = this.descuento();
            const creditoCompra = this.creditoAplicado();

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
                creditoCompra,
                subtotalCompra,
                descuentoCompra,
            );
            this.itemsUltimaCompra.set(itemsCandy);
            this.resumenUltimaCompra.set({
                subtotal: subtotalCompra,
                descuento: descuentoCompra,
                creditoAplicado: creditoCompra,
            });
            this.carritoCandy.vaciar();
            this.reservaConfirmada.set(reserva);

            // Mismo motivo que en candy-bar.ts: el crédito usado ya se
            // descontó en el servidor, hay que refrescar el perfil local o
            // la próxima compra en la misma sesión ofrece un saldo que ya
            // no existe.
            if (usuarioId) {
                try {
                    this.perfil.set(await this.perfilesService.obtenerPorId(usuarioId));
                } catch {
                    // No crítico: la compra ya se confirmó.
                }
            }
        } catch (err) {
            // Los RPC de Postgres (aplicar_credito, sumar_puntos) tiran un
            // mensaje de error ya pensado para mostrar tal cual (ej. "No
            // tenes credito suficiente") -- lo mostramos en vez de un
            // genérico siempre que venga, así el usuario entiende qué pasó
            // en vez de un "probá de nuevo" que no explica nada.
            const mensaje = err && typeof err === 'object' && 'message' in err ? String((err as { message: unknown }).message) : '';
            this.errorMensaje.set(mensaje || 'No pudimos confirmar la compra. Probá de nuevo.');
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
            const resumen = this.resumenUltimaCompra();
            await generarTicketPdf({
                ...(huboButacas
                    ? {
                          pelicula: pelicula.titulo,
                          clasificacion: pelicula.clasificacion,
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
                ...(resumen ? { subtotal: resumen.subtotal, descuento: resumen.descuento, creditoAplicado: resumen.creditoAplicado } : {}),
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
