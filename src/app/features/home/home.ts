import { Component, inject, OnInit, signal } from '@angular/core';
import { PeliculasService } from '../../core/services/peliculas';
import { Pelicula } from '../../core/models/pelicula';

@Component({
    imports: [],
    selector: 'app-home',
    styleUrl: './home.css',
    templateUrl: './home.html',
})
export class Home implements OnInit {
    private readonly peliculasService = inject(PeliculasService);

    top3 = signal<Pelicula[]>([]);

    async ngOnInit(): Promise<void> {
        this.top3.set(await this.peliculasService.obtenerTop3());
    }
}