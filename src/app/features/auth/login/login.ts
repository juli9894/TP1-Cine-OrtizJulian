import { Component, inject } from '@angular/core';
import { FormGroup, FormControl, Validators, ReactiveFormsModule } from '@angular/forms';
import { AuthService } from '../../../core/services/auth';

@Component({
  imports: [ReactiveFormsModule],
  selector: 'app-login',
  styleUrl: './login.css',
  templateUrl: './login.html',
})
export class Login {
  private readonly authService = inject(AuthService);

  errorMensaje = '';

  form = new FormGroup({
    email: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.email] }),
    password: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
  });

  async onSubmit(): Promise<void> {
    this.errorMensaje = ''; 
    if (this.form.invalid) return;

    try {
      const { email, password } = this.form.getRawValue();
      await this.authService.iniciarSesion(email, password);
    } catch (err) {
      this.errorMensaje = 'Email o contraseña incorrectos.';
    }
  }
}