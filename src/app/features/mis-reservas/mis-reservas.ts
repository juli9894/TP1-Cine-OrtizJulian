import { Component, OnInit, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ReservasService } from '../../core/services/reservas';
import { AuthService } from '../../core/services/auth';
import { generarTicketPdf } from '../../core/services/ticket-pdf';
import { ReservaDetalle } from '../../core/models/reserva';

@Component({
    imports: [DatePipe, RouterLink],
    selector: 'app-mis-reservas',
    styleUrl: './mis-reservas.css',
    templateUrl: './mis-reservas.html',
})
export class MisReservas implements OnInit {
    private readonly reservasService = inject(ReservasService);
    protected readonly authService = inject(AuthService);

    reservas = signal<ReservaDetalle[]>([]);
    cargando = signal(true);
    errorMensaje = signal('');
    cancelandoId = signal<number | null>(null);
    generandoPdfId = signal<number | null>(null);

    async ngOnInit(): Promise<void> {
        const usuario = this.authService.usuarioActual();
        if (!usuario) {
            this.cargando.set(false);
            return;
        }

        try {
            this.reservas.set(await this.reservasService.obtenerDeUsuario(usuario.id));
        } catch (err) {
            this.errorMensaje.set('No pudimos cargar tus reservas.');
        } finally {
            this.cargando.set(false);
        }
    }

    puedeCancelar(reserva: ReservaDetalle): boolean {
        if (reserva.cancelada) return false;
        const dosHorasEnMs = 2 * 60 * 60 * 1000;
        return new Date(reserva.horario).getTime() - Date.now() >= dosHorasEnMs;
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
            });
        } catch (err) {
            this.errorMensaje.set('No pudimos generar el PDF. Probá de nuevo.');
        } finally {
            this.generandoPdfId.set(null);
        }
    }
}
