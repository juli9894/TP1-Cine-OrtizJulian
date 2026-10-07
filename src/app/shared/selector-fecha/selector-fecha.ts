import { Component, effect, input, output, signal } from '@angular/core';

// Selector de fecha (y opcionalmente hora) armado con inputs individuales
// -- dia, mes, año, hora, minuto -- en vez del selector nativo del
// navegador (<input type="date">/"datetime-local">), que en el celular se
// muestra como una rueda de scroll infinito. Pedido explicito del
// enunciado del TP: "prohibido usar selectores nativos confusos o scrolls
// infinitos para fecha y hora: diseñar selectores directos, accesibles e
// intuitivos".
//
// Cada <input type="number"> trae de fabrica flechitas de +/- (el
// "selector") Y permite tipear el numero directo -- las dos formas de
// cargarlo conviven solas, no hace falta codigo extra para eso.
//
// Es un componente "tonto": no sabe nada de Reactive Forms ni de que
// pantalla lo esta usando. El padre le pasa un valorInicial y escucha
// (cambio) para guardarse el resultado en su propio signal -- mas simple
// de explicar que implementar ControlValueAccessor para que ande como un
// FormControl mas, y acá no hace falta esa integracion.
@Component({
    selector: 'app-selector-fecha',
    styleUrl: './selector-fecha.css',
    templateUrl: './selector-fecha.html',
})
export class SelectorFecha {
    // Si es false, solo se muestran dia/mes/año (para una fecha de
    // estreno, que en la base es una columna 'date' sin hora).
    conHora = input<boolean>(false);

    // 'YYYY-MM-DD' si conHora() es false, 'YYYY-MM-DDTHH:mm' si es true --
    // mismo formato que ya devolvian los inputs nativos que reemplaza, asi
    // el resto de cada formulario no tiene que cambiar su forma de leer la
    // fecha.
    valorInicial = input<string>('');

    cambio = output<string>();

    private readonly anioActual = new Date().getFullYear();

    // Solo hacen falta el año en curso y el que sigue -- ninguna pelicula
    // ni funcion de este sistema necesita programarse mas adelante que
    // eso, y el unico motivo real para "el año que sigue" es cargar algo
    // para los ultimos dias de diciembre.
    readonly aniosDisponibles = [this.anioActual, this.anioActual + 1];

    // Listas de opciones para los <select> de dia/mes/hora/minuto -- el
    // mismo criterio que aniosDisponibles arriba: un desplegable con
    // valores ya validos, en vez de dejar que se tipee cualquier cosa.
    readonly diasDisponibles = Array.from({ length: 31 }, (_, i) => i + 1);
    readonly mesesDisponibles = Array.from({ length: 12 }, (_, i) => i + 1);
    readonly horasDisponibles = Array.from({ length: 24 }, (_, i) => i);
    readonly minutosDisponibles = [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55];

    // Un <label for="..."> necesita que el id al que apunta sea unico en
    // todo el documento. Si el dia de mañana se usan dos SelectorFecha
    // juntos en la misma pantalla, este contador evita que sus ids se
    // pisen entre si.
    private static siguienteId = 0;
    readonly idInstancia = SelectorFecha.siguienteId++;

    dia = signal(1);
    mes = signal(1);
    anio = signal(this.anioActual);
    hora = signal(0);
    minuto = signal(0);

