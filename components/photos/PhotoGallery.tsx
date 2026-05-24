"use client";

import React, { useState } from "react";
import Image from "next/image";
import { EventPhoto } from "@/lib/photos/event-photo.types";

interface PhotoGalleryProps {
  photos: EventPhoto[];
  currentUserId?: string;
  isEventOwner: boolean;
  onDeleteSuccess: () => void;
}

export default function PhotoGallery({ photos, currentUserId, isEventOwner, onDeleteSuccess }: PhotoGalleryProps) {
  // Estado para la foto que se está viendo en pantalla completa (lightbox)
  const [selectedPhoto, setSelectedPhoto] = useState<EventPhoto | null>(null);
  // Estado para el ID de la foto que se está eliminando actualmente
  const [deletingId, setDeletingId] = useState<string | null>(null);
  // Estado para la foto que se desea eliminar (para mostrar el modal de confirmación)
  const [photoToDelete, setPhotoToDelete] = useState<EventPhoto | null>(null);

  // Maneja la apertura del modal de confirmación
  const handleDelete = (e: React.MouseEvent, photo: EventPhoto) => {
    e.stopPropagation(); // Evitamos que se abra el modal al hacer clic en borrar
    setPhotoToDelete(photo);
  };

  // Ejecuta la eliminación real de la foto tras confirmar en el modal
  const confirmDelete = async () => {
    if (!photoToDelete) return;
    
    const photo = photoToDelete;
    setDeletingId(photo.id || null);
    setPhotoToDelete(null); // Cerramos el modal inmediatamente
    
    try {
      const res = await fetch(`/api/invitations/${photo.eventId}/photos/${photo.id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        onDeleteSuccess();
        if (selectedPhoto?.id === photo.id) setSelectedPhoto(null);
      } else {
        const data = await res.json();
        console.error("Error al eliminar la foto:", data.error || "Error desconocido");
      }
    } catch (err) {
      console.error("Error deleting photo:", err);
    } finally {
      setDeletingId(null);
    }
  };

  // Renderizado en caso de que no existan fotos
  if (photos.length === 0) {
    return (
      <div style={{
        padding: "60px 24px",
        textAlign: "center",
        border: "2px dashed #27272a",
        borderRadius: "16px",
        color: "#52525b"
      }}>
        <p style={{ fontSize: "40px", margin: "0 0 10px 0" }}>🖼️</p>
        <p style={{ fontWeight: 700, fontSize: "14px" }}>ÁLBUM VACÍO</p>
        <p style={{ fontSize: "12px" }}>Sé el primero en subir una foto de este momento.</p>
      </div>
    );
  }

  return (
    <>
      {/* Grilla principal de fotos con diseño responsivo */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))",
        gap: "12px",
      }}>
        {photos.map((photo) => {
          // Determina si el usuario tiene permiso para borrar esta foto
          const canDelete = isEventOwner || (currentUserId && photo.userId === currentUserId);
          
          return (
            <div
              key={photo.id}
              onClick={() => setSelectedPhoto(photo)}
              style={{
                position: "relative",
                aspectRatio: "1 / 1",
                borderRadius: "12px",
                overflow: "hidden",
                backgroundColor: "#09090b",
                cursor: "pointer",
                border: "1px solid #27272a",
                transition: "transform 0.2s"
              }}
              onMouseEnter={e => e.currentTarget.style.transform = "scale(1.03)"}
              onMouseLeave={e => e.currentTarget.style.transform = "scale(1)"}
            >
              {/* Imagen de la miniatura */}
              <Image
                src={photo.url}
                alt={`Foto por ${photo.userName}`}
                fill
                style={{ objectFit: "cover" }}
                sizes="(max-width: 768px) 33vw, 20vw"
              />

              {/* Botón flotante para eliminar la foto */}
              {canDelete && (
                <button
                  onClick={(e) => handleDelete(e, photo)}
                  disabled={deletingId === photo.id}
                  style={{
                    position: "absolute",
                    top: "8px",
                    right: "8px",
                    width: "28px",
                    height: "28px",
                    borderRadius: "8px",
                    backgroundColor: "rgba(244, 63, 94, 0.9)",
                    border: "none",
                    color: "white",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "14px",
                    cursor: "pointer",
                    zIndex: 15,
                    opacity: 0,
                    transition: "opacity 0.2s"
                  }}
                  className="delete-btn"
                >
                  {deletingId === photo.id ? "..." : "🗑️"}
                </button>
              )}

              {/* Pie de foto con el nombre del autor */}
              <div style={{
                position: "absolute",
                bottom: 0,
                left: 0,
                right: 0,
                padding: "8px",
                background: "linear-gradient(transparent, rgba(0,0,0,0.8))",
                opacity: 0,
                transition: "opacity 0.2s",
              }} className="photo-label">
                <p style={{ color: "white", fontSize: "10px", fontWeight: 700, margin: 0 }}>
                  👤 {photo.userName}
                </p>
              </div>
              <style jsx>{`
                div:hover .photo-label { opacity: 1 !important; }
                div:hover .delete-btn { opacity: 1 !important; }
              `}</style>
            </div>
          );
        })}
      </div>

      {/* Modal / Lightbox para ver la imagen en alta resolución */}
      {selectedPhoto && (
        <div 
          onClick={() => setSelectedPhoto(null)}
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(0,0,0,0.95)",
            zIndex: 2000,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: "40px",
            cursor: "zoom-out"
          }}
        >
          {/* Controles del lightbox */}
          <div style={{ position: "absolute", top: "20px", right: "20px", display: "flex", gap: "20px", alignItems: "center" }}>
            {/* Botón eliminar dentro del lightbox */}
            {(isEventOwner || (currentUserId && selectedPhoto.userId === currentUserId)) && (
              <button
                onClick={(e) => handleDelete(e, selectedPhoto)}
                style={{
                  background: "rgba(244, 63, 94, 0.2)",
                  border: "1px solid #f43f5e",
                  color: "#f43f5e",
                  padding: "8px 16px",
                  borderRadius: "10px",
                  fontWeight: 700,
                  fontSize: "13px",
                  cursor: "pointer"
                }}
              >
                Eliminar Foto
              </button>
            )}
            {/* Botón para cerrar el lightbox */}
            <button 
              onClick={() => setSelectedPhoto(null)}
              style={{
                background: "none",
                border: "none",
                color: "white",
                fontSize: "30px",
                cursor: "pointer"
              }}
            >✕</button>
          </div>

          {/* Contenedor de la imagen expandida */}
          <div 
            onClick={e => e.stopPropagation()}
            style={{
              position: "relative",
              width: "100%",
              maxWidth: "1000px",
              height: "80vh",
              cursor: "default"
            }}
          >
            <Image
              src={selectedPhoto.url}
              alt="Vista completa"
              fill
              style={{ objectFit: "contain" }}
              priority
            />
          </div>

          {/* Información detallada de la foto seleccionada */}
          <div style={{ marginTop: "20px", textAlign: "center" }}>
            <p style={{ color: "white", fontWeight: 900, fontSize: "16px", margin: "0 0 4px 0" }}>
              Subida por {selectedPhoto.userName}
            </p>
            <p style={{ color: "#71717a", fontSize: "12px" }}>
              {new Date(selectedPhoto.createdAt).toLocaleString("es-MX", { dateStyle: "long", timeStyle: "short" })}
            </p>
          </div>
        </div>
      )}

      {/* Modal de confirmación personalizado para eliminar */}
      {photoToDelete && (
        <div style={{
          position: "fixed",
          inset: 0,
          backgroundColor: "rgba(0,0,0,0.8)",
          backdropFilter: "blur(4px)",
          zIndex: 3000,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "20px"
        }}>
          <div style={{
            backgroundColor: "#18181b",
            border: "1px solid #27272a",
            borderRadius: "20px",
            padding: "24px",
            maxWidth: "400px",
            width: "100%",
            textAlign: "center"
          }}>
            <div style={{
              width: "60px",
              height: "60px",
              borderRadius: "30px",
              backgroundColor: "rgba(244, 63, 94, 0.1)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "24px",
              margin: "0 auto 16px"
            }}>🗑️</div>
            
            <h3 style={{ color: "white", fontSize: "18px", fontWeight: 800, margin: "0 0 8px 0" }}>
              ¿Eliminar esta foto?
            </h3>
            <p style={{ color: "#a1a1aa", fontSize: "14px", margin: "0 0 24px 0" }}>
              Esta acción no se puede deshacer y la foto desaparecerá del álbum para todos los invitados.
            </p>
            
            <div style={{ display: "flex", gap: "12px" }}>
              <button
                onClick={() => setPhotoToDelete(null)}
                style={{
                  flex: 1,
                  padding: "12px",
                  borderRadius: "12px",
                  border: "1px solid #27272a",
                  backgroundColor: "transparent",
                  color: "white",
                  fontWeight: 600,
                  cursor: "pointer"
                }}
              >
                Cancelar
              </button>
              <button
                onClick={confirmDelete}
                style={{
                  flex: 1,
                  padding: "12px",
                  borderRadius: "12px",
                  border: "none",
                  backgroundColor: "#f43f5e",
                  color: "white",
                  fontWeight: 600,
                  cursor: "pointer"
                }}
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
