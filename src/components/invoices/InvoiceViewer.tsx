/**
 * InvoiceViewer Component
 * Componente compartido para visualizar facturas
 * Se usa en: Admin UI, User UI, y como base para PDF
 * Diseño optimizado para una sola página A4 con paginación si es necesario
 */

import Image from 'next/image';

interface InvoiceItem {
  id?: string;
  name: string;
  quantity: number;
  price: number;
  subtotal: number;
  image?: string;
  description?: string;
}

interface InvoiceData {
  invoiceNumber: string;
  issuedAt: Date | string;
  isCancelled?: boolean;
  cancelledAt?: Date | string | null;
  // Datos de la empresa
  companyName: string;
  companyTaxId: string;
  companyAddress: string;
  companyCity: string;
  companyProvince: string;
  companyPostalCode: string;
  companyPhone?: string;
  companyEmail?: string;
  // Datos del cliente
  clientName: string;
  clientTaxId: string;
  clientAddress: string;
  clientCity: string;
  clientProvince: string;
  clientPostalCode: string;
  clientCountry?: string;
  clientEmail?: string;
  clientPhone?: string;
  // Items y totales
  items: InvoiceItem[];
  subtotal: number;
  shipping: number;
  taxableAmount: number;
  vatRate: number;
  vatAmount: number;
  total: number;
  paymentMethod?: string;
  orderNumber?: string;
}

interface InvoiceViewerProps {
  data: InvoiceData;
  mode?: 'screen' | 'pdf';
}

