import { Component, OnDestroy, OnInit, computed, inject, signal } from '@angular/core';
import { NavigationEnd, Router, RouterLink } from '@angular/router';
import { Subscription } from 'rxjs';
import { ReservasService } from '../../core/services/reservas';
import { ClickFueraDirective } from '../../core/directives/click-fuera';
import { CarritoCandyService } from '../../core/services/carrito-candy';
import { PerfilesService } from '../../core/services/perfiles';
import { CuponesService } from '../../core/services/cupones';
import { AuthService } from '../../core/services/auth';
import { generarTicketPdf } from '../../core/services/ticket-pdf';
import { notaTotalPagado } from '../../core/utils/pago';
import { Perfil } from '../../core/models/perfil';
import { Cupon } from '../../core/models/cupon';
import { ReservaCreada } from '../../core/models/reserva';

// Misma función que en seleccion-butacas.ts — se duplica a propósito (es una
// función pura de 8 líneas, sin estado) en vez de crear un service nuevo solo
// para esto.
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

// Pantallas donde este widget flotante NO debe aparecer:
// - admin/*: no tiene sentido venderle candy bar al propio administrador.
// - login/registro: todavía no hay sesión resuelta, mejor no distraer.
// - funciones/:id/butacas: esa pantalla ya tiene SU PROPIO panel de candy bar
//   integrado a la compra de entradas (ver seleccion-butacas.html), que lee
//   el mismo carrito compartido. Mostrar los dos botones juntos confundiría.
function debeOcultarseEn(ruta: string): boolean {
    return (
        ruta.startsWith('/admin') ||
        ruta.startsWith('/empleado') ||
        ruta === '/login' ||
        ruta === '/registro' ||
        ruta.includes('/butacas')
    );
}

@Component({
    imports: [RouterLink, ClickFueraDirective],
    selector: 'app-candy-bar',
    styleUrl: './candy-bar.css',
    templateUrl: './candy-bar.html',
})
export class CandyBar implements OnInit, OnDestroy {
    private readonly reservasService = inject(ReservasService);
    private readonly perfilesService = inject(PerfilesService);
    private readonly cuponesService = inject(CuponesService);
    private readonly authService = inject(AuthService);
    private readonly router = inject(Router);

    // Mismo service (misma instancia) que inyecta SeleccionButacas: el
    // carrito es uno solo para toda la app, no uno por pantalla.
    protected readonly carritoCandy = inject(CarritoCandyService);

    private suscripcionRouter?: Subscription;

    // Arranca cerrado: es un widget flotante que aparece sobre cualquier
    // pantalla, no una página a la que se navega.
    abierto = signal(false);
    rutaActual = signal(this.router.url);

    perfil = signal<Perfil | null>(null);
    cupon = signal<Cupon | null>(null);
    usarCredito = signal(false);
    reservaConfirmada = signal<ReservaCreada | null>(null);
    errorMensaje = signal('');
    generandoPdf = signal(false);

    // Foto de los items comprados en el momento de confirmar — hace falta
    // porque, apenas se confirma, se vacía el carrito compartido para dejarlo
    // listo para la próxima compra (ver confirmarCompra()).
    itemsUltimaCompra = signal<string[]>([]);

    // Misma idea que en SeleccionButacas: foto del desglose de pago ANTES
    // de vaciar el carrito compartido (ver confirmarCompra()).
    resumenUltimaCompra = signal<{ subtotal: number; descuento: number; creditoAplicado: number } | null>(null);

    // Referencia directa a la función -- se usa desde el template.
    protected notaTotalPagado = notaTotalPagado;

    // Se recalcula sola cada vez que cambia rutaActual (Router) — es la señal
    // que decide si el botón flotante se muestra o no en la pantalla actual.
    visible = computed(() => !debeOcultarseEn(this.rutaActual()));

    descuento = computed(() => this.reservasService.calcularDescuento(this.carritoCandy.subtotal(), this.cupon()));

    creditoDisponible = computed(() => this.perfil()?.saldo_credito ?? 0);

    creditoAplicado = computed(() => {
        if (!this.usarCredito()) return 0;
        const restante = this.carritoCandy.subtotal() - this.descuento();
        return Math.min(this.creditoDisponible(), restante);
    });

    total = computed(() => this.carritoCandy.subtotal() - this.descuento() - this.creditoAplicado());

