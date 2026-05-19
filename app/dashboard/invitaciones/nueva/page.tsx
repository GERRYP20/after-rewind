"use client";

import React, { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

// ─── Categorías disponibles para el evento ──────
const CATEGORIAS = [
  { key: "boda",       label: "Boda",       icon: "💍" },
  { key: "cumpleaños", label: "Cumpleaños", icon: "🎂" },
  { key: "viaje",      label: "Viaje",      icon: "✈️" },
  { key: "cena",       label: "Cena",       icon: "🍽" },
  { key: "reunión",    label: "Reunión",    icon: "🤝" },
  { key: "picnic",     label: "Picnic",     icon: "🧺" },
  { key: "otro",       label: "Otro",       icon: "✦"  },
];

export default function NuevaInvitacion() {
  const router = useRouter();

  // Estados de navegación y UI
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [step, setStep] = useState<1 | 2>(1);
  const [categoriaActiva, setCategoriaActiva] = useState<string>("boda");
  const [visibility, setVisibility] = useState<'public' | 'private'>("public");

  // Estado para la subida de imagen de Cloudinary
  const [uploadingImage, setUploadingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Datos del formulario principal
  const [formData, setFormData] = useState({
    title: "",
    date: "",
    location: "",
    accessCode: "",
    description: "",
    imageUrl: "", 
  });

  // ── Maneja la subida de la imagen principal a Cloudinary ─────────
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingImage(true);
    try {
      const uploadData = new FormData();
      uploadData.append("file", file);

      const response = await fetch("/api/upload", {
        method: "POST",
        body: uploadData,
      });

      if (!response.ok) {
        throw new Error("Failed to upload image");
      }

      const data = await response.json();
      
      if (data.url) {
        setFormData(prev => ({ ...prev, imageUrl: data.url }));
      }
    } catch (error) {
      console.error("Error uploading image:", error);
      alert("Error al subir la imagen. Por favor, intenta de nuevo.");
    } finally {
      setUploadingImage(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  // ── Elimina la foto de la vista previa ───────────────
  const handleRemoveImage = () => {
    setFormData(prev => ({ ...prev, imageUrl: "" }));
  };

  // ── Envía el formulario a la API ───────────────
  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/invitations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          ...formData, 
          category: categoriaActiva,
          visibility: visibility,
          guestCount: 0, 
        }),
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

  // ── Estilos reutilizables para inputs ──────────
  const inputStyle: React.CSSProperties = {
    width: "100%",
    backgroundColor: "#09090b",
    border: "1px solid #3f3f46",
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
    color: "#a1a1aa",
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

      {/* ── ENCABEZADO ───────────────────────── */}
      <div style={{ textAlign: "center", marginBottom: "2.5rem", maxWidth: "560px" }}>
        <p style={{ color: "#E0B046", fontSize: "11px", fontWeight: 900, letterSpacing: "0.25em", textTransform: "uppercase", margin: "0 0 12px 0" }}>
          ✦ Nuevo Evento
        </p>
        <h1 style={{ color: "white", fontSize: "clamp(1.8rem, 4vw, 2.8rem)", fontWeight: 900, letterSpacing: "-0.03em", margin: "0 0 10px 0" }}>
          Crea tu <span style={{ color: "#E0B046" }}>Memoria</span>
        </h1>
        <p style={{ color: "#71717a", fontSize: "14px", margin: 0, lineHeight: 1.6 }}>
          Configura los detalles de tu evento y sube una foto de portada.
        </p>
      </div>

      {/* ── INDICADOR DE PASOS ───────────────── */}
      <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "2.5rem" }}>
        {[
          { n: 1, label: "Detalles" },
          { n: 2, label: "Portada" },
        ].map(({ n, label }, i) => (
          <React.Fragment key={n}>
            {i > 0 && (
              <div style={{
                width: "48px", height: "1px",
                backgroundColor: step >= n ? "#E0B046" : "#27272a",
                transition: "background-color 0.3s",
              }} />
            )}
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "6px" }}>
              <div style={{
                width: "36px", height: "36px",
                borderRadius: "50%",
                backgroundColor: step >= n ? "#E0B046" : "#18181b",
                border: `2px solid ${step >= n ? "#E0B046" : "#3f3f46"}`,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontWeight: 900, fontSize: "13px",
                color: step >= n ? "#000" : "#52525b",
                transition: "all 0.3s",
              }}>
                {step > n ? "✓" : n}
              </div>
              <span style={{ fontSize: "10px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: step >= n ? "#E0B046" : "#52525b" }}>
                {label}
              </span>
            </div>
          </React.Fragment>
        ))}
      </div>

      {/* ── CONTENEDOR PRINCIPAL DEL FORMULARIO  */}
      <div style={{
        width: "100%",
        maxWidth: "680px",
        backgroundColor: "#18181b",
        border: "1px solid #3f3f46",
        borderRadius: "20px",
        overflow: "hidden",
      }}>

        {/* PASO 1 — DETALLES DEL EVENTO */}
        {step === 1 && (
          <div>
            <div style={{
              height: "8px",
              background: "linear-gradient(90deg, #92400e, #E0B046, #fcd34d, #E0B046, #92400e)",
              backgroundSize: "200% 100%",
            }} />

            <div style={{ padding: "36px" }}>

              <div style={{ marginBottom: "28px" }}>
                <p style={labelStyle}>Tipo de evento</p>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(100px, 1fr))", gap: "10px" }}>
                  {CATEGORIAS.map(cat => (
                    <button
                      key={cat.key}
                      type="button"
                      onClick={() => setCategoriaActiva(cat.key)}
                      style={{
                        padding: "12px 8px",
                        borderRadius: "10px",
                        border: `2px solid ${categoriaActiva === cat.key ? "#E0B046" : "#27272a"}`,
                        backgroundColor: categoriaActiva === cat.key ? "rgba(224, 176, 70, 0.12)" : "#09090b",
                        color: categoriaActiva === cat.key ? "#E0B046" : "#71717a",
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

              <div style={{ marginBottom: "28px" }}>
                <p style={labelStyle}>Visibilidad del evento</p>
                <div style={{ display: "flex", gap: "12px" }}>
                  <button
                    type="button"
                    onClick={() => setVisibility("public")}
                    style={{
                      flex: 1,
                      padding: "16px",
                      borderRadius: "12px",
                      border: `2px solid ${visibility === "public" ? "#E0B046" : "#27272a"}`,
                      backgroundColor: visibility === "public" ? "rgba(224, 176, 70, 0.08)" : "#09090b",
                      cursor: "pointer",
                      textAlign: "left",
                      transition: "all 0.2s",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "6px" }}>
                      <span style={{ fontSize: "20px" }}>🌐</span>
                      <span style={{
                        color: visibility === "public" ? "#E0B046" : "#fafafa",
                        fontWeight: 700,
                        fontSize: "14px",
                      }}>
                        Público
                      </span>
                    </div>
                    <p style={{ color: "#71717a", fontSize: "12px", margin: 0 }}>
                      Cualquiera con el código se une automáticamente
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setVisibility("private")}
                    style={{
                      flex: 1,
                      padding: "16px",
                      borderRadius: "12px",
                      border: `2px solid ${visibility === "private" ? "#E0B046" : "#27272a"}`,
                      backgroundColor: visibility === "private" ? "rgba(224, 176, 70, 0.08)" : "#09090b",
                      cursor: "pointer",
                      textAlign: "left",
                      transition: "all 0.2s",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "6px" }}>
                      <span style={{ fontSize: "20px" }}>🔒</span>
                      <span style={{
                        color: visibility === "private" ? "#E0B046" : "#fafafa",
                        fontWeight: 700,
                        fontSize: "14px",
                      }}>
                        Privado
                      </span>
                    </div>
                    <p style={{ color: "#71717a", fontSize: "12px", margin: 0 }}>
                      Los invitados requieren tu aprobación manual
                    </p>
                  </button>
                </div>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                <div>
                  <label style={labelStyle}>Nombre del evento</label>
                  <input
                    style={inputStyle}
                    placeholder="Ej: Boda de Ana y Juan"
                    value={formData.title}
                    onChange={e => setFormData({ ...formData, title: e.target.value })}
                    onFocus={e => (e.target.style.borderColor = "#E0B046")}
                    onBlur={e => (e.target.style.borderColor = "#3f3f46")}
                    required
                  />
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                  <div>
                    <label style={labelStyle}>Fecha del evento</label>
                    <input
                      type="date"
                      style={{ ...inputStyle, colorScheme: "dark" }}
                      value={formData.date}
                      onChange={e => setFormData({ ...formData, date: e.target.value })}
                      onFocus={e => (e.target.style.borderColor = "#E0B046")}
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
                      onFocus={e => (e.target.style.borderColor = "#E0B046")}
                      onBlur={e => (e.target.style.borderColor = "#3f3f46")}
                      required
                    />
                  </div>
                </div>

                <div>
                  <label style={labelStyle}>Descripción <span style={{ color: "#52525b", fontWeight: 400, textTransform: "none", letterSpacing: 0 }}>(opcional)</span></label>
                  <textarea
                    style={{ ...inputStyle, resize: "none", height: "90px", lineHeight: 1.6 }}
                    placeholder="Cuéntale a tus invitados de qué trata el evento..."
                    value={formData.description}
                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                    onFocus={e => (e.target.style.borderColor = "#E0B046")}
                    onBlur={e => (e.target.style.borderColor = "#3f3f46")}
                  />
                </div>

                <div>
                  <label style={labelStyle}>Código de acceso</label>
                  <div style={{ position: "relative" }}>
                    <span style={{
                      position: "absolute", left: "16px", top: "50%", transform: "translateY(-50%)",
                      color: "#E0B046", fontWeight: 900, fontSize: "16px", pointerEvents: "none",
                    }}>
                      #
                    </span>
                    <input
                      style={{ ...inputStyle, paddingLeft: "34px", textTransform: "uppercase", fontFamily: "monospace", letterSpacing: "0.1em" }}
                      placeholder="ANA2026"
                      value={formData.accessCode}
                      onChange={e => setFormData({ ...formData, accessCode: e.target.value.toUpperCase() })}
                      onFocus={e => (e.target.style.borderColor = "#E0B046")}
                      onBlur={e => (e.target.style.borderColor = "#3f3f46")}
                      required
                    />
                  </div>
                  <p style={{ color: "#52525b", fontSize: "11px", marginTop: "6px" }}>
                    Tus invitados usarán este código para acceder al evento.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setStep(2)}
                disabled={!formData.title || !formData.date || !formData.location || !formData.accessCode}
                style={{
                  marginTop: "28px",
                  width: "100%",
                  padding: "16px",
                  borderRadius: "12px",
                  backgroundColor: "#E0B046",
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
                Siguiente — Agregar Portada →
              </button>
            </div>
          </div>
        )}

        {/* PASO 2 — IMAGEN DE PORTADA (REDiseñado para bajar los botones) */}
        {step === 2 && (
          <div>
            <div style={{ height: "8px", background: "linear-gradient(90deg, #92400e, #E0B046, #fcd34d, #E0B046, #92400e)", backgroundSize: "200% 100%" }} />

            {/* PORTADA - Se muestra primero arriba para dar visibilidad */}
            <div style={{ height: "350px", position: "relative", backgroundColor: "#09090b", borderBottom: "1px solid #3f3f46" }}>
              {formData.imageUrl ? (
                <Image 
                  src={formData.imageUrl} 
                  alt="Portada del evento" 
                  fill 
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 80vw"
                />
              ) : (
                <div style={{ height: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", color: "#52525b", gap: "12px" }}>
                  <span style={{ fontSize: "50px" }}>🖼️</span>
                  <p style={{ fontWeight: 800, fontSize: "12px", textTransform: "uppercase", letterSpacing: "0.1em" }}>Sin foto de portada seleccionada</p>
                </div>
              )}
              {uploadingImage && (
                <div style={{ position: "absolute", inset: 0, backgroundColor: "rgba(0,0,0,0.8)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", color: "#E0B046", zIndex: 30 }}>
                  <span style={{ width: "32px", height: "32px", borderRadius: "50%", border: "2px solid #E0B046", borderTopColor: "transparent", animation: "spin 0.7s linear infinite", marginBottom: "12px" }} />
                  <p style={{ fontWeight: 900, fontSize: "13px", letterSpacing: "0.1em" }}>Subiendo a Cloudinary...</p>
                </div>
              )}
            </div>

            <div style={{ padding: "36px" }}>
              
              {/* BOTONES DE ACCIÓN - AHORA FUERA DE LA IMAGEN Y ABAJO */}
              <div style={{ display: "flex", gap: "12px", marginBottom: "32px" }}>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  style={{
                    flex: 1,
                    padding: "16px",
                    borderRadius: "14px",
                    backgroundColor: "#27272a",
                    border: "1px solid #3f3f46",
                    color: "white",
                    fontWeight: 800,
                    fontSize: "13px",
                    cursor: "pointer",
                    transition: "all 0.2s",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "10px"
                  }}
                  onMouseEnter={e => e.currentTarget.style.borderColor = "#E0B046"}
                  onMouseLeave={e => e.currentTarget.style.borderColor = "#3f3f46"}
                >
                  {formData.imageUrl ? "🔄 Cambiar Imagen" : "➕ Subir Imagen Principal"}
                </button>
                
                {formData.imageUrl && (
                  <button
                    type="button"
                    onClick={handleRemoveImage}
                    style={{
                      padding: "16px 20px",
                      borderRadius: "14px",
                      backgroundColor: "rgba(244, 63, 94, 0.1)",
                      border: "1px solid rgba(244, 63, 94, 0.3)",
                      color: "#f43f5e",
                      cursor: "pointer",
                      transition: "all 0.2s"
                    }}
                    onMouseEnter={e => e.currentTarget.style.backgroundColor = "rgba(244, 63, 94, 0.2)"}
                    onMouseLeave={e => e.currentTarget.style.backgroundColor = "rgba(244, 63, 94, 0.1)"}
                  >
                    🗑️
                  </button>
                )}
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                style={{ display: "none" }}
              />

              {/* RESUMEN DEL EVENTO - CONFIRMACIÓN VISUAL */}
              <div style={{
                backgroundColor: "#09090b",
                border: "1px solid #27272a",
                borderRadius: "16px",
                padding: "20px 24px",
                marginBottom: "32px",
              }}>
                <p style={labelStyle}>Resumen del evento</p>
                <h3 style={{ color: "white", fontWeight: 900, fontSize: "20px", margin: "0 0 4px 0" }}>
                  {formData.title || "Sin título"}
                </h3>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "16px", color: "#71717a", fontSize: "14px" }}>
                  <span>📅 {formData.date || "Sin fecha"}</span>
                  <span>📍 {formData.location || "Sin ubicación"}</span>
                  <span style={{ color: "#E0B046", fontWeight: 700 }}>#{formData.accessCode}</span>
                </div>
              </div>

              {/* ACCIONES FINALES DE NAVEGACIÓN */}
              <div style={{ display: "flex", gap: "12px" }}>
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  disabled={isSubmitting || uploadingImage}
                  style={{
                    flex: "0 0 120px",
                    padding: "16px",
                    borderRadius: "14px",
                    backgroundColor: "transparent",
                    border: "1px solid #3f3f46",
                    color: "#a1a1aa",
                    fontSize: "13px",
                    fontWeight: 700,
                    cursor: "pointer",
                    transition: "all 0.2s",
                  }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = "#E0B046"; e.currentTarget.style.color = "white"; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = "#3f3f46"; e.currentTarget.style.color = "#a1a1aa"; }}
                >
                  ← Volver
                </button>

                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={isSubmitting || uploadingImage}
                  style={{
                    flex: 1,
                    padding: "16px",
                    borderRadius: "14px",
                    backgroundColor: isSubmitting || uploadingImage ? "#52525b" : "#E0B046",
                    color: isSubmitting || uploadingImage ? "#a1a1aa" : "#000",
                    fontSize: "13px",
                    fontWeight: 900,
                    textTransform: "uppercase",
                    letterSpacing: "0.15em",
                    border: "none",
                    cursor: isSubmitting || uploadingImage ? "not-allowed" : "pointer",
                    transition: "transform 0.15s, background-color 0.2s",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "8px",
                  }}
                  onMouseEnter={e => { if (!isSubmitting && !uploadingImage) e.currentTarget.style.transform = "scale(1.01)"; }}
                  onMouseLeave={e => { e.currentTarget.style.transform = "scale(1)"; }}
                >
                  {isSubmitting ? "Publicando..." : "✦ Publicar Evento"}
                </button>
              </div>

            </div>
          </div>
        )}
      </div>
    </div>
  );
}