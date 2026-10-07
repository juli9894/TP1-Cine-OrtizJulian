import { Component, computed, inject, input, OnInit, signal } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { DatePipe } from '@angular/common';
import { PeliculasService } from '../../../core/services/peliculas';
import { SalasService } from '../../../core/services/salas';
import { FuncionesService } from '../../../core/services/funciones';
import { Pelicula } from '../../../core/models/pelicula';
import { Sala } from '../../../core/models/sala';
import { FormatoFuncion, IdiomaFuncion } from '../../../core/models/funcion';
import { SelectorFecha } from '../../../shared/selector-fecha/selector-fecha';
import { ComponenteConCambiosSinGuardar } from '../../../core/guards/confirmar-salida-guard';

@Component({
    imports: [ReactiveFormsModule, RouterLink, DatePipe, SelectorFecha],
    selector: 'app-formulario-funcion',
    styleUrl: './formulario-funcion.css',
    templateUrl: './formulario-funcion.html',
})
export class FormularioFuncion implements OnInit, ComponenteConCambiosSinGuardar {
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

    // Que pelicula esta elegida en el <select> en este momento -- separado
    // del FormGroup (mismo criterio que onTextoChange/onGeneroChange en
    // Home) para poder mostrar su detalle (poster, duracion, fecha de
    // estreno) al lado del formulario sin tener que leer el control del
    // form directo en el template.
    peliculaIdSeleccionada = signal<number | null>(null);
    peliculaSeleccionada = computed(() =>
        this.peliculas().find((p) => p.id === this.peliculaIdSeleccionada()) ?? null,
    );

    onPeliculaChange(evento: Event): void {
        const select = evento.target as HTMLSelectElement;
        const valor = select.value;
        this.peliculaIdSeleccionada.set(valor === '' ? null : Number(valor));
    }

    formularioFuncion = this.formBuilder.nonNullable.group({
        peliculaId: ['', Validators.required],
        salaId: ['', Validators.required],
        formato: ['2D' as FormatoFuncion, Validators.required],
        idioma: ['castellano' as IdiomaFuncion, Validators.required],
    });

    // El horario vive aparte del FormGroup reactivo: SelectorFecha no es
    // un FormControl (no implementa ControlValueAccessor), es un
    // componente comun que nos avisa los cambios por su output `cambio`.
    // Lo guardamos en este signal y lo leemos en guardar().
    horarioValor = signal('');

    onHorarioChange(valor: string): void {
        this.horarioValor.set(valor);
    }

    async ngOnInit(): Promise<void> {
        try {
            this.peliculas.set(await this.peliculasService.buscar('', null));
            this.salas.set(await this.salasService.obtenerTodas());

            if (this.id() !== undefined) {
                const funcion = await this.funcionesService.obtenerPorId(Number(this.id()));
                this.formularioFuncion.patchValue({
                    peliculaId: String(funcion.peliculaId),
                    salaId: String(funcion.salaId),
                    formato: funcion.formato,
                    idioma: funcion.idioma,
                });
                this.horarioValor.set(aDatetimeLocal(funcion.horario));
                this.peliculaIdSeleccionada.set(funcion.peliculaId);
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
            horario: new Date(this.horarioValor()).toISOString(),
            formato: valores.formato,
            idioma: valores.idioma,
        };

        try {
            if (this.esEdicion()) {
                await this.funcionesService.actualizar(Number(this.id()), datos);
            } else {
                await this.funcionesService.crear(datos);
            }
            this.formularioFuncion.markAsPristine();
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

    hayCambiosSinGuardar(): boolean {
        return this.formularioFuncion.dirty;
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