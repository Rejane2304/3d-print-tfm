// Lint y style fixes por un senior:
'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { AlertCircle, ArrowRightLeft, CheckCircle2, Smartphone } from 'lucide-react';

function ProcessingContent({
  method,
  progress,
  reference,
}: Readonly<{
  method: 'bizum' | 'transfer';
  progress: number;
  reference: string;
}>) {
  const isBizum = method === 'bizum';
  const Icon = isBizum ? Smartphone : ArrowRightLeft;
  const title = isBizum ? 'Conectando con Bizum...' : 'Generando datos de transferencia...';
  return (
    <div className="text-center space-y-6">
      <div className="w-20 h-20 mx-auto relative">
        <div className="absolute inset-0 bg-indigo-100 rounded-full animate-ping" />
        <div className="relative w-20 h-20 bg-indigo-600 rounded-full flex items-center justify-center">
          <Icon className="w-10 h-10 text-white" />
        </div>
      </div>
      <h2 className="text-2xl font-bold text-gray-900">{title}</h2>
      <p className="text-gray-600 max-w-sm mx-auto">
        {isBizum
          ? 'Preparando la solicitud de pago en tu aplicación bancaria...'
          : 'Generando los datos bancarios para tu transferencia...'}
      </p>
      {reference && (
        <div className="bg-white border-2 border-indigo-100 rounded-lg p-4 mt-4">
          <p className="text-sm text-gray-500 mb-1">Referencia:</p>
          <p className="text-xl font-mono font-bold text-indigo-600">{reference}</p>
        </div>
      )}
      <div className="w-full max-w-xs mx-auto">
        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-indigo-600 transition-all duration-100 ease-linear"
            style={{ width: `${progress}%` }}
          />
        </div>
        <p className="text-sm text-gray-500 mt-2">{Math.round(progress)}%</p>
      </div>
    </div>
  );
}

function SuccessContent() {
  return (
    <div className="text-center space-y-4">
      <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto">
        <CheckCircle2 className="w-12 h-12 text-green-600" />
      </div>
      <h2 className="text-2xl font-bold text-gray-900">¡Pago completado!</h2>
      <p className="text-gray-600">Redirigiendo a la confirmación...</p>
    </div>
  );
}

function ErrorContent({
  errorMessage,
  router,
}: Readonly<{ errorMessage: string; router: ReturnType<typeof useRouter> }>) {
  return (
    <div className="text-center space-y-4">
      <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto">
        <AlertCircle className="w-12 h-12 text-red-600" />
      </div>
      <h2 className="text-2xl font-bold text-gray-900">Error en el pago</h2>
      <p className="text-gray-600">{errorMessage}</p>
      <button
        onClick={() => router.push('/checkout')}
        className="mt-4 px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
      >
        Volver al checkout
      </button>
    </div>
  );
}

export default function ProcessingPage() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const orderId = searchParams.get('orderId');
  const paymentId = searchParams.get('paymentId');
  const method = searchParams.get('method') as 'bizum' | 'transfer' | null;

  const [status, setStatus] = useState<'processing' | 'success' | 'error'>('processing');
  const [progress, setProgress] = useState(0);
  const [errorMessage, setErrorMessage] = useState('');
  const [reference, setReference] = useState('');

  useEffect(() => {
    if (!orderId || !paymentId || !method) {
      setStatus('error');
      setErrorMessage('Datos de pago incompletos');
      return;
    }

    const completePayment = async () => {
      try {
        const response = await fetch('/api/payments/complete', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ orderId, paymentId }),
        });
        if (response.ok) {
          setStatus('success');
          setTimeout(() => {
            router.push(`/checkout/success?orderId=${orderId}&method=${method}&ref=${reference}`);
          }, 1500);
        } else {
          throw new Error('Error al completar el pago');
        }
      } catch (err) {
        setStatus('error');
        setErrorMessage(err instanceof Error ? err.message : 'Error al finalizar el pago');
      }
    };

    const processFakePayment = async () => {
      try {
        const endpoint = method === 'bizum' ? '/api/payments/bizum/init' : '/api/payments/transfer/init';
        const response = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ orderId, paymentId }),
        });
        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.error || 'Error al iniciar el pago');
        }
        setReference(data.reference);
        // Simulate delay with progress animation
        const totalDelay = 3000; // 3 seconds
        const interval = 100;
        const steps = totalDelay / interval;
        let currentStep = 0;
        const progressInterval = setInterval(() => {
          currentStep++;
          const newProgress = Math.min((currentStep / steps) * 100, 100);
          setProgress(newProgress);
          if (currentStep >= steps) {
            clearInterval(progressInterval);
            completePayment();
          }
        }, interval);
      } catch (err) {
        setStatus('error');
        setErrorMessage(err instanceof Error ? err.message : 'Error desconocido');
      }
    };
    processFakePayment();
  }, [orderId, paymentId, method, reference, router]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8">
        {status === 'processing' && (
          <ProcessingContent method={method as 'bizum' | 'transfer'} progress={progress} reference={reference} />
        )}
        {status === 'success' && <SuccessContent />}
        {status === 'error' && <ErrorContent errorMessage={errorMessage} router={router} />}
      </div>
    </div>
  );
}
