import { Component, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { PeliculasService } from '../../../core/services/peliculas';
import { Pelicula } from '../../../core/models/pelicula';

@Component({
    imports: [RouterLink],
    selector: 'app-lista-peliculas',
    styleUrl: './lista-peliculas.css',
    templateUrl: './lista-peliculas.html',
})
export class ListaPeliculas implements OnInit {
    private readonly peliculasService = inject(PeliculasService);

    peliculas = signal<Pelicula[]>([]);
    errorMensaje = signal('');

    async ngOnInit(): Promise<void> {
        await this.cargarPeliculas();
    }

    async cargarPeliculas(): Promise<void> {
        this.peliculas.set(await this.peliculasService.obtenerTodas());
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