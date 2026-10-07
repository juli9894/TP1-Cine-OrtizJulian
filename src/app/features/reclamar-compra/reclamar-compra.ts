import { Component, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import QRCode from 'qrcode';
import { ReservasService } from '../../core/services/reservas';
import { generarTicketPdf } from '../../core/services/ticket-pdf';
import { notaTotalPagado } from '../../core/utils/pago';
import { ReservaDetalle } from '../../core/models/reserva';

// Pantalla PÚBLICA (sin login, sin canActivate) para quien compró como
// invitado: no tiene "Mis reservas" porque esa lista se pide por usuarioId,
// y un invitado no tiene usuarioId. El código QR es lo único que necesita
// para reclamar su compra -- es el mismo dato que ya usa el Empleado para
// validar la entrada, así que no se agrega ninguna puerta de seguridad
// nueva: tener el código ya es, hoy, la única prueba de la compra (es lo
// que se imprime en la entrada física).
@Component({
    imports: [DatePipe, RouterLink],
    selector: 'app-reclamar-compra',
    styleUrl: './reclamar-compra.css',
    templateUrl: './reclamar-compra.html',
})
export class ReclamarCompra {
    private readonly reservasService = inject(ReservasService);

    codigo = signal('');
    buscando = signal(false);
    errorMensaje = signal('');
    reserva = signal<ReservaDetalle | null>(null);
    qrImagen = signal('');
    generandoPdf = signal(false);

    protected notaTotalPagado = notaTotalPagado;

    onCodigoChange(evento: Event): void {
        this.codigo.set((evento.target as HTMLInputElement).value);
    }

    async buscar(): Promise<void> {
        const codigo = this.codigo().trim();
        if (!codigo) return;

        this.buscando.set(true);
        this.errorMensaje.set('');
        this.reserva.set(null);
        this.qrImagen.set('');

        try {
            const reserva = await this.reservasService.obtenerPorQrCode(codigo);
            this.reserva.set(reserva);
            // width: 220 -- mismo criterio que mis-reservas.ts: se genera ya
            // en alta resolución en vez de agrandar con CSS una imagen chica.
            this.qrImagen.set(await QRCode.toDataURL(reserva.qrCode, { width: 220 }));
        } catch (err) {
            this.errorMensaje.set('No encontramos ninguna compra con ese código. Revisá que esté bien escrito.');
        } finally {
            this.buscando.set(false);
        }
    }

    // Mismo patrón que mis-reservas.ts: el PDF se regenera a partir de los
    // datos que ya trajo obtenerPorQrCode(), sin volver a pegarle a
    // Supabase ni pasar por ningún carrito.
    async descargar(): Promise<void> {
        const reserva = this.reserva();
        if (!reserva) return;

        this.generandoPdf.set(true);
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
            this.generandoPdf.set(false);
        }
    }

    formatearButacas(columnas: number[]): string {
        return `${columnas.map((c) => `Butaca ${c}`).join(', ')}.`;
    }
}
