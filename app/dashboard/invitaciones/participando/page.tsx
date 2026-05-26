// Invitaciones aceptadas: lista de eventos externos en los que el usuario participa como invitado
"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Invitation } from "@/lib/invitations/invitation.types";
import SearchByCode from "@/components/search/SearchByCode";
import { parseLocalDate } from "@/lib/date-utils";
import { Cake, Gem, Plane, Utensils, Handshake, TreePine, Sparkles, Calendar, MapPin, Check, Users, Mail } from "lucide-react";

// ─── Metadatos de categoría: icono y color de fondo del badge ────────────────
const CATEGORY_META: Record<string, { icon: React.ComponentType<any>; bg: string }> = {
  cumpleaños: { icon: Cake, bg: "#ec4899" },
  boda: { icon: Gem, bg: "#f43f5e" },
  viaje: { icon: Plane, bg: "#0ea5e9" },
  cena: { icon: Utensils, bg: "#f97316" },
  reunión: { icon: Handshake, bg: "#8b5cf6" },
  picnic: { icon: TreePine, bg: "#22c55e" },
  default: { icon: Sparkles, bg: "#E0B046 " },
};

const COVER_STYLES = [
  { background: "linear-gradient(135deg, #075985 0%, #0369a1 50%, #38bdf8 100%)" },
  { background: "linear-gradient(135deg, #4c1d95 0%, #6d28d9 50%, #a78bfa 100%)" },
  { background: "linear-gradient(135deg, #064e3b 0%, #047857 50%, #34d399 100%)" },
];

function EventCard({ evento, index }: { evento: Invitation; index: number }) {
  const categoryKey = evento.category?.toLowerCase() ?? "default";
  const cat = CATEGORY_META[categoryKey] ?? CATEGORY_META.default;
  const coverStyle = COVER_STYLES[index % COVER_STYLES.length];

  const fecha = parseLocalDate(evento.date);
  const dia = fecha.getDate();
  const mes = fecha.toLocaleDateString("es-MX", { month: "short" }).toUpperCase();
  const año = fecha.getFullYear();

  return (
    <Link href={`/dashboard/invitaciones/${evento.id}`} className="group block">
      <div
        style={{
          borderRadius: "1rem",
          overflow: "hidden",
          backgroundColor: "#18181b",
          border: "1px solid #3f3f46",
          transition: "all 0.3s ease",
          cursor: "pointer",
        }}
        onMouseEnter={(e) => {
          const el = e.currentTarget as HTMLDivElement;
          el.style.transform = "translateY(-8px)";
          el.style.borderColor = "rgba(56, 189, 248, 0.6)";
          el.style.boxShadow = "0 20px 40px rgba(56, 189, 248, 0.12)";
        }}
        onMouseLeave={(e) => {
          const el = e.currentTarget as HTMLDivElement;
          el.style.transform = "translateY(0)";
          el.style.borderColor = "#3f3f46";
          el.style.boxShadow = "none";
        }}
      >
        <div
          style={{
            height: "180px",
            position: "relative",
            backgroundColor: "#09090b",
            background: evento.imageUrl ? "none" : coverStyle.background,
          }}
        >
          {evento.imageUrl && (
            <Image src={evento.imageUrl} alt={evento.title} fill className="object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
          )}
          
          <div style={{ position: "absolute", top: "16px", right: "16px", zIndex: 10 }}>
            <span style={{ backgroundColor: cat.bg, color: "white", fontSize: "10px", fontWeight: 900, textTransform: "uppercase", padding: "4px 12px", borderRadius: "9999px", display: "flex", alignItems: "center", gap: "6px" }}>
              <cat.icon size={12} style={{ color: "#E0B046" }} /> {categoryKey !== "default" ? categoryKey : "evento"}
            </span>
          </div>

          <div style={{ position: "absolute", bottom: "16px", left: "16px", backgroundColor: "rgba(0,0,0,0.6)", backdropFilter: "blur(8px)", padding: "6px 12px", borderRadius: "10px", border: "1px solid rgba(255,255,255,0.1)", zIndex: 10, display: "flex", alignItems: "center", gap: "6px" }}>
            <Calendar size={12} style={{ color: "#E0B046" }} />
            <span style={{ color: "white", fontSize: "12px", fontWeight: 700 }}>{dia} {mes}, {año}</span>
          </div>
        </div>

        <div style={{ padding: "20px", display: "flex", flexDirection: "column", gap: "14px" }}>
          <h3 style={{ color: "white", fontSize: "17px", fontWeight: 900, margin: 0 }}>{evento.title}</h3>
          <p style={{ color: "#a1a1aa", fontSize: "13px", margin: 0, display: "flex", alignItems: "center", gap: "6px" }}>
            <MapPin size={14} style={{ color: "#E0B046" }} /> {evento.location}
          </p>
          <div style={{ borderTop: "1px solid #3f3f46" }} />
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ color: "#38bdf8", fontSize: "11px", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.05em", display: "flex", alignItems: "center", gap: "4px" }}>
              <Check size={12} /> Invitación Aceptada
            </span>
            <span style={{ color: "#52525b", fontSize: "12px", display: "flex", alignItems: "center", gap: "4px" }}>
              <Users size={14} style={{ color: "#71717a" }} /> {evento.guestCount || 0} invitados
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}

export default function InvitacionesParticipando() {
  const [eventos, setEventos] = useState<Invitation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/invitations/participating")
      .then((res) => (res.ok ? res.json() : []))
      .then((data: Invitation[]) => {
        setEventos(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) return (
    <div style={{ paddingTop: "8rem", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "100vh", gap: "16px" }}>
      <div style={{ width: "32px", height: "32px", borderRadius: "50%", border: "2px solid #38bdf8", borderTopColor: "transparent", animation: "spin 0.8s linear infinite" }} />
      <p style={{ color: "#52525b", fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.2em", fontWeight: 700 }}>Buscando invitaciones...</p>
    </div>
  );

  return (
    <div style={{ paddingTop: "7rem", paddingBottom: "6rem", paddingLeft: "3rem", paddingRight: "3rem", maxWidth: "1400px", margin: "0 auto", minHeight: "100vh" }}>
      <header style={{ marginBottom: "3rem" }}>
        <h1 style={{ fontSize: "clamp(2rem, 4vw, 3rem)", fontWeight: 900, color: "white", letterSpacing: "-0.03em", margin: "0 0 8px 0" }}>
          Mis <span style={{ color: "#38bdf8" }}>Invitaciones</span>
        </h1>
        <p style={{ color: "#71717a", fontSize: "14px", margin: 0, maxWidth: "480px" }}>
          Aquí aparecen los eventos de otros usuarios a los que te has unido y has sido aceptado.
        </p>
      </header>

      <div style={{ marginBottom: "3rem" }}>
        <SearchByCode />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "28px", alignItems: "start" }}>
        {eventos.length === 0 ? (
          <div style={{ gridColumn: "1 / -1", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "100px 0", gap: "20px" }}>
            <Mail size={64} style={{ color: "#3f3f46" }} />
            <p style={{ color: "#71717a", fontSize: "14px", textAlign: "center", maxWidth: "300px", lineHeight: 1.6 }}>
              Aún no tienes invitaciones aceptadas. Usa un código arriba para unirte a un evento.
            </p>
          </div>
        ) : (
          eventos.map((evento, i) => (
            <EventCard key={evento.id} evento={evento} index={i} />
          ))
        )}
      </div>
    </div>
  );
}