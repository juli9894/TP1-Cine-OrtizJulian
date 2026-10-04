import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../core/services/auth';
import { PerfilesService } from '../../core/services/perfiles';
import { ReservasService } from '../../core/services/reservas';
import { CuponesService } from '../../core/services/cupones';
import { PuntosService } from '../../core/services/puntos';
import { Perfil } from '../../core/models/perfil';
import { ReservaDetalle } from '../../core/models/reserva';
import { Canje } from '../../core/models/canje';
import { Cupon } from '../../core/models/cupon';

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
    selector: 'app-perfil-usuario',
    imports: [CommonModule],
    styleUrl: './perfil-usuario.css',
    templateUrl: './perfil-usuario.html',
})
export class PerfilUsuario implements OnInit {
    protected readonly authService = inject(AuthService);
    private readonly perfilesService = inject(PerfilesService);
    private readonly reservasService = inject(ReservasService);
    private readonly cuponesService = inject(CuponesService);
    private readonly puntosService = inject(PuntosService);

    perfil = signal<Perfil | null>(null);
    reservas = signal<ReservaDetalle[]>([]);
    historial = signal<Canje[]>([]);
    cuponBienvenida = signal<Cupon | null>(null);
    cuponMayor50 = signal<Cupon | null>(null);
    cargando = signal(true);
    errorMensaje = signal('');
    canjeando = signal(false);
    mensajeCanje = signal('');

    esMayor50 = computed(() => {
        const perfil = this.perfil();
        return perfil ? calcularEdad(perfil.fecha_nacimiento) >= 50 : false;
    });

    yaComproAlgunaVez = computed(() => this.reservas().length > 0);

    misPeliculas = computed(() => {
        const vistas = new Map<number, { titulo: string; imagenUrl: string }>();
        for (const reserva of this.reservas()) {
            if (reserva.cancelada || reserva.peliculaId === 0) continue;
            if (!vistas.has(reserva.peliculaId)) {
                vistas.set(reserva.peliculaId, {
                    titulo: reserva.peliculaTitulo,
                    imagenUrl: reserva.peliculaImagenUrl,
                });
            }
        }
        return Array.from(vistas.values());
    });

    async ngOnInit(): Promise<void> {
        const usuario = this.authService.usuarioActual();
        if (!usuario) {
            this.cargando.set(false);
            return;
        }

        try {
            const [perfil, reservas, historial, cuponBienvenida, cuponMayor50] = await Promise.all([
                this.perfilesService.obtenerPorId(usuario.id),
                this.reservasService.obtenerDeUsuario(usuario.id),
                this.puntosService.obtenerHistorialDe(usuario.id),
                this.cuponesService.obtenerPorTipo('bienvenida'),
                this.cuponesService.obtenerPorTipo('mayor50'),
            ]);
            this.perfil.set(perfil);
            this.reservas.set(reservas);
            this.historial.set(historial);
            this.cuponBienvenida.set(cuponBienvenida);
            this.cuponMayor50.set(cuponMayor50);
        } catch (err) {
            this.errorMensaje.set('No pudimos cargar tu perfil.');
        } finally {
            this.cargando.set(false);
        }
    }

    async canjearPuntos(): Promise<void> {
        const usuario = this.authService.usuarioActual();
        const perfil = this.perfil();
        if (!usuario || !perfil || perfil.saldo_puntos <= 0) return;

        if (!confirm(`¿Canjear tus ${perfil.saldo_puntos} puntos acumulados por crédito?`)) {
            return;
        }

        this.mensajeCanje.set('');
        this.canjeando.set(true);
        try {
            await this.puntosService.canjear(usuario.id);
            const [perfilActualizado, historial] = await Promise.all([
                this.perfilesService.obtenerPorId(usuario.id),
                this.puntosService.obtenerHistorialDe(usuario.id),
            ]);
            this.perfil.set(perfilActualizado);
            this.historial.set(historial);
            this.mensajeCanje.set('¡Canje realizado! Se acreditó el crédito en tu cuenta.');
        } catch (err) {
            this.mensajeCanje.set('No pudimos realizar el canje. Probá de nuevo.');
        } finally {
            this.canjeando.set(false);
        }
    }
}