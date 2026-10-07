import { Component, inject, input, OnInit, signal, computed } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { ProductosService } from '../../../core/services/productos';
import { ComponenteConCambiosSinGuardar } from '../../../core/guards/confirmar-salida-guard';

@Component({
    imports: [ReactiveFormsModule, RouterLink],
    selector: 'app-formulario-producto',
    styleUrl: './formulario-producto.css',
    templateUrl: './formulario-producto.html',
})
export class FormularioProducto implements OnInit, ComponenteConCambiosSinGuardar {
    private readonly productosService = inject(ProductosService);
    private readonly router = inject(Router);
    private readonly formBuilder = inject(FormBuilder);

    id = input<string>();

    esEdicion = computed(() => this.id() !== undefined);
    errorMensaje = signal('');

    formularioProducto = this.formBuilder.nonNullable.group({
        nombre: ['', Validators.required],
        categoria: ['', Validators.required],
        precio: [0, [Validators.required, Validators.min(0)]],
        // Opcional a proposito: no vamos a obligar a recargar todos los
        // productos ya existentes con una imagen antes de poder tocar
        // cualquier otra cosa del catalogo.
        imagenUrl: [''],
    });

    async ngOnInit(): Promise<void> {
        if (this.id() !== undefined) {
            const producto = await this.productosService.obtenerPorId(Number(this.id()));
            this.formularioProducto.patchValue({
                nombre: producto.nombre,
                categoria: producto.categoria,
                precio: producto.precio,
                imagenUrl: producto.imagenUrl ?? '',
            });
        }
    }

    async guardar(): Promise<void> {
        if (this.formularioProducto.invalid) return;

        const valores = this.formularioProducto.getRawValue();
        this.errorMensaje.set('');

        const datos = {
            nombre: valores.nombre,
            categoria: valores.categoria,
            precio: valores.precio,
            imagenUrl: valores.imagenUrl.trim() === '' ? null : valores.imagenUrl.trim(),
        };

        try {
            if (this.esEdicion()) {
                await this.productosService.actualizar(Number(this.id()), datos);
            } else {
                await this.productosService.crear(datos);
            }

            this.formularioProducto.markAsPristine();

            this.router.navigateByUrl('/admin/productos');
        } catch (err) {
            this.errorMensaje.set('No pudimos guardar el producto. Probá de nuevo.');
        }
    }

    hayCambiosSinGuardar(): boolean {
        return this.formularioProducto.dirty;
    }
}