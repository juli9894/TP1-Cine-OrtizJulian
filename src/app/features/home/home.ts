import { Component, inject, OnInit, signal } from '@angular/core';
import { PeliculasService } from '../../core/services/peliculas';
import { Pelicula } from '../../core/models/pelicula';
import { GenerosService } from '../../core/services/generos';
import { Genero } from '../../core/models/genero';
import { RouterLink } from '@angular/router';
import { calcularEstadoVenta, EstadoVentaPelicula } from '../../core/utils/preventa';


@Component({
    imports: [RouterLink],
    selector: 'app-home',
    styleUrl: './home.css',
    templateUrl: './home.html',
})
export class Home implements OnInit {
    private readonly peliculasService = inject(PeliculasService);
    private readonly generosService = inject(GenerosService);

    top3 = signal<Pelicula[]>([]);
    generos = signal<Genero[]>([]);
    resultados = signal<Pelicula[]>([]);
    texto = signal('');
    generoId = signal<number | null>(null);

    async ngOnInit(): Promise<void> {
        this.top3.set(await this.peliculasService.obtenerTop3());
        this.generos.set(await this.generosService.obtenerTodos());
        await this.buscarPeliculas();    
    }

    async buscarPeliculas(): Promise<void> {
        this.resultados.set(await this.peliculasService.buscar(this.texto(), this.generoId()));
    }

    onTextoChange(evento: Event): void {
        const input = evento.target as HTMLInputElement;
        this.texto.set(input.value);
        this.buscarPeliculas();
    }

    onGeneroChange(evento: Event): void {
        const select = evento.target as HTMLSelectElement;
        const valor = select.value;
        this.generoId.set(valor === '' ? null : Number(valor));
        this.buscarPeliculas();
    }

    // El buscador mezcla peliculas ya estrenadas con las de Proximamente
    // (preventa o todavia sin fecha de venta abierta) -- esta funcion le
    // dice al template que estado tiene cada una para poder mostrar un
    // distintivo visual, sin la cual se verian identicas a una pelicula
    // en cartelera normal.
    estadoVenta(pelicula: Pelicula): EstadoVentaPelicula {
        return calcularEstadoVenta(pelicula);
    }
}