import jsPDF from 'jspdf';
import QRCode from 'qrcode';

export interface DatosTicket {
    pelicula: string;
    horario: string;
    formato: string;
    idioma: string;
    butacas: string[];
    items: string[];
    total: number;
    qrCode: string;
}

export async function generarTicketPdf(datos: DatosTicket): Promise<void> {
    const qrDataUrl = await QRCode.toDataURL(datos.qrCode);

    const doc = new jsPDF();

    doc.setFontSize(18);
    doc.text('TP Cine — Entrada', 20, 20);

    doc.setFontSize(12);
    doc.text(`Película: ${datos.pelicula}`, 20, 35);
    doc.text(`Función: ${datos.horario} — ${datos.formato} / ${datos.idioma}`, 20, 42);
    doc.text(`Butacas: ${datos.butacas.join(', ')}`, 20, 49);

    let y = 56;
    if (datos.items.length > 0) {
        doc.text(`Candy bar: ${datos.items.join(', ')}`, 20, y);
        y += 7;
    }

    doc.text(`Total pagado: $${datos.total}`, 20, y);
    doc.addImage(qrDataUrl, 'PNG', 20, y + 10, 50, 50);

    doc.save(`entrada-${datos.qrCode}.pdf`);
}