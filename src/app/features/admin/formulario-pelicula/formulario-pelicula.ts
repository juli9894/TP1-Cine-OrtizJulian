import { Component, computed, inject, input, OnInit, signal } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { PeliculasService } from '../../../core/services/peliculas';
import { GenerosService } from '../../../core/services/generos';
import { Genero } from '../../../core/models/genero';
import { ClasificacionPelicula } from '../../../core/models/pelicula';
import { SelectorFecha } from '../../../shared/selector-fecha/selector-fecha';
import { ComponenteConCambiosSinGuardar } from '../../../core/guards/confirmar-salida-guard';

@Component({
    imports: [ReactiveFormsModule, RouterLink, SelectorFecha],
    selector: 'app-formulario-pelicula',
    styleUrl: './formulario-pelicula.css',
    templateUrl: './formulario-pelicula.html',
})
export class FormularioPelicula implements OnInit, ComponenteConCambiosSinGuardar {
    private readonly peliculasService = inject(PeliculasService);
    private readonly generosService = inject(GenerosService);
    private readonly formBuilder = inject(FormBuilder);
    private readonly router = inject(Router);

    id = input<string>();
    esEdicion = computed(() => this.id() !== undefined);

    generos = signal<Genero[]>([]);
    generosSeleccionados = signal<number[]>([]);
    errorCarga = signal('');
    errorPelicula = signal('');

    formularioPelicula = this.formBuilder.nonNullable.group({
        titulo: ['', Validators.required],
        duracionMinutos: [0, [Validators.required, Validators.min(1)]],
        sinopsis: ['', Validators.required],
        imagenUrl: ['', Validators.required],
        clasificacion: ['ATP' as ClasificacionPelicula, Validators.required],
        diasPreventa: [7, [Validators.required, Validators.min(0)]],
        precioPreventa: [null as number | null],
    });

    // Igual que horarioValor en FormularioFuncion: SelectorFecha no es un
    // FormControl, asi que la fecha de estreno vive en un signal aparte
    // del FormGroup. Por default, hoy -- asi una pelicula nueva que no se
    // piensa poner en "Proximamente" sigue vendiendose normal desde que se
    // crea, sin que el admin tenga que tocar nada extra.
    fechaEstrenoValor = signal(new Date().toISOString().slice(0, 10));

    onFechaEstrenoChange(valor: string): void {
        this.fechaEstrenoValor.set(valor);
    }

    async ngOnInit(): Promise<void> {
        try {
            this.generos.set(await this.generosService.obtenerTodos());

            if (this.id() !== undefined) {
                const peliculaId = Number(this.id());
                const pelicula = await this.peliculasService.obtenerPorId(peliculaId);

                this.formularioPelicula.patchValue({
                    titulo: pelicula.titulo,
                    duracionMinutos: pelicula.duracionMinutos,
                    sinopsis: pelicula.sinopsis,
                    imagenUrl: pelicula.imagenUrl,
                    clasificacion: pelicula.clasificacion,
                    diasPreventa: pelicula.diasPreventa,
                    precioPreventa: pelicula.precioPreventa,
                });
                this.fechaEstrenoValor.set(pelicula.fechaEstreno);

                this.generosSeleccionados.set(await this.peliculasService.obtenerGenerosDe(peliculaId));
            }
        } catch (err) {
            this.errorCarga.set('No pudimos cargar los datos del formulario.');
        }
    }

    onToggleGenero(generoId: number): void {
        const actuales = this.generosSeleccionados();

        if (actuales.includes(generoId)) {
            this.generosSeleccionados.set(actuales.filter((id) => id !== generoId));
        } else {
            this.generosSeleccionados.set([...actuales, generoId]);
        }
    }

    async guardar(): Promise<void> {
        if (this.formularioPelicula.invalid) return;

        const valores = this.formularioPelicula.getRawValue();
        this.errorPelicula.set('');

        const datos = {
            titulo: valores.titulo,
            duracionMinutos: Number(valores.duracionMinutos),
            sinopsis: valores.sinopsis,
            imagenUrl: valores.imagenUrl,
            clasificacion: valores.clasificacion,
            fechaEstreno: this.fechaEstrenoValor(),
            diasPreventa: Number(valores.diasPreventa),
            precioPreventa: valores.precioPreventa === null ? null : Number(valores.precioPreventa),
        };

        try {
            if (this.esEdicion()) {
                await this.peliculasService.actualizar(Number(this.id()), datos, this.generosSeleccionados());
            } else {
                await this.peliculasService.crear(datos, this.generosSeleccionados());
            }
            this.formularioPelicula.markAsPristine();
            this.router.navigateByUrl('/admin/peliculas');
        } catch (err) {
            this.errorPelicula.set('No pudimos guardar la película. Probá de nuevo.');
        }
    }

    // Lo usa confirmarSalidaGuard (canDeactivate) para decidir si hay que
    // preguntar antes de abandonar esta pantalla. 
    hayCambiosSinGuardar(): boolean {
        return this.formularioPelicula.dirty;
    }
}