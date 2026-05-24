"use client";
import { useEffect, useState, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { useAuth } from "@/lib/use-auth";
import { Invitation } from "@/lib/invitations/invitation.types";
import { Comment } from "@/lib/comments/comment.types";
import { EventGuest } from "@/lib/guests/event-guest.types";
import CommentForm from "@/components/comments/CommentForm";
import CommentList from "@/components/comments/CommentList";
import EventEditForm from "@/components/invitations/EventEditForm";
import PhotoUpload from "@/components/photos/PhotoUpload";
import PhotoGallery from "@/components/photos/PhotoGallery";
import { EventPhoto } from "@/lib/photos/event-photo.types";

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

// ─── Interfaz para las acciones rápidas ───────────────────
interface QuickAction {
  icon: string;
  label: string;
  desc: string;
  color: string;
  action?: () => void;
}

// ─── Componente de Modal de Información Genérico ────────────────────────────
interface InfoModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  message: string;
  icon?: string;
  confirmText?: string;
  onConfirm?: () => void;
  showCancel?: boolean;
}

function InfoModal({ isOpen, onClose, title, message, icon = "✨", confirmText = "Entendido", onConfirm, showCancel = false }: InfoModalProps) {
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
        backdropFilter: "blur(4px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 2000,
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: "#18181b",
          border: "1px solid #3f3f46",
          borderRadius: "20px",
          padding: "32px",
          maxWidth: "400px",
          width: "90%",
          textAlign: "center",
          boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ fontSize: "48px", marginBottom: "16px" }}>{icon}</div>
        <h3 style={{ color: "white", fontSize: "20px", fontWeight: 800, marginBottom: "12px", textTransform: "uppercase", letterSpacing: "0.05em" }}>{title}</h3>
        <p style={{ color: "#a1a1aa", fontSize: "14px", lineHeight: 1.6, marginBottom: "24px" }}>{message}</p>
        <div style={{ display: "flex", gap: "12px", justifyContent: "center" }}>
          {showCancel && (
            <button
              onClick={onClose}
              style={{
                padding: "12px 24px",
                borderRadius: "10px",
                backgroundColor: "transparent",
                border: "1px solid #3f3f46",
                color: "#a1a1aa",
                fontSize: "13px",
                fontWeight: 700,
                cursor: "pointer"
              }}
            >
              Cancelar
            </button>
          )}
          <button
            onClick={() => {
              if (onConfirm) onConfirm();
              onClose();
            }}
            style={{
              padding: "12px 24px",
              borderRadius: "10px",
              backgroundColor: "#E0B046",
              border: "none",
              color: "black",
              fontSize: "13px",
              fontWeight: 800,
              cursor: "pointer",
              textTransform: "uppercase"
            }}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function DetalleEvento() {
  const params = useParams();
  const id = params?.id as string;
  const router = useRouter();
  const { user } = useAuth();
  
  const [evento, setEvento] = useState<Invitation | null>(null);
  const [loading, setLoading] = useState(true);
  const [copiado, setCopiado] = useState(false);
  const [comentarios, setComentarios] = useState<Comment[]>([]);
  const [fotos, setFotos] = useState<EventPhoto[]>([]);
  
  // Estado para el modal de información genérico
  const [infoModal, setInfoModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    icon?: string;
    onConfirm?: () => void;
    showCancel?: boolean;
    confirmText?: string;
  }>({
    isOpen: false,
    title: "",
    message: "",
  });

  // Estados para edición y eliminación del evento
  const [isEditing, setIsEditing] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingEvent, setDeletingEvent] = useState(false);

  // Estados para gestión de invitados
  const [guestsData, setGuestsData] = useState<{
    confirmed: EventGuest[];
    pending: EventGuest[];
    isOwner: boolean;
    guestCount: number;
  } | null>(null);
  const [processingGuest, setProcessingGuest] = useState<string | null>(null);
  const [isJoining, setIsJoining] = useState(false);

  // Verificar si el usuario actual es el creador del evento
  const isOwner = user && evento?.createdBy === user.uid;

  // Determinar el estado del usuario actual en este evento
  const currentUserGuestStatus = useMemo(() => {
    if (isOwner) return "owner";
    if (!guestsData || !user) return null;
    
    if (guestsData.confirmed.some(g => g.userId === user.uid)) return "confirmed";
    if (guestsData.pending.some(g => g.userId === user.uid)) return "pending";
    
    return "none";
  }, [guestsData, user, isOwner]);

  // Función para cargar las fotos del álbum
  const cargarFotos = async () => {
    try {
      const res = await fetch(`/api/invitations/${id}/photos`);
      const data = await res.json();
      if (!data.error) setFotos(data);
    } catch (error) {
      console.error("Error al cargar fotos:", error);
    }
  };

  // Carga los datos del evento desde la API
  useEffect(() => {
    fetch(`/api/invitations/${id}`)
      .then((res) => res.json())
      .then((data) => {
        if (!data.error) setEvento(data);
        setLoading(false);
      });
  }, [id]);

  // Carga los comentarios e invitados del evento
  useEffect(() => {
    // Solo cargar si el usuario es dueño o está confirmado
    if (currentUserGuestStatus !== "owner" && currentUserGuestStatus !== "confirmed") return;

    fetch(`/api/invitations/${id}/comments`)
      .then((res) => res.json())
      .then((data) => {
        if (!data.error) setComentarios(data);
      });

    cargarFotos();
  }, [id, currentUserGuestStatus]);

  // Carga los invitados del evento
  useEffect(() => {
    if (!evento) return;
    fetch(`/api/invitations/${id}/guests`)
      .then((res) => res.json())
      .then((data) => {
        if (!data.error) setGuestsData(data);
      });
  }, [id, evento]);

  // Función para unirse al evento
  const handleJoinEvent = async () => {
    if (!evento || isJoining) return;
    
    setIsJoining(true);
    try {
      const res = await fetch(`/api/invitations/access/${evento.accessCode}`, {
        method: "POST"
      });
      const data = await res.json();
      
      if (res.ok) {
        // Recargar datos de invitados para actualizar el estado UI
        const guestsRes = await fetch(`/api/invitations/${id}/guests`);
        const guestsData = await guestsRes.json();
        if (!guestsData.error) setGuestsData(guestsData);
        
        if (data.status === "pending") {
          setInfoModal({
            isOpen: true,
            title: "Solicitud Enviada",
            message: "Tu solicitud ha sido enviada al anfitrión. Te notificaremos cuando seas aprobado.",
            icon: "📨"
          });
        } else {
          setInfoModal({
            isOpen: true,
            title: "¡Bienvenido!",
            message: `Te has unido exitosamente a ${evento.title}. Ya puedes ver todas las fotos y comentarios.`,
            icon: "🎉"
          });
        }
      } else {
        setInfoModal({
          isOpen: true,
          title: "Error",
          message: data.error || "Hubo un problema al intentar unirte al evento.",
          icon: "❌"
        });
      }
    } catch (error) {
      console.error("Error joining event:", error);
      setInfoModal({
        isOpen: true,
        title: "Error",
        message: "No se pudo establecer conexión con el servidor.",
        icon: "🔌"
      });
    } finally {
      setIsJoining(false);
    }
  };

  // Función para salir del evento (voluntariamente)
  const handleLeaveEvent = async () => {
    setInfoModal({
      isOpen: true,
      title: "¿Salir del evento?",
      message: "¿Estás seguro de que quieres salir de este evento? Ya no podrás ver las fotos ni los comentarios compartidos.",
      icon: "🚪",
      showCancel: true,
      confirmText: "Salir ahora",
      onConfirm: async () => {
        setIsJoining(true); // Reusamos este estado para bloquear la UI
        try {
          const res = await fetch(`/api/invitations/${id}/guests`, {
            method: "DELETE"
          });
          
          if (res.ok) {
            // Recargar datos de invitados para actualizar el estado UI a "none"
            const guestsRes = await fetch(`/api/invitations/${id}/guests`);
            const guestsData = await guestsRes.json();
            if (!guestsData.error) setGuestsData(guestsData);
            setInfoModal({
              isOpen: true,
              title: "Has salido",
              message: "Ya no formas parte de este evento.",
              icon: "👋"
            });
          } else {
            const data = await res.json();
            setInfoModal({
              isOpen: true,
              title: "Error",
              message: data.error || "Hubo un problema al intentar salir del evento.",
              icon: "❌"
            });
          }
        } catch (error) {
          console.error("Error leaving event:", error);
          setInfoModal({
            isOpen: true,
            title: "Error",
            message: "Ocurrió un error inesperado.",
            icon: "⚠️"
          });
        } finally {
          setIsJoining(false);
        }
      }
    });
  };

  // Copia el código de acceso al portapapeles
  const copiarCodigo = () => {
    if (!evento) return;
    navigator.clipboard.writeText(evento.accessCode).then(() => {
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2000); // resetea tras 2 segundos
    });
  };

  // Agrega un nuevo comentario a la lista
  const handleCommentAdded = (comment: Comment) => {
    setComentarios((prev) => [comment, ...prev]);
  };

  // Actualiza un comentario existente en la lista (después de editar)
  const handleCommentEdit = async (commentId: string, newText: string) => {
    const res = await fetch(`/api/invitations/${id}/comments/${commentId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: newText }),
    });

    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error || "Error al editar comentario");
    }

    setComentarios((prev) =>
      prev.map((c) => (c.id === commentId ? { ...c, text: newText } : c))
    );
  };

  // Elimina un comentario de la lista
  const handleCommentDelete = async (commentId: string) => {
    const res = await fetch(`/api/invitations/${id}/comments/${commentId}`, {
      method: "DELETE",
    });

    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error || "Error al eliminar comentario");
    }

    setComentarios((prev) => prev.filter((c) => c.id !== commentId));
  };

  // Activa el modo de edición del evento
  const handleEditClick = () => {
    if (!isOwner) return;
    setIsEditing(true);
  };

  // Cancela la edición del evento
  const handleCancelEdit = () => {
    setIsEditing(false);
  };

  // Guarda los cambios del evento (llamado desde el formulario de edición)
  const handleSaveEdit = async (data: Partial<Invitation>) => {
    const res = await fetch(`/api/invitations/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (!res.ok) {
      const errorData = await res.json();
      throw new Error(errorData.error || "Error al guardar los cambios");
    }

    // Actualizar el evento en el estado local
    setEvento((prev) => prev ? { ...prev, ...data } : null);
    setIsEditing(false);
  };

  // Muestra el modal de confirmación de eliminación
  const handleDeleteClick = () => {
    if (!isOwner) return;
    setShowDeleteModal(true);
  };

  // Confirma la eliminación del evento
  const handleDeleteConfirm = async () => {
    setDeletingEvent(true);
    try {
      const res = await fetch(`/api/invitations/${id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Error al eliminar el evento");
      }

      // Redirigir al dashboard después de eliminar
      router.push("/dashboard");
      router.refresh();
    } catch (error) {
      console.error("Error al eliminar evento:", error);
      alert("Error al eliminar el evento");
    } finally {
      setDeletingEvent(false);
      setShowDeleteModal(false);
    }
  };

  // Cancela la eliminación del evento
  const handleDeleteCancel = () => {
    setShowDeleteModal(false);
  };

  // Aprueba a un invitado pendiente
  const handleApproveGuest = async (guestDocId?: string) => {
    if (!guestDocId) return;
    setProcessingGuest(guestDocId);
    try {
      const res = await fetch(`/api/invitations/${id}/guests`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ guestDocId, action: "approve" }),
      });

      if (res.ok) {
        // Recargar los datos de invitados
        const data = await fetch(`/api/invitations/${id}/guests`).then(r => r.json());
        if (!data.error) setGuestsData(data);
      } else {
        alert("Error al aprobar el invitado");
      }
    } catch (error) {
      console.error("Error approving guest:", error);
      alert("Error al aprobar el invitado");
    } finally {
      setProcessingGuest(null);
    }
  };

  // Rechaza a un invitado pendiente
  const handleRejectGuest = async (guestDocId?: string) => {
    if (!guestDocId) return;
    
    setInfoModal({
      isOpen: true,
      title: "¿Rechazar invitado?",
      message: "¿Estás seguro de que quieres rechazar esta solicitud de acceso?",
      icon: "👤",
      showCancel: true,
      confirmText: "Rechazar",
      onConfirm: async () => {
        setProcessingGuest(guestDocId);
        try {
          const res = await fetch(`/api/invitations/${id}/guests`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ guestDocId, action: "reject" }),
          });

          if (res.ok) {
            // Recargar los datos de invitados
            const data = await fetch(`/api/invitations/${id}/guests`).then(r => r.json());
            if (!data.error) setGuestsData(data);
          } else {
            alert("Error al rechazar el invitado");
          }
        } catch (error) {
          console.error("Error rejecting guest:", error);
          alert("Error al rechazar el invitado");
        } finally {
          setProcessingGuest(null);
        }
      }
    });
  };

  // Elimina a un invitado ya confirmado (expulsar)
  const handleRemoveGuest = async (guestDocId?: string) => {
    if (!guestDocId) return;
    
    setInfoModal({
      isOpen: true,
      title: "¿Eliminar invitado?",
      message: "¿Estás seguro de que quieres eliminar a este invitado del evento? Perderá el acceso inmediatamente.",
      icon: "🚪",
      showCancel: true,
      confirmText: "Eliminar",
      onConfirm: async () => {
        setProcessingGuest(guestDocId);
        try {
          const res = await fetch(`/api/invitations/${id}/guests`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ guestDocId, action: "remove" }),
          });

          if (res.ok) {
            // Recargar los datos de invitados
            const data = await fetch(`/api/invitations/${id}/guests`).then(r => r.json());
            if (!data.error) setGuestsData(data);
          } else {
            alert("Error al eliminar al invitado");
          }
        } catch (error) {
          console.error("Error removing guest:", error);
          alert("Error al eliminar al invitado");
        } finally {
          setProcessingGuest(null);
        }
      }
    });
  };

  // Calcula los días que faltan para el evento con UseMemo
  const diasRestantes = useMemo(() => {
    if (!evento) return null;
    const hoy = new Date();
    return Math.ceil(
      (new Date(evento.date).getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24),
    );
  }, [evento]);

  // Detecta la categoría del evento desde el campo guardado
  const categoryKey = evento?.category?.toLowerCase() ?? "default";
  const coverGradient = COVER_STYLES[categoryKey] ?? COVER_STYLES.default;

  // Estadísticas reales
  const statsReales = [
    { label: "Invitados", value: String(guestsData?.guestCount || evento?.guestCount || 0), icon: "👥" },
    { label: "Fotos", value: String(fotos.length), icon: "🖼" },
    { label: "Días para el evento", value: String(diasRestantes), icon: "📅" },
  ];

  // Pantalla de carga
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

  //  Evento no encontrado 
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

  // Mostrar formulario de edición si está en modo edición
  if (isEditing) {
    return (
      <div style={{ paddingTop: "100px", paddingBottom: "60px", paddingLeft: "20px", paddingRight: "20px" }}>
        <div style={{ maxWidth: "680px", margin: "0 auto" }}>
          <EventEditForm
            event={evento}
            onSave={handleSaveEdit}
            onCancel={handleCancelEdit}
          />
        </div>
      </div>
    );
  }

  return (
    <div
      style={{ minHeight: "100vh", paddingTop: "5rem", paddingBottom: "6rem" }}
    >
      {/* HERO: portada grande con imagen o gradiente de color*/}
      <div
        style={{
          width: "100%",
          minHeight: "340px",
          background: evento.imageUrl ? "none" : coverGradient,
          position: "relative",
          display: "flex",
          flexDirection: "column",
          justifyContent: "flex-end",
          padding: "40px clamp(24px, 6vw, 48px) 80px clamp(24px, 6vw, 48px)",
          overflow: "hidden",
        }}
      >
        {evento.imageUrl && (
          <div style={{ position: "absolute", inset: 0, zIndex: 0 }}>
            <Image 
              src={evento.imageUrl} 
              alt={evento.title} 
              fill 
              className="object-cover"
              priority
            />
          </div>
        )}

        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage: `radial-gradient(circle at 20% 50%, rgba(0,0,0,0.3) 0%, transparent 60%),
                            radial-gradient(circle at 80% 20%, rgba(255,255,255,0.05) 0%, transparent 50%)`,
            zIndex: 1,
          }}
        />

        <div
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            height: "100%",
            background: "linear-gradient(to top, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0.2) 50%, transparent 100%)",
            zIndex: 1,
          }}
        />

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

        <div style={{ position: "relative", zIndex: 2 }}>
          <h1
            style={{
              color: "white",
              fontSize: "clamp(2.5rem, 6vw, 5rem)",
              fontWeight: 900,
              letterSpacing: "-0.04em",
              lineHeight: 1,
              margin: "0 0 16px 0",
              textShadow: "0 2px 20px rgba(0,0,0,0.6)",
            }}
          >
            {evento.title}
          </h1>

          <div style={{ display: "flex", flexWrap: "wrap", gap: "20px", marginTop: "8px" }}>
            <span
              style={{
                color: "white",
                fontSize: "18px",
                fontWeight: 700,
                display: "flex",
                alignItems: "center",
                gap: "10px",
                backgroundColor: "rgba(255,255,255,0.1)",
                padding: "8px 16px",
                borderRadius: "10px",
                backdropFilter: "blur(4px)",
                border: "1px solid rgba(255,255,255,0.1)"
              }}
            >
              <span style={{ fontSize: "22px" }}>📅</span>{" "}
              {new Date(evento.date).toLocaleDateString("es-MX", {
                dateStyle: "full",
              })}
            </span>
          </div>
        </div>
      </div>

      {/* ── BARRA DE INFORMACIÓN DESTACADA (Ubicación y Anfitrión) ── */}
      {(currentUserGuestStatus === "owner" || currentUserGuestStatus === "confirmed") && (
        <div style={{ maxWidth: "960px", margin: "-40px auto 32px auto", padding: "0 24px", position: "relative", zIndex: 20 }}>
            <div style={{
              backgroundColor: "#18181b",
              border: "1px solid #E0B046",
              borderRadius: "16px",
              padding: "20px 32px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              boxShadow: "0 10px 40px rgba(0,0,0,0.5)",
              flexWrap: "wrap",
              gap: "24px"
            }}>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "32px", flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                      <span style={{ fontSize: "32px" }}>📍</span>
                      <div>
                          <p style={{ color: "#71717a", fontSize: "10px", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.1em", margin: 0 }}>Lugar del evento</p>
                          <p style={{ color: "white", fontSize: "18px", fontWeight: 900, margin: 0 }}>{evento.location}</p>
                      </div>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: "16px", borderLeft: "1px solid rgba(255,255,255,0.1)", paddingLeft: "32px" }}>
                      <div style={{ 
                          width: "40px", 
                          height: "40px", 
                          borderRadius: "50%", 
                          overflow: "hidden", 
                          backgroundColor: "#27272a",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          border: "2px solid rgba(224, 176, 70, 0.3)"
                      }}>
                          {evento.hostPhoto ? (
                              <img 
                                  src={evento.hostPhoto} 
                                  alt={evento.hostName} 
                                  style={{ width: "100%", height: "100%", objectFit: "cover" }} 
                              />
                          ) : (
                              <span style={{ fontSize: "20px" }}>👤</span>
                          )}
                      </div>
                      <div>
                          <p style={{ color: "#71717a", fontSize: "10px", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.1em", margin: 0 }}>Anfitrión</p>
                          <p style={{ color: "white", fontSize: "18px", fontWeight: 900, margin: 0 }}>{evento.hostName}</p>
                      </div>
                  </div>
              </div>

              {evento.locationUrl && (
                  <a 
                      href={evento.locationUrl} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      style={{
                          backgroundColor: "#E0B046",
                          color: "black",
                          padding: "12px 24px",
                          borderRadius: "10px",
                          fontSize: "12px",
                          fontWeight: 900,
                          textDecoration: "none",
                          textTransform: "uppercase",
                          letterSpacing: "0.05em",
                          transition: "transform 0.2s"
                      }}
                      onMouseEnter={e => e.currentTarget.style.transform = "scale(1.05)"}
                      onMouseLeave={e => e.currentTarget.style.transform = "scale(1)"}
                  >
                      Mapa ↗
                  </a>
              )}
            </div>
        </div>
      )}

      {/* ── CONTENIDO DINÁMICO SEGÚN ESTADO DE INVITADO ────────────────────── */}
      <div style={{ maxWidth: "960px", margin: "0 auto", padding: "0 24px" }}>
        
        {(currentUserGuestStatus === "none" || currentUserGuestStatus === "pending") ? (
          <div style={{
            marginTop: "16px",
            backgroundColor: "#18181b",
            border: "1px solid #3f3f46",
            borderRadius: "24px",
            padding: "48px 32px",
            textAlign: "center",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "24px"
          }}>
            <div style={{ fontSize: "64px" }}>
              {currentUserGuestStatus === "none" ? "👋" : "⏳"}
            </div>
            <div>
              <h2 style={{ color: "white", fontSize: "24px", fontWeight: 900, margin: "0 0 8px 0" }}>
                {currentUserGuestStatus === "none" 
                  ? "¡Te han invitado a este evento!" 
                  : "Solicitud enviada"}
              </h2>
              <p style={{ color: "#a1a1aa", fontSize: "15px", maxWidth: "400px", margin: "0 auto", lineHeight: 1.6 }}>
                {currentUserGuestStatus === "none"
                  ? `Para ver las fotos y participar en el álbum de ${evento.title}, necesitas unirte.`
                  : "Estamos esperando que el creador del evento apruebe tu solicitud de acceso."}
              </p>
            </div>

            {currentUserGuestStatus === "none" && (
              <button
                onClick={handleJoinEvent}
                disabled={isJoining}
                style={{
                  padding: "16px 40px",
                  borderRadius: "14px",
                  backgroundColor: "#E0B046",
                  color: "#000",
                  fontSize: "14px",
                  fontWeight: 900,
                  textTransform: "uppercase",
                  letterSpacing: "0.1em",
                  border: "none",
                  cursor: isJoining ? "not-allowed" : "pointer",
                  transition: "transform 0.2s",
                  boxShadow: "0 10px 30px rgba(224, 176, 70, 0.2)"
                }}
              >
                {isJoining ? "Uniéndote..." : "✨ Unirse al Evento"}
              </button>
            )}

            {currentUserGuestStatus === "pending" && (
              <div style={{ display: "flex", flexDirection: "column", gap: "12px", width: "100%", maxWidth: "300px" }}>
                <div style={{
                  padding: "12px 24px",
                  borderRadius: "10px",
                  backgroundColor: "rgba(224, 176, 70, 0.1)",
                  border: "1px solid rgba(224, 176, 70, 0.3)",
                  color: "#E0B046",
                  fontSize: "13px",
                  fontWeight: 700
                }}>
                  Estado: Pendiente de aprobación
                </div>
                <button
                  onClick={handleLeaveEvent}
                  disabled={isJoining}
                  style={{
                    backgroundColor: "transparent",
                    color: "#f43f5e",
                    border: "1px solid rgba(244, 63, 94, 0.3)",
                    padding: "10px",
                    borderRadius: "10px",
                    fontSize: "12px",
                    fontWeight: 700,
                    cursor: "pointer"
                  }}
                >
                  Cancelar solicitud
                </button>
              </div>
            )}
          </div>
        ) : (
          <>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
                gap: "16px",
                marginTop: "-28px",
                marginBottom: "32px",
                position: "relative",
                zIndex: 10,
              }}
            >
              {statsReales.map((stat, i) => (
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

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
                gap: "20px",
              }}
            >
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
                  ...(currentUserGuestStatus === "confirmed" ? [
                    {
                      icon: "🚪",
                      label: "Salir del evento",
                      desc: "Ya no tendrás acceso a este álbum",
                      color: "#f43f5e",
                      action: handleLeaveEvent,
                    }
                  ] : []),
                  ...(isOwner ? [                    {
                      icon: "✏️",
                      label: "Editar evento",
                      desc: "Modifica los detalles",
                      color: "#a78bfa",
                      action: handleEditClick,
                    },
                    {
                      icon: "🗑",
                      label: "Eliminar evento",
                      desc: "Esta acción no se puede deshacer",
                      color: "#f43f5e",
                      action: handleDeleteClick,
                    },
                  ] : []),
                ].map((accion: QuickAction, i: number) => (
                  <button
                    key={i}
                    type="button"
                    style={{
                      width: "100%",
                      padding: "14px 16px",
                      borderRadius: "12px",
                      backgroundColor: "#09090b",
                      border: "1px solid #27272a",
                      cursor: accion.action ? "pointer" : "default",
                      display: "flex",
                      alignItems: "center",
                      gap: "14px",
                      textAlign: "left",
                      transition: "border-color 0.2s, background-color 0.2s",
                    }}
                    onClick={accion.action}
                    onMouseEnter={(e) => {
                      if (accion.action) {
                        e.currentTarget.style.borderColor = accion.color;
                        e.currentTarget.style.backgroundColor = "#18181b";
                      }
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = "#27272a";
                      e.currentTarget.style.backgroundColor = "#09090b";
                    }}
                  >
                    <span
                      style={{
                        width: "36px",
                        height: "36px",
                        flexShrink: 0,
                        borderRadius: "99px",
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

            <div
              style={{
                backgroundColor: "#18181b",
                border: "1px solid #3f3f46",
                borderRadius: "20px",
                padding: "28px",
                marginTop: "20px",
              }}
            >
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
                    ✦ INVITADOS
                  </p>
                  <h2
                    style={{
                      color: "white",
                      fontSize: "18px",
                      fontWeight: 900,
                      margin: 0,
                    }}
                  >
                    {guestsData?.guestCount || evento?.guestCount || 0} Confirmados
                  </h2>
                </div>
                <span
                  style={{
                    padding: "6px 12px",
                    borderRadius: "8px",
                    fontSize: "11px",
                    fontWeight: 700,
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                    backgroundColor: evento?.visibility === "private" 
                      ? "rgba(167, 139, 250, 0.15)" 
                      : "rgba(16, 185, 129, 0.15)",
                    color: evento?.visibility === "private" 
                      ? "#a78bfa" 
                      : "#10b981",
                    border: `1px solid ${evento?.visibility === "private" 
                      ? "rgba(167, 139, 250, 0.3)" 
                      : "rgba(16, 185, 129, 0.3)"}`,
                  }}
                >
                  {evento?.visibility === "private" ? "🔒 Privado" : "🌐 Público"}
                </span>
              </div>

              {/* LISTA DE CONFIRMADOS: Visible para todos los unidos */}
              {guestsData?.confirmed && guestsData.confirmed.length > 0 && (
                <div style={{ marginBottom: isOwner && guestsData.pending.length > 0 ? "32px" : "0" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "16px" }}>
                    <span style={{ fontSize: "14px" }}>✅</span>
                    <p style={{ color: "#52525b", fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", margin: 0 }}>
                      Invitados Confirmados ({guestsData.confirmed.length})
                    </p>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                    {guestsData.confirmed.map((guest: EventGuest) => (
                      <div
                        key={guest.id}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "12px",
                          padding: "12px",
                          backgroundColor: "#09090b",
                          borderRadius: "12px",
                          border: "1px solid rgba(255,255,255,0.05)",
                        }}
                      >
                        <div
                          style={{
                            width: "32px",
                            height: "32px",
                            borderRadius: "50%",
                            backgroundColor: "#27272a",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: "14px",
                            overflow: "hidden",
                            border: "1px solid rgba(224, 176, 70, 0.2)"
                          }}
                        >
                          {guest.userPhoto ? (
                            <img 
                              src={guest.userPhoto} 
                              alt={guest.userName} 
                              style={{ width: "100%", height: "100%", objectFit: "cover" }} 
                            />
                          ) : (
                            "👤"
                          )}
                        </div>
                        <div style={{ flex: 1 }}>
                          <p style={{ color: "white", fontSize: "13px", fontWeight: 600, margin: 0 }}>
                            {guest.userName}
                          </p>
                        </div>
                        
                        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                          <span
                            style={{
                              padding: "4px 10px",
                              borderRadius: "6px",
                              fontSize: "10px",
                              fontWeight: 800,
                              textTransform: "uppercase",
                              backgroundColor: "rgba(16, 185, 129, 0.1)",
                              color: "#10b981",
                              border: "1px solid rgba(16, 185, 129, 0.2)"
                            }}
                          >
                            Confirmado
                          </span>

                          {/* Botón EXPULSAR: Solo para el dueño */}
                          {isOwner && (
                            <button
                              onClick={() => handleRemoveGuest(guest.id)}
                              disabled={processingGuest === guest.id}
                              style={{
                                padding: "4px 10px",
                                borderRadius: "6px",
                                backgroundColor: "rgba(244, 63, 94, 0.1)",
                                border: "1px solid rgba(244, 63, 94, 0.2)",
                                color: "#f43f5e",
                                fontSize: "10px",
                                fontWeight: 800,
                                cursor: "pointer",
                                textTransform: "uppercase",
                                transition: "all 0.2s"
                              }}
                              onMouseEnter={e => e.currentTarget.style.backgroundColor = "rgba(244, 63, 94, 0.2)"}
                              onMouseLeave={e => e.currentTarget.style.backgroundColor = "rgba(244, 63, 94, 0.1)"}
                            >
                              Expulsar
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* LISTA DE PENDIENTES: Visible SOLO para el DUEÑO */}
              {isOwner && guestsData?.pending && guestsData.pending.length > 0 && (
                <div style={{ marginTop: "12px", paddingTop: "24px", borderTop: "1px dashed rgba(255,255,255,0.1)" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "16px" }}>
                    <span style={{ fontSize: "14px" }}>⏳</span>
                    <p style={{ color: "#f59e0b", fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", margin: 0 }}>
                      Solicitudes de Acceso ({guestsData.pending.length})
                    </p>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                    {guestsData.pending.map((guest: EventGuest) => (
                      <div
                        key={guest.id}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "12px",
                          padding: "12px",
                          backgroundColor: "rgba(245, 158, 11, 0.03)",
                          borderRadius: "12px",
                          border: "1px solid rgba(245, 158, 11, 0.1)",
                        }}
                      >
                        <div
                          style={{
                            width: "32px",
                            height: "32px",
                            borderRadius: "50%",
                            backgroundColor: "#27272a",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: "14px",
                            overflow: "hidden",
                            border: "1px solid rgba(224, 176, 70, 0.2)"
                          }}
                        >
                          {guest.userPhoto ? (
                            <img 
                              src={guest.userPhoto} 
                              alt={guest.userName} 
                              style={{ width: "100%", height: "100%", objectFit: "cover" }} 
                            />
                          ) : (
                            "👤"
                          )}
                        </div>
                        <div style={{ flex: 1 }}>
                          <p style={{ color: "white", fontSize: "13px", fontWeight: 600, margin: 0 }}>
                            {guest.userName}
                          </p>
                          <p style={{ color: "rgba(245, 158, 11, 0.6)", fontSize: "11px", margin: "2px 0 0 0" }}>
                            Desea unirse al evento
                          </p>
                        </div>
                        <div style={{ display: "flex", gap: "8px" }}>
                          <button
                            onClick={() => handleApproveGuest(guest.id)}
                            disabled={processingGuest === guest.id}
                            style={{
                              padding: "8px 14px",
                              borderRadius: "8px",
                              backgroundColor: "#E0B046",
                              border: "none",
                              color: "black",
                              fontSize: "11px",
                              fontWeight: 800,
                              cursor: processingGuest === guest.id ? "not-allowed" : "pointer",
                              transition: "all 0.2s",
                              textTransform: "uppercase"
                            }}
                          >
                            {processingGuest === guest.id ? "..." : "Aprobar"}
                          </button>
                          <button
                            onClick={() => handleRejectGuest(guest.id)}
                            disabled={processingGuest === guest.id}
                            style={{
                              padding: "8px 14px",
                              borderRadius: "8px",
                              backgroundColor: "rgba(244, 63, 94, 0.1)",
                              border: "1px solid rgba(244, 63, 94, 0.3)",
                              color: "#f43f5e",
                              fontSize: "11px",
                              fontWeight: 700,
                              cursor: processingGuest === guest.id ? "not-allowed" : "pointer",
                              transition: "all 0.2s",
                              textTransform: "uppercase"
                            }}
                          >
                            Rechazar
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {(!guestsData?.confirmed || guestsData.confirmed.length === 0) && 
               (!isOwner || !guestsData?.pending || guestsData.pending.length === 0) && (
                <p style={{ color: "#52525b", fontSize: "13px", textAlign: "center", padding: "20px" }}>
                  Aún no hay invitados confirmados
                </p>
              )}
            </div>

            <div
              style={{
                backgroundColor: "#18181b",
                border: "1px solid #3f3f46",
                borderRadius: "20px",
                padding: "28px",
                marginTop: "20px",
              }}
            >
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
                <span
                  style={{
                    backgroundColor: "rgba(56, 189, 248, 0.15)",
                    color: "#38bdf8",
                    fontSize: "11px",
                    fontWeight: 800,
                    padding: "6px 12px",
                    borderRadius: "8px",
                  }}
                >
                  {fotos.length} {fotos.length === 1 ? "foto" : "fotos"}
                </span>
              </div>

              <PhotoUpload eventId={id as string} onUploadSuccess={cargarFotos} />

              <div style={{ marginTop: "24px" }}>
                <PhotoGallery 
                  photos={fotos} 
                  currentUserId={user?.uid}
                  isEventOwner={isOwner || false}
                  onDeleteSuccess={cargarFotos}
                />
              </div>
            </div>

            <div
              style={{
                backgroundColor: "#18181b",
                border: "1px solid #3f3f46",
                borderRadius: "20px",
                padding: "28px",
                marginTop: "20px",
              }}
            >
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
                    Comentarios
                  </p>
                  <p
                    style={{
                      color: "white",
                      fontWeight: 900,
                      fontSize: "16px",
                      margin: 0,
                    }}
                  >
                    Opiniones de los invitados
                  </p>
                </div>
                <span
                  style={{
                    backgroundColor: "rgba(224,176,70,0.15)",
                    color: "#E0B046",
                    fontSize: "11px",
                    fontWeight: 800,
                    padding: "6px 12px",
                    borderRadius: "8px",
                  }}
                >
                  {comentarios.length} {comentarios.length === 1 ? "comentario" : "comentarios"}
                </span>
              </div>

              <CommentForm eventId={id as string} onCommentAdded={handleCommentAdded} />

              <div style={{ marginTop: "24px" }}>
                <CommentList 
                  comments={comentarios} 
                  onEdit={handleCommentEdit}
                  onDelete={handleCommentDelete}
                />
              </div>
            </div>

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
          </>
        )}
      </div>

      {showDeleteModal && (
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
          onClick={handleDeleteCancel}
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
                ¿Eliminar evento?
              </h3>
              <p style={{ color: "#a1a1aa", fontSize: "14px", margin: 0 }}>
                ¿Estás seguro de que quieres eliminar el evento <strong style={{ color: "#E0B046" }}>{evento.title}</strong>? Esta acción no se puede deshacer.
              </p>
            </div>
            <div style={{ display: "flex", gap: "12px", justifyContent: "center" }}>
              <button
                onClick={handleDeleteCancel}
                disabled={deletingEvent}
                style={{
                  padding: "12px 24px",
                  borderRadius: "10px",
                  backgroundColor: "transparent",
                  border: "1px solid #3f3f46",
                  color: "#a1a1aa",
                  fontSize: "14px",
                  fontWeight: 600,
                  cursor: deletingEvent ? "not-allowed" : "pointer",
                  transition: "all 0.2s",
                }}
              >
                Cancelar
              </button>
              <button
                onClick={handleDeleteConfirm}
                disabled={deletingEvent}
                style={{
                  padding: "12px 24px",
                  borderRadius: "10px",
                  backgroundColor: deletingEvent ? "#52525b" : "#f43f5e",
                  border: "none",
                  color: "#ffffff",
                  fontSize: "14px",
                  fontWeight: 600,
                  cursor: deletingEvent ? "not-allowed" : "pointer",
                  transition: "all 0.2s",
                }}
              >
                {deletingEvent ? "Eliminando..." : "Eliminar"}
              </button>
            </div>
          </div>
        </div>
      )}

      <InfoModal 
        isOpen={infoModal.isOpen}
        onClose={() => setInfoModal(prev => ({ ...prev, isOpen: false }))}
        title={infoModal.title}
        message={infoModal.message}
        icon={infoModal.icon}
        onConfirm={infoModal.onConfirm}
        showCancel={infoModal.showCancel}
        confirmText={infoModal.confirmText}
      />
    </div>
  );
}
