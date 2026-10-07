import { Component, OnDestroy, OnInit, computed, inject, signal } from '@angular/core';
import { NavigationEnd, Router, RouterLink } from '@angular/router';
import { DatePipe } from '@angular/common';
import { Subscription } from 'rxjs';
import { PeliculasService } from '../../core/services/peliculas';
import { AlertasProximamenteService } from '../../core/services/alertas-proximamente';
import { AuthService } from '../../core/services/auth';
import { Pelicula } from '../../core/models/pelicula';
import { calcularEstadoVenta, EstadoVentaPelicula } from '../../core/utils/preventa';

// Mismo criterio que debeOcultarseEn() en candy-bar.ts: no tiene sentido
// mostrarle este widget al admin/empleado, ni en login/registro antes de que
// haya sesion resuelta. Al principio lo dejamos visible en /butacas, pero
// Julian detecto que ahi se superpone con el panel "Mi compra" de la propia
// pantalla de seleccion de butacas -- lo ocultamos tambien ahi, igual que
// hace CandyBar con su propio boton flotante.
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
    imports: [RouterLink, DatePipe],
    selector: 'app-proximamente',
    styleUrl: './proximamente.css',
    templateUrl: './proximamente.html',
})
export class Proximamente implements OnInit, OnDestroy {
    private readonly peliculasService = inject(PeliculasService);
    private readonly alertasService = inject(AlertasProximamenteService);
    protected readonly authService = inject(AuthService);
    private readonly router = inject(Router);

    private suscripcionRouter?: Subscription;
    rutaActual = signal(this.router.url);
    visible = computed(() => !debeOcultarseEn(this.rutaActual()));

    abierto = signal(false);
    peliculas = signal<Pelicula[]>([]);
    idsConAlerta = signal<number[]>([]);

    // Alertas activadas por el usuario cuya pelicula ya entro en preventa
    // (o ya se estreno) y todavia no se le mostraron -- son las que arman el
    // numerito del badge y el "feed" estilo notificacion arriba del panel.
    notificacionesPendientes = signal<{ alertaId: number; pelicula: Pelicula }[]>([]);

    // Una vez que el usuario abre el panel una vez, el badge se apaga aunque
    // las notificaciones se sigan mostrando en el feed por el resto de la
    // sesion -- mismo comportamiento que una campanita de notificaciones
    // comun (abrir el dropdown "marca como leido", no borra el feed).
    private vistasEnEstaSesion = signal(false);
    badgeCount = computed(() => (this.vistasEnEstaSesion() ? 0 : this.notificacionesPendientes().length));

    async ngOnInit(): Promise<void> {
        // Este componente vive una sola vez para toda la app (montado en
        // app.html, fuera del router-outlet) -- mismo patron que CandyBar.
        this.suscripcionRouter = this.router.events.subscribe((evento) => {
            if (evento instanceof NavigationEnd) {
                this.rutaActual.set(evento.urlAfterRedirects);
            }
        });

        try {
            this.peliculas.set(await this.peliculasService.obtenerProximamente());

            const usuario = this.authService.usuarioActual();
            if (usuario) {
                this.idsConAlerta.set(await this.alertasService.obtenerPeliculaIdsDeUsuario(usuario.id));
                this.notificacionesPendientes.set(await this.alertasService.obtenerPendientesDeNotificar(usuario.id));
            }
        } catch {
            // Si la migracion de Proximamente todavia no se corrio contra
            // Supabase, estas consultas fallan -- el widget queda vacio en
            // vez de tumbar el resto de la app (Home, buscador, etc.).
        }
    }

    ngOnDestroy(): void {
        this.suscripcionRouter?.unsubscribe();
    }

    alternarPanel(): void {
        this.abierto.update((valor) => !valor);

        if (this.abierto() && this.notificacionesPendientes().length > 0 && !this.vistasEnEstaSesion()) {
            this.vistasEnEstaSesion.set(true);
            this.alertasService.marcarNotificadas(this.notificacionesPendientes().map((n) => n.alertaId));
        }
    }

    cerrarPanel(): void {
        this.abierto.set(false);
    }

    async alternarAlerta(peliculaId: number): Promise<void> {
        const usuario = this.authService.usuarioActual();
        if (!usuario) return;

        if (this.idsConAlerta().includes(peliculaId)) {
            await this.alertasService.desactivar(usuario.id, peliculaId);
            this.idsConAlerta.update((ids) => ids.filter((id) => id !== peliculaId));
        } else {
            await this.alertasService.activar(usuario.id, peliculaId);
            this.idsConAlerta.update((ids) => [...ids, peliculaId]);
        }
    }

    // obtenerProximamente() trae TODAS las peliculas que todavia no se
    // estrenaron -- incluye tanto las que estan en 'proximamente' (todavia
    // no se vende nada, tiene sentido "avisarme") como las que ya estan en
    // 'preventa' (ya se puede comprar, "avisarme" ya no tiene sentido: hay
    // que dejar comprar directo). El template usa esto para decidir que
    // mostrar en cada tarjeta de la lista.
    estadoVenta(pelicula: Pelicula): EstadoVentaPelicula {
        return calcularEstadoVenta(pelicula);
    }
}
