"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Invitation } from "@/lib/invitations/invitation.types";

export default function DetalleInvitacion() {
  const { id } = useParams();
  const [evento, setEvento] = useState<Invitation | null>(null);

  useEffect(() => {
    fetch(`/api/invitations/${id}`)
      .then(res => res.json())
      .then(data => setEvento(data));
  }, [id]);

  if (!evento) return <div className="pt-32 text-center text-white">Cargando detalles...</div>;

  return (
    <div className="pt-32 p-8 max-w-4xl mx-auto text-white">
      <h1 className="text-5xl font-bold mb-4">{evento.title}</h1>
      <div className="bg-[#222225] p-8 rounded-3xl border border-white/5 space-y-6">
        <p className="text-2xl text-[#E8B973]">📍 {evento.location}</p>
        <p className="text-xl">📅 {new Date(evento.date).toLocaleDateString('es-MX', { dateStyle: 'full' })}</p>
        <div className="p-6 bg-black/40 rounded-2xl border border-white/10">
          <p className="text-gray-400 uppercase text-xs font-bold mb-2">Código de Acceso Privado</p>
          <p className="text-4xl font-mono font-bold text-amber-500">{evento.accessCode}</p>
        </div>
      </div>
    </div>
  );
}