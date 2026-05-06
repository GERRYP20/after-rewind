"use client";

import React, { useState, useRef } from "react";
import { useRouter } from "next/navigation";

// ─── Categorías disponibles para el evento ────────────────────────────────────
const CATEGORIAS = [
  { key: "boda",       label: "Boda",       icon: "💍" },
  { key: "cumpleaños", label: "Cumpleaños", icon: "🎂" },
  { key: "viaje",      label: "Viaje",      icon: "✈️" },
  { key: "cena",       label: "Cena",       icon: "🍽" },
  { key: "reunión",    label: "Reunión",    icon: "🤝" },
  { key: "picnic",     label: "Picnic",     icon: "🧺" },
  { key: "otro",       label: "Otro",       icon: "✦"  },
];

// ─── Fotos placeholder para la sección de galería (no funcional) ──────────────
// Representan el estado vacío de la galería con slots de carga
const PHOTO_SLOTS = Array.from({ length: 6 });

export default function NuevaInvitacion() {
  const router = useRouter();

  // Estado de envío del formulario
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Paso actual del formulario (1 = datos, 2 = fotos)
  const [step, setStep] = useState<1 | 2>(1);

  // Categoría seleccionada por el usuario
  const [categoriaActiva, setCategoriaActiva] = useState<string>("boda");

  // Fotos "subidas" (solo UI, no funcional)
  const [fotosPreview, setFotosPreview] = useState<string[]>([]);

  // Referencia al input de archivo oculto
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Datos del formulario principal
  const [formData, setFormData] = useState({
    title: "",
    date: "",
    location: "",
    accessCode: "",
    description: "",
  });

  // ── Maneja la selección de fotos (solo preview local, no se envían) ─────────
  const handleFotos = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    // Convierte cada archivo a URL temporal para previsualización
    const urls = files.map(f => URL.createObjectURL(f));
    setFotosPreview(prev => [...prev, ...urls].slice(0, 9)); // máximo 9 fotos
  };

  // ── Elimina una foto del preview ─────────────────────────────────────────────
  const eliminarFoto = (index: number) => {
    setFotosPreview(prev => prev.filter((_, i) => i !== index));
  };

  // ── Envía el formulario a la API ─────────────────────────────────────────────
  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/invitations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...formData, category: categoriaActiva }),
      });
      if (res.ok) {
        router.push("/dashboard");
        router.refresh();
      } else {
        alert("Ocurrió un error al guardar el evento.");
      }
    } catch (err) {
      console.error("Error:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── Estilos reutilizables para inputs ────────────────────────────────────────
  const inputStyle: React.CSSProperties = {
    width: "100%",
    backgroundColor: "#09090b",       /* negro profundo para el input */
    border: "1px solid #3f3f46",      /* borde zinc-700 */
    borderRadius: "10px",
    padding: "14px 16px",
    color: "white",
    fontSize: "14px",
    outline: "none",
    boxSizing: "border-box",
    transition: "border-color 0.2s",
    fontFamily: "inherit",
  };

  const labelStyle: React.CSSProperties = {
    display: "block",
    color: "#a1a1aa",                 /* zinc-400 */
    fontSize: "11px",
    fontWeight: 800,
    textTransform: "uppercase",
    letterSpacing: "0.12em",
    marginBottom: "8px",
  };

  return (
    <div style={{
      minHeight: "100vh",
      paddingTop: "6rem",
      paddingBottom: "6rem",
      paddingLeft: "1.5rem",
      paddingRight: "1.5rem",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
    }}>

      {/* ── ENCABEZADO ─────────────────────────────────────────────────────── */}
      <div style={{ textAlign: "center", marginBottom: "2.5rem", maxWidth: "560px" }}>
        <p style={{ color: "#E0B046 ", fontSize: "11px", fontWeight: 900, letterSpacing: "0.25em", textTransform: "uppercase", margin: "0 0 12px 0" }}>
          ✦ Nuevo Evento
        </p>
        <h1 style={{ color: "white", fontSize: "clamp(1.8rem, 4vw, 2.8rem)", fontWeight: 900, letterSpacing: "-0.03em", margin: "0 0 10px 0" }}>
          Crea tu <span style={{ color: "#E0B046" }}>Memoria</span>
        </h1>
        <p style={{ color: "#71717a", fontSize: "14px", margin: 0, lineHeight: 1.6 }}>
          Configura los detalles de tu evento y sube fotos para compartir con tus invitados.
        </p>
      </div>

      {/* ── INDICADOR DE PASOS ─────────────────────────────────────────────── */}
      <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "2.5rem" }}>
        {/* Paso 1 */}
        {[
          { n: 1, label: "Detalles" },
          { n: 2, label: "Fotos" },
        ].map(({ n, label }, i) => (
          <React.Fragment key={n}>
            {/* Conector entre pasos */}
            {i > 0 && (
              <div style={{
                width: "48px", height: "1px",
                backgroundColor: step >= n ? "#E0B046 " : "#27272a",
                transition: "background-color 0.3s",
              }} />
            )}
            {/* Círculo del paso */}
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "6px" }}>
              <div style={{
                width: "36px", height: "36px",
                borderRadius: "50%",
                backgroundColor: step >= n ? "#E0B046 " : "#18181b",
                border: `2px solid ${step >= n ? "#E0B046 " : "#3f3f46"}`,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontWeight: 900, fontSize: "13px",
                color: step >= n ? "#000" : "#52525b",
                transition: "all 0.3s",
              }}>
                {step > n ? "✓" : n}
              </div>
              <span style={{ fontSize: "10px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: step >= n ? "#E0B046 " : "#52525b" }}>
                {label}
              </span>
            </div>
          </React.Fragment>
        ))}
      </div>

      {/* ── CONTENEDOR PRINCIPAL DEL FORMULARIO ────────────────────────────── */}
      <div style={{
        width: "100%",
        maxWidth: "680px",
        backgroundColor: "#18181b",       /* zinc-900 — visible sobre el negro de fondo */
        border: "1px solid #3f3f46",
        borderRadius: "20px",
        overflow: "hidden",
      }}>

        {/* ════════════════════════════════════════════════════════════════════
            PASO 1 — DETALLES DEL EVENTO
        ════════════════════════════════════════════════════════════════════ */}
        {step === 1 && (
          <div>
            {/* Banner decorativo superior */}
            <div style={{
              height: "8px",
              background: "linear-gradient(90deg, #92400e, #E0B046 , #fcd34d, #E0B046 , #92400e)",
              backgroundSize: "200% 100%",
            }} />

            <div style={{ padding: "36px" }}>

              {/* ── Selector de categoría ────────────────────────────────── */}
              <div style={{ marginBottom: "28px" }}>
                <p style={labelStyle}>Tipo de evento</p>
                {/* Grilla de botones de categoría */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(100px, 1fr))", gap: "10px" }}>
                  {CATEGORIAS.map(cat => (
                    <button
                      key={cat.key}
                      type="button"
                      onClick={() => setCategoriaActiva(cat.key)}
                      style={{
                        padding: "12px 8px",
                        borderRadius: "10px",
                        border: `2px solid ${categoriaActiva === cat.key ? "#E0B046 " : "#27272a"}`,
                        backgroundColor: categoriaActiva === cat.key ? "rgba(224, 176, 70, 0.12)" : "#09090b",
                        color: categoriaActiva === cat.key ? "#E0B046 " : "#71717a",
                        cursor: "pointer",
                        display: "flex", flexDirection: "column", alignItems: "center", gap: "6px",
                        fontSize: "11px", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.08em",
                        transition: "all 0.2s",
                      }}
                    >
                      <span style={{ fontSize: "20px" }}>{cat.icon}</span>
                      {cat.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* ── Campos del formulario ─────────────────────────────────── */}
              <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>

                {/* Nombre del evento */}
                <div>
                  <label style={labelStyle}>Nombre del evento</label>
                  <input
                    style={inputStyle}
                    placeholder="Ej: Boda de Ana y Juan"
                    value={formData.title}
                    onChange={e => setFormData({ ...formData, title: e.target.value })}
                    onFocus={e => (e.target.style.borderColor = "#E0B046 ")}
                    onBlur={e => (e.target.style.borderColor = "#3f3f46")}
                    required
                  />
                </div>

                {/* Fecha y ubicación en fila */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                  <div>
                    <label style={labelStyle}>Fecha del evento</label>
                    <input
                      type="date"
                      style={{ ...inputStyle, colorScheme: "dark" }}
                      value={formData.date}
                      onChange={e => setFormData({ ...formData, date: e.target.value })}
                      onFocus={e => (e.target.style.borderColor = "#E0B046 ")}
                      onBlur={e => (e.target.style.borderColor = "#3f3f46")}
                      required
                    />
                  </div>
                  <div>
                    <label style={labelStyle}>Ubicación</label>
                    <input
                      style={inputStyle}
                      placeholder="Ej: Jardín de los Olivos"
                      value={formData.location}
                      onChange={e => setFormData({ ...formData, location: e.target.value })}
                      onFocus={e => (e.target.style.borderColor = "#E0B046 ")}
                      onBlur={e => (e.target.style.borderColor = "#3f3f46")}
                      required
                    />
                  </div>
                </div>

                {/* Descripción del evento */}
                <div>
                  <label style={labelStyle}>Descripción <span style={{ color: "#52525b", fontWeight: 400, textTransform: "none", letterSpacing: 0 }}>(opcional)</span></label>
                  <textarea
                    style={{ ...inputStyle, resize: "none", height: "90px", lineHeight: 1.6 }}
                    placeholder="Cuéntale a tus invitados de qué trata el evento..."
                    value={formData.description}
                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                    onFocus={e => (e.target.style.borderColor = "#E0B046 ")}
                    onBlur={e => (e.target.style.borderColor = "#3f3f46")}
                  />
                </div>

                {/* Código de acceso con prefijo visual */}
                <div>
                  <label style={labelStyle}>Código de acceso</label>
                  <div style={{ position: "relative" }}>
                    {/* Prefijo "#" decorativo */}
                    <span style={{
                      position: "absolute", left: "16px", top: "50%", transform: "translateY(-50%)",
                      color: "#E0B046 ", fontWeight: 900, fontSize: "16px", pointerEvents: "none",
                    }}>
                      #
                    </span>
                    <input
                      style={{ ...inputStyle, paddingLeft: "34px", textTransform: "uppercase", fontFamily: "monospace", letterSpacing: "0.1em" }}
                      placeholder="ANA2026"
                      value={formData.accessCode}
                      onChange={e => setFormData({ ...formData, accessCode: e.target.value.toUpperCase() })}
                      onFocus={e => (e.target.style.borderColor = "#E0B046 ")}
                      onBlur={e => (e.target.style.borderColor = "#3f3f46")}
                      required
                    />
                  </div>
                  <p style={{ color: "#52525b", fontSize: "11px", marginTop: "6px" }}>
                    Tus invitados usarán este código para acceder al álbum.
                  </p>
                </div>
              </div>

              {/* ── Botón para avanzar al paso 2 ─────────────────────────── */}
              <button
                type="button"
                onClick={() => setStep(2)}
                disabled={!formData.title || !formData.date || !formData.location || !formData.accessCode}
                style={{
                  marginTop: "28px",
                  width: "100%",
                  padding: "16px",
                  borderRadius: "12px",
                  backgroundColor: "#E0B046 ",
                  color: "#000",
                  fontSize: "13px",
                  fontWeight: 900,
                  textTransform: "uppercase",
                  letterSpacing: "0.15em",
                  border: "none",
                  cursor: "pointer",
                  opacity: (!formData.title || !formData.date || !formData.location || !formData.accessCode) ? 0.4 : 1,
                  transition: "opacity 0.2s, transform 0.15s",
                }}
                onMouseEnter={e => (e.currentTarget.style.transform = "scale(1.01)")}
                onMouseLeave={e => (e.currentTarget.style.transform = "scale(1)")}
              >
                Siguiente — Agregar Fotos →
              </button>
            </div>
          </div>
        )}

        {/* ════════════════════════════════════════════════════════════════════
            PASO 2 — FOTOS DEL EVENTO (UI no funcional)
        ════════════════════════════════════════════════════════════════════ */}
        {step === 2 && (
          <div>
            {/* Banner decorativo */}
            <div style={{ height: "8px", background: "linear-gradient(90deg, #92400e, #E0B046 , #fcd34d, #E0B046 , #92400e)", backgroundSize: "200% 100%" }} />

            <div style={{ padding: "36px" }}>

              {/* Resumen del evento creado */}
              <div style={{
                backgroundColor: "#09090b",
                border: "1px solid #27272a",
                borderRadius: "12px",
                padding: "16px 20px",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: "28px",
                flexWrap: "wrap",
                gap: "10px",
              }}>
                <div>
                  <p style={{ color: "white", fontWeight: 900, fontSize: "15px", margin: "0 0 4px 0" }}>
                    {formData.title || "Sin nombre"}
                  </p>
                  <p style={{ color: "#71717a", fontSize: "12px", margin: 0 }}>
                    📅 {formData.date} &nbsp;·&nbsp; 📍 {formData.location}
                  </p>
                </div>
                {/* Badge del código de acceso */}
                <span style={{
                  backgroundColor: "rgba(224, 176, 70, 0.1)",
                  border: "1px solid rgba(224, 176, 70, 0.3)",
                  color: "#E0B046 ",
                  fontFamily: "monospace",
                  fontWeight: 900,
                  fontSize: "13px",
                  padding: "6px 14px",
                  borderRadius: "8px",
                  letterSpacing: "0.1em",
                }}>
                  #{formData.accessCode}
                </span>
              </div>

              {/* Título de la sección de fotos */}
              <p style={{ ...labelStyle, marginBottom: "6px" }}>Fotos del evento</p>
              <p style={{ color: "#52525b", fontSize: "12px", marginBottom: "20px" }}>
                Sube fotos para que aparezcan en el álbum compartido. Máximo 9 fotos.
              </p>

              {/* ── Zona de arrastre principal ────────────────────────────── */}
              <div
                onClick={() => fileInputRef.current?.click()}
                style={{
                  border: "2px dashed #3f3f46",
                  borderRadius: "14px",
                  backgroundColor: "#09090b",
                  padding: "36px 24px",
                  textAlign: "center",
                  cursor: "pointer",
                  marginBottom: "20px",
                  transition: "all 0.2s",
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.borderColor = "rgba(245,158,11,0.5)";
                  e.currentTarget.style.backgroundColor = "rgba(245,158,11,0.03)";
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.borderColor = "#3f3f46";
                  e.currentTarget.style.backgroundColor = "#09090b";
                }}
              >
                {/* Icono de subida */}
                <div style={{ fontSize: "36px", marginBottom: "12px" }}>🖼</div>
                <p style={{ color: "white", fontWeight: 800, fontSize: "14px", margin: "0 0 6px 0" }}>
                  Haz clic o arrastra tus fotos aquí
                </p>
                <p style={{ color: "#52525b", fontSize: "12px", margin: 0 }}>
                  JPG, PNG, WEBP — máximo 9 fotos
                </p>
              </div>

              {/* Input de archivo oculto */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                onChange={handleFotos}
                style={{ display: "none" }}
              />

              {/* ── Grid de previews de fotos ─────────────────────────────── */}
              <div style={{
                display: "grid",
                gridTemplateColumns: "repeat(3, 1fr)",
                gap: "10px",
                marginBottom: "28px",
              }}>
                {/* Slots para fotos — muestra previews o placeholders vacíos */}
                {PHOTO_SLOTS.map((_, i) => {
                  const foto = fotosPreview[i];
                  return (
                    <div
                      key={i}
                      style={{
                        aspectRatio: "1",
                        borderRadius: "10px",
                        overflow: "hidden",
                        backgroundColor: "#09090b",
                        border: foto ? "2px solid #3f3f46" : "1px dashed #27272a",
                        position: "relative",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      {foto ? (
                        <>
                          {/* Vista previa de la foto */}
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={foto} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                          {/* Botón para eliminar la foto */}
                          <button
                            type="button"
                            onClick={() => eliminarFoto(i)}
                            style={{
                              position: "absolute", top: "6px", right: "6px",
                              width: "22px", height: "22px",
                              backgroundColor: "rgba(0,0,0,0.7)",
                              border: "none", borderRadius: "50%",
                              color: "white", fontSize: "11px",
                              cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
                            }}
                          >
                            ✕
                          </button>
                        </>
                      ) : (
                        // Slot vacío con número de posición
                        <span style={{ color: "#27272a", fontSize: "11px", fontWeight: 700 }}>
                          {i + 1}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* ── Botones de acción del paso 2 ──────────────────────────── */}
              <div style={{ display: "flex", gap: "12px" }}>
                {/* Volver al paso 1 */}
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  style={{
                    flex: "0 0 auto",
                    padding: "16px 24px",
                    borderRadius: "12px",
                    backgroundColor: "#18181b",
                    border: "1px solid #3f3f46",
                    color: "#a1a1aa",
                    fontSize: "13px", fontWeight: 700, cursor: "pointer",
                    transition: "border-color 0.2s, color 0.2s",
                  }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = "#E0B046 "; e.currentTarget.style.color = "white"; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = "#3f3f46"; e.currentTarget.style.color = "#a1a1aa"; }}
                >
                  ← Volver
                </button>

                {/* Publicar el evento */}
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  style={{
                    flex: 1,
                    padding: "16px",
                    borderRadius: "12px",
                    backgroundColor: isSubmitting ? "#78350f" : "#E0B046 ",
                    color: "#000",
                    fontSize: "13px", fontWeight: 900,
                    textTransform: "uppercase", letterSpacing: "0.15em",
                    border: "none", cursor: isSubmitting ? "not-allowed" : "pointer",
                    transition: "transform 0.15s, background-color 0.2s",
                    display: "flex", alignItems: "center", justifyContent: "center", gap: "8px",
                  }}
                  onMouseEnter={e => { if (!isSubmitting) e.currentTarget.style.transform = "scale(1.01)"; }}
                  onMouseLeave={e => { e.currentTarget.style.transform = "scale(1)"; }}
                >
                  {isSubmitting ? (
                    <>
                      {/* Spinner de carga */}
                      <span style={{ width: "14px", height: "14px", borderRadius: "50%", border: "2px solid #000", borderTopColor: "transparent", animation: "spin 0.7s linear infinite", display: "inline-block" }} />
                      Publicando...
                    </>
                  ) : (
                    "✦ Publicar Evento"
                  )}
                </button>
              </div>

              {/* Aviso de que las fotos son solo de demostración */}
              <p style={{ textAlign: "center", color: "#3f3f46", fontSize: "11px", marginTop: "16px" }}>
                Las fotos se guardarán junto al evento en tu álbum privado.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}