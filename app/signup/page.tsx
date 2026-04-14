/**
 * Página de Registro de Usuario
 * 
 * Esta página permite crear nuevas cuentas de usuario.
 * Implementa el mismo flujo de autenticación de dos fases que el login:
 * 1. Firebase SDK: Crea el usuario y autentica
 * 2. API /api/sessionLogin: Crea la cookie de sesión server-side
 * 
 *
 * - Actualización de perfil de usuario (displayName)
 * - Validación de confirmación de contraseña
 * - Mensajes de error seguros al usuario
 * - Redirección automática tras registro exitoso
 */
"use client";

import PublicHeder from "@/components/layout/PublicHeder";
import React, { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { auth, configureAuthPersistence } from "@/lib/firebase-client"; 
import { createUserWithEmailAndPassword, updateProfile, GoogleAuthProvider, signInWithPopup } from "firebase/auth";

function SignupForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  
  const router = useRouter();

  /**
   * handleSignup - Registro con Email y Contraseña
   */
  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null);

    if (password !== confirmPassword) {
      setErr("Las contraseñas no coinciden");
      return;
    }

    setLoading(true);
    
    try {
      const cred = await createUserWithEmailAndPassword(auth, email, password);
      
      if (name) {
        await updateProfile(cred.user, { displayName: name });
      }

      const idToken = await cred.user.getIdToken();
      
      const res = await fetch("/api/sessionLogin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idToken, remember: true }),
      });

      if (!res.ok) throw new Error("Error al sincronizar la sesión");

      router.push("/dashboard");
      router.refresh();
      
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Error al crear la cuenta";
      setErr(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  /**
   * handleGoogleLogin - Registro/Login rápido con Google
   */
  const handleGoogleLogin = async () => {
    setErr(null);
    setLoading(true);
    const provider = new GoogleAuthProvider();
    
    try {
      // Por defecto para registros nuevos solemos recordar sesión
      await configureAuthPersistence(true);
      
      const result = await signInWithPopup(auth, provider);
      const idToken = await result.user.getIdToken();
      
      const res = await fetch("/api/sessionLogin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idToken, remember: true }),
      });

      if (!res.ok) throw new Error("Error en sesión de servidor con Google");

      router.push("/dashboard");
      router.refresh();
      
    } catch {
      setErr("Error al conectar con Google.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="relative flex items-center justify-center min-h-[calc(100vh-4rem)] bg-[url('/evento.png')] bg-cover bg-center bg-no-repeat bg-fixed">
      {/* Capa oscura superpuesta */}
      <div className="absolute inset-0 bg-neutral-950/70 backdrop-blur-[2px]"></div>
      
      <div className="w-full max-w-6xl mx-auto px-4 py-12 relative z-10">
        <div className="grid md:grid-cols-2 gap-12 lg:gap-20 items-center">
          
          {/* Lado Izquierdo: Texto Informativo */}
          <div className="text-center md:text-left drop-shadow-md">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold leading-tight text-white mb-6">
              ÚNETE A <span className="text-amber-400">AFTER-REWIND</span>
            </h1>
            <p className="text-neutral-200 text-lg md:text-xl font-light leading-relaxed max-w-lg mx-auto md:mx-0">
              Comienza a capturar la esencia de cada instante. Crea tu cuenta para organizar eventos inolvidables y gestionar tus recuerdos.
            </p>
          </div>

          {/* Lado Derecho: Tarjeta del Formulario */}
          <div className="bg-neutral-900/60 backdrop-blur-md border border-neutral-800/50 rounded-2xl p-8 shadow-2xl">
            <header className="mb-8 text-center">
              <h2 className="text-2xl font-bold text-white">Crear cuenta</h2>
            </header>

            <form onSubmit={handleSignup} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-neutral-300 mb-1">Nombre completo</label>
                <input
                  type="text" value={name} onChange={(e) => setName(e.target.value)}
                  placeholder="Ej. Gerardo Pérez" required
                  className="w-full p-3 border border-neutral-700/50 rounded-lg bg-neutral-800/50 text-white focus:outline-none focus:ring-2 focus:ring-amber-400 transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-300 mb-1">Correo Electrónico</label>
                <input
                  type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                  placeholder="tucorreo@dominio.com" required
                  className="w-full p-3 border border-neutral-700/50 rounded-lg bg-neutral-800/50 text-white focus:outline-none focus:ring-2 focus:ring-amber-400 transition-all"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-300 mb-1">Contraseña</label>
                  <div className="relative">
                    <input
                      type={showPass ? "text" : "password"} value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="********" required minLength={8}
                      className="w-full p-3 pr-12 border border-neutral-700/50 rounded-lg bg-neutral-800/50 text-white focus:outline-none focus:ring-2 focus:ring-amber-400 transition-all"
                    />
                    <button
                      type="button" onClick={() => setShowPass((s) => !s)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-neutral-400 hover:text-amber-400 transition-colors"
                    >
                      {showPass ? "Ocultar" : "Ver"}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-300 mb-1">Confirmar</label>
                  <input
                    type={showPass ? "text" : "password"} value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="********" required minLength={8}
                    className="w-full p-3 border border-neutral-700/50 rounded-lg bg-neutral-800/50 text-white focus:outline-none focus:ring-2 focus:ring-amber-400 transition-all"
                  />
                </div>
              </div>

              {err && (
                <div className="text-sm text-red-300 bg-red-900/30 border border-red-900/50 p-3 rounded-lg flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {err}
                </div>
              )}

              <button
                type="submit" disabled={loading}
                className="w-full bg-amber-400 text-neutral-950 font-bold py-3 rounded-lg hover:bg-amber-300 transition-all transform hover:scale-[1.01] active:scale-95 disabled:opacity-60 mt-2 shadow-lg shadow-amber-400/20"
              >
                {loading ? "Creando cuenta..." : "Registrarse"}
              </button>
            </form>

            {/* Separador */}
            <div className="my-6 flex items-center gap-4">
              <div className="h-px flex-1 bg-neutral-700/50" />
              <span className="text-xs uppercase font-medium text-neutral-400 tracking-wider">o regístrate con</span>
              <div className="h-px flex-1 bg-neutral-700/50" />
            </div>

            {/* Botón de Google */}
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

            <p className="mt-8 text-center text-sm text-neutral-400">
              ¿Ya tienes cuenta? <Link href="/login" className="text-amber-400 hover:text-amber-300 font-semibold transition-colors">Inicia sesión</Link>
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

export default function Signup() {
  return (
    <>
      <PublicHeder />
      <Suspense fallback={
        <div className="bg-neutral-950 min-h-[calc(100vh-4rem)] flex items-center justify-center text-amber-400">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-400"></div>
        </div>
      }>
        <SignupForm />
      </Suspense>
    </>
  );
}