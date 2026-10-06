import jsPDF from 'jspdf';
import QRCode from 'qrcode';

export interface DatosTicket {
    // La película/función queda opcional: un pedido solo de candy bar (sin
    // butacas ni función elegida) no tiene ninguno de estos datos.
    pelicula?: string;
    sala?: string;
    horario?: string;
    formato?: string;
    idioma?: string;
    butacas?: string[];
    items: string[];
    total: number;
    qrCode: string;
}

const DORADO: [number, number, number] = [217, 164, 65];
const GRIS_OSCURO: [number, number, number] = [30, 30, 35];
const GRIS_MEDIO: [number, number, number] = [120, 120, 125];

export async function generarTicketPdf(datos: DatosTicket): Promise<void> {
    const qrDataUrl = await QRCode.toDataURL(datos.qrCode);

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

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(11);
        doc.setTextColor(...GRIS_MEDIO);
        // .filter(Boolean) para no imprimir "Sala undefined" cuando no
        // tenemos el nombre de la sala a mano (ej: mis-reservas no lo pide).
        const detalleFuncion = [datos.sala ? `Sala ${datos.sala}` : null, datos.formato, datos.idioma]
            .filter(Boolean)
            .join(' — ');
        doc.text(detalleFuncion, margenIzquierdo, y + 7);
        doc.text(datos.horario ?? '', margenIzquierdo, y + 13);

        y += 25;
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

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.setTextColor(...GRIS_OSCURO);
    doc.text(`Total pagado: $${datos.total}`, margenIzquierdo, y);
    y += 10;

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
