/**
 * Esta página implementa autenticación de dos fases con diseño Glassmorphism:
 * 1. Firebase SDK: Autenticación del usuario (email/password o Google)
 * 2. API /api/sessionLogin: Creación de cookie de sesión server-side
 * El diseño utiliza:
 * - GlassCard: Tarjeta translúcida con backdrop-blur-xl
 * - AnimatedBackground: 3 orbes dinámicos pulsantes
 * - GlassInput: Campos con brillo amber en foco
 * - GlassButton: Botón con respuesta orgánica al hover/tap
 * Estructura del componente:
 * - LoginForm: Contiene toda la lógica (usa useSearchParams que requiere Suspense)
 * - Login (export default): Wrapper con Suspense para Next.js
 */
"use client";

import PublicHeder from "@/components/layout/PublicHeder";
import GlassCard from "@/components/ui/GlassCard";
import GlassInput from "@/components/ui/GlassInput";
import GlassButton from "@/components/ui/GlassButton";
import GlassPasswordInput from "@/components/ui/GlassPasswordInput";
import AnimatedBackground from "@/components/ui/AnimatedBackground";
import { useAuth } from "@/lib/use-auth";
import React, { useState, Suspense, ChangeEvent, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { auth, configureAuthPersistence } from "@/lib/firebase-client";
import {
  signInWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
} from "firebase/auth";

/**
 * LoginForm - Componente interno con la lógica de login
 * Separado del export default para usar useSearchParams dentro de Suspense.
 * Next.js requiere que useSearchParams esté envuelto en Suspense.
 */
function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(true);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const { user, loading: authLoading } = useAuth();

  const router = useRouter();
  const searchParams = useSearchParams();

  const redirectTo = searchParams.get("redirectTo") || "/dashboard";

  // Redirigir al dashboard si el usuario ya está logueado
  useEffect(() => {
    if (!authLoading && user) {
      router.push(redirectTo);
    }
  }, [user, authLoading, router, redirectTo]);

  /**
   * handleLogin - Login con email y contraseña
   * Flujo de autenticación de dos fases:
   * 1. Firebase valida credenciales en el navegador
   * 2. Se obtiene el idToken de Firebase
   * 3. Se envía el idToken a /api/sessionLogin para crear la cookie
   * 4. Se recarga el estado del router para que el servidor detecte la cookie
   */
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

  /**
   * handleGoogleLogin - Login con Google OAuth
   *
   * Usa el mismo flujo de dos fases que el login normal:
   * 1. Firebase maneja el popup de Google
   * 2. Se crea la cookie de sesión server-side
   */
  const handleGoogleLogin = async () => {
    setErr(null);
    setLoading(true);
    const provider = new GoogleAuthProvider();

    try {
      await configureAuthPersistence(remember);

      const result = await signInWithPopup(auth, provider);

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
        {/* Fondo dinámico con orbes - detrás del contenido */}
        <AnimatedBackground />

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

            {/* Tarjeta del formulario con Glassmorphism (Lado Derecho) */}
            <div className="max-w-md mx-auto w-full">
              <GlassCard className="p-8">
                {/* Encabezado del formulario */}
                <h2 className="text-2xl font-bold text-center mb-6 text-white">
                  Iniciar Sesión
                </h2>

                {/* Formulario de inicio de sesión */}
                <form onSubmit={handleLogin} className="space-y-5">
                  {/* Campo: Correo electrónico */}
                  <GlassInput
                    id="email"
                    type="email"
                    label="Correo Electrónico"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    placeholder="correo@example.com"
                  />

                  {/* Campo: Contraseña con icono de ojo */}
                  <GlassPasswordInput
                    id="password"
                    label="Contraseña"
                    value={password}
                    onChange={(e: ChangeEvent<HTMLInputElement>) =>
                      setPassword(e.target.value)
                    }
                    required
                    placeholder="Ingresa tu contraseña"
                  />

                  {/* Checkbox para recordar sesión */}
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="remember"
                      checked={remember}
                      onChange={(e) => setRemember(e.target.checked)}
                      className="rounded border-white/20 bg-white/5 text-amber-400 focus:ring-amber-400/50 focus:ring-offset-0"
                    />
                    <label
                      htmlFor="remember"
                      className="text-sm text-neutral-400"
                    >
                      Recordarme
                    </label>
                  </div>

                  {/* Sección: Mensaje de error */}
                  {err && (
                    <p className="text-sm text-red-400 bg-red-900/20 p-3 rounded-lg border border-red-900/30">
                      {err}
                    </p>
                  )}

                  {/* Botón de envío de inicio de sesión */}
                  <GlassButton type="submit" disabled={loading}>
                    {loading ? "Iniciando..." : "Iniciar Sesión"}
                  </GlassButton>
                </form>

                {/* Separador de opciones de inicio de sesión */}
                <div className="my-6 flex items-center gap-3">
                  <div className="h-px flex-1 bg-white/10" />
                  <span className="text-xs text-neutral-400">o</span>
                  <div className="h-px flex-1 bg-white/10" />
                </div>

                {/* Botón de inicio de sesión con Google */}
                <GlassButton
                  type="button"
                  onClick={handleGoogleLogin}
                  disabled={loading}
                  variant="secondary"
                >
                  <span className="flex items-center justify-center gap-2">
                    <svg
                      viewBox="0 0 24 24"
                      className="w-5 h-5"
                      fill="currentColor"
                    >
                      <path d="M21.35 11.1h-9.18v2.98h5.27a4.52 4.52 0 0 1-1.95 2.96 6.06 6.06 0 0 1-3.32.9A6.25 6.25 0 0 1 5.9 11.82a6.25 6.25 0 0 1 6.27-6.25c1.46 0 2.78.5 3.81 1.49l2.09-2.09A9.3 9.3 0 0 0 12.17 2 9.1 9.1 0 0 0 5.7 4.7 9.25 9.25 0 0 0 3 11.82a9.25 9.25 0 0 0 2.7 7.12A9.1 9.1 0 0 0 12.17 22a8.9 8.9 0 0 0 6.08-2.37 6.25 6.25 0 0 0 2.1-4.81c0-.68-.05-1.28-.31-1.72Z" />
                    </svg>
                    Continuar con Google
                  </span>
                </GlassButton>

                {/* Enlace de redirección a Registro - solo mostrar si no está logueado */}
                {!user && (
                  <p className="mt-6 text-center text-sm text-neutral-400">
                    ¿No tienes cuenta?{" "}
                    <Link
                      href="/signup"
                      className="text-amber-400 hover:text-amber-300 font-medium"
                    >
                      Regístrate
                    </Link>
                  </p>
                )}
              </GlassCard>
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
      <Suspense
        fallback={
          <div className="bg-neutral-950 min-h-screen text-white p-10">
            Cargando...
          </div>
        }
      >
        <LoginForm />
      </Suspense>
    </>
  );
}