    async ngOnInit(): Promise<void> {
        // Este componente vive una sola vez para toda la app (está montado en
        // app.html, fuera del router-outlet), así que esta suscripción se crea
        // una sola vez y queda escuchando cada navegación mientras dure la sesión.
        this.suscripcionRouter = this.router.events.subscribe((evento) => {
            if (evento instanceof NavigationEnd) {
                this.rutaActual.set(evento.urlAfterRedirects);
            }
        });

        try {
            await this.carritoCandy.cargarCatalogoSiHaceFalta();

            const usuario = this.authService.usuarioActual();
            if (usuario) {
                const perfil = await this.perfilesService.obtenerPorId(usuario.id);
                this.perfil.set(perfil);

                const cantidadReservas = await this.reservasService.contarReservasDe(usuario.id);
                if (calcularEdad(perfil.fecha_nacimiento) >= 50) {
                    this.cupon.set(await this.cuponesService.obtenerPorTipo('mayor50'));
                } else if (cantidadReservas === 0) {
                    this.cupon.set(await this.cuponesService.obtenerPorTipo('bienvenida'));
                }
            }
        } catch (err) {
            this.errorMensaje.set('No pudimos cargar el candy bar.');
        }
    }

    ngOnDestroy(): void {
        this.suscripcionRouter?.unsubscribe();
    }

    alternarPanel(evento: MouseEvent): void {
        // Sin stopPropagation, el mismo click que abre el panel seguiria
        // burbujeando hasta document, donde ClickFueraDirective lo tomaria como
        // un click 'afuera' del panel (el boton esta fuera del <aside>) y lo
        // cerraria al toque -- el panel 'nunca se abriria' a la vista del usuario.
        evento.stopPropagation();
        this.abierto.update((valor) => !valor);
    }

    cerrarPanel(): void {
        this.abierto.set(false);
    }

    // Vaciar todo de una vez en lugar de ir restando item por item -- mismo
    // vaciar() que ya usa el flujo post-compra, ahora también a mano.
    vaciarCandy(): void {
        if (!confirm('¿Vaciar el carrito de candy bar?')) return;
        this.carritoCandy.vaciar();
    }

    onToggleCredito(evento: Event): void {
        this.usarCredito.set((evento.target as HTMLInputElement).checked);
    }

    async confirmarCompra(): Promise<void> {
        if (!this.carritoCandy.hayAlgoSeleccionado()) return;
        this.errorMensaje.set('');

        const usuario = this.authService.usuarioActual();

        try {
            // Foto de los items y del desglose de pago ANTES de vaciar el
            // carrito compartido.
            const itemsCandy = this.carritoCandy.itemsSeleccionados();
            const subtotalCompra = this.carritoCandy.subtotal();
            const descuentoCompra = this.descuento();
            const creditoCompra = this.creditoAplicado();

            // funcion: null y butacas: [] — es justamente lo que permite esta
            // compra NO estar atada a ninguna función (ver migración 0018).
            const reserva = await this.reservasService.crear(
                null,
                [],
                usuario?.id ?? null,
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

            // El saldo de crédito que se usó para pagar ya se descontó en el
            // servidor (reservasService.crear) -- si no refrescamos acá, el
            // perfil local queda con el saldo VIEJO, y la próxima compra en
            // la misma sesión ofrece usar crédito que ya no existe. Pasó de
            // verdad probando: comprar candy 3 veces con el mismo perfil
            // "cacheado" terminaba en un "No tenés crédito suficiente" del
            // servidor, porque la pantalla seguía mostrando el saldo inicial.
            if (usuario) {
                try {
                    this.perfil.set(await this.perfilesService.obtenerPorId(usuario.id));
                } catch {
                    // No crítico: la compra ya se confirmó. Si esto falla, el
                    // usuario simplemente ve el saldo viejo hasta recargar.
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

    async descargarComprobante(): Promise<void> {
        const reserva = this.reservaConfirmada();
        if (!reserva) return;

        this.generandoPdf.set(true);
        try {
            const resumen = this.resumenUltimaCompra();
            await generarTicketPdf({
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

    // Deja todo listo para otra compra sin tener que cerrar y reabrir el
    // widget ni recargar la página.
    empezarOtraCompra(): void {
        this.reservaConfirmada.set(null);
        this.resumenUltimaCompra.set(null);
        this.usarCredito.set(false);
        this.errorMensaje.set('');
    }
}
