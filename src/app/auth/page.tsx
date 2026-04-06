'use client';

import { useState, useEffect, Suspense } from 'react';
import { signIn, useSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { 
  User, 
  Mail, 
  Lock, 
  Eye, 
  EyeOff, 
  ArrowRight,
  CheckCircle2,
  LogIn,
  UserPlus,
  MapPin,
  Home,
  Building,
  Map,
  Phone,
  Loader2
} from 'lucide-react';

export const dynamic = 'force-dynamic';

function AuthContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session, status } = useSession();
  const callbackUrl = searchParams.get('callbackUrl') || '/';
  const cartStorageKey = 'cart';
  const registrationSuccessful = searchParams.get('registro') === 'exitoso';
  
  // Redirect authenticated users away from auth page
  // Skip redirect if we just logged in (handled by handleLogin)
  useEffect(() => {
    if (status === 'authenticated' && session) {
      // Check if we just came from login/register
      const justRegistered = searchParams.get('registro') === 'exitoso';
      const migratingCart = sessionStorage.getItem('migratingCart');

      // If we're migrating cart, don't redirect yet
      if (migratingCart) {
        console.log('Migration in progress, skipping redirect');
        return;
      }

      const userRole = (session.user as { rol?: string })?.rol;
      if (userRole === 'ADMIN') {
        router.push('/admin/dashboard');
      } else if (!justRegistered) {
        // Only redirect if not just registered (registration auto-redirects)
        router.push(callbackUrl);
      }
    }
  }, [status, session, router, callbackUrl, searchParams]);
  
  // Tab state: 'login' | 'register'
  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');
  
  // Shared email state
  const [sharedEmail, setSharedEmail] = useState('');
  
  // Login form state
  const [loginPassword, setLoginPassword] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState('');
  
  // Register form state
  const [registerData, setRegisterData] = useState({
    // Datos personales
    nombre: '',
    email: '',
    password: '',
    confirmarPassword: '',
    telefono: '',
    // Datos de dirección
    direccion: '',
    complemento: '',
    codigoPostal: '',
    ciudad: '',
    provincia: '',
  });
  const [showRegisterPassword, setShowRegisterPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [registerLoading, setRegisterLoading] = useState(false);
  const [registerError, setRegisterError] = useState('');
  const [registerSuccess, setRegisterSuccess] = useState(false);

  // Sync shared email with register email
  useEffect(() => {
    setRegisterData(prev => ({ ...prev, email: sharedEmail }));
  }, [sharedEmail]);

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

  // Login handler
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginLoading(true);
    setLoginError('');

    // Set migration flag BEFORE login to prevent useEffect redirect
    const localCart = localStorage.getItem(cartStorageKey);
    const hasItemsToMigrate = localCart && JSON.parse(localCart).length > 0;
    
    if (hasItemsToMigrate) {
      sessionStorage.setItem('migratingCart', 'true');
    }

    try {
      const result = await signIn('credentials', {
        email: sharedEmail,
        password: loginPassword,
        redirect: false,
        callbackUrl,
      });

      if (result?.error) {
        // Clear migration flag on error
        sessionStorage.removeItem('migratingCart');
        setLoginError('Email o contraseña incorrectos');
      } else {
        // Login successful - migrate cart before redirecting
        
        if (localCart) {
          try {
            const items = JSON.parse(localCart);
            console.log(`Migrating ${items.length} items to API cart`);
            
            // Migrate each item to API with credentials
            const migrationResults = await Promise.allSettled(
              items.map(async (item: { productId: string; quantity: number }) => {
                const response = await fetch('/api/cart', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  credentials: 'include',
                  body: JSON.stringify({
                    productId: item.productId,
                    quantity: item.quantity,
                  }),
                });
                if (!response.ok) {
                  const errorData = await response.json().catch(() => ({}));
                  console.error('Failed to migrate item:', item.productId, errorData);
                  return { success: false, productId: item.productId, error: errorData };
                }
                return { success: true, productId: item.productId };
              })
            );
            
            const successful = migrationResults.filter(r => r.status === 'fulfilled' && (r.value as {success: boolean}).success).length;
            const failed = migrationResults.length - successful;
            console.log(`Migration complete: ${successful} successful, ${failed} failed`);
            
            // Clear localStorage after migration attempt
            localStorage.removeItem(cartStorageKey);
            
            // Small delay to ensure API consistency
            await new Promise(resolve => setTimeout(resolve, 500));
          } catch (err) {
            console.error('Error migrating cart:', err);
            // Still clear localStorage to prevent duplicate migration attempts
            localStorage.removeItem(cartStorageKey);
          }
        }
        
        // Clear migration flag and redirect
        sessionStorage.removeItem('migratingCart');
        
        // Trigger cart update to refresh header counter
        window.dispatchEvent(new Event('cartUpdated'));
        
        // Redirect to callback URL
        console.log('Redirecting to:', callbackUrl);
        router.push(callbackUrl);
      }
    } catch {
      sessionStorage.removeItem('migratingCart');
      setLoginError('Error al iniciar sesión. Inténtalo de nuevo.');
    } finally {
      setLoginLoading(false);
    }
  };

  // Register handler
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegisterLoading(true);
    setRegisterError('');

    // Validation
    if (registerData.password !== registerData.confirmarPassword) {
      setRegisterError('Las contraseñas no coinciden');
      setRegisterLoading(false);
      return;
    }

    if (registerData.password.length < 8) {
      setRegisterError('La contraseña debe tener al menos 8 caracteres');
      setRegisterLoading(false);
      return;
    }

    // Validar campos de dirección
    if (!registerData.direccion || !registerData.codigoPostal || !registerData.ciudad || !registerData.provincia) {
      setRegisterError('Por favor, completa todos los campos de dirección obligatorios');
      setRegisterLoading(false);
      return;
    }

    // Validar código postal (5 dígitos para España)
    const cpRegex = /^\d{5}$/;
    if (!cpRegex.test(registerData.codigoPostal)) {
      setRegisterError('El código postal debe tener 5 dígitos');
      setRegisterLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nombre: registerData.nombre,
          email: registerData.email,
          password: registerData.password,
          telefono: registerData.telefono || undefined,
          // Datos de dirección
          direccion: {
            nombre: 'Principal',
            destinatario: registerData.nombre,
            telefono: registerData.telefono || '',
            direccion: registerData.direccion,
            complemento: registerData.complemento || undefined,
            codigoPostal: registerData.codigoPostal,
            ciudad: registerData.ciudad,
            provincia: registerData.provincia,
            esPrincipal: true,
          }
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setRegisterError(data.error || 'Error al registrar usuario');
      } else {
        setRegisterSuccess(true);
        setSharedEmail(registerData.email);
        // Switch to login tab after 2 seconds
        setTimeout(() => {
          setActiveTab('login');
          setRegisterSuccess(false);
        }, 2000);
      }
    } catch {
      setRegisterError('Error al registrar. Inténtalo de nuevo.');
    } finally {
      setRegisterLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 via-gray-100 to-indigo-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-lg w-full">
        {/* Header with Logo */}
        <div className="text-center mb-8">
          <div className="mx-auto h-16 w-16 bg-indigo-600 rounded-2xl flex items-center justify-center mb-4 shadow-lg shadow-indigo-200">
            <User className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Bienvenido
          </h1>
          <p className="text-sm text-gray-600">
            Accede a tu cuenta o crea una nueva
          </p>
        </div>

        {/* Main Card */}
        <div className="bg-white shadow-2xl rounded-3xl border border-gray-100 overflow-hidden">
          {/* Tabs */}
          <div className="flex border-b border-gray-200">
            <button
              onClick={() => handleTabSwitch('login')}
              data-testid="login-tab"
              className={`flex-1 flex items-center justify-center gap-2 py-4 text-sm font-medium transition-all duration-300 ${
                activeTab === 'login'
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
                  <CheckCircle2 className="h-5 w-5 text-green-400" />
                  <div className="ml-3">
                    <p className="text-sm text-green-700">
                      ¡Registro exitoso! Ahora puedes iniciar sesión.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Login Form */}
            <div
              className={`transition-all duration-500 ease-in-out ${
                activeTab === 'login'
                  ? 'opacity-100 translate-x-0'
                  : 'opacity-0 translate-x-10 absolute pointer-events-none'
              }`}
            >
              <form onSubmit={handleLogin} className="space-y-5">
                {loginError && (
                  <div data-testid="login-error" className="bg-red-50 border-l-4 border-red-400 p-4 rounded-r-lg">
                    <p className="text-sm text-red-700">{loginError}</p>
                  </div>
                )}

                {/* Email Field */}
                <div>
                  <label htmlFor="login-email" className="block text-sm font-medium text-gray-700 mb-2">
                    Correo electrónico
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Mail className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      id="login-email"
                      data-testid="login-email"
                      type="email"
                      required
                      className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200"
                      placeholder="tu@email.com"
                      value={sharedEmail}
                      onChange={(e) => setSharedEmail(e.target.value)}
                    />
                  </div>
                </div>

                {/* Password Field */}
                <div>
                  <label htmlFor="login-password" className="block text-sm font-medium text-gray-700 mb-2">
                    Contraseña
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Lock className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      id="login-password"
                      data-testid="login-password"
                      type={showLoginPassword ? 'text' : 'password'}
                      required
                      className="block w-full pl-10 pr-12 py-3 border border-gray-300 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200"
                      placeholder="••••••••"
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                    />
                    <button
                      type="button"
                      onClick={() => setShowLoginPassword(!showLoginPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      {showLoginPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  data-testid="login-submit"
                  disabled={loginLoading}
                  className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-xl text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl"
                >
                  {loginLoading ? (
                    <div className="flex items-center">
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Iniciando...
                    </div>
                  ) : (
                    <div className="flex items-center">
                      Iniciar sesión
                      <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                    </div>
                  )}
                </button>
              </form>

              {/* Forgot password link */}
              <div className="mt-4 text-center">
                <Link href="#" className="text-sm text-indigo-600 hover:text-indigo-500 transition-colors">
                  ¿Olvidaste tu contraseña?
                </Link>
              </div>
            </div>

            {/* Register Form */}
            <div
              className={`transition-all duration-500 ease-in-out ${
                activeTab === 'register'
                  ? 'opacity-100 translate-x-0'
                  : 'opacity-0 -translate-x-10 absolute pointer-events-none'
              }`}
            >
              {registerSuccess ? (
                <div className="text-center py-8">
                  <CheckCircle2 className="h-16 w-16 text-green-500 mx-auto mb-4" />
                  <h3 className="text-xl font-bold text-gray-900 mb-2">¡Registro exitoso!</h3>
                  <p className="text-gray-600">Redirigiendo al login...</p>
                </div>
              ) : (
                <form onSubmit={handleRegister} className="space-y-4">
                  {registerError && (
                    <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded-r-lg">
                      <p className="text-sm text-red-700">{registerError}</p>
                    </div>
                  )}

                  {/* Sección: Datos Personales */}
                  <div className="border-b border-gray-200 pb-4 mb-4">
                    <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3 flex items-center gap-2">
                      <User className="h-4 w-4" />
                      Datos Personales
                    </h3>
                    
                    {/* Nombre */}
                    <div className="mb-4">
                      <label htmlFor="register-nombre" className="block text-sm font-medium text-gray-700 mb-2">
                        Nombre completo *
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <User className="h-5 w-5 text-gray-400" />
                        </div>
                        <input
                          id="register-nombre"
                          data-testid="register-name"
                          name="nombre"
                          type="text"
                          required
                          className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200"
                          placeholder="Tu nombre completo"
                          value={registerData.nombre}
                          onChange={(e) => setRegisterData({ ...registerData, nombre: e.target.value })}
                        />
                      </div>
                    </div>

                    {/* Email */}
                    <div className="mb-4">
                      <label htmlFor="register-email" className="block text-sm font-medium text-gray-700 mb-2">
                        Correo electrónico *
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <Mail className="h-5 w-5 text-gray-400" />
                        </div>
                        <input
                          id="register-email"
                          data-testid="register-email"
                          name="email"
                          type="email"
                          required
                          className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200"
                          placeholder="tu@email.com"
                          value={registerData.email}
                          onChange={(e) => {
                            setRegisterData({ ...registerData, email: e.target.value });
                            setSharedEmail(e.target.value);
                          }}
                        />
                      </div>
                    </div>

                    {/* Teléfono */}
                    <div className="mb-4">
                      <label htmlFor="register-telefono" className="block text-sm font-medium text-gray-700 mb-2">
                        Teléfono <span className="text-gray-400 font-normal">(opcional)</span>
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <Phone className="h-5 w-5 text-gray-400" />
                        </div>
                        <input
                          id="register-telefono"
                          name="telefono"
                          type="tel"
                          className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200"
                          placeholder="+34 600 123 456"
                          value={registerData.telefono}
                          onChange={(e) => setRegisterData({ ...registerData, telefono: e.target.value })}
                        />
                      </div>
                    </div>

                    {/* Password */}
                    <div className="mb-4">
                      <label htmlFor="register-password" className="block text-sm font-medium text-gray-700 mb-2">
                        Contraseña *
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <Lock className="h-5 w-5 text-gray-400" />
                        </div>
                        <input
                          id="register-password"
                          data-testid="register-password"
                          name="password"
                          type={showRegisterPassword ? 'text' : 'password'}
                          required
                          className="block w-full pl-10 pr-12 py-3 border border-gray-300 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200"
                          placeholder="Mínimo 8 caracteres"
                          value={registerData.password}
                          onChange={(e) => setRegisterData({ ...registerData, password: e.target.value })}
                        />
                        <button
                          type="button"
                          onClick={() => setShowRegisterPassword(!showRegisterPassword)}
                          className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
                        >
                          {showRegisterPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                        </button>
                      </div>
                    </div>

                    {/* Confirm Password */}
                    <div>
                      <label htmlFor="register-confirm" className="block text-sm font-medium text-gray-700 mb-2">
                        Confirmar contraseña *
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <Lock className="h-5 w-5 text-gray-400" />
                        </div>
                        <input
                          id="register-confirm"
                          data-testid="register-confirm-password"
                          name="confirmarPassword"
                          type={showConfirmPassword ? 'text' : 'password'}
                          required
                          className="block w-full pl-10 pr-12 py-3 border border-gray-300 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200"
                          placeholder="Repite tu contraseña"
                          value={registerData.confirmarPassword}
                          onChange={(e) => setRegisterData({ ...registerData, confirmarPassword: e.target.value })}
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
                        >
                          {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Sección: Dirección de Envío */}
                  <div className="border-b border-gray-200 pb-4 mb-4">
                    <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3 flex items-center gap-2">
                      <MapPin className="h-4 w-4" />
                      Dirección de Envío
                    </h3>
                    
                    {/* Dirección */}
                    <div className="mb-4">
                      <label htmlFor="register-direccion" className="block text-sm font-medium text-gray-700 mb-2">
                        Calle y número *
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <Home className="h-5 w-5 text-gray-400" />
                        </div>
                        <input
                          id="register-direccion"
                          name="direccion"
                          type="text"
                          required
                          className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200"
                          placeholder="Calle Mayor 123"
                          value={registerData.direccion}
                          onChange={(e) => setRegisterData({ ...registerData, direccion: e.target.value })}
                        />
                      </div>
                    </div>

                    {/* Complemento */}
                    <div className="mb-4">
                      <label htmlFor="register-complemento" className="block text-sm font-medium text-gray-700 mb-2">
                        Piso, puerta, escalera <span className="text-gray-400 font-normal">(opcional)</span>
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <Building className="h-5 w-5 text-gray-400" />
                        </div>
                        <input
                          id="register-complemento"
                          name="complemento"
                          type="text"
                          className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200"
                          placeholder="2º A"
                          value={registerData.complemento}
                          onChange={(e) => setRegisterData({ ...registerData, complemento: e.target.value })}
                        />
                      </div>
                    </div>

                    {/* Código Postal */}
                    <div className="mb-4">
                      <label htmlFor="register-cp" className="block text-sm font-medium text-gray-700 mb-2">
                        Código Postal *
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <Map className="h-5 w-5 text-gray-400" />
                        </div>
                        <input
                          id="register-cp"
                          name="codigoPostal"
                          type="text"
                          required
                          maxLength={5}
                          pattern="\d{5}"
                          className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200"
                          placeholder="28001"
                          value={registerData.codigoPostal}
                          onChange={(e) => setRegisterData({ ...registerData, codigoPostal: e.target.value })}
                        />
                      </div>
                    </div>

                    {/* Ciudad y Provincia - Grid */}
                    <div className="grid grid-cols-2 gap-4">
                      {/* Ciudad */}
                      <div>
                        <label htmlFor="register-ciudad" className="block text-sm font-medium text-gray-700 mb-2">
                          Ciudad *
                        </label>
                        <input
                          id="register-ciudad"
                          name="ciudad"
                          type="text"
                          required
                          className="block w-full px-3 py-3 border border-gray-300 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200"
                          placeholder="Madrid"
                          value={registerData.ciudad}
                          onChange={(e) => setRegisterData({ ...registerData, ciudad: e.target.value })}
                        />
                      </div>

                      {/* Provincia */}
                      <div>
                        <label htmlFor="register-provincia" className="block text-sm font-medium text-gray-700 mb-2">
                          Provincia *
                        </label>
                        <input
                          id="register-provincia"
                          name="provincia"
                          type="text"
                          required
                          className="block w-full px-3 py-3 border border-gray-300 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200"
                          placeholder="Madrid"
                          value={registerData.provincia}
                          onChange={(e) => setRegisterData({ ...registerData, provincia: e.target.value })}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    data-testid="register-submit"
                    disabled={registerLoading}
                    className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-xl text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl"
                  >
                    {registerLoading ? (
                      <div className="flex items-center">
                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Registrando...
                      </div>
                    ) : (
                      <div className="flex items-center">
                        Registrarse
                        <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                      </div>
                    )}
                  </button>

                  {/* Terms */}
                  <p className="text-xs text-center text-gray-500">
                    Al registrarte, aceptas nuestros{' '}
                    <a href="#" className="text-indigo-600 hover:text-indigo-500">términos y condiciones</a>
                    {' '}y{' '}
                    <a href="#" className="text-indigo-600 hover:text-indigo-500">política de privacidad</a>
                  </p>
                </form>
              )}
            </div>
          </div>
        </div>

        {/* Test Credentials */}
        <div className="mt-6 bg-white/80 backdrop-blur-sm border border-gray-200 rounded-xl p-4 shadow-sm">
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
            Usuarios de prueba
          </h3>
          <div className="space-y-2 text-xs text-gray-600">
            <div className="flex items-center justify-between bg-white p-2 rounded-lg border border-gray-100">
              <span><strong>Admin:</strong> admin@3dprint.com</span>
              <span className="text-gray-400 font-mono">admin123</span>
            </div>
            <div className="flex items-center justify-between bg-white p-2 rounded-lg border border-gray-100">
              <span><strong>Cliente:</strong> juan@example.com</span>
              <span className="text-gray-400 font-mono">pass123</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AuthPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 via-gray-100 to-indigo-50">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-indigo-600 mx-auto mb-4" />
          <p className="text-gray-600">Cargando...</p>
        </div>
      </div>
    }>
      <AuthContent />
    </Suspense>
  );
}
