"use client";

import { useState } from "react";
import { Invitation } from "@/lib/invitations/invitation.types";

interface EventEditFormProps {
  event: Invitation;
  onSave: (data: Partial<Invitation>) => Promise<void>;
  onCancel: () => void;
}

// Categorías disponibles para el evento
const CATEGORIAS = [
  { key: "boda", label: "Boda", icon: "💍" },
  { key: "cumpleaños", label: "Cumpleaños", icon: "🎂" },
  { key: "viaje", label: "Viaje", icon: "✈️" },
  { key: "cena", label: "Cena", icon: "🍽" },
  { key: "reunión", label: "Reunión", icon: "🤝" },
  { key: "picnic", label: "Picnic", icon: "🧺" },
  { key: "otro", label: "Otro", icon: "✦" },
];

export default function EventEditForm({ event, onSave, onCancel }: EventEditFormProps) {
  // Estado para indicar si hay una operación en progreso
  const [loading, setLoading] = useState(false);

  // Estado para el formulario
  const [formData, setFormData] = useState({
    title: event.title || "",
    date: event.date ? event.date.split("T")[0] : "",
    location: event.location || "",
    description: event.description || "",
    category: event.category || "otro",
  });

  // Función para guardar los cambios
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title || !formData.date || !formData.location) {
      alert("Por favor completa los campos requeridos");
      return;
    }

    setLoading(true);
    try {
      await onSave(formData);
    } catch (error) {
      console.error("Error al guardar:", error);
      alert("Error al guardar los cambios");
    } finally {
      setLoading(false);
    }
  };

  // Estilos reutilizables
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
      backgroundColor: "#18181b",
      border: "1px solid #3f3f46",
      borderRadius: "20px",
      overflow: "hidden",
    }}>
      {/* Banner decorativo */}
      <div style={{
        height: "8px",
        background: "linear-gradient(90deg, #92400e, #E0B046, #fcd34d, #E0B046, #92400e)",
        backgroundSize: "200% 100%",
      }} />

      <form onSubmit={handleSubmit}>
        <div style={{ padding: "36px" }}>
          {/* Título de la sección */}
          <div style={{ textAlign: "center", marginBottom: "28px" }}>
            <h2 style={{ color: "white", fontSize: "24px", fontWeight: 900, margin: "0 0 8px 0" }}>
              Editar <span style={{ color: "#E0B046" }}>Evento</span>
            </h2>
            <p style={{ color: "#71717a", fontSize: "14px", margin: 0 }}>
              Modifica los detalles de tu evento
            </p>
          </div>

          {/* Selector de categoría */}
          <div style={{ marginBottom: "28px" }}>
            <p style={labelStyle}>Tipo de evento</p>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(100px, 1fr))", gap: "10px" }}>
              {CATEGORIAS.map(cat => (
                <button
                  key={cat.key}
                  type="button"
                  onClick={() => setFormData({ ...formData, category: cat.key })}
                  style={{
                    padding: "12px 8px",
                    borderRadius: "10px",
                    border: `2px solid ${formData.category === cat.key ? "#E0B046" : "#27272a"}`,
                    backgroundColor: formData.category === cat.key ? "rgba(224, 176, 70, 0.12)" : "#09090b",
                    color: formData.category === cat.key ? "#E0B046" : "#71717a",
                    cursor: "pointer",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: "6px",
                    fontSize: "11px",
                    fontWeight: 800,
                    textTransform: "uppercase",
                    letterSpacing: "0.08em",
                    transition: "all 0.2s",
                  }}
                >
                  <span style={{ fontSize: "20px" }}>{cat.icon}</span>
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          {/* Campos del formulario */}
          <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            {/* Nombre del evento */}
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

            {/* Fecha y ubicación */}
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

            {/* Descripción */}
            <div>
              <label style={labelStyle}>
                Descripción <span style={{ color: "#52525b", fontWeight: 400, textTransform: "none", letterSpacing: 0 }}>(opcional)</span>
              </label>
              <textarea
                style={{ ...inputStyle, resize: "none", height: "90px", lineHeight: 1.6 }}
                placeholder="Cuéntale a tus invitados de qué trata el evento..."
                value={formData.description}
                onChange={e => setFormData({ ...formData, description: e.target.value })}
                onFocus={e => (e.target.style.borderColor = "#E0B046")}
                onBlur={e => (e.target.style.borderColor = "#3f3f46")}
              />
            </div>
          </div>

          {/* Botones de acción */}
          <div style={{ display: "flex", gap: "12px", marginTop: "28px" }}>
            {/* Cancelar */}
            <button
              type="button"
              onClick={onCancel}
              disabled={loading}
              style={{
                flex: "0 0 auto",
                padding: "16px 24px",
                borderRadius: "12px",
                backgroundColor: "transparent",
                border: "1px solid #3f3f46",
                color: "#a1a1aa",
                fontSize: "13px",
                fontWeight: 700,
                cursor: loading ? "not-allowed" : "pointer",
                transition: "border-color 0.2s, color 0.2s",
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = "#E0B046"; e.currentTarget.style.color = "white"; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = "#3f3f46"; e.currentTarget.style.color = "#a1a1aa"; }}
            >
              Cancelar
            </button>

            {/* Guardar cambios */}
            <button
              type="submit"
              disabled={loading || !formData.title || !formData.date || !formData.location}
              style={{
                flex: 1,
                padding: "16px",
                borderRadius: "12px",
                backgroundColor: loading ? "#52525b" : "#E0B046",
                color: loading ? "#a1a1aa" : "#000",
                fontSize: "13px",
                fontWeight: 900,
                textTransform: "uppercase",
                letterSpacing: "0.15em",
                border: "none",
                cursor: loading ? "not-allowed" : "pointer",
                transition: "transform 0.15s, background-color 0.2s",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
              }}
              onMouseEnter={e => { if (!loading) e.currentTarget.style.transform = "scale(1.01)"; }}
              onMouseLeave={e => { e.currentTarget.style.transform = "scale(1)"; }}
            >
              {loading ? "Guardando..." : "✦ Guardar Cambios"}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}