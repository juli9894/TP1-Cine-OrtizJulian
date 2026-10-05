import { Component, inject, input, OnInit, signal, computed } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { CombosService } from '../../../core/services/combos';

@Component({
    imports: [ReactiveFormsModule, RouterLink],
    selector: 'app-formulario-combo',
    styleUrl: './formulario-combo.css',
    templateUrl: './formulario-combo.html',
})
export class FormularioCombo implements OnInit {
    private readonly combosService = inject(CombosService);
    private readonly router = inject(Router);
    private readonly formBuilder = inject(FormBuilder);

    id = input<string>();

    esEdicion = computed(() => this.id() !== undefined);
    errorMensaje = signal('');

    formularioCombo = this.formBuilder.nonNullable.group({
        nombre: ['', Validators.required],
        descripcion: ['', Validators.required],
        precio: [0, [Validators.required, Validators.min(0)]],
    });

    async ngOnInit(): Promise<void> {
        if (this.id() !== undefined) {
            const combo = await this.combosService.obtenerPorId(Number(this.id()));
            this.formularioCombo.patchValue({
                nombre: combo.nombre,
                descripcion: combo.descripcion,
                precio: combo.precio,
            });
        }
    }

    async guardar(): Promise<void> {
        if (this.formularioCombo.invalid) return;

        const valores = this.formularioCombo.getRawValue();
        this.errorMensaje.set('');

        try {
            if (this.esEdicion()) {
                await this.combosService.actualizar(Number(this.id()), valores);
            } else {
                await this.combosService.crear(valores);
            }

            this.router.navigateByUrl('/admin/combos');
        } catch (err) {
            this.errorMensaje.set('No pudimos guardar el combo. Probá de nuevo.');
        }
    }
}