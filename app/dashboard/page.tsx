"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import GlassCard from "@/components/ui/GlassCard";
import GlassButton from "@/components/ui/GlassButton";
// 1. Importamos la interfaz para que TypeScript sepa qué es un 'evento'
import { Invitation } from "@/lib/invitations/invitation.types";

export default function Dashboard() {
  // 2. Definimos que el estado es un arreglo de Invitaciones
  const [eventos, setEventos] = useState<Invitation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/invitations")
      .then(res => res.json())
      .then((data: Invitation[]) => {
        setEventos(data);
        setLoading(false);
      })
      .catch(err => {
        console.error("Error:", err);
        setLoading(false);
      });
  }, []);

  if (loading) return <div className="pt-32 text-center text-white text-xl">Buscando tus eventos...</div>;

  return (
    <div className="pt-32 p-8 max-w-7xl mx-auto min-h-screen">
      <div className="flex justify-between items-center mb-10">
        <h1 className="text-4xl font-bold text-white">Mis Eventos</h1>
        <Link href="/dashboard/invitaciones/nueva">
          <GlassButton>+ Crear Evento</GlassButton>
        </Link>
      </div>

      {eventos.length === 0 ? (
        <GlassCard>
          <div className="text-center py-10 text-white">No hay eventos guardados aún.</div>
        </GlassCard>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* 3. Cambiamos 'any' por 'Invitation'[cite: 2] */}
          {eventos.map((evento: Invitation) => (
            <GlassCard key={evento.id} title={evento.title}>
              <div className="text-gray-200 space-y-3">
                <p>📍 {evento.location}</p>
                {/* 4. Usamos un String de la fecha (convertida en el repositorio)[cite: 2] */}
                <p>📅 {evento.date.toString()}</p>
                <div className="bg-white/10 p-2 rounded text-center font-mono text-yellow-400">
                  Código: {evento.accessCode}
                </div>
                <GlassButton className="w-full mt-4">Gestionar Evento</GlassButton>
              </div>
            </GlassCard>
          ))}
        </div>
      )}
    </div>
  );
}