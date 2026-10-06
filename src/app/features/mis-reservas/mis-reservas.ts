import { Component, OnInit, OnDestroy, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Subscription } from 'rxjs';
import QRCode from 'qrcode';
import { ReservasService } from '../../core/services/reservas';
import { AuthService } from '../../core/services/auth';
import { generarTicketPdf } from '../../core/services/ticket-pdf';
import { notaTotalPagado } from '../../core/utils/pago';
import { ReservaDetalle } from '../../core/models/reserva';

@Component({
    imports: [DatePipe, RouterLink],
    selector: 'app-mis-reservas',
    styleUrl: './mis-reservas.css',
    templateUrl: './mis-reservas.html',
})
export class MisReservas implements OnInit, OnDestroy {
    private readonly reservasService = inject(ReservasService);
    protected readonly authService = inject(AuthService);

    reservas = signal<ReservaDetalle[]>([]);
    cargando = signal(true);
    errorMensaje = signal('');
    cancelandoId = signal<number | null>(null);
    generandoPdfId = signal<number | null>(null);

    // "Ver detalle": en vez de forzar la descarga del PDF, el QR y todo el
    // resto de la info se pueden ver en la misma pantalla. detalleAbiertoId
    // guarda qué reserva está expandida (null = ninguna); qrImagenes cachea
    // la imagen ya generada por reserva.id para no regenerarla cada toggle.
    detalleAbiertoId = signal<number | null>(null);
    qrImagenes = signal<Record<number, string>>({});

    // Referencia directa a la función -- se usa desde el template para que
    // "Total: $0" aclare que fue canjeado con cupón/crédito en vez de
    // parecer un error.
    protected notaTotalPagado = notaTotalPagado;

    private suscripcionCambios?: Subscription;

    async ngOnInit(): Promise<void> {
        const usuario = this.authService.usuarioActual();
        if (!usuario) {
            this.cargando.set(false);
            return;
        }

        await this.cargarReservas(usuario.id);
        this.cargando.set(false);

        // Esta lista puede cambiar sin que el usuario toque nada en esta
        // pantalla: compró candy desde el widget flotante (vive fuera del
        // router-outlet, el componente nunca se recrea) o un Empleado validó
        // su QR desde otro dispositivo. Mismo patrón de Supabase Realtime que
        // ya usa ButacasService -- al avisar, volvemos a pedir la lista
        // entera en vez de tratar de parchear una fila suelta.
        this.suscripcionCambios = this.reservasService.suscribirseACambios(usuario.id).subscribe(() => {
            this.cargarReservas(usuario.id);
        });
    }

    ngOnDestroy(): void {
        this.suscripcionCambios?.unsubscribe();
    }

    private async cargarReservas(usuarioId: string): Promise<void> {
        try {
            this.reservas.set(await this.reservasService.obtenerDeUsuario(usuarioId));
        } catch (err) {
            this.errorMensaje.set('No pudimos cargar tus reservas.');
        }
    }

    puedeCancelar(reserva: ReservaDetalle): boolean {
        if (reserva.cancelada || reserva.qrValidado) return false;
        // Una compra de solo candy (sin función, ver migración 0018) no
        // tiene horario contra el cual medir las 2 horas -- se puede
        // cancelar en cualquier momento mientras no haya sido entregada.
        if (reserva.peliculaId === 0) return true;
        const dosHorasEnMs = 2 * 60 * 60 * 1000;
        return new Date(reserva.horario).getTime() - Date.now() >= dosHorasEnMs;
    }

    // Dos motivos distintos por los que puede estar bloqueada la
    // cancelacion -- se lo mostramos al usuario para que no piense que es
    // un error. Si ya fue validada (entrada escaneada o candy entregado
    // por el Empleado, ver migracion 0019/0020) el motivo manda por sobre
    // el de las 2 horas, porque esa reserva nunca va a volver a ser
    // cancelable aunque falte mucho para la funcion.
    motivoNoCancelable(reserva: ReservaDetalle): string {
        if (reserva.qrValidado) {
            return 'No se puede cancelar: El codigo ya fue validado.';
        }
        return 'No se puede cancelar (faltan menos de 2hs para la función)';
    }

    async cancelar(reserva: ReservaDetalle): Promise<void> {
        const usuario = this.authService.usuarioActual();
        if (!usuario) return;

        if (!confirm(`¿Cancelar esta reserva? Se acreditan $${reserva.total} como crédito interno en tu cuenta.`)) {
            return;
        }

        this.errorMensaje.set('');
        this.cancelandoId.set(reserva.id);
        try {
            await this.reservasService.cancelar(reserva.id, usuario.id);
            this.reservas.update((lista) =>
                lista.map((r) => (r.id === reserva.id ? { ...r, cancelada: true } : r)),
            );
        } catch (err) {
            this.errorMensaje.set('No pudimos cancelar la reserva. Probá de nuevo.');
        } finally {
            this.cancelandoId.set(null);
        }
    }

    // Regenera el comprobante en PDF a partir de los datos YA guardados de la
    // reserva — no hace falta volver a pasar por Supabase ni por el carrito,
    // porque obtenerDeUsuario() ya trajo todo lo necesario (función, butacas,
    // candy, total y el código QR original).
    async descargar(reserva: ReservaDetalle): Promise<void> {
        this.generandoPdfId.set(reserva.id);
        try {
            await generarTicketPdf({
                ...(reserva.peliculaId > 0
                    ? {
                          pelicula: reserva.peliculaTitulo,
                          clasificacion: reserva.peliculaClasificacion ?? undefined,
                          sala: reserva.sala,
                          horario: new Date(reserva.horario).toLocaleString('es-AR'),
                          formato: reserva.formato,
                          idioma: reserva.idioma,
                          butacas: reserva.butacas,
                      }
                    : {}),
                items: reserva.candyItems,
                total: reserva.total,
                qrCode: reserva.qrCode,
                subtotal: reserva.subtotal,
                descuento: reserva.descuento,
                creditoAplicado: reserva.creditoAplicado,
            });
        } catch (err) {
            this.errorMensaje.set('No pudimos generar el PDF. Probá de nuevo.');
        } finally {
            this.generandoPdfId.set(null);
        }
    }

    // Alternativa a "descargar el PDF" para solo querer ver el QR y el
    // detalle de la reserva ahí mismo. La imagen del QR se genera una sola
    // vez por reserva (mismo QRCode.toDataURL() que ya usa ticket-pdf.ts
    // para el PDF) y se cachea en qrImagenes -- volver a abrir el detalle
    // no la regenera.
    async alternarDetalle(reserva: ReservaDetalle): Promise<void> {
        if (this.detalleAbiertoId() === reserva.id) {
            this.detalleAbiertoId.set(null);
            return;
        }
        this.detalleAbiertoId.set(reserva.id);

        if (!this.qrImagenes()[reserva.id]) {
            // width: 220 -- generamos el QR ya en alta resolución en vez de
            // agrandar con CSS una imagen chica (eso la volvería borrosa y
            // una cámara lee peor los bordes de cada módulo).
            const dataUrl = await QRCode.toDataURL(reserva.qrCode, { width: 220 });
            this.qrImagenes.update((actual) => ({ ...actual, [reserva.id]: dataUrl }));
        }
    }

    // "Fila A: Butaca 5, Butaca 6, Butaca 7." -- las columnas de una fila ya
    // vienen agrupadas y ordenadas desde mapearReservaDetalle().
    formatearButacas(columnas: number[]): string {
        return `${columnas.map((c) => `Butaca ${c}`).join(', ')}.`;
    }
}
