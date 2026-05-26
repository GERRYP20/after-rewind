"use client";

import { useState, useRef } from "react";
import { Invitation } from "@/lib/invitations/invitation.types";
import Image from "next/image";
import {
  Cake,
  Gem,
  Plane,
  Utensils,
  Handshake,
  TreePine,
  Sparkles,
  Image as ImageIcon,
  RefreshCw,
  Plus,
  Trash2,
} from "lucide-react";

interface EventEditFormProps {
  event: Invitation;
  onSave: (data: Partial<Invitation>) => Promise<void>;
  onCancel: () => void;
}

// Categorías disponibles para clasificar el evento
const CATEGORIAS = [
  { key: "boda", label: "Boda", icon: Gem },
  { key: "cumpleaños", label: "Cumpleaños", icon: Cake },
  { key: "viaje", label: "Viaje", icon: Plane },
  { key: "cena", label: "Cena", icon: Utensils },
  { key: "reunión", label: "Reunión", icon: Handshake },
  { key: "picnic", label: "Picnic", icon: TreePine },
  { key: "otro", label: "Otro", icon: Sparkles },
];

export default function EventEditForm({ event, onSave, onCancel }: EventEditFormProps) {
  // Estados para manejar la carga de datos y archivos
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Estado que agrupa todos los campos del formulario
  const [formData, setFormData] = useState({
    title: event.title || "",
    date: event.date ? event.date.split("T")[0] : "",
    location: event.location || "",
    locationUrl: event.locationUrl || "",
    description: event.description || "",
    category: event.category || "otro",
    imageUrl: event.imageUrl || "",
  });

  // Gestiona la subida de la imagen a Cloudinary/API
  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
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
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  // Valida y envía los datos actualizados del evento
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

  // Estilos base para inputs y etiquetas
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
      {/* Línea decorativa superior con degradado dorado */}
      <div style={{
        height: "8px",
        background: "linear-gradient(90deg, #92400e, #E0B046, #fcd34d, #E0B046, #92400e)",
        backgroundSize: "200% 100%",
      }} />

      <form onSubmit={handleSubmit}>
        {/* Sección de portada del evento */}
        <div style={{ height: "300px", position: "relative", backgroundColor: "#09090b", borderBottom: "1px solid #3f3f46" }}>
          {formData.imageUrl ? (
            <Image 
              src={formData.imageUrl} 
              alt="Portada del evento" 
              fill 
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 50vw"
            />
          ) : (
            <div style={{ height: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", color: "#52525b", gap: "12px" }}>
              <ImageIcon size={48} style={{ color: "#3f3f46" }} />
              <p style={{ fontWeight: 800, fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.1em" }}>Sin foto de portada</p>
            </div>
          )}
          {/* Spinner de carga durante la subida de imagen */}
          {uploading && (
            <div style={{ position: "absolute", inset: 0, backgroundColor: "rgba(0,0,0,0.8)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", color: "#E0B046", zIndex: 30 }}>
              <span style={{ width: "32px", height: "32px", borderRadius: "50%", border: "2px solid #E0B046", borderTopColor: "transparent", animation: "spin 0.7s linear infinite", marginBottom: "12px" }} />
              <p style={{ fontWeight: 900, fontSize: "13px", letterSpacing: "0.1em" }}>Subiendo...</p>
            </div>
          )}
        </div>

        <div style={{ padding: "36px" }}>
          {/* Botones para gestionar la imagen de portada */}
          <div style={{ display: "flex", gap: "12px", marginBottom: "32px" }}>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              style={{
                flex: 1,
                padding: "14px",
                borderRadius: "12px",
                backgroundColor: "#27272a",
                border: "1px solid #3f3f46",
                color: "white",
                fontWeight: 800,
                fontSize: "12px",
                cursor: "pointer",
                transition: "all 0.2s",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "10px"
              }}
              onMouseEnter={e => e.currentTarget.style.borderColor = "#E0B046"}
              onMouseLeave={e => e.currentTarget.style.borderColor = "#3f3f46"}
              disabled={loading || uploading}
            >
              {formData.imageUrl ? (
                <>
                  <RefreshCw size={14} />
                  Cambiar Imagen
                </>
              ) : (
                <>
                  <Plus size={14} />
                  Subir Imagen
                </>
              )}
            </button>
            
            {formData.imageUrl && (
              <button
                type="button"
                onClick={() => setFormData(prev => ({ ...prev, imageUrl: "" }))}
                style={{
                  padding: "14px 20px",
                  borderRadius: "12px",
                  backgroundColor: "rgba(244, 63, 94, 0.1)",
                  border: "1px solid rgba(244, 63, 94, 0.3)",
                  color: "#f43f5e",
                  cursor: "pointer",
                  transition: "all 0.2s",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
                onMouseEnter={e => e.currentTarget.style.backgroundColor = "rgba(244, 63, 94, 0.2)"}
                onMouseLeave={e => e.currentTarget.style.backgroundColor = "rgba(244, 63, 94, 0.1)"}
                disabled={loading || uploading}
              >
                <Trash2 size={16} />
              </button>
            )}
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleImageChange}
          />

          {/* Encabezado del formulario */}
          <div style={{ textAlign: "center", marginBottom: "28px" }}>
            <h2 style={{ color: "white", fontSize: "24px", fontWeight: 900, margin: "0 0 8px 0" }}>
              Editar <span style={{ color: "#E0B046" }}>Evento</span>
            </h2>
            <p style={{ color: "#71717a", fontSize: "14px", margin: 0 }}>
              Modifica los detalles de tu evento
            </p>
          </div>

          {/* Selector de categoría visual */}
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
                  <cat.icon size={20} style={{ color: "#E0B046" }} />
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          {/* Bloque de inputs del formulario */}
          <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            {/* Campo: Título del evento */}
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

            {/* Grid para Fecha y Ubicación */}
            <div style={{ 
              display: "grid", 
              gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", 
              gap: "16px" 
            }}>
              {/* Campo: Fecha */}
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
              {/* Campo: Ubicación */}
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

            {/* Campo: URL de ubicación (opcional) */}
            <div>
              <label style={labelStyle}>Link del mapa <span style={{ color: "#52525b", fontWeight: 400, textTransform: "none", letterSpacing: 0 }}>(opcional)</span></label>
              <input
                style={inputStyle}
                placeholder="Ej: https://maps.app.goo.gl/..."
                value={formData.locationUrl}
                onChange={e => setFormData({ ...formData, locationUrl: e.target.value })}
                onFocus={e => (e.target.style.borderColor = "#E0B046")}
                onBlur={e => (e.target.style.borderColor = "#3f3f46")}
              />
            </div>

            {/* Campo: Descripción del evento */}
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

          {/* Botones de acción final: Cancelar y Guardar */}
          <div style={{ display: "flex", gap: "12px", marginTop: "28px" }}>
            {/* Botón para abortar la edición */}
            <button
              type="button"
              onClick={onCancel}
              disabled={loading || uploading}
              style={{
                flex: "0 0 auto",
                padding: "16px 24px",
                borderRadius: "12px",
                backgroundColor: "transparent",
                border: "1px solid #3f3f46",
                color: "#a1a1aa",
                fontSize: "13px",
                fontWeight: 700,
                cursor: (loading || uploading) ? "not-allowed" : "pointer",
                transition: "border-color 0.2s, color 0.2s",
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = "#E0B046"; e.currentTarget.style.color = "white"; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = "#3f3f46"; e.currentTarget.style.color = "#a1a1aa"; }}
            >
              Cancelar
            </button>

            {/* Botón principal para confirmar cambios */}
            <button
              type="submit"
              disabled={loading || uploading || !formData.title || !formData.date || !formData.location}
              style={{
                flex: 1,
                padding: "16px",
                borderRadius: "12px",
                backgroundColor: (loading || uploading) ? "#52525b" : "#E0B046",
                color: (loading || uploading) ? "#a1a1aa" : "#000",
                fontSize: "13px",
                fontWeight: 900,
                textTransform: "uppercase",
                letterSpacing: "0.15em",
                border: "none",
                cursor: (loading || uploading) ? "not-allowed" : "pointer",
                transition: "transform 0.15s, background-color 0.2s",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
              }}
              onMouseEnter={e => { if (!loading && !uploading) e.currentTarget.style.transform = "scale(1.01)"; }}
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