"use client";
import { useEffect, useState, useMemo } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Invitation } from "@/lib/invitations/invitation.types";


// ─── Colores de portada por categoría (primera palabra del título) ────────────
const COVER_STYLES: Record<string, string> = {
  boda: "linear-gradient(135deg, #881337 0%, #be123c 50%, #f43f5e 100%)",
  cumpleaños: "linear-gradient(135deg, #831843 0%, #db2777 50%, #f472b6 100%)",
  viaje: "linear-gradient(135deg, #075985 0%, #0369a1 50%, #38bdf8 100%)",
  cena: "linear-gradient(135deg, #7c2d12 0%, #c2410c 50%, #fb923c 100%)",
  reunión: "linear-gradient(135deg, #4c1d95 0%, #6d28d9 50%, #a78bfa 100%)",
  picnic: "linear-gradient(135deg, #064e3b 0%, #047857 50%, #34d399 100%)",
  default: "linear-gradient(135deg, #92400e 0%, #b45309 50%, #fbbf24 100%)",
};

// ─── Estadísticas de placeholder (UI estática, no funcional aún) ──────────────
const STATS = [
  { label: "Invitados", value: "—", icon: "👥" },
  { label: "Fotos", value: "0", icon: "🖼" },
  { label: "Días para el evento", value: "—", icon: "📅" },
];

