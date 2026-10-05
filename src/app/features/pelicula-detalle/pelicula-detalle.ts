import { Component, computed, inject, input, OnInit, signal } from '@angular/core';
import { PeliculasService } from '../../core/services/peliculas';
import { ResenasService } from '../../core/services/resenas';
import { FuncionesService } from '../../core/services/funciones';
import { AuthService } from '../../core/services/auth';
import { Pelicula } from '../../core/models/pelicula';
import { Resena } from '../../core/models/resena';
import { Funcion } from '../../core/models/funcion';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';

@Component({
  imports: [ReactiveFormsModule, RouterLink],
  selector: 'app-pelicula-detalle',
  styleUrl: './pelicula-detalle.css',
  templateUrl: './pelicula-detalle.html',
})
export class PeliculaDetalle implements OnInit {
  private readonly peliculasService = inject(PeliculasService);
  private readonly resenasService = inject(ResenasService);
  private readonly funcionesService = inject(FuncionesService);
  private readonly formBuilder = inject(FormBuilder);
  readonly authService = inject(AuthService);

  formularioResena = this.formBuilder.nonNullable.group({
    calificacion: [0, [Validators.required, Validators.min(1)]],
    comentario: ['', Validators.maxLength(300)],
  });

  id = input.required<string>();
  pelicula = signal<Pelicula | null>(null);
  resenas = signal<Resena[]>([]);
  funciones = signal<Funcion[]>([]);
  diaSeleccionado = signal<string | null>(null);
  errorMensaje = signal('');
  errorResena = signal('');

  // Solo para pintar las estrellas del selector: así el template nunca lee
  // directo formularioResena.controls.calificacion.value (eso generaba
  // estrellas "pegadas" de un estado viejo después de un reset()).
  calificacionSeleccionada = signal(0);
  estrellaHover = signal(0);

  estrellaMostrada = computed(() => this.estrellaHover() || this.calificacionSeleccionada());

  promedio = computed(() => {
    const lista = this.resenas();
    if (lista.length === 0) return 0;

    const suma = lista.reduce((acumulado, resena) => acumulado + resena.calificacion, 0);
    return suma / lista.length;
  });

  // Agrupa las funciones por día (igual que agrupamos butacas por fila en
  // seleccion-butacas): la clave es la fecha local sin hora, así todas las
  // funciones de un mismo día quedan juntas aunque tengan horarios distintos.
  funcionesPorDia = computed(() => {
    const mapa = new Map<string, Funcion[]>();
    for (const funcion of this.funciones()) {
      const clave = new Date(funcion.horario).toDateString();
      const lista = mapa.get(clave) ?? [];
      lista.push(funcion);
      mapa.set(clave, lista);
    }
    return mapa;
  });

  diasDisponibles = computed(() => Array.from(this.funcionesPorDia().keys()));

  funcionesDelDia = computed(() => {
    const dia = this.diaSeleccionado();
    if (!dia) return [];
    return this.funcionesPorDia().get(dia) ?? [];
  });

  async ngOnInit(): Promise<void> {
    const peliculaId = Number(this.id());

    try {
      const [pelicula, resenas, funciones] = await Promise.all([
        this.peliculasService.obtenerPorId(peliculaId),
        this.resenasService.obtenerResenasDePelicula(peliculaId),
        this.funcionesService.obtenerPorPelicula(peliculaId),
      ]);
      this.pelicula.set(pelicula);
      this.resenas.set(resenas);
      this.funciones.set(funciones);

      if (funciones.length > 0) {
        this.diaSeleccionado.set(new Date(funciones[0].horario).toDateString());
      }
    } catch (err) {
      this.errorMensaje.set('No pudimos encontrar esta película.');
    }
  }

  seleccionarDia(dia: string): void {
    this.diaSeleccionado.set(dia);
  }

  formatearDia(clave: string): string {
    return new Date(clave).toLocaleDateString('es-AR', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
    });
  }

  formatearHora(horarioIso: string): string {
    return new Date(horarioIso).toLocaleTimeString('es-AR', {
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  elegirCalificacion(estrella: number): void {
    this.formularioResena.patchValue({ calificacion: estrella });
    this.calificacionSeleccionada.set(estrella);
  }

  onHoverEstrella(estrella: number): void {
    this.estrellaHover.set(estrella);
  }

  onSalirEstrellas(): void {
    this.estrellaHover.set(0);
  }

  async enviarResena(): Promise<void> {
    if (this.formularioResena.invalid) return;

    const peliculaId = Number(this.id());
    const { calificacion, comentario } = this.formularioResena.getRawValue();

    try {
      await this.resenasService.crearResena(peliculaId, calificacion, comentario);
      this.resenas.set(await this.resenasService.obtenerResenasDePelicula(peliculaId));
      this.formularioResena.reset();
      this.calificacionSeleccionada.set(0);
      this.errorResena.set('');
    } catch (err) {
      if (typeof err === 'object' && err !== null && 'code' in err && err.code === '23505') {
        this.errorResena.set('Ya dejaste una reseña para esta película.');
      } else {
        this.errorResena.set('No pudimos guardar tu reseña. Probá de nuevo.');
      }
    }
  }
}