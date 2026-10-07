import { Component, inject, input, OnInit, signal, computed } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { CombosService } from '../../../core/services/combos';
import { ComponenteConCambiosSinGuardar } from '../../../core/guards/confirmar-salida-guard';

@Component({
    imports: [ReactiveFormsModule, RouterLink],
    selector: 'app-formulario-combo',
    styleUrl: './formulario-combo.css',
    templateUrl: './formulario-combo.html',
})
export class FormularioCombo implements OnInit, ComponenteConCambiosSinGuardar {
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
        // Opcional, mismo criterio que en productos: no obligamos a
        // recargar los combos existentes con una imagen.
        imagenUrl: [''],
    });

    async ngOnInit(): Promise<void> {
        if (this.id() !== undefined) {
            const combo = await this.combosService.obtenerPorId(Number(this.id()));
            this.formularioCombo.patchValue({
                nombre: combo.nombre,
                descripcion: combo.descripcion,
                precio: combo.precio,
                imagenUrl: combo.imagenUrl ?? '',
            });
        }
    }

    async guardar(): Promise<void> {
        if (this.formularioCombo.invalid) return;

        const valores = this.formularioCombo.getRawValue();
        this.errorMensaje.set('');

        const datos = {
            nombre: valores.nombre,
            descripcion: valores.descripcion,
            precio: valores.precio,
            imagenUrl: valores.imagenUrl.trim() === '' ? null : valores.imagenUrl.trim(),
        };

        try {
            if (this.esEdicion()) {
                await this.combosService.actualizar(Number(this.id()), datos);
            } else {
                await this.combosService.crear(datos);
            }

            this.formularioCombo.markAsPristine();

            this.router.navigateByUrl('/admin/combos');
        } catch (err) {
            this.errorMensaje.set('No pudimos guardar el combo. Probá de nuevo.');
        }
    }

    // Lo usa confirmarSalidaGuard (canDeactivate) para decidir si hay que
    // preguntar antes de abandonar esta pantalla. 'dirty' es una propiedad
    // que Angular mantiene sola en cualquier FormGroup/FormControl: se pone
    // en true apenas el usuario toca un campo, y volvemos a false a mano con
    // markAsPristine() justo antes de navegar tras guardar con exito (arriba),
    // para no preguntar '¿salir sin guardar?' justo despues de guardar.
    hayCambiosSinGuardar(): boolean {
        return this.formularioCombo.dirty;
    }
}
