import { Component, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CombosService } from '../../../core/services/combos';
import { Combo } from '../../../core/models/combo';

@Component({
    imports: [RouterLink],
    selector: 'app-lista-combos',
    styleUrl: './lista-combos.css',
    templateUrl: './lista-combos.html',
})
export class ListaCombos implements OnInit {
    private readonly combosService = inject(CombosService);

    combos = signal<Combo[]>([]);
    errorMensaje = signal('');

    async ngOnInit(): Promise<void> {
        await this.cargarCombos();
    }

    async cargarCombos(): Promise<void> {
        this.combos.set(await this.combosService.obtenerActivos());
    }

    async eliminarCombo(id: number): Promise<void> {
        this.errorMensaje.set('');

        if (!confirm('¿Seguro que querés eliminar este combo?')) return;

        try {
            await this.combosService.eliminar(id);
            await this.cargarCombos();
        } catch (err) {
            this.errorMensaje.set('No pudimos eliminar el combo. Probá de nuevo.');
        }
    }
}