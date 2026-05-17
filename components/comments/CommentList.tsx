"use client";

import { useState } from "react";
import { Comment } from "@/lib/comments/comment.types";

interface DeleteConfirmModalProps {
  isOpen: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  userName: string;
}

function DeleteConfirmModal({ isOpen, onConfirm, onCancel, userName }: DeleteConfirmModalProps) {
  if (!isOpen) return null;

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(0, 0, 0, 0.8)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
      }}
      onClick={onCancel}
    >
      <div
        style={{
          backgroundColor: "#18181b",
          border: "1px solid #3f3f46",
          borderRadius: "16px",
          padding: "24px",
          maxWidth: "400px",
          width: "90%",
          boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ textAlign: "center", marginBottom: "24px" }}>
          <div
            style={{
              width: "64px",
              height: "64px",
              borderRadius: "50%",
              backgroundColor: "#fef2f2",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: "16px",
            }}
          >
            <span style={{ fontSize: "32px" }}>⚠️</span>
          </div>
          <h3
            style={{
              color: "#fafafa",
              fontSize: "20px",
              fontWeight: 700,
              margin: 0,
              marginBottom: "8px",
            }}
          >
            ¿Eliminar comentario?
          </h3>
          <p style={{ color: "#a1a1aa", fontSize: "14px", margin: 0 }}>
            ¿Estás seguro de que quieres eliminar el comentario de <strong style={{ color: "#E0B046" }}>{userName}</strong>? Esta acción no se puede deshacer.
          </p>
        </div>
        <div style={{ display: "flex", gap: "12px", justifyContent: "center" }}>
          <button
            onClick={onCancel}
            style={{
              padding: "12px 24px",
              borderRadius: "10px",
              backgroundColor: "transparent",
              border: "1px solid #3f3f46",
              color: "#a1a1aa",
              fontSize: "14px",
              fontWeight: 600,
              cursor: "pointer",
              transition: "all 0.2s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = "#52525b";
              e.currentTarget.style.color = "#fafafa";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = "#3f3f46";
              e.currentTarget.style.color = "#a1a1aa";
            }}
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            style={{
              padding: "12px 24px",
              borderRadius: "10px",
              backgroundColor: "#f43f5e",
              border: "none",
              color: "#ffffff",
              fontSize: "14px",
              fontWeight: 600,
              cursor: "pointer",
              transition: "all 0.2s",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#e11d48")}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#f43f5e")}
          >
            Eliminar
          </button>
        </div>
      </div>
    </div>
  );
}

interface CommentListProps {
  comments: Comment[];
  onEdit: (commentId: string, newText: string) => Promise<void>;
  onDelete: (commentId: string) => Promise<void>;
}

/**
 * Formatea una fecha ISO a formato legible en español.
 * @param isoString - Fecha en formato ISO
 * @returns Cadena con la fecha formateada
 */
