/**
 * Página de Login
 * 
 * Esta página implementa autenticación de dos fases:
 * 1. Firebase SDK: Autenticación del usuario (email/password o Google)
 * 2. API /api/sessionLogin: Creación de cookie de sesión server-side
 * 
 * El segundo paso es crucial para que el middleware y Server Components
 * puedan verificar la identidad del usuario sin llamar a Firebase.
 * 
 * Estructura del componente:
 * - LoginForm: Contiene toda la lógica (usa useSearchParams que requiere Suspense)
 * - Login (export default): Wrapper con Suspense para Next.js
 * 
 * Fortalezas:
 * - Suspense boundary para useSearchParams (Next.js requirement)
 * - Manejo de errores con tipo 'unknown' (TypeScript)
 * - Redirección inteligente basada en query params
 */
"use client";

import PublicHeder from "@/components/layout/PublicHeder";
import React, { useState, Suspense } from "react";
import Link from "next/link"; 
import { useRouter, useSearchParams } from "next/navigation";
import { auth, configureAuthPersistence } from "@/lib/firebase-client";
import { signInWithEmailAndPassword, GoogleAuthProvider, signInWithPopup } from "firebase/auth";

/**
 * LoginForm - Componente interno con la lógica de login
 * 
 * Separado del export default para poder usar useSearchParams dentro de Suspense.
 * Next.js requiere que useSearchParams esté envuelto en Suspense.
 */
