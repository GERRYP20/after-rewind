"use client";

import React, { useState, useRef } from "react";

interface PhotoUploadProps {
  eventId: string;
  onUploadSuccess: () => void;
}

export default function PhotoUpload({ eventId, onUploadSuccess }: PhotoUploadProps) {
  // Estado para saber si estamos subiendo archivos
  const [uploading, setUploading] = useState(false);
  // Para mostrar mensajes de progreso (ej: "Subiendo 2 de 5...")
  const [progressMsg, setProgressMsg] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Maneja la selección de múltiples archivos
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    const totalFiles = files.length;
    let successCount = 0;

    // Procesamos cada archivo uno por uno
    for (let i = 0; i < totalFiles; i++) {
      const file = files[i];
      setProgressMsg(`Subiendo ${i + 1} de ${totalFiles}...`);

      try {
        // 1. Subir a Cloudinary usando tu API existente
        const uploadData = new FormData();
        uploadData.append("file", file);

        const cloudRes = await fetch("/api/upload", {
          method: "POST",
          body: uploadData,
        });

        if (!cloudRes.ok) throw new Error("Error en Cloudinary");
        const cloudData = await cloudRes.json();

        // 2. Registrar la URL en Firestore
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
    
    // Limpiamos el input
    if (fileInputRef.current) fileInputRef.current.value = "";

    // Si al menos una se subió bien, refrescamos la galería
    if (successCount > 0) {
      onUploadSuccess();
    } else {
      alert("No se pudo subir ninguna foto. Revisa tu conexión.");
    }
  };

  return (
    <div style={{ marginBottom: "24px" }}>
      {/* Input oculto para abrir el selector de archivos */}
      <input
        type="file"
        multiple
        accept="image/*"
        ref={fileInputRef}
        onChange={handleFileChange}
        style={{ display: "none" }}
      />

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
            <span style={{ fontSize: "20px" }}>📸</span>
            Subir Fotos al Álbum
          </>
        )}
      </button>
      
      {!uploading && (
        <p style={{ color: "#52525b", fontSize: "11px", textAlign: "center", marginTop: "8px" }}>
          Puedes seleccionar varias imágenes a la vez
        </p>
      )}
    </div>
  );
}
