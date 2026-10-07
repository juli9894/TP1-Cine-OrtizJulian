import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ReportesService, ItemMasVendido } from '../../../core/services/reportes';

@Component({
    selector: 'app-graficos',
    imports: [RouterLink],
    styleUrl: './graficos.css',
    templateUrl: './graficos.html',
})
export class Graficos implements OnInit {
    private readonly reportesService = inject(ReportesService);

    peliculas = signal<ItemMasVendido[]>([]);
    productos = signal<ItemMasVendido[]>([]);
    errorMensaje = signal('');

    async ngOnInit(): Promise<void> {
        try {
            const [peliculas, productos] = await Promise.all([
                this.reportesService.peliculasMasVistas(),
                this.reportesService.productosMasVendidos(),
            ]);
            this.peliculas.set(peliculas);
            this.productos.set(productos);
        } catch (err) {
            this.errorMensaje.set('No pudimos cargar los gráficos.');
        }
    }

    // Ancho de la barra en % relativo al valor mas alto de la lista -- asi
    // la barra mas grande siempre llega al 100%, sin importar si los
    // numeros reales son chicos o grandes.
    anchoBarra(cantidad: number, items: ItemMasVendido[]): number {
        const maximo = Math.max(...items.map((i) => i.cantidad), 1);
        return (cantidad / maximo) * 100;
    }
}
