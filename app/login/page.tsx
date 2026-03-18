"use client";
import PublicHeder from "@/components/layout/PublicHeder";

import React from "react";
import { useState } from "react";
function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  return (
    <>
      <PublicHeder />
      <section className="relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 py-20 relative">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h1 className="text-4xl md:text-5xl font-extrabold leading-tight">
                ENTRA A TU PANEL
              </h1>
              <p className="mt-5 text-amber-400 text-lg">
                Accede a tu panel de control para gestionar tus eventos, revisar
                estadísticas y personalizar tu experiencia con AFTER-REWIND.
              </p>
            </div>
            <div className="bg-slate-900/60 border border-slate-800 rounded-lg p-8">
                <h2 className="text-2xl font-bold text-center mb-6">
                    Iniciar Sesión
                </h2>
                <form className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium" htmlFor="email">
                            Correo Electrónico
                        </label>
                        <input
                            type="email"
                            className="w-full mt-1 p-2 border border-gray-700 rounded bg-slate-800 text-white focus:outline-none focus:ring-2 focus:ring-amber-400"
                            placeholder="correo@example.com"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium" htmlFor="password">
                            Contraseña
                        </label>
                        <input
                            type="password"
                            className="w-full mt-1 p-2 border border-gray-700 rounded bg-slate-800 text-white focus:outline-none focus:ring-2 focus:ring-amber-400"
                            placeholder="Ingresa tu contraseña"
                        />
                    </div>
                    <button type="submit" className="w-full bg-amber-400 text-slate-900 font-bold py-2 rounded hover:bg-amber-500 transition-colors">
                        Iniciar Sesión
                    </button>
                </form>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

export default Login;
