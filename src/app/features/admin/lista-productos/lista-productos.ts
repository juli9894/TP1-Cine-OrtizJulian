import { Component, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ProductosService } from '../../../core/services/productos';
import { Producto } from '../../../core/models/producto';

@Component({
    imports: [RouterLink],
    selector: 'app-lista-productos',
    styleUrl: './lista-productos.css',
    templateUrl: './lista-productos.html',
})
export class ListaProductos implements OnInit {
    private readonly productosService = inject(ProductosService);

    productos = signal<Producto[]>([]);
    errorMensaje = signal('');

    async ngOnInit(): Promise<void> {
        await this.cargarProductos();
    }

    async cargarProductos(): Promise<void> {
        this.productos.set(await this.productosService.obtenerActivos());
    }

    async eliminarProducto(id: number): Promise<void> {
        this.errorMensaje.set('');

        if (!confirm('¿Seguro que querés eliminar este producto?')) return;

        try {
            await this.productosService.eliminar(id);
            await this.cargarProductos();
        } catch (err) {
            this.errorMensaje.set('No pudimos eliminar el producto. Probá de nuevo.');
        }
    }
}