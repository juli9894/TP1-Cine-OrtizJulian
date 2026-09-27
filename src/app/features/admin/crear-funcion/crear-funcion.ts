import { Component, inject, OnInit, signal } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { PeliculasService } from '../../../core/services/peliculas';
import { SalasService } from '../../../core/services/salas';
import { FuncionesService } from '../../../core/services/funciones';
import { Pelicula } from '../../../core/models/pelicula';
import { Sala } from '../../../core/models/sala';
import { FormatoFuncion, IdiomaFuncion } from '../../../core/models/funcion';

@Component({
    imports: [ReactiveFormsModule],
    selector: 'app-crear-funcion',
    styleUrl: './crear-funcion.css',
    templateUrl: './crear-funcion.html',
})
export class CrearFuncion implements OnInit {
    private readonly peliculasService = inject(PeliculasService);
    private readonly salasService = inject(SalasService);
    private readonly funcionesService = inject(FuncionesService);
    private readonly formBuilder = inject(FormBuilder);

    peliculas = signal<Pelicula[]>([]);
    salas = signal<Sala[]>([]);
    errorCarga = signal('');
    errorFuncion = signal('');
    mensajeExito = signal('');

    formularioFuncion = this.formBuilder.nonNullable.group({
        peliculaId: ['', Validators.required],
        salaId: ['', Validators.required],
        horario: ['', Validators.required],
        formato: ['2D' as FormatoFuncion, Validators.required],
        idioma: ['castellano' as IdiomaFuncion, Validators.required],
    });

    async ngOnInit(): Promise<void> {
        try {
            this.peliculas.set(await this.peliculasService.buscar('', null));
            this.salas.set(await this.salasService.obtenerTodas());
        } catch (err) {
            this.errorCarga.set('No pudimos cargar las películas y salas.');
        }
    }

    async crearFuncion(): Promise<void> {
        if (this.formularioFuncion.invalid) return;

        const valores = this.formularioFuncion.getRawValue();
        const horarioUtc = new Date(valores.horario).toISOString();

        try {
            await this.funcionesService.crear({
                peliculaId: Number(valores.peliculaId),
                salaId: Number(valores.salaId),
                horario: horarioUtc,
                formato: valores.formato,
                idioma: valores.idioma,
            });

            this.mensajeExito.set('Función creada correctamente.');
            this.errorFuncion.set('');
            this.formularioFuncion.reset();
        } catch (err) {
            this.mensajeExito.set('');

            if (
                typeof err === 'object' &&
                err !== null &&
                'code' in err &&
                err.code === 'P0001' &&
                'message' in err
            ) {
                this.errorFuncion.set(String(err.message));
            } else {
                this.errorFuncion.set('No pudimos crear la función. Probá de nuevo.');
            }
        }
    }
}