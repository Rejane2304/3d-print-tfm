/* eslint-disable max-len */
'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Loader2, LogIn, User, UserPlus } from 'lucide-react';

import LoginForm from '@/components/auth/LoginForm';
import RegisterForm from '@/components/auth/RegisterForm';
import { useAuthRedirect } from './hooks/useAuthRedirect';
import { useCartMigration } from './hooks/useCartMigration';

export const dynamic = 'force-dynamic';

interface TestCredentialsProps {
  readonly title: string;
  readonly email: string;
  readonly password: string;
}

function TestCredential({ title, email, password }: Readonly<TestCredentialsProps>) {
  return (
    <div className="flex items-center justify-between bg-white p-2 rounded-lg border border-gray-100">
      <span>
        <strong>{title}:</strong> {email}
      </span>
      <span className="text-gray-400 font-mono">{password}</span>
    </div>
  );
}

function AuthContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  useAuthRedirect();
  const { setMigrationFlag, clearMigrationFlag, migrateCart } = useCartMigration();

  const callbackUrl = searchParams.get('callbackUrl') || '/';
  const registrationSuccessful = searchParams.get('registro') === 'exitoso';

  // Tab state: 'login' | 'register'
  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');

  // Shared email state
  const [sharedEmail, setSharedEmail] = useState('');

  // Error states
  const [loginError, setLoginError] = useState('');
  const [registerError, setRegisterError] = useState('');

  // Sync tab state with URL parameter on mount
  useEffect(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam === 'register') {
      setActiveTab('register');
    }
  }, [searchParams]);

  // Handle tab switch with animation
  const handleTabSwitch = (tab: 'login' | 'register') => {
    setActiveTab(tab);
    setLoginError('');
    setRegisterError('');
  };

  // Handle login start - set migration flag
  const handleLoginStart = () => {
    setLoginError('');
    setMigrationFlag();
  };

  // Handle login error - clear migration flag
  const handleLoginError = (error: string) => {
    clearMigrationFlag();
    setLoginError(error);
  };

  // Handle login success - migrate cart and redirect
  const handleLoginSuccess = async () => {
    await migrateCart();
    clearMigrationFlag();
    globalThis.dispatchEvent(new Event('cartUpdated'));
    router.push(callbackUrl);
  };

  // Handle register success - switch to login tab
  const handleRegisterSuccess = () => {
    setTimeout(() => {
      setActiveTab('login');
    }, 2000);
  };

  const isLoginTab = activeTab === 'login';

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 via-gray-100 to-indigo-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-lg w-full">
        {/* Header with Logo */}
        <div className="text-center mb-8">
          <div className="mx-auto h-16 w-16 bg-indigo-600 rounded-2xl flex items-center justify-center mb-4 shadow-lg shadow-indigo-200">
            <User className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Bienvenido</h1>
          <p className="text-sm text-gray-600">Accede a tu cuenta o crea una nueva</p>
        </div>

        {/* Main Card */}
        <div className="bg-white shadow-2xl rounded-3xl border border-gray-100 overflow-hidden">
          {/* Tabs */}
          <div className="flex border-b border-gray-200">
            <button
              onClick={() => handleTabSwitch('login')}
              data-testid="login-tab"
              className={`flex-1 flex items-center justify-center gap-2 py-4 text-sm font-medium transition-all duration-300 ${
                isLoginTab
                  ? 'text-indigo-600 border-b-2 border-indigo-600 bg-indigo-50/50'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              }`}
            >
              <LogIn className="h-4 w-4" />
              Iniciar sesión
            </button>
            <button
              onClick={() => handleTabSwitch('register')}
              data-testid="register-tab"
              className={`flex-1 flex items-center justify-center gap-2 py-4 text-sm font-medium transition-all duration-300 ${
                activeTab === 'register'
                  ? 'text-indigo-600 border-b-2 border-indigo-600 bg-indigo-50/50'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              }`}
            >
              <UserPlus className="h-4 w-4" />
              Registrarse
            </button>
          </div>

          {/* Content Area */}
          <div className="p-8">
            {/* Success Message from Register */}
            {registrationSuccessful && (
              <div className="mb-6 bg-green-50 border-l-4 border-green-400 p-4 rounded-r-lg">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-green-700">¡Registro exitoso! Ahora puedes iniciar sesión.</p>
                  </div>
                </div>
              </div>
            )}

            {/* Login Form */}
            <div
              className={`transition-all duration-500 ease-in-out ${
                isLoginTab ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-10 absolute pointer-events-none'
              }`}
            >
              {loginError && (
                <div data-testid="login-error" className="mb-4 bg-red-50 border-l-4 border-red-400 p-4 rounded-r-lg">
                  <p className="text-sm text-red-700">{loginError}</p>
                </div>
              )}
              <LoginForm
                email={sharedEmail}
                onEmailChange={setSharedEmail}
                onLoginStart={handleLoginStart}
                onLoginError={handleLoginError}
                onLoginSuccess={handleLoginSuccess}
              />
            </div>

            {/* Register Form */}
            <div
              className={`transition-all duration-500 ease-in-out ${
                activeTab === 'register'
                  ? 'opacity-100 translate-x-0'
                  : 'opacity-0 -translate-x-10 absolute pointer-events-none'
              }`}
            >
              {registerError && (
                <div className="mb-4 bg-red-50 border-l-4 border-red-400 p-4 rounded-r-lg">
                  <p className="text-sm text-red-700">{registerError}</p>
                </div>
              )}
              <RegisterForm
                initialEmail={sharedEmail}
                onEmailChange={setSharedEmail}
                onRegisterSuccess={handleRegisterSuccess}
                onRegisterError={setRegisterError}
              />
            </div>
          </div>
        </div>

        {/* Test Credentials */}
        <div className="mt-6 bg-white/80 backdrop-blur-sm border border-gray-200 rounded-xl p-4 shadow-sm">
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Usuarios de prueba</h3>
          <div className="space-y-2 text-xs text-gray-600">
            <TestCredential title="Admin" email="admin@3dprint.com" password="AdminTFM2024!" />
            <TestCredential title="Cliente" email="juan@example.com" password="JuanTFM2024!" />
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AuthPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 via-gray-100 to-indigo-50">
          <div className="text-center">
            <Loader2 className="h-12 w-12 animate-spin text-indigo-600 mx-auto mb-4" />
            <p className="text-gray-600">Cargando...</p>
          </div>
        </div>
      }
    >
      <AuthContent />
    </Suspense>
  );
}
