import { Component, effect, inject, signal } from '@angular/core';
import { RouterOutlet, RouterLink } from '@angular/router';
import { AuthService } from './core/services/auth';
import { PerfilesService } from './core/services/perfiles';
import { CandyBar } from './features/candy-bar/candy-bar';
import { Proximamente } from './features/proximamente/proximamente';

@Component({
  imports: [RouterOutlet, RouterLink, CandyBar, Proximamente],
  selector: 'app-root',
  styleUrl: './app.css',
  templateUrl: './app.html',
})
export class App {
  protected readonly authService = inject(AuthService);
  private readonly perfilesService = inject(PerfilesService);

  protected readonly esAdmin = signal(false);
  protected readonly esEmpleado = signal(false);
  protected readonly nombreBienvenida = signal<string | null>(null);

  constructor() {
    effect(() => {
      const usuario = this.authService.usuarioActual();

      if (!usuario) {
        this.esAdmin.set(false);
        this.esEmpleado.set(false);
        return;
      }

      this.perfilesService.obtenerPorId(usuario.id).then((perfil) => {
        this.esAdmin.set(perfil.rol === 'admin');
        this.esEmpleado.set(perfil.rol === 'empleado' || perfil.rol === 'admin');

        if (this.authService.bienvenidaPendiente()) {
          this.authService.bienvenidaPendiente.set(false);
          this.nombreBienvenida.set(perfil.nombre);
          setTimeout(() => this.nombreBienvenida.set(null), 3500);
        }
      });
    });
  }

  async cerrarSesion(): Promise<void> {
    await this.authService.cerrarSesion();
  }
}