export function InvoiceViewer({ data, mode = 'screen' }: InvoiceViewerProps) {
  const isPDF = mode === 'pdf';

  const fechaEmision = new Date(data.issuedAt).toLocaleDateString('es-ES', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });

  const fechaAnulacion = data.cancelledAt
    ? new Date(data.cancelledAt).toLocaleDateString('es-ES', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
      })
    : null;

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR',
    }).format(amount);

  const getPaymentMethodName = (method?: string) => {
    const methods: Record<string, string> = {
      CARD: 'Tarjeta de crédito/débito',
      PAYPAL: 'PayPal',
      BIZUM: 'Bizum',
      TRANSFER: 'Transferencia bancaria',
      TARJETA: 'Tarjeta de crédito/débito',
    };
    return methods[method || ''] || 'Tarjeta de crédito/débito';
  };

  return (
    <div
      className={`invoice-container ${isPDF ? 'pdf-mode' : ''}`}
      style={{
        maxWidth: '210mm',
        margin: '0 auto',
        background: 'white',
        borderRadius: isPDF ? '0' : '16px',
        boxShadow: isPDF ? 'none' : '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
        overflow: 'hidden',
        fontFamily:
          'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      }}
    >
      {/* Header con gradiente */}
      <div
        style={{
          background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
          color: 'white',
          padding: '32px 40px',
          position: 'relative',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
          }}
        >
          {/* Logo y datos empresa */}
          <div style={{ flex: 1 }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                marginBottom: '16px',
              }}
            >
              {/* Logo 3D */}
              <div
                style={{
                  width: '48px',
                  height: '48px',
                  background: 'white',
                  borderRadius: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '20px',
                  fontWeight: 800,
                  color: '#4f46e5',
                }}
              >
                3D
              </div>
              <div>
                <div
                  style={{
                    fontSize: '24px',
                    fontWeight: 700,
                    letterSpacing: '-0.5px',
                  }}
                >
                  {data.companyName}
                </div>
              </div>
            </div>
            <div
              style={{
                fontSize: '13px',
                opacity: 0.9,
                lineHeight: 1.7,
              }}
            >
              <div>
                <strong>NIF:</strong> {data.companyTaxId}
              </div>
              <div>{data.companyAddress}</div>
              <div>
                {data.companyPostalCode} {data.companyCity}, {data.companyProvince}
              </div>
              {data.companyPhone && <div>📞 {data.companyPhone}</div>}
              {data.companyEmail && <div>✉ {data.companyEmail}</div>}
            </div>
          </div>

          {/* Datos factura */}
          <div
            style={{
              textAlign: 'right',
              background: 'rgba(255,255,255,0.1)',
              padding: '20px 28px',
              borderRadius: '12px',
              backdropFilter: 'blur(10px)',
            }}
          >
            <div
              style={{
                fontSize: '11px',
                fontWeight: 600,
                textTransform: 'uppercase',
                letterSpacing: '2px',
                opacity: 0.8,
                marginBottom: '4px',
              }}
            >
              Factura
            </div>
            <div
              style={{
                fontSize: '28px',
                fontWeight: 700,
                letterSpacing: '-1px',
              }}
            >
              {data.invoiceNumber}
            </div>
            <div style={{ fontSize: '13px', opacity: 0.9, marginTop: '4px' }}>
              {fechaEmision}
            </div>
            {data.isCancelled && (
              <div
                style={{
                  background: '#ef4444',
                  padding: '6px 12px',
                  borderRadius: '20px',
                  fontSize: '10px',
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  marginTop: '12px',
                }}
              >
                Factura Anulada
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Body */}
      <div style={{ padding: '32px 40px' }}>
        {/* Datos cliente y pedido */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '20px',
            marginBottom: '28px',
          }}
        >
          {/* Cliente */}
          <div
            style={{
              background: '#f8fafc',
              borderRadius: '12px',
              padding: '20px',
              border: '1px solid #e2e8f0',
            }}
          >
            <div
              style={{
                fontSize: '10px',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '1px',
                color: '#64748b',
                marginBottom: '8px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <span
                style={{
                  width: '3px',
                  height: '12px',
                  background: '#4f46e5',
                  borderRadius: '2px',
                }}
              />
              Facturar a
            </div>
            <div
              style={{
                fontSize: '18px',
                fontWeight: 700,
                color: '#1e293b',
                marginBottom: '8px',
              }}
            >
              {data.clientName}
            </div>
            <div
              style={{ fontSize: '13px', color: '#475569', lineHeight: 1.6 }}
            >
              <div>
                <strong style={{ color: '#1e293b' }}>NIF:</strong>{' '}
                {data.clientTaxId || 'No especificado'}
              </div>
              <div>{data.clientAddress}</div>
              <div>
                {data.clientPostalCode} {data.clientCity},{' '}
                {data.clientProvince}
              </div>
              <div>{data.clientCountry || 'España'}</div>
            </div>
            {(data.clientEmail || data.clientPhone) && (
              <div
                style={{
                  marginTop: '12px',
                  paddingTop: '12px',
                  borderTop: '1px solid #e2e8f0',
                  fontSize: '12px',
                  color: '#64748b',
                }}
              >
                {data.clientEmail && <div>✉ {data.clientEmail}</div>}
                {data.clientPhone && <div>📞 {data.clientPhone}</div>}
              </div>
            )}
          </div>

          {/* Pedido */}
          <div
            style={{
              background: '#f8fafc',
              borderRadius: '12px',
              padding: '20px',
              border: '1px solid #e2e8f0',
            }}
          >
            <div
              style={{
                fontSize: '10px',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '1px',
                color: '#64748b',
                marginBottom: '8px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <span
                style={{
                  width: '3px',
                  height: '12px',
                  background: '#4f46e5',
                  borderRadius: '2px',
                }}
              />
              Información del pedido
            </div>
            <div
              style={{ fontSize: '13px', color: '#475569', lineHeight: 1.8 }}
            >
              <div>
                <strong style={{ color: '#1e293b' }}>Pedido:</strong>{' '}
                {data.orderNumber || 'N/A'}
              </div>
              <div>
                <strong style={{ color: '#1e293b' }}>Método de pago:</strong>{' '}
                {getPaymentMethodName(data.paymentMethod)}
              </div>
              <div>
                <strong style={{ color: '#1e293b' }}>Fecha de emisión:</strong>{' '}
                {fechaEmision}
              </div>
            </div>
          </div>
        </div>

        {/* Items */}
        <div style={{ marginBottom: '24px' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '12px',
              paddingBottom: '12px',
              borderBottom: '2px solid #e2e8f0',
            }}
          >
            <div
              style={{
                fontSize: '14px',
                fontWeight: 700,
                color: '#1e293b',
              }}
            >
              Conceptos
            </div>
            <div style={{ fontSize: '12px', color: '#64748b' }}>
              {data.items.length} producto{data.items.length !== 1 ? 's' : ''}
            </div>
          </div>

          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th
                  style={{
                    background: '#f1f5f9',
                    padding: '12px',
                    textAlign: 'left',
                    fontSize: '10px',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                    color: '#64748b',
                    borderBottom: '2px solid #e2e8f0',
                    borderTopLeftRadius: '8px',
                  }}
                >
                  Producto
                </th>
                <th
                  style={{
                    background: '#f1f5f9',
                    padding: '12px',
                    textAlign: 'center',
                    fontSize: '10px',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                    color: '#64748b',
                    borderBottom: '2px solid #e2e8f0',
                    width: '80px',
                  }}
                >
                  Cant.
                </th>
                <th
                  style={{
                    background: '#f1f5f9',
                    padding: '12px',
                    textAlign: 'right',
                    fontSize: '10px',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                    color: '#64748b',
                    borderBottom: '2px solid #e2e8f0',
                    width: '100px',
                  }}
                >
                  Precio
                </th>
                <th
                  style={{
                    background: '#f1f5f9',
                    padding: '12px',
                    textAlign: 'right',
                    fontSize: '10px',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                    color: '#64748b',
                    borderBottom: '2px solid #e2e8f0',
                    borderTopRightRadius: '8px',
                    width: '100px',
                  }}
                >
                  Importe
                </th>
              </tr>
            </thead>
            <tbody>
              {data.items.map((item, index) => (
                <tr
                  key={item.id || index}
                  style={{
                    borderBottom:
                      index === data.items.length - 1
                        ? 'none'
                        : '1px solid #e2e8f0',
                  }}
                >
                  <td style={{ padding: '12px' }}>
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                      }}
                    >
                      {item.image ? (
                        <div
                          style={{
                            width: '48px',
                            height: '48px',
                            borderRadius: '8px',
                            overflow: 'hidden',
                            background: '#f1f5f9',
                            border: '1px solid #e2e8f0',
                            flexShrink: 0,
                          }}
                        >
                          <Image
                            src={item.image}
                            alt={item.name}
                            width={48}
                            height={48}
                            style={{ objectFit: 'cover' }}
                            unoptimized
                          />
                        </div>
                      ) : (
                        <div
                          style={{
                            width: '48px',
                            height: '48px',
                            borderRadius: '8px',
                            background: '#f1f5f9',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: '#94a3b8',
                            flexShrink: 0,
                            border: '1px solid #e2e8f0',
                          }}
                        >
                          <svg
                            width="24"
                            height="24"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={1.5}
                              d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                            />
                          </svg>
                        </div>
                      )}
                      <div>
                        <div
                          style={{
                            fontWeight: 600,
                            color: '#1e293b',
                            fontSize: '13px',
                          }}
                        >
                          {item.name}
                        </div>
                        {item.description && (
                          <div
                            style={{
                              fontSize: '11px',
                              color: '#64748b',
                              marginTop: '2px',
                            }}
                          >
                            {item.description}
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: '12px', textAlign: 'center' }}>
                    <span
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        minWidth: '28px',
                        height: '28px',
                        background: '#f1f5f9',
                        borderRadius: '6px',
                        fontWeight: 600,
                        color: '#475569',
                        fontSize: '12px',
                      }}
                    >
                      {item.quantity}
                    </span>
                  </td>
                  <td
                    style={{
                      padding: '12px',
                      textAlign: 'right',
                      color: '#64748b',
                      fontSize: '13px',
                    }}
                  >
                    {formatCurrency(item.price)}
                  </td>
                  <td
                    style={{
                      padding: '12px',
                      textAlign: 'right',
                      fontWeight: 600,
                      color: '#1e293b',
                      fontSize: '13px',
                    }}
                  >
                    {formatCurrency(item.subtotal)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Totales */}
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <div
            style={{
              background: '#1e293b',
              borderRadius: '12px',
              padding: '24px',
              color: 'white',
              minWidth: '280px',
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                marginBottom: '8px',
                fontSize: '13px',
                color: '#94a3b8',
              }}
            >
              <span>Subtotal productos</span>
              <span>{formatCurrency(data.subtotal)}</span>
            </div>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                marginBottom: '8px',
                fontSize: '13px',
                color: '#94a3b8',
              }}
            >
              <span>Envío</span>
              <span>{formatCurrency(data.shipping)}</span>
            </div>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                marginBottom: '8px',
                fontSize: '13px',
                color: '#94a3b8',
              }}
            >
              <span>Base imponible</span>
              <span>{formatCurrency(data.taxableAmount)}</span>
            </div>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                marginBottom: '8px',
                fontSize: '13px',
                color: '#94a3b8',
              }}
            >
              <span>IVA ({data.vatRate}%)</span>
              <span>{formatCurrency(data.vatAmount)}</span>
            </div>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                marginTop: '12px',
                paddingTop: '12px',
                borderTop: '2px solid rgba(255,255,255,0.1)',
                fontSize: '20px',
                fontWeight: 700,
              }}
            >
              <span>TOTAL</span>
              <span>{formatCurrency(data.total)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div
        style={{
          background: '#f8fafc',
          padding: '24px 40px',
          borderTop: '1px solid #e2e8f0',
          textAlign: 'center',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            gap: '16px',
            marginBottom: '16px',
          }}
        >
          {/* Método de pago */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '12px 16px',
              background: 'white',
              borderRadius: '8px',
              border: '1px solid #e2e8f0',
            }}
          >
            <div
              style={{
                width: '32px',
                height: '32px',
                background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
                borderRadius: '6px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <svg
                width="16"
                height="16"
                fill="none"
                stroke="white"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
                />
              </svg>
            </div>
            <div style={{ textAlign: 'left' }}>
              <div
                style={{
                  fontSize: '10px',
                  fontWeight: 600,
                  color: '#64748b',
                  textTransform: 'uppercase',
                }}
              >
                Método de pago
              </div>
              <div
                style={{ fontSize: '13px', color: '#1e293b', fontWeight: 600 }}
              >
                {getPaymentMethodName(data.paymentMethod)}
              </div>
            </div>
          </div>

          {/* Pedido */}
          {data.orderNumber && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '12px 16px',
                background: 'white',
                borderRadius: '8px',
                border: '1px solid #e2e8f0',
              }}
            >
              <div
                style={{
                  width: '32px',
                  height: '32px',
                  background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
                  borderRadius: '6px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <svg
                  width="16"
                  height="16"
                  fill="none"
                  stroke="white"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
                  />
                </svg>
              </div>
              <div style={{ textAlign: 'left' }}>
                <div
                  style={{
                    fontSize: '10px',
                    fontWeight: 600,
                    color: '#64748b',
                    textTransform: 'uppercase',
                  }}
                >
                  Pedido
                </div>
                <div
                  style={{
                    fontSize: '13px',
                    color: '#1e293b',
                    fontWeight: 600,
                  }}
                >
                  {data.orderNumber}
                </div>
              </div>
            </div>
          )}
        </div>

        <div style={{ fontSize: '12px', color: '#94a3b8', lineHeight: 1.6 }}>
          <div style={{ fontWeight: 600, color: '#64748b' }}>
            {data.companyName} - {data.companyCity}, {data.companyProvince}
          </div>
          <div>
            Factura generada electrónicamente · Este documento es válido sin
            firma según la normativa vigente
          </div>
          {data.companyEmail && (
            <div style={{ marginTop: '4px' }}>Contacto: {data.companyEmail}</div>
          )}
        </div>
      </div>
    </div>
  );
}

