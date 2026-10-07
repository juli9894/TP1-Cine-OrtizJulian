import { Component, inject, input, OnInit, signal, computed } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { SalasService } from '../../../core/services/salas';
import { ComponenteConCambiosSinGuardar } from '../../../core/guards/confirmar-salida-guard';

@Component({
    imports: [ReactiveFormsModule, RouterLink],
    selector: 'app-formulario-sala',
    styleUrl: './formulario-sala.css',
    templateUrl: './formulario-sala.html',
})
export class FormularioSala implements OnInit, ComponenteConCambiosSinGuardar {
    private readonly salasService = inject(SalasService);
    private readonly router = inject(Router);
    private readonly formBuilder = inject(FormBuilder);

    id = input<string>();

    esEdicion = computed(() => this.id() !== undefined);
    errorMensaje = signal('');

    formularioSala = this.formBuilder.nonNullable.group({
        nombre: ['', Validators.required],
    });

    async ngOnInit(): Promise<void> {
        if (this.id() !== undefined) {
            const sala = await this.salasService.obtenerPorId(Number(this.id()));
            this.formularioSala.patchValue({ nombre: sala.nombre });
        }
    }

    async guardar(): Promise<void> {
        if (this.formularioSala.invalid) return;

        const valores = this.formularioSala.getRawValue();
        this.errorMensaje.set('');

        try {
            if (this.esEdicion()) {
                await this.salasService.actualizar(Number(this.id()), valores.nombre);
            } else {
                await this.salasService.crear(valores.nombre);
            }

            this.formularioSala.markAsPristine();

            this.router.navigateByUrl('/admin/salas');
        } catch (err) {
            this.errorMensaje.set('No pudimos guardar la sala. Probá de nuevo.');
        }
    }


    hayCambiosSinGuardar(): boolean {
        return this.formularioSala.dirty;
    }
}