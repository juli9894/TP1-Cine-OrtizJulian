import { Component, inject, OnInit, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { DatePipe } from '@angular/common';
import { FuncionesService } from '../../../core/services/funciones';
import { PeliculasService } from '../../../core/services/peliculas';
import { SalasService } from '../../../core/services/salas';
import { Funcion } from '../../../core/models/funcion';
import { Pelicula } from '../../../core/models/pelicula';
import { Sala } from '../../../core/models/sala';


@Component({
    imports: [RouterLink, DatePipe],
    selector: 'app-lista-funciones',
    styleUrl: './lista-funciones.css',
    templateUrl: './lista-funciones.html',
})
export class ListaFunciones implements OnInit {
    private readonly funcionesService = inject(FuncionesService);
    private readonly peliculasService = inject(PeliculasService);
    private readonly salasService = inject(SalasService);
    private readonly router = inject(Router);

    funciones = signal<Funcion[]>([]);
    peliculas = signal<Pelicula[]>([]);
    salas = signal<Sala[]>([]);
    errorMensaje = signal('');

    async ngOnInit(): Promise<void> {
        await this.cargarFunciones();
        this.peliculas.set(await this.peliculasService.buscar('', null));
        this.salas.set(await this.salasService.obtenerTodas());
    }

    async cargarFunciones(): Promise<void> {
        this.funciones.set(await this.funcionesService.obtenerTodas());
    }

    nombrePelicula(peliculaId: number): string {
        return this.peliculas().find((p) => p.id === peliculaId)?.titulo ?? '—';
    }

    nombreSala(salaId: number): string {
        return this.salas().find((s) => s.id === salaId)?.nombre ?? '—';
    }

    // Click en la fila (no en los botones de Editar/Eliminar) lleva a la
    // pantalla de seleccion de butacas de esa funcion -- a pedido de
    // Julian, para poder previsualizarla sin tener que ir a buscarla desde
    // la cartelera publica.
    verButacas(funcionId: number): void {
        this.router.navigate(['/funciones', funcionId, 'butacas']);
    }

    async eliminarFuncion(id: number): Promise<void> {
        this.errorMensaje.set('');
        if (!confirm('¿Seguro que querés eliminar esta función?')) return;

        try {
            await this.funcionesService.eliminar(id);
            await this.cargarFunciones();
        } catch (err) {
            if (typeof err === 'object' && err !== null && 'code' in err && err.code === '23503') {
                this.errorMensaje.set('No se puede eliminar: esta función tiene reservas asociadas.');
            } else {
                this.errorMensaje.set('No pudimos eliminar la función. Probá de nuevo.');
            }
        }
    }
}