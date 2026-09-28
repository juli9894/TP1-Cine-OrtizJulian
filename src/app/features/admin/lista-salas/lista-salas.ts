import { Component, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { SalasService } from '../../../core/services/salas';
import { Sala } from '../../../core/models/sala';

@Component({
    imports: [RouterLink],
    selector: 'app-lista-salas',
    styleUrl: './lista-salas.css',
    templateUrl: './lista-salas.html',
})
export class ListaSalas implements OnInit {
    private readonly salasService = inject(SalasService);

    salas = signal<Sala[]>([]);
    errorMensaje = signal('');

    async ngOnInit(): Promise<void> {
        await this.cargarSalas();
    }

    async cargarSalas(): Promise<void> {
        this.salas.set(await this.salasService.obtenerTodas());
    }

    async eliminarSala(id: number): Promise<void> {
        this.errorMensaje.set('');

        if (!confirm('¿Seguro que querés eliminar esta sala?')) return;

        try {
            await this.salasService.eliminar(id);
            await this.cargarSalas();
        } catch (err) {
            if (
                typeof err === 'object' &&
                err !== null &&
                'code' in err &&
                err.code === '23503'
            ) {
                this.errorMensaje.set('No se puede eliminar: esta sala tiene funciones asignadas.');
            } else {
                this.errorMensaje.set('No pudimos eliminar la sala. Probá de nuevo.');
            }
        }
    }
}