function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(true);  // Por defecto: recordar sesión
  
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const router = useRouter();
  const searchParams = useSearchParams();
  
  // Si el usuario fue redirigido desde el middleware, 'redirectTo' contiene la página destino
  const redirectTo = searchParams.get("redirectTo") || "/dashboard";

  /**
   * handleLogin - Login con email y contraseña
   * 
   * Flujo de autenticación de dos fases:
   * 1. Firebase valida credenciales en el navegador
   * 2. Obtenemos el idToken de Firebase
   * 3. Enviamos el idToken a /api/sessionLogin para crear la cookie
   * 4. Recargamos el estado del router para que el servidor detecte la cookie
   */
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null);
    setLoading(true);

    try {
      // Configuramos la persistencia según preferencia del usuario
      await configureAuthPersistence(remember);
      
      // FASE 1: Autenticación con Firebase (en el navegador)
      const cred = await signInWithEmailAndPassword(auth, email, password);
      
      // FASE 2: Crear sesión en el servidor
      // Sin este paso, el middleware no puede verificar quién está logueado
      const idToken = await cred.user.getIdToken();  // Obtenemos token de Firebase
      
      const res = await fetch("/api/sessionLogin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idToken, remember }),
      });

      if (!res.ok) throw new Error("No se pudo crear la sesión en el servidor");

      // Redirección + refresco del estado del servidor
      router.push(redirectTo);
      router.refresh();  // Crucial: actualiza Server Components y middleware
      
    } catch (error: unknown) {
      // Usamos 'unknown' en vez de 'any' - es mejor práctica en TypeScript
      console.error("Login Error:", error);
      setErr("El correo o la contraseña son incorrectos.");
    } finally {
      setLoading(false);
    }
  };

  /**
   * handleGoogleLogin - Login con Google OAuth
   * 
   * Usa el mismo flujo de dos fases que el login normal:
   * 1. Firebase maneja el popup de Google
   * 2. Creamos la cookie de sesión server-side
   */
  const handleGoogleLogin = async () => {
    setErr(null);
    setLoading(true);
    const provider = new GoogleAuthProvider();
    
    try {
      await configureAuthPersistence(remember);
      
      // Login con popup de Google
      const result = await signInWithPopup(auth, provider);
      
      // Sincronizar con el servidor (igual que en login normal)
      const idToken = result.user.getIdToken();
      const res = await fetch("/api/sessionLogin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idToken, remember }),
      });

      if (!res.ok) throw new Error("Error en sesión de servidor con Google");

      router.push(redirectTo);
      router.refresh();
      
    } catch {
      setErr("Error al conectar con Google.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <section className="relative overflow-hidden bg-neutral-950 min-h-[calc(100vh-4rem)]">
        <div className="max-w-7xl mx-auto px-4 py-30 relative">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            
            {/* Sección de texto informativo (Lado Izquierdo) */}
            <div>
              <h1 className="text-4xl md:text-5xl font-extrabold leading-tight text-white">
                ENTRA A TU PANEL
              </h1>
              <p className="mt-5 text-amber-400 text-lg">
                Accede a tu panel de control para gestionar tus eventos, revisar
                estadísticas y personalizar tu experiencia con AFTER-REWIND.
              </p>
            </div>

            {/* Tarjeta del formulario (Lado Derecho) */}
            <div className="bg-neutral-900/80 border border-neutral-800 rounded-lg p-8">
              
              {/* Encabezado del formulario */}
              <h2 className="text-2xl font-bold text-center mb-6 text-white">
                Iniciar Sesión
              </h2>
              
              {/* Formulario de inicio de sesión */}
              <form onSubmit={handleLogin} className="space-y-4">
                
                {/* Campo: Correo electrónico */}
                <div>
                  <label className="block text-sm font-medium text-neutral-200" htmlFor="email">
                    Correo Electrónico
                  </label>
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full mt-1 p-2 border border-neutral-700 rounded bg-neutral-800 text-white focus:outline-none focus:ring-2 focus:ring-amber-400"
                    placeholder="correo@example.com"
                  />
                </div>

                {/* Campo: Contraseña */}
                <div>
                  <label className="block text-sm font-medium text-neutral-200" htmlFor="password">
                    Contraseña
                  </label>
                  <div className="relative mt-1">
                    <input
                      id="password"
                      type={showPass ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      className="w-full p-2 pr-20 border border-neutral-700 rounded bg-neutral-800 text-white focus:outline-none focus:ring-2 focus:ring-amber-400"
                      placeholder="Ingresa tu contraseña"
                    />
                    {/* Botón de mostrar/ocultar contraseña */}
                    <button
                      type="button"
                      onClick={() => setShowPass(!showPass)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-neutral-400 hover:text-white"
                    >
                      {showPass ? "Ocultar" : "Mostrar"}
                    </button>
                  </div>
                </div>

                {/* Checkbox para recordar sesión */}
                <div className="flex items-center gap-2">
                  <input 
                    type="checkbox" 
                    id="remember"
                    checked={remember}
                    onChange={(e) => setRemember(e.target.checked)}
                    className="rounded border-neutral-700 bg-neutral-800 text-amber-400"
                  />
                  <label htmlFor="remember" className="text-sm text-neutral-400">Recordarme</label>
                </div>

                {/* Sección: Mensaje de error */}
                {err && (
                  <p className="text-sm text-red-400 bg-red-900/20 p-2 rounded">
                    {err}
                  </p>
                )}

                {/* Botón de envío de inicio de sesión */}
                <button 
                  type="submit" 
                  disabled={loading}
                  className="w-full bg-amber-400 text-neutral-900 font-bold py-2 rounded hover:bg-amber-500 transition-colors disabled:opacity-60"
                >
                  {loading ? "Iniciando..." : "Iniciar Sesión"}
                </button>
              </form>

              {/* Separador de opciones de inicio de sesión */}
              <div className="my-6 flex items-center gap-3">
                <div className="h-px flex-1 bg-neutral-800" />
                <span className="text-xs text-neutral-400">o</span>
                <div className="h-px flex-1 bg-neutral-800" />
              </div>

              {/* Botón de inicio de sesión con Google */}
              <button
                type="button"
                onClick={handleGoogleLogin}
                disabled={loading}
                className="w-full border border-neutral-700 rounded bg-neutral-800 hover:bg-neutral-700 text-white py-2 flex items-center justify-center gap-2 transition-colors disabled:opacity-60"
              >
                <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor">
                  <path d="M21.35 11.1h-9.18v2.98h5.27a4.52 4.52 0 0 1-1.95 2.96 6.06 6.06 0 0 1-3.32.9A6.25 6.25 0 0 1 5.9 11.82a6.25 6.25 0 0 1 6.27-6.25c1.46 0 2.78.5 3.81 1.49l2.09-2.09A9.3 9.3 0 0 0 12.17 2 9.1 9.1 0 0 0 5.7 4.7 9.25 9.25 0 0 0 3 11.82a9.25 9.25 0 0 0 2.7 7.12A9.1 9.1 0 0 0 12.17 22a8.9 8.9 0 0 0 6.08-2.37 6.25 6.25 0 0 0 2.1-4.81c0-.68-.05-1.28-.31-1.72Z" />
                </svg>
                Continuar con Google
              </button>

              {/* Enlace de redirección a Registro */}
              <p className="mt-6 text-center text-sm text-neutral-400">
                ¿No tienes cuenta?{" "}
                <Link href="/signup" className="text-amber-400 hover:text-amber-300 font-medium">
                  Regístrate
                </Link>
              </p>

            </div>
          </div>
        </div>
      </section>
    </>
  );
}

export default function Login() {
  return (
    <>
      <PublicHeder />
      <Suspense fallback={<div className="bg-neutral-950 min-h-screen text-white p-10">Cargando...</div>}>
        <LoginForm />
      </Suspense>
    </>
  );
}