function formatDate(isoString: string): string {
  const date = new Date(isoString);
  return date.toLocaleDateString("es-MX", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/**
 * Componente que renderiza un solo comentario.
 * Muestra botones de editar/eliminar si el usuario es el propietario.
 */
function CommentItem({
  comment,
  onEdit,
  onDelete,
}: {
  comment: Comment;
  onEdit: (commentId: string, newText: string) => Promise<void>;
  onDelete: (commentId: string) => Promise<void>;
}) {
  // Estado para controlar el modo de edición
  const [isEditing, setIsEditing] = useState(false);
  // Estado para el texto edited
  const [editText, setEditText] = useState(comment.text);
  // Estado para indicar si hay una operación en progreso
  const [loading, setLoading] = useState(false);
  // Estado para controlar la visibilidad del modal de confirmación de eliminación
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  /**
   * Maneja el clic en el botón de editar.
   * Activa el modo de edición.
   */
  const handleEditClick = () => {
    setEditText(comment.text); // Reinicia el texto al original
    setIsEditing(true);
  };

  /**
   * Cancela el modo de edición sin guardar cambios.
   */
  const handleCancel = () => {
    setIsEditing(false);
    setEditText(comment.text);
  };

  /**
   * Guarda los cambios del comentario.
   * Llama a la función onEdit del componente padre.
   */
  const handleSave = async () => {
    if (!editText.trim() || editText.trim() === comment.text) {
      setIsEditing(false);
      return;
    }

    setLoading(true);
    try {
      await onEdit(comment.id, editText.trim());
      setIsEditing(false);
    } catch (error) {
      console.error("Error al editar:", error);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Muestra el modal de confirmación de eliminación.
   */
  const handleDeleteClick = () => {
    setShowDeleteModal(true);
  };

  /**
   * Confirma la eliminación del comentario.
   * Llama a la función onDelete del componente padre.
   */
  const handleDeleteConfirm = async () => {
    setShowDeleteModal(false);
    setLoading(true);
    try {
      await onDelete(comment.id);
    } catch (error) {
      console.error("Error al eliminar:", error);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Cancela la eliminación del comentario.
   */
  const handleDeleteCancel = () => {
    setShowDeleteModal(false);
  };

  return (
    <div
      style={{
        backgroundColor: "#09090b",
        border: "1px solid #27272a",
        borderRadius: "12px",
        padding: "16px",
      }}
    >
      {/* Encabezado del comentario: usuario, fecha y acciones */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: "12px",
        }}
      >
        <span
          style={{
            color: "#E0B046",
            fontSize: "13px",
            fontWeight: 700,
          }}
        >
          {comment.userName}
        </span>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <span
            style={{
              color: "#52525b",
              fontSize: "11px",
            }}
          >
            {formatDate(comment.createdAt || "")}
          </span>
          {/* Botones de editar/eliminar solo para el propietario */}
          {comment.isOwner && !isEditing && (
            <div style={{ display: "flex", gap: "8px" }}>
              {/* Botón de editar */}
              <button
                onClick={handleEditClick}
                disabled={loading}
                title="Editar comentario"
                style={{
                  background: "none",
                  border: "none",
                  color: "#71717a",
                  cursor: loading ? "not-allowed" : "pointer",
                  fontSize: "14px",
                  padding: "4px",
                  transition: "color 0.2s",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.color = "#E0B046")}
                onMouseLeave={(e) => (e.currentTarget.style.color = "#71717a")}
              >
                ✏️
              </button>
              {/* Botón de eliminar */}
              <button
                onClick={handleDeleteClick}
                disabled={loading}
                title="Eliminar comentario"
                style={{
                  background: "none",
                  border: "none",
                  color: "#71717a",
                  cursor: loading ? "not-allowed" : "pointer",
                  fontSize: "14px",
                  padding: "4px",
                  transition: "color 0.2s",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.color = "#f43f5e")}
                onMouseLeave={(e) => (e.currentTarget.style.color = "#71717a")}
              >
                🗑️
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Contenido del comentario: texto normal o modo edición */}
      {isEditing ? (
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          <textarea
            value={editText}
            onChange={(e) => setEditText(e.target.value)}
            disabled={loading}
            style={{
              width: "100%",
              minHeight: "80px",
              padding: "12px",
              backgroundColor: "#18181b",
              border: "1px solid #3f3f46",
              borderRadius: "8px",
              color: "white",
              fontSize: "14px",
              fontFamily: "inherit",
              resize: "vertical",
              outline: "none",
            }}
          />
          <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end" }}>
            <button
              onClick={handleCancel}
              disabled={loading}
              style={{
                padding: "8px 16px",
                borderRadius: "8px",
                backgroundColor: "transparent",
                border: "1px solid #3f3f46",
                color: "#a1a1aa",
                fontSize: "12px",
                fontWeight: 600,
                cursor: loading ? "not-allowed" : "pointer",
              }}
            >
              Cancelar
            </button>
            <button
              onClick={handleSave}
              disabled={loading || !editText.trim()}
              style={{
                padding: "8px 16px",
                borderRadius: "8px",
                backgroundColor: loading ? "#52525b" : "#E0B046",
                border: "none",
                color: loading ? "#a1a1aa" : "#09090b",
                fontSize: "12px",
                fontWeight: 700,
                cursor: loading ? "not-allowed" : "pointer",
              }}
            >
              {loading ? "Guardando..." : "Guardar"}
            </button>
          </div>
        </div>
      ) : (
        <p
          style={{
            color: "#e4e4e7",
            fontSize: "14px",
            margin: 0,
            lineHeight: 1.5,
          }}
        >
          {comment.text}
        </p>
      )}

      {/* Modal de confirmación de eliminación */}
      <DeleteConfirmModal
        isOpen={showDeleteModal}
        onConfirm={handleDeleteConfirm}
        onCancel={handleDeleteCancel}
        userName={comment.userName}
      />
    </div>
  );
}

/**
 * Componente principal que renderiza la lista de comentarios.
 * Muestra un mensaje cuando no hay comentarios.
 */
export default function CommentList({ comments, onEdit, onDelete }: CommentListProps) {
  if (comments.length === 0) {
    return (
      <div
        style={{
          textAlign: "center",
          padding: "40px 20px",
          color: "#52525b",
        }}
      >
        <span style={{ fontSize: "32px", display: "block", marginBottom: "12px" }}>💬</span>
        <p style={{ margin: 0, fontSize: "14px" }}>Aún no hay comentarios. Sé el primero en opinar.</p>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      {comments.map((comment) => (
        <CommentItem
          key={comment.id}
          comment={comment}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
}