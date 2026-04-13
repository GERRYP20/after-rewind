"use client";

import PublicHeder from "@/components/layout/PublicHeder";
import React, { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation"; // Importamos para la redirección
import { auth, configureAuthPersistence } from "@/lib/firebase-client"; 
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";

// 1. Movemos la lógica a un componente interno para usar Suspense
function SignupForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  
  const router = useRouter(); //

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null);

    // Validación de coincidencia de contraseñas
    if (password !== confirmPassword) {
      setErr("Las contraseñas no coinciden");
      return;
    }

    setLoading(true);
    
    try {
      // A. Configurar persistencia (cliente)
      await configureAuthPersistence(true);

      // B. Crear el usuario en Firebase
      const cred = await createUserWithEmailAndPassword(auth, email, password);
      
      // C. Actualizar el nombre del usuario en su perfil de Firebase
      if (name) {
        await updateProfile(cred.user, { displayName: name });
      }

      // D. SINCRONIZACIÓN CON EL SERVIDOR (Igual que en el Login)
      // Obtenemos el token del nuevo usuario
      const idToken = await cred.user.getIdToken();
      
      // Llamamos a tu API para crear la cookie de sesión
      const res = await fetch("/api/sessionLogin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idToken, remember: true }),
      });

      if (!res.ok) throw new Error("Error al sincronizar la sesión");

      // E. Redirección y refresco de estado
      router.push("/dashboard");
      router.refresh(); // Crucial para que el middleware y el header detecten al usuario
      
    } catch (error: unknown) {
      // Corregimos el error (error: any) usando unknown y type-casting
      const errorMessage = error instanceof Error ? error.message : "Error al crear la cuenta";
      setErr(errorMessage);
      console.error("Signup error:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="relative overflow-hidden bg-neutral-950 min-h-[calc(100vh-4rem)]">
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

          {/* Lado Derecho: Tarjeta del Formulario */}
          <div className="bg-neutral-900/80 border border-neutral-800 rounded-lg p-8 shadow-xl">
            <header className="mb-6 text-center">
              <h2 className="text-2xl font-bold text-white">Crear cuenta</h2>
            </header>

            <form onSubmit={handleSignup} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-neutral-200 mb-1">Nombre completo</label>
                <input
                  type="text" value={name} onChange={(e) => setName(e.target.value)}
                  placeholder="Ej. Gerardo Pérez" required
                  className="w-full p-2 border border-neutral-700 rounded bg-neutral-800 text-white focus:outline-none focus:ring-2 focus:ring-amber-400"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-200 mb-1">Correo Electrónico</label>
                <input
                  type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                  placeholder="tucorreo@dominio.com" required
                  className="w-full p-2 border border-neutral-700 rounded bg-neutral-800 text-white focus:outline-none focus:ring-2 focus:ring-amber-400"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-200 mb-1">Contraseña</label>
                <div className="relative">
                  <input
                    type={showPass ? "text" : "password"} value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="********" required minLength={8}
                    className="w-full p-2 pr-20 border border-neutral-700 rounded bg-neutral-800 text-white focus:outline-none focus:ring-2 focus:ring-amber-400"
                  />
                  <button
                    type="button" onClick={() => setShowPass((s) => !s)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-neutral-400 hover:text-white"
                  >
                    {showPass ? "Ocultar" : "Mostrar"}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-200 mb-1">Confirmar Contraseña</label>
                <input
                  type={showPass ? "text" : "password"} value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="********" required minLength={8}
                  className="w-full p-2 border border-neutral-700 rounded bg-neutral-800 text-white focus:outline-none focus:ring-2 focus:ring-amber-400"
                />
              </div>

              {err && <p className="rounded bg-red-900/20 p-2 text-sm text-red-400">{err}</p>}

              <button
                type="submit" disabled={loading}
                className="w-full bg-amber-400 text-neutral-900 font-bold py-2 rounded hover:bg-amber-500 transition-colors disabled:opacity-60 mt-4"
              >
                {loading ? "Creando cuenta..." : "Registrarse"}
              </button>
            </form>

            <p className="mt-6 text-center text-sm text-neutral-400">
              ¿Ya tienes cuenta? <Link href="/login" className="text-amber-400 hover:text-amber-300 font-medium">Inicia sesión</Link>
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

// 2. Exportamos el componente envuelto en Suspense
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