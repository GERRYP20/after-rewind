"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Invitation } from "@/lib/invitations/invitation.types";

// ─── Colores de portada definidos como estilos inline (no clases dinámicas) ──
// Tailwind no puede generar clases construidas con variables en runtime,
// por eso usamos style={{ background: "..." }} directamente.
const COVER_STYLES = [
  { background: "linear-gradient(135deg, #92400e, #b45309, #d97706)" }, // ámbar
  { background: "linear-gradient(135deg, #881337, #be123c, #e11d48)" }, // rosa
  { background: "linear-gradient(135deg, #075985, #0369a1, #0ea5e9)" }, // azul
  { background: "linear-gradient(135deg, #4c1d95, #6d28d9, #8b5cf6)" }, // violeta
  { background: "linear-gradient(135deg, #064e3b, #047857, #10b981)" }, // verde
  { background: "linear-gradient(135deg, #7c2d12, #c2410c, #f97316)" }, // naranja
];

// ─── Metadatos de categoría: icono y color de fondo del badge ────────────────
const CATEGORY_META: Record<string, { icon: string; bg: string }> = {
  cumpleaños: { icon: "🎂", bg: "#ec4899" },
  boda: { icon: "💍", bg: "#f43f5e" },
  viaje: { icon: "✈️", bg: "#0ea5e9" },
  cena: { icon: "🍽", bg: "#f97316" },
  reunión: { icon: "🤝", bg: "#8b5cf6" },
  picnic: { icon: "🧺", bg: "#22c55e" },
  default: { icon: "✦", bg: "#E0B046 " },
};

type Filter = "todos" | "próximos" | "pasados";