// Hook para obtener datos de factura desde la API
export function useInvoiceData(invoiceData: {
  invoiceNumber: string;
  issuedAt: string;
  isCancelled: boolean;
  cancelledAt?: string | null;
  empresaNombre: string;
  empresaNif: string;
  empresaDireccion: string;
  empresaCiudad: string;
  empresaProvincia: string;
  empresaCodigoPostal: string;
  empresaTelefono?: string;
  empresaEmail?: string;
  clienteNombre: string;
  clienteNif: string;
  clienteDireccion: string;
  clienteCiudad: string;
  clienteProvincia: string;
  clienteCodigoPostal: string;
  clientePais: string;
  clienteEmail?: string;
  clienteTelefono?: string;
  order: {
    orderNumber: string;
    paymentMethod: string;
    items: Array<{
      id?: string;
      nombre?: string;
      name?: string;
      quantity: number;
      price: number;
      subtotal: number;
      image?: string;
      description?: string;
    }>;
  };
  baseImponible: number;
  cuotaIva: number;
  tipoIva: number;
  total: number;
  subtotal?: number;
  shipping?: number;
}): InvoiceData {
  return {
    invoiceNumber: invoiceData.invoiceNumber,
    issuedAt: invoiceData.issuedAt,
    isCancelled: invoiceData.isCancelled,
    cancelledAt: invoiceData.cancelledAt,
    companyName: invoiceData.empresaNombre,
    companyTaxId: invoiceData.empresaNif,
    companyAddress: invoiceData.empresaDireccion,
    companyCity: invoiceData.empresaCiudad,
    companyProvince: invoiceData.empresaProvincia,
    companyPostalCode: invoiceData.empresaCodigoPostal,
    companyPhone: invoiceData.empresaTelefono,
    companyEmail: invoiceData.empresaEmail,
    clientName: invoiceData.clienteNombre,
    clientTaxId: invoiceData.clienteNif,
    clientAddress: invoiceData.clienteDireccion,
    clientCity: invoiceData.clienteCiudad,
    clientProvince: invoiceData.clienteProvincia,
    clientPostalCode: invoiceData.clienteCodigoPostal,
    clientCountry: invoiceData.clientePais,
    clientEmail: invoiceData.clienteEmail,
    clientPhone: invoiceData.clienteTelefono,
    items:
      invoiceData.order?.items?.map((item) => ({
        id: item.id,
        name: item.name || item.nombre || '',
        quantity: item.quantity,
        price: item.price,
        subtotal: item.subtotal,
        image: item.image,
        description: item.description,
      })) || [],
    subtotal: invoiceData.subtotal || invoiceData.baseImponible,
    shipping: invoiceData.shipping || 0,
    taxableAmount: invoiceData.baseImponible,
    vatRate: invoiceData.tipoIva,
    vatAmount: invoiceData.cuotaIva,
    total: invoiceData.total,
    paymentMethod: invoiceData.order?.paymentMethod,
    orderNumber: invoiceData.order?.orderNumber,
  };
}
