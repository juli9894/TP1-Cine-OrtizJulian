import { Component, computed, inject, input, OnInit, signal } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { PeliculasService } from '../../../core/services/peliculas';
import { SalasService } from '../../../core/services/salas';
import { FuncionesService } from '../../../core/services/funciones';
import { Pelicula } from '../../../core/models/pelicula';
import { Sala } from '../../../core/models/sala';
import { FormatoFuncion, IdiomaFuncion } from '../../../core/models/funcion';

@Component({
    imports: [ReactiveFormsModule],
    selector: 'app-formulario-funcion',
    styleUrl: './formulario-funcion.css',
    templateUrl: './formulario-funcion.html',
})
export class FormularioFuncion implements OnInit {
    private readonly peliculasService = inject(PeliculasService);
    private readonly salasService = inject(SalasService);
    private readonly funcionesService = inject(FuncionesService);
    private readonly formBuilder = inject(FormBuilder);
    private readonly router = inject(Router);

    id = input<string>();
    esEdicion = computed(() => this.id() !== undefined);

    peliculas = signal<Pelicula[]>([]);
    salas = signal<Sala[]>([]);
    errorCarga = signal('');
    errorFuncion = signal('');

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

            if (this.id() !== undefined) {
                const funcion = await this.funcionesService.obtenerPorId(Number(this.id()));
                this.formularioFuncion.patchValue({
                    peliculaId: String(funcion.peliculaId),
                    salaId: String(funcion.salaId),
                    horario: aDatetimeLocal(funcion.horario),
                    formato: funcion.formato,
                    idioma: funcion.idioma,
                });
            }
        } catch (err) {
            this.errorCarga.set('No pudimos cargar los datos del formulario.');
        }
    }

    async guardar(): Promise<void> {
        if (this.formularioFuncion.invalid) return;

        const valores = this.formularioFuncion.getRawValue();
        this.errorFuncion.set('');

        const datos = {
            peliculaId: Number(valores.peliculaId),
            salaId: Number(valores.salaId),
            horario: new Date(valores.horario).toISOString(),
            formato: valores.formato,
            idioma: valores.idioma,
        };

        try {
            if (this.esEdicion()) {
                await this.funcionesService.actualizar(Number(this.id()), datos);
            } else {
                await this.funcionesService.crear(datos);
            }
            this.router.navigateByUrl('/admin/funciones');
        } catch (err) {
            if (
                typeof err === 'object' &&
                err !== null &&
                'code' in err &&
                err.code === 'P0001' &&
                'message' in err
            ) {
                this.errorFuncion.set(String(err.message));
            } else {
                this.errorFuncion.set('No pudimos guardar la función. Probá de nuevo.');
            }
        }
    }
}

function aDatetimeLocal(horarioUtc: string): string {
    const fecha = new Date(horarioUtc);
    const año = fecha.getFullYear();
    const mes = String(fecha.getMonth() + 1).padStart(2, '0');
    const dia = String(fecha.getDate()).padStart(2, '0');
    const horas = String(fecha.getHours()).padStart(2, '0');
    const minutos = String(fecha.getMinutes()).padStart(2, '0');

    return `${año}-${mes}-${dia}T${horas}:${minutos}`;
}