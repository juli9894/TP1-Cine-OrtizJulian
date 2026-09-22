import { Component, computed, inject, input, OnInit, signal } from '@angular/core';
import { PeliculasService } from '../../core/services/peliculas';
import { ResenasService } from '../../core/services/resenas';
import { AuthService } from '../../core/services/auth';
import { Pelicula } from '../../core/models/pelicula';
import { Resena } from '../../core/models/resena';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';

@Component({
  imports: [ReactiveFormsModule],
  selector: 'app-pelicula-detalle',
  styleUrl: './pelicula-detalle.css',
  templateUrl: './pelicula-detalle.html',
})
export class PeliculaDetalle implements OnInit {
  private readonly peliculasService = inject(PeliculasService);
  private readonly resenasService = inject(ResenasService);
  private readonly formBuilder = inject(FormBuilder);
  readonly authService = inject(AuthService);

  formularioResena = this.formBuilder.nonNullable.group({
    calificacion: [0, [Validators.required, Validators.min(1)]],
    comentario: ['', Validators.maxLength(300)],
  });

  id = input.required<string>();
  pelicula = signal<Pelicula | null>(null);
  resenas = signal<Resena[]>([]);
  errorMensaje = signal('');
  errorResena = signal('');

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

  async enviarResena(): Promise<void> {
    if (this.formularioResena.invalid) return;

    const peliculaId = Number(this.id());
    const { calificacion, comentario } = this.formularioResena.getRawValue();

    try {
      await this.resenasService.crearResena(peliculaId, calificacion, comentario);
      this.resenas.set(await this.resenasService.obtenerResenasDePelicula(peliculaId));
      this.formularioResena.reset();
      this.errorResena.set('');
    }catch (err) {
      if (typeof err === 'object' && err !== null && 'code' in err && err.code === '23505') {
        this.errorResena.set('Ya dejaste una reseña para esta película.');
      } else {
        this.errorResena.set('No pudimos guardar tu reseña. Probá de nuevo.');
      }
    }
  }
}