import { Component, ElementRef, OnDestroy, inject, signal, viewChild } from '@angular/core';
import jsQR from 'jsqr';
import { ReservasService } from '../../../core/services/reservas';
import { ReservaDetalle } from '../../../core/models/reserva';

@Component({
    selector: 'app-validar-entrada',
    styleUrl: './validar-entrada.css',
    templateUrl: './validar-entrada.html',
})
export class ValidarEntrada implements OnDestroy {
    private readonly reservasService = inject(ReservasService);

    // viewChild() en vez de @ViewChild clasico -- misma logica que usamos en
    // los computed(): la referencia al <video>/<canvas> del template queda
    // disponible como una signal, consistente con el resto de la app.
    private readonly videoRef = viewChild<ElementRef<HTMLVideoElement>>('video');
    private readonly canvasRef = viewChild<ElementRef<HTMLCanvasElement>>('canvas');

    escaneando = signal(false);
    codigoManual = signal('');
    resultado = signal<ReservaDetalle | null>(null);
    errorMensaje = signal('');
    validando = signal(false);

    private stream: MediaStream | null = null;
    private idFrame: number | null = null;

    async iniciarCamara(): Promise<void> {
        this.errorMensaje.set('');
        this.resultado.set(null);

        try {
            // facingMode: 'environment' pide la camara trasera del celular
            // (la que apunta "para afuera") -- la que usaria un empleado
            // real para escanear la pantalla de otra persona.
            this.stream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: 'environment' },
            });

            const video = this.videoRef()?.nativeElement;
            if (!video) return;

            video.srcObject = this.stream;
            await video.play();
            this.escaneando.set(true);
            this.leerFrame();
        } catch (err) {
            this.errorMensaje.set('No pudimos acceder a la cámara. Podés cargar el código manualmente.');
        }
    }

    detenerCamara(): void {
        this.escaneando.set(false);

        if (this.idFrame !== null) {
            cancelAnimationFrame(this.idFrame);
            this.idFrame = null;
        }

        this.stream?.getTracks().forEach((track) => track.stop());
        this.stream = null;
    }

    // Se llama a si misma con requestAnimationFrame en loop mientras
    // escaneando() sea true -- lee un cuadro del video, lo vuelca a un
    // <canvas> oculto para poder leer sus pixeles (un <video> no los expone
    // directo) y le pasa esos pixeles a jsQR para que busque un codigo QR.
    // A diferencia del callback de Supabase Realtime, requestAnimationFrame
    // SI esta parcheado por Zone.js, asi que .set() aca adentro dispara
    // deteccion de cambios sola, sin necesitar ngZone.run().
    private leerFrame(): void {
        const video = this.videoRef()?.nativeElement;
        const canvas = this.canvasRef()?.nativeElement;
        if (!video || !canvas || !this.escaneando()) return;

        if (video.readyState === video.HAVE_ENOUGH_DATA) {
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            const contexto = canvas.getContext('2d');

            if (contexto) {
                contexto.drawImage(video, 0, 0, canvas.width, canvas.height);
                const imagen = contexto.getImageData(0, 0, canvas.width, canvas.height);
                const codigo = jsQR(imagen.data, imagen.width, imagen.height);

                if (codigo) {
                    this.detenerCamara();
                    this.validar(codigo.data);
                    return;
                }
            }
        }

        this.idFrame = requestAnimationFrame(() => this.leerFrame());
    }

    onCodigoManualChange(evento: Event): void {
        this.codigoManual.set((evento.target as HTMLInputElement).value);
    }

    validarManual(): void {
        const codigo = this.codigoManual();
        this.codigoManual.set('');
        this.validar(codigo);
    }

    async validar(codigo: string): Promise<void> {
        const codigoLimpio = codigo.trim();
        if (!codigoLimpio) return;

        this.errorMensaje.set('');
        this.resultado.set(null);
        this.validando.set(true);

        try {
            // Paso 1: la mutacion atomica (marca el QR como usado, o tira
            // una excepcion con el motivo -- ver migracion 0019).
            await this.reservasService.validarReserva(codigoLimpio);
            // Paso 2: recien si el paso 1 funciono, traemos los datos para
            // mostrar en pantalla que corresponde entregar.
            this.resultado.set(await this.reservasService.obtenerPorQrCode(codigoLimpio));
        } catch (err) {
            // El mensaje que tira la funcion de Postgres (ej. "Este codigo
            // ya fue validado antes") llega tal cual en err.message -- mismo
            // patron de type narrowing sobre unknown que ya usamos en el
            // resto de la app, sin "any".
            const mensaje =
                err && typeof err === 'object' && 'message' in err
                    ? String((err as { message: unknown }).message)
                    : 'No pudimos validar este código.';
            this.errorMensaje.set(mensaje);
        } finally {
            this.validando.set(false);
        }
    }

    ngOnDestroy(): void {
        this.detenerCamara();
    }
}