// =============================================================================
// COMPONENTE: Card de evento individual
// =============================================================================
function EventCard({ evento, index }: { evento: Invitation; index: number }) {
  // Selecciona el estilo de portada según el índice
  const coverStyle = COVER_STYLES[index % COVER_STYLES.length];

  // Detecta la categoría a partir de la primera palabra del título
  const categoryKey = evento.title?.split(" ")[0]?.toLowerCase() ?? "default";
  const cat = CATEGORY_META[categoryKey] ?? CATEGORY_META.default;

  // Partes de la fecha formateadas por separado
  const fecha = new Date(evento.date);
  const dia = fecha.getDate();
  const mes = fecha
    .toLocaleDateString("es-MX", { month: "short" })
    .toUpperCase();
  const año = fecha.getFullYear();

  return (
    <Link href={`/dashboard/invitaciones/${evento.id}`} className="group block">
      {/* Tarjeta completa — fondo zinc-900 para que contraste con el negro de la página */}
      <div
        style={{
          borderRadius: "1rem",
          overflow: "hidden",
          backgroundColor: "#18181b" /* zinc-900 */,
          border: "1px solid #3f3f46" /* zinc-700 */,
          transition: "all 0.3s ease",
          cursor: "pointer",
        }}
        onMouseEnter={(e) => {
          // Efecto hover: eleva la card y resalta el borde
          const el = e.currentTarget as HTMLDivElement;
          el.style.transform = "translateY(-8px)";
          el.style.borderColor = "rgba(245,158,11,0.6)";
          el.style.boxShadow = "0 20px 40px rgba(245,158,11,0.12)";
        }}
        onMouseLeave={(e) => {
          // Restaura el estado inicial al quitar el cursor
          const el = e.currentTarget as HTMLDivElement;
          el.style.transform = "translateY(0)";
          el.style.borderColor = "#3f3f46";
          el.style.boxShadow = "none";
        }}
      >
        {/* ── PORTADA: zona de color con gradiente ────────────────────── */}
        <div
          style={{
            ...coverStyle /* gradiente único por card */,
            height: "180px",
            position: "relative",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            padding: "16px",
          }}
        >
          {/* Badge de categoría — esquina superior derecha */}
          <div style={{ display: "flex", justifyContent: "flex-end" }}>
            <span
              style={{
                backgroundColor: cat.bg,
                color: "white",
                fontSize: "10px",
                fontWeight: 900,
                textTransform: "uppercase",
                letterSpacing: "0.1em",
                padding: "4px 12px",
                borderRadius: "9999px",
                display: "flex",
                alignItems: "center",
                gap: "6px",
              }}
            >
              {cat.icon} {categoryKey !== "default" ? categoryKey : "evento"}
            </span>
          </div>

          {/* Badge de fecha — esquina inferior izquierda */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              backgroundColor: "rgba(0,0,0,0.55)",
              backdropFilter: "blur(8px)",
              padding: "6px 12px",
              borderRadius: "10px",
              border: "1px solid rgba(255,255,255,0.1)",
              width: "fit-content",
            }}
          >
            <span style={{ fontSize: "13px" }}>📅</span>
            <span style={{ color: "white", fontSize: "12px", fontWeight: 700 }}>
              {dia} {mes}, {año}
            </span>
          </div>
        </div>

        {/* ── CUERPO: información textual del evento ───────────────────── */}
        <div
          style={{
            padding: "20px",
            backgroundColor: "#18181b" /* mismo zinc-900 que el contenedor */,
            display: "flex",
            flexDirection: "column",
            gap: "14px",
          }}
        >
          {/* Nombre del evento */}
          <h3
            style={{
              color: "white",
              fontSize: "17px",
              fontWeight: 900,
              lineHeight: 1.3,
              margin: 0,
              overflow: "hidden",
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
            }}
          >
            {evento.title}
          </h3>

          {/* Ubicación */}
          <p
            style={{
              color: "#a1a1aa" /* zinc-400 */,
              fontSize: "13px",
              margin: 0,
              display: "flex",
              alignItems: "center",
              gap: "6px",
              overflow: "hidden",
              whiteSpace: "nowrap",
              textOverflow: "ellipsis",
            }}
          >
            <span style={{ color: "#E0B046 " }}>📍</span>
            {evento.location}
          </p>

          {/* Separador */}
          <div style={{ borderTop: "1px solid #3f3f46" }} />

          {/* Fila inferior: código de acceso + contador de fotos */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            {/* Chip del código de acceso */}
            <div
              style={{
                backgroundColor: "#27272a" /* zinc-800 */,
                border: "1px solid #3f3f46",
                borderRadius: "10px",
                padding: "8px 14px",
              }}
            >
              {/* Etiqueta pequeña */}
              <p
                style={{
                  color: "#71717a" /* zinc-500 */,
                  fontSize: "9px",
                  fontWeight: 900,
                  textTransform: "uppercase",
                  letterSpacing: "0.15em",
                  margin: "0 0 4px 0",
                }}
              >
                Código
              </p>
              {/* El código en monoespaciado y ámbar */}
              <p
                style={{
                  color: "#E0B046 " /* amber-400 */,
                  fontSize: "14px",
                  fontFamily: "monospace",
                  fontWeight: 700,
                  textTransform: "uppercase",
                  letterSpacing: "0.1em",
                  margin: 0,
                }}
              >
                {evento.accessCode}
              </p>
            </div>

            {/* Contador de fotos */}
            <span
              style={{
                color: "#52525b",
                fontSize: "12px",
                display: "flex",
                alignItems: "center",
                gap: "6px",
              }}
            >
              🖼 0 fotos
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}

// =============================================================================
// COMPONENTE: Card de "Crear Nuevo Evento"
// =============================================================================
function CreateEventCard() {
  return (
    <Link
      href="/dashboard/invitaciones/nueva"
      className="group block"
      style={{ height: "100%" }}
    >
      <div
        style={{
          borderRadius: "1rem",
          minHeight: "320px",
          height: "100%",
          border:
            "2px dashed rgba(245,158,11,0.5)" /* punteado ámbar — muy visible */,
          backgroundColor: "rgba(245,158,11,0.04)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: "20px",
          padding: "32px",
          cursor: "pointer",
          transition: "all 0.3s ease",
        }}
        onMouseEnter={(e) => {
          // Intensifica el borde y el fondo al hacer hover
          const el = e.currentTarget as HTMLDivElement;
          el.style.borderColor = "rgba(245,158,11,0.9)";
          el.style.backgroundColor = "rgba(245,158,11,0.09)";
          el.style.transform = "translateY(-8px)";
          el.style.boxShadow = "0 20px 40px rgba(245,158,11,0.15)";
        }}
        onMouseLeave={(e) => {
          // Restaura el estado base
          const el = e.currentTarget as HTMLDivElement;
          el.style.borderColor = "rgba(245,158,11,0.5)";
          el.style.backgroundColor = "rgba(245,158,11,0.04)";
          el.style.transform = "translateY(0)";
          el.style.boxShadow = "none";
        }}
      >
        {/* Círculo con el "+" */}
        <div
          style={{
            width: "64px",
            height: "64px",
            borderRadius: "50%",
            border: "2px solid rgba(245,158,11,0.5)",
            backgroundColor: "rgba(245,158,11,0.1)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "28px",
            color: "#E0B046 ",
            fontWeight: 300,
            lineHeight: 1,
            transition: "all 0.3s ease",
          }}
        >
          +
        </div>

        {/* Textos */}
        <div style={{ textAlign: "center" }}>
          <p
            style={{
              color: "white",
              fontWeight: 900,
              fontSize: "15px",
              margin: "0 0 6px 0",
            }}
          >
            Crear Nuevo Evento
          </p>
          <p style={{ color: "#71717a", fontSize: "13px", margin: 0 }}>
            Comienza una nueva colección
          </p>
        </div>
      </div>
    </Link>
  );
}

// =============================================================================
// PÁGINA PRINCIPAL: Dashboard
// =============================================================================
export default function Dashboard() {
  const [eventos, setEventos] = useState<Invitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<Filter>("todos");
  const [sort, setSort] = useState("reciente");

  // Carga los eventos desde la API al montar el componente
  useEffect(() => {
    fetch("/api/invitations")
      .then((res) => (res.ok ? res.json() : []))
      .then((data: Invitation[]) => {
        setEventos(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const now = new Date();

  // Aplica el filtro de tiempo sobre la lista de eventos
  const filtered = eventos.filter((e) => {
    const d = new Date(e.date);
    if (filter === "próximos") return d >= now;
    if (filter === "pasados") return d < now;
    return true;
  });

  // Ordena los eventos filtrados según el criterio elegido
  const sorted = [...filtered].sort((a, b) => {
    if (sort === "reciente")
      return new Date(b.date).getTime() - new Date(a.date).getTime();
    if (sort === "antiguo")
      return new Date(a.date).getTime() - new Date(b.date).getTime();
    return a.title.localeCompare(b.title);
  });

  // Pantalla de carga mientras llega la respuesta de la API
  if (loading)
    return (
      <div
        style={{
          paddingTop: "8rem",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "100vh",
          gap: "16px",
        }}
      >
        <div
          style={{
            width: "32px",
            height: "32px",
            borderRadius: "50%",
            border: "2px solid #E0B046",
            borderTopColor: "transparent",
            animation: "spin 0.8s linear infinite",
          }}
        />
        <p
          style={{
            color: "#52525b",
            fontSize: "11px",
            textTransform: "uppercase",
            letterSpacing: "0.2em",
            fontWeight: 700,
          }}
        >
          Cargando eventos...
        </p>
      </div>
    );

  // Definición de los filtros del tab bar
  const FILTERS: { key: Filter; label: string; icon: string }[] = [
    { key: "todos", label: "Todos", icon: "⊞" },
    { key: "próximos", label: "Próximos", icon: "⏳" },
    { key: "pasados", label: "Pasados", icon: "🕓" },
  ];

  return (
    <div
      style={{
        paddingTop: "7rem",
        paddingBottom: "6rem",
        paddingLeft: "3rem",
        paddingRight: "3rem",
        maxWidth: "1400px",
        margin: "0 auto",
        minHeight: "100vh",
      }}
    >
      {/* ── ENCABEZADO ─────────────────────────────────────────────────── */}
      <header style={{ marginBottom: "3rem" }}>
        <h1
          style={{
            fontSize: "clamp(2rem, 4vw, 3rem)",
            fontWeight: 900,
            color: "white",
            letterSpacing: "-0.03em",
            margin: "0 0 8px 0",
          }}
        >
          Mis Eventos <span style={{ color: "#E0B046" }}>Creados</span>
        </h1>
        <p
          style={{
            color: "#71717a",
            fontSize: "14px",
            margin: 0,
            maxWidth: "480px",
          }}
        >
          Gestiona tus eventos, revisa estadísticas y administra álbumes
          compartidos.
        </p>
      </header>

      {/* ── BARRA DE CONTROLES ─────────────────────────────────────────── */}
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "16px",
          marginBottom: "2.5rem",
        }}
      >
        {/* Pills de filtro */}
        <div
          style={{
            display: "flex",
            gap: "6px",
            backgroundColor: "#18181b",
            border: "1px solid #3f3f46",
            padding: "4px",
            borderRadius: "12px",
          }}
        >
          {FILTERS.map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              style={{
                padding: "8px 20px",
                borderRadius: "9px",
                fontSize: "13px",
                fontWeight: 700,
                border: "none",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "8px",
                transition: "all 0.2s ease",
                // Activo: fondo ámbar + texto negro; Inactivo: transparente + texto gris
                backgroundColor: filter === f.key ? "#E0B046 " : "transparent",
                color: filter === f.key ? "#000" : "#71717a",
                boxShadow:
                  filter === f.key
                    ? "0 4px 12px rgba(224, 176, 70, 0.35)"
                    : "none",
              }}
            >
              <span>{f.icon}</span>
              {f.label}
            </button>
          ))}
        </div>

        {/* Selector de ordenamiento */}
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <span style={{ color: "#71717a", fontSize: "13px" }}>
            Ordenar por:
          </span>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            style={{
              backgroundColor: "#18181b",
              border: "1px solid #3f3f46",
              color: "white",
              fontSize: "13px",
              padding: "8px 14px",
              borderRadius: "10px",
              outline: "none",
              cursor: "pointer",
            }}
          >
            <option value="reciente">Reciente</option>
            <option value="antiguo">Más antiguo</option>
            <option value="nombre">Nombre A–Z</option>
          </select>
        </div>
      </div>

      {/* ── GRID DE CARDS ──────────────────────────────────────────────── */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns:
            "repeat(auto-fill, minmax(260px, 1fr))" /* columnas responsivas */,
          gap: "28px" /* espacio generoso entre cards */,
          alignItems: "start",
        }}
      >
        {/* Card de creación — siempre primera */}
        <CreateEventCard />

        {/* Mensaje vacío cuando no hay resultados */}
        {sorted.length === 0 ? (
          <div
            style={{
              gridColumn: "span 3",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "80px 0",
            }}
          >
            <p
              style={{
                color: "#3f3f46",
                fontSize: "12px",
                textTransform: "uppercase",
                letterSpacing: "0.2em",
                fontWeight: 700,
              }}
            >
              Sin eventos para este filtro
            </p>
          </div>
        ) : (
          // Renderiza una card por cada evento
          sorted.map((evento, i) => (
            <EventCard key={evento.id} evento={evento} index={i} />
          ))
        )}
      </div>

      {/* ── PIE DE PÁGINA ──────────────────────────────────────────────── */}
      <footer
        style={{
          marginTop: "6rem",
          paddingTop: "2rem",
          textAlign: "center",
          borderTop: "1px solid #27272a",
        }}
      >
        <p
          style={{
            color: "#3f3f46",
            fontSize: "11px",
            fontWeight: 700,
            textTransform: "uppercase",
            letterSpacing: "0.2em",
          }}
        >
          AFTER-REWIND © 2026 — Captura la esencia
        </p>
      </footer>
    </div>
  );
}
