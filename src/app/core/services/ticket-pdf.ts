import jsPDF from 'jspdf';
import QRCode from 'qrcode';
import { notaTotalPagado } from '../utils/pago';

export interface DatosTicket {
    // La película/función queda opcional: un pedido solo de candy bar (sin
    // butacas ni función elegida) no tiene ninguno de estos datos.
    pelicula?: string;
    // Si viene y no es 'ATP', el ticket aclara la edad mínima y que un
    // menor necesita acompañamiento adulto -- es la "entrada" que pide el
    // enunciado, no solo la pantalla de compra.
    clasificacion?: 'ATP' | '+13' | '+18';
    sala?: string;
    horario?: string;
    formato?: string;
    idioma?: string;
    butacas?: string[];
    items: string[];
    total: number;
    qrCode: string;
    // Desglose opcional de cómo se llegó al total -- sin esto, una compra
    // pagada con cupón/crédito solo mostraba "Total pagado: $0" sin
    // explicar por qué. Si no se pasa (ej. entradas viejas sin este dato
    // guardado todavía), el ticket se ve exactamente igual que antes.
    subtotal?: number;
    descuento?: number;
    creditoAplicado?: number;
}

const DORADO: [number, number, number] = [217, 164, 65];
const GRIS_OSCURO: [number, number, number] = [30, 30, 35];
const GRIS_MEDIO: [number, number, number] = [120, 120, 125];

export async function generarTicketPdf(datos: DatosTicket): Promise<void> {
    // width: 300 -- misma razón que en mis-reservas.ts: mejor generarlo ya
    // grande que depender de que jsPDF agrande una imagen chica al insertarla.
    const qrDataUrl = await QRCode.toDataURL(datos.qrCode, { width: 300 });

    const doc = new jsPDF();
    const margenIzquierdo = 20;
    const margenDerecho = 190;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(22);
    doc.setTextColor(...DORADO);
    doc.text('TP CINE', margenIzquierdo, 22);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(...GRIS_MEDIO);
    doc.text(datos.pelicula ? 'Entrada de cine' : 'Pedido de candy bar', margenIzquierdo, 28);

    doc.setDrawColor(...GRIS_MEDIO);
    doc.line(margenIzquierdo, 33, margenDerecho, 33);

    let y = 45;

    if (datos.pelicula) {
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(17);
        doc.setTextColor(...GRIS_OSCURO);
        doc.text(datos.pelicula, margenIzquierdo, y);
        y += 7;

        if (datos.clasificacion && datos.clasificacion !== 'ATP') {
            const edadMinima = datos.clasificacion === '+18' ? '18' : '13';
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(9);
            doc.setTextColor(...DORADO);
            doc.text(`Apta para mayores de ${edadMinima} años — requiere acompañamiento adulto`, margenIzquierdo, y);
            y += 6;
        }

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(11);
        doc.setTextColor(...GRIS_MEDIO);
        // .filter(Boolean) para no imprimir "Sala undefined" cuando no
        // tenemos el nombre de la sala a mano (ej: mis-reservas no lo pide).
        const detalleFuncion = [datos.sala ?? null, datos.formato, datos.idioma]
            .filter(Boolean)
            .join(' — ');
        doc.text(detalleFuncion, margenIzquierdo, y);
        doc.text(datos.horario ?? '', margenIzquierdo, y + 6);

        y += 18;
    }

    if (datos.butacas && datos.butacas.length > 0) {
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(10);
        doc.setTextColor(...DORADO);
        doc.text('ENTRADAS', margenIzquierdo, y);
        y += 7;

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(11);
        doc.setTextColor(...GRIS_OSCURO);
        for (const butaca of datos.butacas) {
            doc.text(butaca, margenIzquierdo, y);
            y += 6;
        }
    }

    if (datos.items.length > 0) {
        y += 4;
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(10);
        doc.setTextColor(...DORADO);
        doc.text('CANDY BAR', margenIzquierdo, y);
        y += 7;

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(11);
        doc.setTextColor(...GRIS_OSCURO);
        for (const item of datos.items) {
            doc.text(item, margenIzquierdo, y);
            y += 6;
        }
    }

    y += 6;
    doc.setDrawColor(...GRIS_MEDIO);
    doc.line(margenIzquierdo, y, margenDerecho, y);
    y += 12;

    // Desglose: solo tiene sentido mostrarlo si de verdad se aplicó un
    // descuento o crédito -- si se pagó el subtotal entero, alcanza con
    // la línea de "Total pagado" de siempre.
    if ((datos.descuento ?? 0) > 0 || (datos.creditoAplicado ?? 0) > 0) {
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);
        doc.setTextColor(...GRIS_MEDIO);
        if (datos.subtotal !== undefined) {
            doc.text(`Subtotal: $${datos.subtotal}`, margenIzquierdo, y);
            y += 6;
        }
        if ((datos.descuento ?? 0) > 0) {
            doc.text(`Descuento aplicado: -$${datos.descuento}`, margenIzquierdo, y);
            y += 6;
        }
        if ((datos.creditoAplicado ?? 0) > 0) {
            doc.text(`Crédito usado: -$${datos.creditoAplicado}`, margenIzquierdo, y);
            y += 6;
        }
        y += 2;
    }

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.setTextColor(...GRIS_OSCURO);
    doc.text(`Total pagado: $${datos.total}`, margenIzquierdo, y);
    y += 7;

    // Aparte, en letra chica, para no arriesgar que el texto del total se
    // salga de la hoja si el nombre del cupón o el monto son largos.
    const notaTotal = notaTotalPagado(datos.descuento ?? 0, datos.creditoAplicado ?? 0, datos.total);
    if (notaTotal) {
        doc.setFont('helvetica', 'italic');
        doc.setFontSize(9);
        doc.setTextColor(...GRIS_MEDIO);
        doc.text(notaTotal.trim(), margenIzquierdo, y);
        y += 6;
    }
    y += 3;

    doc.setFont('courier', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(...GRIS_MEDIO);
    doc.text(`Código de reserva: ${datos.qrCode}`, margenIzquierdo, y);
    y += 10;

    doc.addImage(qrDataUrl, 'PNG', margenIzquierdo, y, 45, 45);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(...GRIS_MEDIO);
    doc.text('Escaneá este código al ingresar.', margenIzquierdo + 55, y + 22);
    doc.text('Se invalida automáticamente al validarlo.', margenIzquierdo + 55, y + 28);

    doc.save(`entrada-${datos.qrCode}.pdf`);
}