    constructor() {
        // Cada vez que el padre nos pasa un valorInicial nuevo (por
        // ejemplo, al terminar de cargar los datos de una funcion
        // existente para editarla), recalculamos los 5 campos a partir de
        // ese valor y le avisamos al padre del resultado -- asi el padre
        // siempre tiene un valor sincronizado, incluso antes de que el
        // usuario toque nada.
        effect(() => {
            const valor = this.valorInicial();

            // Bug real encontrado y corregido: ESTE string lo armamos
            // nosotros mismos en emitirCambio(), asi que lo parseamos a
            // mano (partiendo por '-'/'T'/':') en vez de pasarlo por
            // new Date(valor). Motivo: en JS, un string de solo fecha
            // ("2026-10-06") se interpreta como medianoche UTC, pero un
            // string con hora ("2026-10-06T20:30") se interpreta en hora
            // LOCAL -- dos reglas de parseo distintas para el mismo tipo
            // de string. En un huso horario negativo (Argentina, UTC-3),
            // la medianoche UTC cae el dia anterior en hora local, asi
            // que getDate() devolvia un dia menos del que decia el
            // string. Eso generaba un string nuevo (un dia atras) que se
            // emitia de vuelta al padre, el padre lo mandaba de vuelta
            // como valorInicial, y el efecto lo volvia a correr -- un
            // loop infinito que Angular corta con el error NG0103.
            // Parseando el string a mano, sin pasar nunca por Date(), el
            // resultado siempre es estable (mismo string de entrada,
            // mismos dia/mes/año calculados).
            if (valor) {
                const [fechaParte, horaParte] = valor.split('T');
                const [anio, mes, dia] = fechaParte.split('-').map(Number);

                this.dia.set(dia);
                this.mes.set(mes);
                this.anio.set(clamp(anio, this.anioActual, this.anioActual + 1));

                if (this.conHora() && horaParte) {
                    const [hora, minuto] = horaParte.split(':').map(Number);
                    this.hora.set(hora);
                    this.minuto.set(redondearA5(minuto));
                }
            } else {
                const ahora = new Date();
                this.dia.set(ahora.getDate());
                this.mes.set(ahora.getMonth() + 1);
                this.anio.set(clamp(ahora.getFullYear(), this.anioActual, this.anioActual + 1));

                if (this.conHora()) {
                    this.hora.set(ahora.getHours());
                    this.minuto.set(redondearA5(ahora.getMinutes()));
                }
            }

            this.emitirCambio();
        });
    }

    onDiaChange(evento: Event): void {
        this.dia.set(clamp(numeroDesde(evento), 1, 31));
        this.emitirCambio();
    }

    onMesChange(evento: Event): void {
        this.mes.set(clamp(numeroDesde(evento), 1, 12));
        this.emitirCambio();
    }

    onAnioChange(evento: Event): void {
        this.anio.set(clamp(numeroDesde(evento), this.anioActual, this.anioActual + 1));
        this.emitirCambio();
    }

    onHoraChange(evento: Event): void {
        this.hora.set(clamp(numeroDesde(evento), 0, 23));
        this.emitirCambio();
    }

    onMinutoChange(evento: Event): void {
        this.minuto.set(redondearA5(clamp(numeroDesde(evento), 0, 59)));
        this.emitirCambio();
    }

    // Para mostrar "08" en vez de "8" en las opciones de Hora/Minuto --
    // el valor numerico de adentro (hora/minuto signals) no cambia, esto
    // es pura cuestion de texto en pantalla.
    pad(numero: number): string {
        return String(numero).padStart(2, '0');
    }

    private emitirCambio(): void {
        const dd = String(this.dia()).padStart(2, '0');
        const mm = String(this.mes()).padStart(2, '0');
        const yyyy = this.anio();

        if (!this.conHora()) {
            this.cambio.emit(`${yyyy}-${mm}-${dd}`);
            return;
        }

        const hh = String(this.hora()).padStart(2, '0');
        const min = String(this.minuto()).padStart(2, '0');
        this.cambio.emit(`${yyyy}-${mm}-${dd}T${hh}:${min}`);
    }
}

function numeroDesde(evento: Event): number {
    return Number((evento.target as HTMLSelectElement).value);
}

function clamp(valor: number, minimo: number, maximo: number): number {
    if (Number.isNaN(valor)) return minimo;
    return Math.min(Math.max(valor, minimo), maximo);
}

// Redondea al multiplo de 5 mas cercano, tope en 55 -- asi "minuto" vive
// siempre en {0,5,10,...,55}, aunque el valor de origen (al editar una
// funcion existente) no caiga justo en esa grilla (ej. 47 -> 45).
function redondearA5(minutos: number): number {
    return Math.min(55, Math.round(minutos / 5) * 5);
}
