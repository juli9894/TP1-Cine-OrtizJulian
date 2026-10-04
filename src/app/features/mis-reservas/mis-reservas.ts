import { Component, OnInit, inject, signal } from '@angular/core';
import { ReservasService } from '../../core/services/reservas';
import { AuthService } from '../../core/services/auth';
import { ReservaDetalle } from '../../core/models/reserva';

@Component({
    selector: 'app-mis-reservas',
    templateUrl: './mis-reservas.html',
})
export class MisReservas implements OnInit {
    private readonly reservasService = inject(ReservasService);
    protected readonly authService = inject(AuthService);

    reservas = signal<ReservaDetalle[]>([]);
    cargando = signal(true);
    errorMensaje = signal('');
    cancelandoId = signal<number | null>(null);

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
}