export default function DetalleEvento() {
  const { id } = useParams();
  const [evento, setEvento] = useState<Invitation | null>(null);
  const [loading, setLoading] = useState(true);
  const [copiado, setCopiado] = useState(false); // estado del botón de copiar código

  // Carga los datos del evento desde la API
  useEffect(() => {
    fetch(`/api/invitations/${id}`)
      .then((res) => res.json())
      .then((data) => {
        if (!data.error) setEvento(data);
        setLoading(false);
      });
  }, [id]);

  // Copia el código de acceso al portapapeles
  const copiarCodigo = () => {
    if (!evento) return;
    navigator.clipboard.writeText(evento.accessCode).then(() => {
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2000); // resetea tras 2 segundos
    });
  };

  // Calcula los días que faltan para el evento
  // Calcula los días que faltan para el evento — useMemo evita llamar Date.now() en el render
  const diasRestantes = useMemo(() => {
    if (!evento) return null;
    const hoy = new Date(); // forma correcta de obtener la fecha actual en React
    return Math.ceil(
      (new Date(evento.date).getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24),
    );
  }, [evento]);

  // Detecta la categoría del evento desde el título
  const categoryKey = evento?.title?.split(" ")[0]?.toLowerCase() ?? "default";
  const coverGradient = COVER_STYLES[categoryKey] ?? COVER_STYLES.default;

  // ── Pantalla de carga ──────────────────────────────────────────────────────
  if (loading)
    return (
      <div
        style={{
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
            border: "2px solid #f59e0b",
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
          Cargando evento...
        </p>
      </div>
    );

  // ── Evento no encontrado ───────────────────────────────────────────────────
  if (!evento)
    return (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "100vh",
          gap: "16px",
        }}
      >
        <p style={{ fontSize: "48px" }}>🔍</p>
        <p style={{ color: "white", fontWeight: 900, fontSize: "20px" }}>
          Evento no encontrado
        </p>
        <Link href="/dashboard" style={{ color: "#f59e0b", fontSize: "13px" }}>
          ← Volver al Dashboard
        </Link>
      </div>
    );

  return (
    <div
      style={{ minHeight: "100vh", paddingTop: "5rem", paddingBottom: "6rem" }}
    >
      {/* ── HERO: portada grande con gradiente de color ─────────────────────── */}
      <div
        style={{
          width: "100%",
          minHeight: "340px",
          background: coverGradient,
          position: "relative",
          display: "flex",
          flexDirection: "column",
          justifyContent: "flex-end",
          padding: "40px 48px",
          overflow: "hidden",
        }}
      >
        {/* Patrón de textura superpuesto para darle profundidad */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage: `radial-gradient(circle at 20% 50%, rgba(0,0,0,0.3) 0%, transparent 60%),
                            radial-gradient(circle at 80% 20%, rgba(255,255,255,0.05) 0%, transparent 50%)`,
          }}
        />

        {/* Overlay oscuro en la parte inferior para que el texto sea legible */}
        <div
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            height: "60%",
            background: "linear-gradient(to top, rgba(0,0,0,0.7), transparent)",
          }}
        />

        {/* Botón de volver — encima de todo */}
        <div
          style={{
            position: "absolute",
            top: "24px",
            left: "48px",
            zIndex: 10,
          }}
        >
          <Link
            href="/dashboard"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              color: "rgba(255,255,255,0.75)",
              fontSize: "13px",
              fontWeight: 700,
              textDecoration: "none",
              transition: "color 0.2s",
              backgroundColor: "rgba(0,0,0,0.3)",
              backdropFilter: "blur(8px)",
              padding: "8px 16px",
              borderRadius: "9999px",
              border: "1px solid rgba(255,255,255,0.1)",
            }}
          >
            ← Dashboard
          </Link>
        </div>

        {/* Badge de categoría — esquina superior derecha */}
        <div
          style={{
            position: "absolute",
            top: "24px",
            right: "48px",
            zIndex: 10,
          }}
        >
          <span
            style={{
              backgroundColor: "rgba(0,0,0,0.4)",
              backdropFilter: "blur(8px)",
              color: "white",
              fontSize: "11px",
              fontWeight: 900,
              textTransform: "uppercase",
              letterSpacing: "0.12em",
              padding: "8px 16px",
              borderRadius: "9999px",
              border: "1px solid rgba(255,255,255,0.15)",
            }}
          >
            ✦ {categoryKey !== "default" ? categoryKey : "evento"}
          </span>
        </div>

        {/* Título del evento — sobre el overlay */}
        <div style={{ position: "relative", zIndex: 2 }}>
          <h1
            style={{
              color: "white",
              fontSize: "clamp(2.5rem, 6vw, 5rem)",
              fontWeight: 900,
              letterSpacing: "-0.04em",
              lineHeight: 1,
              margin: "0 0 16px 0",
              textShadow: "0 2px 20px rgba(0,0,0,0.4)",
            }}
          >
            {evento.title}
          </h1>

          {/* Metadatos rápidos: ubicación y fecha */}
          <div style={{ display: "flex", flexWrap: "wrap", gap: "20px" }}>
            <span
              style={{
                color: "rgba(255,255,255,0.85)",
                fontSize: "15px",
                display: "flex",
                alignItems: "center",
                gap: "7px",
              }}
            >
              📍 {evento.location}
            </span>
            <span
              style={{
                color: "rgba(255,255,255,0.85)",
                fontSize: "15px",
                display: "flex",
                alignItems: "center",
                gap: "7px",
              }}
            >
              📅{" "}
              {new Date(evento.date).toLocaleDateString("es-MX", {
                dateStyle: "full",
              })}
            </span>
          </div>
        </div>
      </div>

      {/* ── CONTENIDO PRINCIPAL ─────────────────────────────────────────────── */}
      <div style={{ maxWidth: "960px", margin: "0 auto", padding: "0 24px" }}>
        {/* ── STATS ROW ─────────────────────────────────────────────────────── */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: "16px",
            marginTop: "-28px" /* sube para solaparse con el hero */,
            marginBottom: "32px",
            position: "relative",
            zIndex: 10,
          }}
        >
          {STATS.map((stat, i) => (
            <div
              key={i}
              style={{
                backgroundColor: "#18181b",
                border: "1px solid #3f3f46",
                borderRadius: "16px",
                padding: "20px 24px",
                boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
              }}
            >
              <p
                style={{
                  color: "#71717a",
                  fontSize: "10px",
                  fontWeight: 800,
                  textTransform: "uppercase",
                  letterSpacing: "0.12em",
                  margin: "0 0 8px 0",
                }}
              >
                {stat.icon} {stat.label}
              </p>
              <p
                style={{
                  color: "white",
                  fontSize: "28px",
                  fontWeight: 900,
                  margin: 0,
                }}
              >
                {/* Muestra los días reales para el campo correspondiente */}
                {stat.label === "Días para el evento"
                  ? diasRestantes !== null && diasRestantes > 0
                    ? diasRestantes
                    : diasRestantes === 0
                      ? "¡Hoy!"
                      : "Pasado"
                  : stat.value}
              </p>
            </div>
          ))}
        </div>

        {/* ── GRID PRINCIPAL: código + acciones + galería ────────────────── */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "20px",
          }}
        >
          {/* ── Tarjeta: Código de acceso ──────────────────────────────────── */}
          <div
            style={{
              backgroundColor: "#18181b",
              border: "1px solid #3f3f46",
              borderRadius: "20px",
              padding: "28px",
              display: "flex",
              flexDirection: "column",
              gap: "20px",
            }}
          >
            <p
              style={{
                color: "#71717a",
                fontSize: "10px",
                fontWeight: 800,
                textTransform: "uppercase",
                letterSpacing: "0.15em",
                margin: 0,
              }}
            >
              Código de acceso
            </p>

            {/* Display grande del código */}
            <div
              style={{
                background: "linear-gradient(135deg, #09090b, #18181b)",
                border: "1px solid #27272a",
                borderRadius: "14px",
                padding: "28px",
                textAlign: "center",
              }}
            >
              <p
                style={{
                  color: "#f59e0b",
                  fontSize: "clamp(1.8rem, 4vw, 3rem)",
                  fontFamily: "monospace",
                  fontWeight: 900,
                  letterSpacing: "0.15em",
                  margin: 0,
                  textShadow: "0 0 30px rgba(245,158,11,0.3)",
                }}
              >
                {evento.accessCode}
              </p>
            </div>

            {/* Botón de copiar código */}
            <button
              onClick={copiarCodigo}
              style={{
                width: "100%",
                padding: "14px",
                borderRadius: "12px",
                backgroundColor: copiado ? "#052e16" : "rgba(245,158,11,0.1)",
                border: `1px solid ${copiado ? "#16a34a" : "rgba(245,158,11,0.3)"}`,
                color: copiado ? "#4ade80" : "#f59e0b",
                fontSize: "12px",
                fontWeight: 900,
                textTransform: "uppercase",
                letterSpacing: "0.15em",
                cursor: "pointer",
                transition: "all 0.2s",
              }}
            >
              {copiado ? "✓ ¡Copiado!" : "⎘ Copiar código"}
            </button>

            {/* Instrucción para los invitados */}
            <p
              style={{
                color: "#52525b",
                fontSize: "11px",
                textAlign: "center",
                margin: 0,
                lineHeight: 1.5,
              }}
            >
              Comparte este código con tus invitados para que puedan acceder al
              álbum del evento.
            </p>
          </div>

          {/* ── Tarjeta: Acciones rápidas ──────────────────────────────────── */}
          <div
            style={{
              backgroundColor: "#18181b",
              border: "1px solid #3f3f46",
              borderRadius: "20px",
              padding: "28px",
              display: "flex",
              flexDirection: "column",
              gap: "12px",
            }}
          >
            <p
              style={{
                color: "#71717a",
                fontSize: "10px",
                fontWeight: 800,
                textTransform: "uppercase",
                letterSpacing: "0.15em",
                margin: "0 0 8px 0",
              }}
            >
              Acciones
            </p>

            {/* Lista de acciones disponibles */}
            {[
              {
                icon: "🖼",
                label: "Ver álbum de fotos",
                desc: "Galería completa del evento",
                color: "#f59e0b",
              },
              {
                icon: "✉️",
                label: "Compartir invitación",
                desc: "Envía el enlace a tus invitados",
                color: "#38bdf8",
              },
              {
                icon: "✏️",
                label: "Editar evento",
                desc: "Modifica los detalles",
                color: "#a78bfa",
              },
              {
                icon: "🗑",
                label: "Eliminar evento",
                desc: "Esta acción no se puede deshacer",
                color: "#f43f5e",
              },
            ].map((accion, i) => (
              <button
                key={i}
                type="button"
                style={{
                  width: "100%",
                  padding: "14px 16px",
                  borderRadius: "12px",
                  backgroundColor: "#09090b",
                  border: "1px solid #27272a",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "14px",
                  textAlign: "left",
                  transition: "border-color 0.2s, background-color 0.2s",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = accion.color;
                  e.currentTarget.style.backgroundColor = "#18181b";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = "#27272a";
                  e.currentTarget.style.backgroundColor = "#09090b";
                }}
              >
                {/* Icono con fondo de color */}
                <span
                  style={{
                    width: "36px",
                    height: "36px",
                    flexShrink: 0,
                    borderRadius: "9px",
                    backgroundColor: `${accion.color}15`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "16px",
                  }}
                >
                  {accion.icon}
                </span>
                <div>
                  <p
                    style={{
                      color: "white",
                      fontSize: "13px",
                      fontWeight: 700,
                      margin: "0 0 2px 0",
                    }}
                  >
                    {accion.label}
                  </p>
                  <p style={{ color: "#52525b", fontSize: "11px", margin: 0 }}>
                    {accion.desc}
                  </p>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* ── Sección: Galería de fotos (placeholder) ─────────────────────── */}
        <div
          style={{
            backgroundColor: "#18181b",
            border: "1px solid #3f3f46",
            borderRadius: "20px",
            padding: "28px",
            marginTop: "20px",
          }}
        >
          {/* Encabezado de la sección */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: "20px",
            }}
          >
            <div>
              <p
                style={{
                  color: "#71717a",
                  fontSize: "10px",
                  fontWeight: 800,
                  textTransform: "uppercase",
                  letterSpacing: "0.15em",
                  margin: "0 0 4px 0",
                }}
              >
                Álbum del Evento
              </p>
              <p
                style={{
                  color: "white",
                  fontWeight: 900,
                  fontSize: "16px",
                  margin: 0,
                }}
              >
                Fotos compartidas
              </p>
            </div>
            {/* Botón para subir fotos */}
            <button
              style={{
                padding: "10px 20px",
                borderRadius: "10px",
                backgroundColor: "rgba(245,158,11,0.1)",
                border: "1px solid rgba(245,158,11,0.3)",
                color: "#f59e0b",
                fontSize: "12px",
                fontWeight: 800,
                textTransform: "uppercase",
                letterSpacing: "0.1em",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "7px",
              }}
            >
              + Subir fotos
            </button>
          </div>

          {/* Estado vacío de la galería */}
          <div
            style={{
              border: "2px dashed #27272a",
              borderRadius: "14px",
              padding: "60px 24px",
              textAlign: "center",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "14px",
            }}
          >
            <span style={{ fontSize: "48px" }}>🖼</span>
            <p
              style={{
                color: "white",
                fontWeight: 900,
                fontSize: "15px",
                margin: 0,
              }}
            >
              Aún no hay fotos en este álbum
            </p>
            <p
              style={{
                color: "#52525b",
                fontSize: "13px",
                margin: 0,
                maxWidth: "320px",
                lineHeight: 1.6,
              }}
            >
              Las fotos que tus invitados suban con el código{" "}
              <strong style={{ color: "#f59e0b", fontFamily: "monospace" }}>
                {evento.accessCode}
              </strong>{" "}
              aparecerán aquí.
            </p>
          </div>
        </div>

        {/* ── Footer de la tarjeta: metadatos del sistema ──────────────────── */}
        <div
          style={{
            marginTop: "20px",
            padding: "16px 24px",
            borderRadius: "14px",
            backgroundColor: "#09090b",
            border: "1px solid #18181b",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: "10px",
          }}
        >
          <p style={{ color: "#3f3f46", fontSize: "11px", margin: 0 }}>
            ID del evento:{" "}
            <span style={{ fontFamily: "monospace", color: "#52525b" }}>
              {evento.id}
            </span>
          </p>
          <p style={{ color: "#3f3f46", fontSize: "11px", margin: 0 }}>
            AFTER-REWIND © 2026 — Captura la esencia
          </p>
        </div>
      </div>
    </div>
  );
}
