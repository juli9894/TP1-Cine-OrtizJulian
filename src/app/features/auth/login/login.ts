import { Component, inject, signal } from '@angular/core';
import { FormGroup, FormControl, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth';

@Component({
  imports: [ReactiveFormsModule, RouterLink],
  selector: 'app-login',
  styleUrl: './login.css',
  templateUrl: './login.html',
})
export class Login {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  errorMensaje = signal('');

  form = new FormGroup({
    email: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.email] }),
    password: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
  });

  async onSubmit(): Promise<void> {
    this.errorMensaje.set('');
    if (this.form.invalid) return;

    try {
      const { email, password } = this.form.getRawValue();
      await this.authService.iniciarSesion(email, password);
      this.authService.bienvenidaPendiente.set(true);
      this.router.navigateByUrl('/');
    } catch (err) {
      this.errorMensaje.set('Email o contraseña incorrectos.');
    }
  }
}