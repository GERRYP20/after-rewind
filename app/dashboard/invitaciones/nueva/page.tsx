"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import GlassCard from "@/components/ui/GlassCard";
import GlassInput from "@/components/ui/GlassInput";
import GlassButton from "@/components/ui/GlassButton";

export default function NuevaInvitacion() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    date: "",
    location: "",
    accessCode: ""
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const res = await fetch("/api/invitations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        // Redirigimos al dashboard principal tras el éxito
        router.push("/dashboard");
        router.refresh();
      } else {
        alert("Ocurrió un error al guardar la invitación.");
      }
    } catch (error) {
      console.error("Error al enviar el formulario:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    // pt-32 asegura que el contenido no quede debajo del Header
    <div className="pt-32 p-8 max-w-2xl mx-auto min-h-screen">
      <GlassCard title="✨ Nueva Invitación">
        <form onSubmit={handleSubmit} className="space-y-6 mt-4">
          <GlassInput
            label="Nombre del Evento"
            placeholder="Ej: Boda de Ana y Juan"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            required
          />
          
          <GlassInput
            label="Fecha del Evento"
            type="date"
            value={formData.date}
            onChange={(e) => setFormData({ ...formData, date: e.target.value })}
            required
          />

          <GlassInput
            label="Ubicación"
            placeholder="Ej: Jardín de los Olivos, CDMX"
            value={formData.location}
            onChange={(e) => setFormData({ ...formData, location: e.target.value })}
            required
          />

          <GlassInput
            label="Código de Acceso"
            placeholder="Crea una clave única (Ej: ANA2026)"
            value={formData.accessCode}
            onChange={(e) => setFormData({ ...formData, accessCode: e.target.value })}
            required
          />

          <GlassButton 
            type="submit" 
            className="w-full"
            disabled={isSubmitting}
          >
            {isSubmitting ? "GUARDANDO..." : "PUBLICAR INVITACIÓN"}
          </GlassButton>
        </form>
      </GlassCard>
    </div>
  );
}