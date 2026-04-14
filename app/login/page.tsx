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

function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(true);
  
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const router = useRouter();
  const searchParams = useSearchParams();
  
  const redirectTo = searchParams.get("redirectTo") || "/dashboard";

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null);
    setLoading(true);

    try {
      await configureAuthPersistence(remember);
      const cred = await signInWithEmailAndPassword(auth, email, password);
      const idToken = await cred.user.getIdToken();
      
      const res = await fetch("/api/sessionLogin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idToken, remember }),
      });

      if (!res.ok) throw new Error("No se pudo crear la sesión en el servidor");

      router.push(redirectTo);
      router.refresh();
      
    } catch (error: unknown) {
      console.error("Login Error:", error);
      setErr("El correo o la contraseña son incorrectos.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setErr(null);
    setLoading(true);
    const provider = new GoogleAuthProvider();
    
    try {
      await configureAuthPersistence(remember);
      const result = await signInWithPopup(auth, provider);
      const idToken = await result.user.getIdToken();
      
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
    <section className="relative flex items-center justify-center min-h-[calc(100vh-4rem)] bg-[url('/evento.png')] bg-cover bg-center bg-no-repeat bg-fixed">
      {/* Capa oscura superpuesta para que el texto resalte sobre la imagen */}
      <div className="absolute inset-0 bg-neutral-950/70 backdrop-blur-[2px]"></div>
      
      <div className="w-full max-w-6xl mx-auto px-4 py-12 relative z-10">
        <div className="grid md:grid-cols-2 gap-12 lg:gap-20 items-center">
          
          {/* Sección de texto informativo (Lado Izquierdo) */}
          <div className="text-center md:text-left drop-shadow-md">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold leading-tight text-white mb-6">
              ENTRA A TU <span className="text-amber-400">PANEL</span>
            </h1>
            <p className="text-neutral-200 text-lg md:text-xl font-light leading-relaxed max-w-lg mx-auto md:mx-0">
              Accede a tu panel de control para gestionar tus eventos, revisar
              estadísticas y personalizar tu experiencia con <strong className="font-semibold text-white">AFTER-REWIND</strong>.
            </p>
          </div>

          {/* Tarjeta del formulario (Lado Derecho) */}
          <div className="bg-neutral-900/60 backdrop-blur-md border border-neutral-800/50 rounded-2xl p-8 sm:p-10 shadow-2xl">
            
            <h2 className="text-2xl font-bold text-center mb-8 text-white">
              Iniciar Sesión
            </h2>
            
            <form onSubmit={handleLogin} className="space-y-5">
              
              {/* Campo: Correo electrónico */}
              <div>
                <label className="block text-sm font-medium text-neutral-300 mb-1" htmlFor="email">
                  Correo Electrónico
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full p-3 border border-neutral-700/50 rounded-lg bg-neutral-800/50 text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:bg-neutral-800 transition-all"
                  placeholder="correo@example.com"
                />
              </div>

              {/* Campo: Contraseña */}
              <div>
                <label className="block text-sm font-medium text-neutral-300 mb-1" htmlFor="password">
                  Contraseña
                </label>
                <div className="relative">
                  <input
                    id="password"
                    type={showPass ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="w-full p-3 pr-20 border border-neutral-700/50 rounded-lg bg-neutral-800/50 text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:bg-neutral-800 transition-all"
                    placeholder="Ingresa tu contraseña"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass(!showPass)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-sm font-medium text-neutral-400 hover:text-amber-400 transition-colors"
                  >
                    {showPass ? "Ocultar" : "Mostrar"}
                  </button>
                </div>
              </div>

              {/* Checkbox para recordar sesión */}
              <div className="flex items-center gap-3 pt-1">
                <input 
                  type="checkbox" 
                  id="remember"
                  checked={remember}
                  onChange={(e) => setRemember(e.target.checked)}
                  className="w-4 h-4 rounded border-neutral-600 bg-neutral-800/50 text-amber-400 focus:ring-amber-400 focus:ring-offset-neutral-900"
                />
                <label htmlFor="remember" className="text-sm text-neutral-300 cursor-pointer select-none">
                  Recordarme
                </label>
              </div>

              {/* Mensaje de error */}
              {err && (
                <div className="text-sm text-red-300 bg-red-900/30 border border-red-900/50 p-3 rounded-lg flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {err}
                </div>
              )}

              {/* Botón de envío */}
              <button 
                type="submit" 
                disabled={loading}
                className="w-full bg-amber-400 text-neutral-950 font-bold py-3 rounded-lg hover:bg-amber-300 transition-all transform hover:scale-[1.01] active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none mt-2 shadow-lg shadow-amber-400/20"
              >
                {loading ? "Iniciando..." : "Iniciar Sesión"}
              </button>
            </form>

            {/* Separador */}
            <div className="my-8 flex items-center gap-4">
              <div className="h-px flex-1 bg-neutral-700/50" />
              <span className="text-xs uppercase font-medium text-neutral-400 tracking-wider">o ingresa con</span>
              <div className="h-px flex-1 bg-neutral-700/50" />
            </div>

            {/* Login con Google */}
            <button
              type="button"
              onClick={handleGoogleLogin}
              disabled={loading}
              className="w-full border border-neutral-700 rounded-lg bg-neutral-800/40 hover:bg-neutral-800 text-white py-3 flex items-center justify-center gap-3 transition-all disabled:opacity-60"
            >
              <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor">
                <path d="M21.35 11.1h-9.18v2.98h5.27a4.52 4.52 0 0 1-1.95 2.96 6.06 6.06 0 0 1-3.32.9A6.25 6.25 0 0 1 5.9 11.82a6.25 6.25 0 0 1 6.27-6.25c1.46 0 2.78.5 3.81 1.49l2.09-2.09A9.3 9.3 0 0 0 12.17 2 9.1 9.1 0 0 0 5.7 4.7 9.25 9.25 0 0 0 3 11.82a9.25 9.25 0 0 0 2.7 7.12A9.1 9.1 0 0 0 12.17 22a8.9 8.9 0 0 0 6.08-2.37 6.25 6.25 0 0 0 2.1-4.81c0-.68-.05-1.28-.31-1.72Z" />
              </svg>
              Continuar con Google
            </button>

            {/* Enlace a Registro */}
            <p className="mt-8 text-center text-sm text-neutral-400">
              ¿No tienes cuenta?{" "}
              <Link href="/signup" className="text-amber-400 hover:text-amber-300 font-semibold transition-colors">
                Regístrate
              </Link>
            </p>

          </div>
        </div>
      </div>
    </section>
  );
}

export default function Login() {
  return (
    <>
      <PublicHeder />
      <Suspense fallback={
        <div className="bg-neutral-950 min-h-[calc(100vh-4rem)] flex items-center justify-center text-amber-400">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-400"></div>
        </div>
      }>
        <LoginForm />
      </Suspense>
    </>
  );
}