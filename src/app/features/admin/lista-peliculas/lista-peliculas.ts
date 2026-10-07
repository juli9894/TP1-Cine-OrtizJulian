import { Component, inject, OnInit, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { DatePipe } from '@angular/common';
import { PeliculasService } from '../../../core/services/peliculas';
import { Pelicula } from '../../../core/models/pelicula';

@Component({
    imports: [RouterLink, DatePipe],
    selector: 'app-lista-peliculas',
    styleUrl: './lista-peliculas.css',
    templateUrl: './lista-peliculas.html',
})
export class ListaPeliculas implements OnInit {
    private readonly peliculasService = inject(PeliculasService);
    private readonly router = inject(Router);

    peliculas = signal<Pelicula[]>([]);
    errorMensaje = signal('');

    async ngOnInit(): Promise<void> {
        await this.cargarPeliculas();
    }

    async cargarPeliculas(): Promise<void> {
        this.peliculas.set(await this.peliculasService.obtenerTodas());
    }

    // Click en la fila (no en Editar/Eliminar) lleva a la ficha publica de
    // la pelicula (sinopsis, reseñas, poster grande) -- mismo criterio que
    // el click de fila en ListaFunciones, que lleva a la seleccion de
    // butacas.
    verDetalle(peliculaId: number): void {
        this.router.navigate(['/peliculas', peliculaId]);
    }

    async eliminarPelicula(id: number): Promise<void> {
        this.errorMensaje.set('');
        if (!confirm('¿Seguro que querés eliminar esta película?')) return;

        try {
            await this.peliculasService.eliminar(id);
            await this.cargarPeliculas();
        } catch (err) {
            if (err instanceof Error) {
                this.errorMensaje.set(err.message);
            } else {
                this.errorMensaje.set('No pudimos eliminar la película. Probá de nuevo.');
            }
        }
    }
}