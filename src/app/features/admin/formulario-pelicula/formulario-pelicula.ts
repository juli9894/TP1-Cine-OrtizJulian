import { Component, computed, inject, input, OnInit, signal } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { PeliculasService } from '../../../core/services/peliculas';
import { GenerosService } from '../../../core/services/generos';
import { Genero } from '../../../core/models/genero';
import { ClasificacionPelicula } from '../../../core/models/pelicula';

@Component({
    imports: [ReactiveFormsModule, RouterLink],
    selector: 'app-formulario-pelicula',
    styleUrl: './formulario-pelicula.css',
    templateUrl: './formulario-pelicula.html',
})
export class FormularioPelicula implements OnInit {
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
    });

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
                });

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
        };

        try {
            if (this.esEdicion()) {
                await this.peliculasService.actualizar(Number(this.id()), datos, this.generosSeleccionados());
            } else {
                await this.peliculasService.crear(datos, this.generosSeleccionados());
            }
            this.router.navigateByUrl('/admin/peliculas');
        } catch (err) {
            this.errorPelicula.set('No pudimos guardar la película. Probá de nuevo.');
        }
    }
}