import { Component, computed, inject, input, OnInit, signal } from '@angular/core';
import { PeliculasService } from '../../core/services/peliculas';
import { ResenasService } from '../../core/services/resenas';
import { Pelicula } from '../../core/models/pelicula';
import { Resena } from '../../core/models/resena';

@Component({
  imports: [],
  selector: 'app-pelicula-detalle',
  styleUrl: './pelicula-detalle.css',
  templateUrl: './pelicula-detalle.html',
})
export class PeliculaDetalle implements OnInit {
  private readonly peliculasService = inject(PeliculasService);
  private readonly resenasService = inject(ResenasService);

  id = input.required<string>();

  pelicula = signal<Pelicula | null>(null);
  resenas = signal<Resena[]>([]);
  errorMensaje = signal('');

  promedio = computed(() => {
    const lista = this.resenas();
    if (lista.length === 0) return 0;

    const suma = lista.reduce((acumulado, resena) => acumulado + resena.calificacion, 0);
    return suma / lista.length;
  });

  async ngOnInit(): Promise<void> {
    const peliculaId = Number(this.id());

    try {
      this.pelicula.set(await this.peliculasService.obtenerPorId(peliculaId));
      this.resenas.set(await this.resenasService.obtenerResenasDePelicula(peliculaId));
    } catch (err) {
      this.errorMensaje.set('No pudimos encontrar esta película.');
    }
  }
}