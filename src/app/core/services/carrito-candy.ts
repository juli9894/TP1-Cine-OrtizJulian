import { Injectable, computed, inject, signal } from '@angular/core';
import { ProductosService } from './productos';
import { CombosService } from './combos';
import { ReservasService, ProductoSeleccionado, ComboSeleccionado } from './reservas';
import { Producto } from '../models/producto';
import { Combo } from '../models/combo';

@Injectable({ providedIn: 'root' })
export class CarritoCandyService {
    private readonly productosService = inject(ProductosService);
    private readonly combosService = inject(CombosService);
    private readonly reservasService = inject(ReservasService);

    // Verificamos si ya cargamos el catálogo de productos y combos, para no volver a cargarlo en la misma sesión.
    private catalogoCargado = false;

    productos = signal<Producto[]>([]);
    combos = signal<Combo[]>([]);
    cantidadesProductos = signal<Record<number, number>>({});
    cantidadesCombos = signal<Record<number, number>>({});

    productosPorCategoria = computed(() => {
        const grupos = new Map<string, Producto[]>();
        for (const producto of this.productos()) {
            const lista = grupos.get(producto.categoria) ?? [];
            lista.push(producto);
            grupos.set(producto.categoria, lista);
        }
        return Array.from(grupos.entries());
    });

    productosSeleccionados = computed((): ProductoSeleccionado[] =>
        Object.entries(this.cantidadesProductos())
            .map(([id, cantidad]) => ({ productoId: Number(id), cantidad }))
            .filter((p) => p.cantidad > 0),
    );

    combosSeleccionados = computed((): ComboSeleccionado[] =>
        Object.entries(this.cantidadesCombos())
            .map(([id, cantidad]) => ({ comboId: Number(id), cantidad }))
            .filter((c) => c.cantidad > 0),
    );

    hayAlgoSeleccionado = computed(
        () => this.productosSeleccionados().length > 0 || this.combosSeleccionados().length > 0,
    );

    // Para el contador del botón flotante — suma todas las unidades elegidas
    // (productos + combos).
    cantidadTotal = computed(
        () =>
            this.productosSeleccionados().reduce((acc, p) => acc + p.cantidad, 0) +
            this.combosSeleccionados().reduce((acc, c) => acc + c.cantidad, 0),
    );

    subtotal = computed(() =>
        this.reservasService.calcularTotalCandy(
            this.productosSeleccionados(),
            this.combosSeleccionados(),
            this.productos(),
            this.combos(),
        ),
    );

    itemsSeleccionados = computed(() => {
        const nombresProductos = this.productosSeleccionados().map((p) => {
            const producto = this.productos().find((x) => x.id === p.productoId);
            return `${p.cantidad}x ${producto?.nombre ?? ''}`;
        });
        const nombresCombos = this.combosSeleccionados().map((c) => {
            const combo = this.combos().find((x) => x.id === c.comboId);
            return `${c.cantidad}x ${combo?.nombre ?? ''}`;
        });
        return [...nombresProductos, ...nombresCombos];
    });

    // Carga de catalogo, una sola vez por sesion. 
    async cargarCatalogoSiHaceFalta(): Promise<void> {
        if (this.catalogoCargado) return;
        this.catalogoCargado = true;

        const [productos, combos] = await Promise.all([
            this.productosService.obtenerActivos(),
            this.combosService.obtenerActivos(),
        ]);
        this.productos.set(productos);
        this.combos.set(combos);
    }

    sumarProducto(id: number): void {
        this.cantidadesProductos.update((actual) => ({ ...actual, [id]: (actual[id] ?? 0) + 1 }));
    }

    restarProducto(id: number): void {
        this.cantidadesProductos.update((actual) => ({ ...actual, [id]: Math.max(0, (actual[id] ?? 0) - 1) }));
    }

    sumarCombo(id: number): void {
        this.cantidadesCombos.update((actual) => ({ ...actual, [id]: (actual[id] ?? 0) + 1 }));
    }

    restarCombo(id: number): void {
        this.cantidadesCombos.update((actual) => ({ ...actual, [id]: Math.max(0, (actual[id] ?? 0) - 1) }));
    }

    vaciar(): void {
        this.cantidadesProductos.set({});
        this.cantidadesCombos.set({});
    }
}
