/**
 * API de Generación de PDF de Factura
 * Genera PDF de factura para descarga
 * 
 * Requiere: Rol ADMIN
 */
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../../auth/[...nextauth]/route';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json(
        { success: false, error: 'No autenticado' },
        { status: 401 }
      );
    }

    const usuario = await prisma.usuario.findUnique({
      where: { email: session.user.email },
    });

    if (!usuario || usuario.rol !== 'ADMIN') {
      return NextResponse.json(
        { success: false, error: 'No autorizado' },
        { status: 403 }
      );
    }

    const factura = await prisma.factura.findUnique({
      where: { id: params.id },
      include: {
        pedido: {
          include: {
            items: {
              include: {
                producto: true,
              },
            },
          },
        },
      },
    });

    if (!factura) {
      return NextResponse.json(
        { success: false, error: 'Factura no encontrada' },
        { status: 404 }
      );
    }

    // Generar HTML de la factura (simulación de PDF)
    const html = generarHTMLFactura(factura);

    // Retornar como HTML con headers para descarga
    return new NextResponse(html, {
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Content-Disposition': `attachment; filename="factura-${factura.numeroFactura}.html"`,
      },
    });
  } catch (error) {
    console.error('Error generando PDF:', error);
    return NextResponse.json(
      { success: false, error: 'Error interno' },
      { status: 500 }
    );
  }
}

function generarHTMLFactura(factura: any): string {
  const items = factura.pedido?.items || [];
  
  return `
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Factura ${factura.numeroFactura}</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 40px; }
        .header { border-bottom: 2px solid #333; padding-bottom: 20px; margin-bottom: 30px; }
        .company-info { float: left; width: 50%; }
        .invoice-info { float: right; width: 50%; text-align: right; }
        .client-info { margin: 30px 0; }
        table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        th, td { border: 1px solid #ddd; padding: 10px; text-align: left; }
        th { background-color: #f5f5f5; }
        .totals { margin-top: 30px; text-align: right; }
        .total { font-size: 1.2em; font-weight: bold; }
        .anulada { color: red; font-size: 1.5em; font-weight: bold; }
        .clear { clear: both; }
    </style>
</head>
<body>
    <div class="header">
        <div class="company-info">
            <h1>${factura.empresaNombre}</h1>
            <p>NIF: ${factura.empresaNif}</p>
            <p>${factura.empresaDireccion}</p>
            <p>${factura.empresaCodigoPostal} ${factura.empresaCiudad}</p>
            <p>${factura.empresaProvincia}</p>
        </div>
        <div class="invoice-info">
            <h2>FACTURA</h2>
            <p><strong>Nº:</strong> ${factura.numeroFactura}</p>
            <p><strong>Fecha:</strong> ${new Date(factura.emitidaEn).toLocaleDateString('es-ES')}</p>
            ${factura.anulada ? '<p class="anulada">FACTURA ANULADA</p>' : ''}
        </div>
        <div class="clear"></div>
    </div>

    <div class="client-info">
        <h3>Cliente</h3>
        <p><strong>${factura.clienteNombre}</strong></p>
        <p>NIF: ${factura.clienteNif}</p>
        <p>${factura.clienteDireccion}</p>
        <p>${factura.clienteCodigoPostal} ${factura.clienteCiudad}</p>
        <p>${factura.clienteProvincia}, ${factura.clientePais}</p>
    </div>

    <table>
        <thead>
            <tr>
                <th>Descripción</th>
                <th>Cantidad</th>
                <th>Precio Unit.</th>
                <th>Total</th>
            </tr>
        </thead>
        <tbody>
            ${items.map((item: any) => `
            <tr>
                <td>${item.nombre}</td>
                <td>${item.cantidad}</td>
                <td>${Number(item.precio).toFixed(2)} €</td>
                <td>${Number(item.subtotal).toFixed(2)} €</td>
            </tr>
            `).join('')}
        </tbody>
    </table>

    <div class="totals">
        <p>Base Imponible: ${Number(factura.baseImponible).toFixed(2)} €</p>
        <p>IVA (${factura.tipoIva}%): ${Number(factura.cuotaIva).toFixed(2)} €</p>
        <p class="total">TOTAL: ${Number(factura.total).toFixed(2)} €</p>
    </div>

    <div style="margin-top: 50px; border-top: 1px solid #ccc; padding-top: 20px;">
        <p><strong>Notas:</strong></p>
        <p>Forma de pago: ${factura.pedido?.metodoPago === 'TARJETA' ? 'Tarjeta de crédito' : 'Transferencia bancaria'}</p>
    </div>
</body>
</html>
  `;
}