import { Component, inject, input, OnInit, signal, computed } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { ProductosService } from '../../../core/services/productos';

@Component({
    imports: [ReactiveFormsModule],
    selector: 'app-formulario-producto',
    styleUrl: './formulario-producto.css',
    templateUrl: './formulario-producto.html',
})
export class FormularioProducto implements OnInit {
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
    });

    async ngOnInit(): Promise<void> {
        if (this.id() !== undefined) {
            const producto = await this.productosService.obtenerPorId(Number(this.id()));
            this.formularioProducto.patchValue({
                nombre: producto.nombre,
                categoria: producto.categoria,
                precio: producto.precio,
            });
        }
    }

    async guardar(): Promise<void> {
        if (this.formularioProducto.invalid) return;

        const valores = this.formularioProducto.getRawValue();
        this.errorMensaje.set('');

        try {
            if (this.esEdicion()) {
                await this.productosService.actualizar(Number(this.id()), valores);
            } else {
                await this.productosService.crear(valores);
            }

            this.router.navigateByUrl('/admin/productos');
        } catch (err) {
            this.errorMensaje.set('No pudimos guardar el producto. Probá de nuevo.');
        }
    }
}