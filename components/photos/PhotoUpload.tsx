"use client";

import React, { useState, useRef } from "react";
import { Camera } from "lucide-react";

interface PhotoUploadProps {
  eventId: string;
  onUploadSuccess: () => void;
}

export default function PhotoUpload({ eventId, onUploadSuccess }: PhotoUploadProps) {
  // Estado para indicar si se están subiendo archivos en este momento
  const [uploading, setUploading] = useState(false);
  // Estado para mostrar mensajes dinámicos sobre el progreso de la subida
  const [progressMsg, setProgressMsg] = useState("");
  // Referencia al input de tipo file oculto
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Maneja la selección de uno o varios archivos de imagen
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    const totalFiles = files.length;
    let successCount = 0;

    // Procesamos la subida de cada archivo secuencialmente
    for (let i = 0; i < totalFiles; i++) {
      const file = files[i];
      setProgressMsg(`Subiendo ${i + 1} de ${totalFiles}...`);

      try {
        // 1. Envía el archivo al endpoint de subida (Cloudinary)
        const uploadData = new FormData();
        uploadData.append("file", file);

        const cloudRes = await fetch("/api/upload", {
          method: "POST",
          body: uploadData,
        });

        if (!cloudRes.ok) throw new Error("Error en Cloudinary");
        const cloudData = await cloudRes.json();

        // 2. Registra la URL obtenida en la base de datos del evento
        const dbRes = await fetch(`/api/invitations/${eventId}/photos`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url: cloudData.url }),
        });

        if (dbRes.ok) {
          successCount++;
        }
      } catch (err) {
        console.error(`Error subiendo el archivo ${file.name}:`, err);
      }
    }

    setUploading(false);
    setProgressMsg("");
    
    // Resetea el input para permitir subir los mismos archivos si se desea
    if (fileInputRef.current) fileInputRef.current.value = "";

    // Si hubo éxito, notifica al componente padre para actualizar la galería
    if (successCount > 0) {
      onUploadSuccess();
    } else {
      alert("No se pudo subir ninguna foto. Revisa tu conexión.");
    }
  };

  return (
    <div style={{ marginBottom: "24px" }}>
      {/* Input de archivos oculto, controlado por el botón principal */}
      <input
        type="file"
        multiple
        accept="image/*"
        ref={fileInputRef}
        onChange={handleFileChange}
        style={{ display: "none" }}
      />

      {/* Botón de acción principal con estados visuales de carga */}
      <button
        onClick={() => fileInputRef.current?.click()}
        disabled={uploading}
        style={{
          width: "100%",
          padding: "16px",
          borderRadius: "14px",
          backgroundColor: uploading ? "#27272a" : "rgba(224, 176, 70, 0.1)",
          border: `2px dashed ${uploading ? "#3f3f46" : "#E0B046"}`,
          color: uploading ? "#71717a" : "#E0B046",
          fontSize: "13px",
          fontWeight: 800,
          textTransform: "uppercase",
          letterSpacing: "0.1em",
          cursor: uploading ? "not-allowed" : "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "12px",
          transition: "all 0.2s"
        }}
        onMouseEnter={e => {
          if (!uploading) {
            e.currentTarget.style.backgroundColor = "rgba(224, 176, 70, 0.15)";
            e.currentTarget.style.transform = "translateY(-2px)";
          }
        }}
        onMouseLeave={e => {
          if (!uploading) {
            e.currentTarget.style.backgroundColor = "rgba(224, 176, 70, 0.1)";
            e.currentTarget.style.transform = "translateY(0)";
          }
        }}
      >
        {uploading ? (
          <>
            {/* Spinner de carga y mensaje de progreso */}
            <span style={{ 
              width: "18px", height: "18px", 
              borderRadius: "50%", border: "2px solid #E0B046", 
              borderTopColor: "transparent", 
              animation: "spin 0.8s linear infinite" 
            }} />
            {progressMsg}
          </>
        ) : (
          <>
            <Camera size={20} />
            Subir Fotos al Álbum
          </>
        )}
      </button>
      
      {/* Nota informativa para el usuario */}
      {!uploading && (
        <p style={{ color: "#52525b", fontSize: "11px", textAlign: "center", marginTop: "8px" }}>
          Puedes seleccionar varias imágenes a la vez
        </p>
      )}
    </div>
  );
}
