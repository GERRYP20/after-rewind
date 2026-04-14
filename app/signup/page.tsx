/**
 * Página de Registro con Glassmorphism
 * 
 * Esta página permite crear nuevas cuentas de usuario.
 * Implementa el mismo flujo de autenticación de dos fases que el login:
 * 1. Firebase SDK: Crea el usuario y autentica
 * 2. API /api/sessionLogin: Crea la cookie de sesión server-side
 * 
 * El diseño utiliza los mismos componentes Glassmorphism:
 * - GlassCard: Tarjeta translúcida con backdrop-blur-xl
 * - AnimatedBackground: 3 orbes dinámicos pulsantes
 * - GlassInput: Campos con brillo amber en foco
 * - GlassButton: Botón con respuesta orgánica al hover/tap
 * 
 * Fortalezas:
 * - Actualización de perfil de usuario (displayName)
 * - Validación de confirmación de contraseña
 * - Mensajes de error seguros al usuario
 * - Redirección automática tras registro exitoso
 */
"use client";

import PublicHeder from "@/components/layout/PublicHeder";
import GlassCard from "@/components/ui/GlassCard";
import GlassInput from "@/components/ui/GlassInput";
import GlassButton from "@/components/ui/GlassButton";
import GlassPasswordInput from "@/components/ui/GlassPasswordInput";
import AnimatedBackground from "@/components/ui/AnimatedBackground";
import React, { useState, Suspense, ChangeEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { auth } from "@/lib/firebase-client"; 
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";

/**
 * SignupForm - Componente interno con la lógica de registro
 * 
 * Separado del export default para mantener la estructura consistente
 * con la página de login.
 */
function SignupForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  
  const router = useRouter();

  /**
   * handleSignup - Registra un nuevo usuario
   * 
   * Flujo completo:
   * 1. Se valida que las contraseñas coincidan
   * 2. Se crea usuario con Firebase (email + password)
   * 3. Se actualiza el perfil con el nombre display
   * 4. Se crea sesión server-side (cookie)
   * 5. Se redirige al dashboard
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
      console.error("Signup error:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="relative overflow-hidden bg-neutral-950 min-h-[calc(100vh-4rem)]">
      
      {/* Fondo dinámico con orbes - detrás del contenido */}
      <AnimatedBackground />
      
      <div className="max-w-7xl mx-auto px-4 py-30 relative">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          
          {/* Lado Izquierdo: Texto Informativo */}
          <div>
            <h1 className="text-4xl md:text-5xl font-extrabold leading-tight text-white">
              Únete a <span className="text-amber-400">AFTER-REWIND</span>
            </h1>
            <p className="mt-5 text-amber-400 text-lg">
              Comienza a capturar la esencia de cada instante. Crea tu cuenta para organizar eventos inolvidables.
            </p>
          </div>

          {/* Tarjeta del Formulario con Glassmorphism (Lado Derecho) */}
          <div className="max-w-md mx-auto w-full">
            <GlassCard className="p-8">
              <header className="mb-6 text-center">
                <h2 className="text-2xl font-bold text-white">Crear cuenta</h2>
              </header>

              <form onSubmit={handleSignup} className="space-y-5">
                
                {/* Campo: Nombre completo */}
                <GlassInput
                  type="text"
                  label="Nombre completo"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ej. Gerardo Pérez"
                  required
                />

                {/* Campo: Correo Electrónico */}
                <GlassInput
                  type="email"
                  label="Correo Electrónico"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="tucorreo@dominio.com"
                  required
                />

                {/* Campo: Contraseña con icono de ojo */}
                <GlassPasswordInput
                  label="Contraseña"
                  value={password}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
                  placeholder="********"
                  required
                  minLength={8}
                />

                {/* Campo: Confirmar Contraseña con icono de ojo */}
                <GlassPasswordInput
                  label="Confirmar Contraseña"
                  value={confirmPassword}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => setConfirmPassword(e.target.value)}
                  placeholder="********"
                  required
                  minLength={8}
                />

                {/* Mensaje de error */}
                {err && (
                  <p className="text-sm text-red-400 bg-red-900/20 p-3 rounded-lg border border-red-900/30">
                    {err}
                  </p>
                )}

                {/* Botón de envío */}
                <GlassButton 
                  type="submit" 
                  disabled={loading}
                >
                  {loading ? "Creando cuenta..." : "Registrarse"}
                </GlassButton>
              </form>

              {/* Enlace a Login */}
              <p className="mt-6 text-center text-sm text-neutral-400">
                ¿Ya tienes cuenta? <Link href="/login" className="text-amber-400 hover:text-amber-300 font-medium">Inicia sesión</Link>
              </p>
            </GlassCard>
          </div>
        </div>
      </div>
    </section>
  );
}

/**
 * Signup - Componente exportado
 * 
 * Wrapper con Suspense para useRouter (patrón consistente con login).
 */
export default function Signup() {
  return (
    <>
      <PublicHeder />
      <Suspense fallback={<div className="bg-neutral-950 min-h-screen text-white p-10">Cargando...</div>}>
        <SignupForm />
      </Suspense>
    </>
  );
}