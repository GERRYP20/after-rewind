"use client";

import React, { useState, useRef, useEffect } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/use-auth";
import { auth } from "@/lib/firebase-client";
import { updateProfile } from "firebase/auth";
import PublicHeder from "@/components/layout/PublicHeder";
import AnimatedBackground from "@/components/ui/AnimatedBackground";

// ── Íconos ──────────────────────────────────────────────────────────────────
const IconUser = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="8" r="4" /><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
  </svg>
);
const IconCalendar = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" />
  </svg>
);
const IconBell = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M6 10a6 6 0 0 1 12 0c0 5 2 7 2 7H4s2-2 2-7" /><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
  </svg>
);
const IconLock = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <rect x="5" y="11" width="14" height="10" rx="2" /><path d="M8 11V7a4 4 0 0 1 8 0v4" />
  </svg>
);
const IconInfo = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="9" /><path d="M12 8v4m0 4h.01" />
  </svg>
);
const IconCamera = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14.5 4h-5l-2 3H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3.5z" />
    <circle cx="12" cy="13" r="3" />
  </svg>
);

// ── Componente: campo de info ────────────────────────────────────────────────
function Field({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
      <span style={{ fontSize: "10px", textTransform: "uppercase", letterSpacing: "0.16em", color: "rgba(255,255,255,0.3)", fontWeight: 500 }}>
        {label}
      </span>
      <div style={{
        padding: "10px 14px",
        borderRadius: "8px",
        background: "rgba(255,255,255,0.03)",
        border: "1px solid rgba(255,255,255,0.07)",
        fontSize: mono ? "11px" : "13px",
        color: mono ? "rgba(196,155,74,0.75)" : "rgba(255,255,255,0.75)",
        fontFamily: mono ? "monospace" : "inherit",
        letterSpacing: mono ? "0.03em" : "normal",
        overflow: "hidden",
        textOverflow: "ellipsis",
        whiteSpace: "nowrap",
      }}>
        {value}
      </div>
    </div>
  );
}

// ── Componente: item de navegación ───────────────────────────────────────────
function NavItem({ icon, label, active = false, onClick }: { icon: React.ReactNode; label: string; active?: boolean; onClick?: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{
        width: "100%",
        display: "flex",
        alignItems: "center",
        gap: "10px",
        padding: "9px 12px",
        borderRadius: "8px",
        fontSize: "13px",
        border: "none",
        cursor: "pointer",
        textAlign: "left",
        background: active ? "rgba(196,155,74,0.1)" : "transparent",
        color: active ? "#c49b4a" : "rgba(255,255,255,0.38)",
        transition: "all 0.15s",
      }}
      onMouseEnter={e => { if (!active) { (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.04)"; (e.currentTarget as HTMLButtonElement).style.color = "rgba(255,255,255,0.75)"; } }}
      onMouseLeave={e => { if (!active) { (e.currentTarget as HTMLButtonElement).style.background = "transparent"; (e.currentTarget as HTMLButtonElement).style.color = "rgba(255,255,255,0.38)"; } }}
    >
      <span style={{ width: "16px", flexShrink: 0 }}>{icon}</span>
      {label}
    </button>
  );
}

// ── Componente: stat card ────────────────────────────────────────────────────
function StatCard({ num, sub }: { num: string; sub: string }) {
  return (
    <div style={{
      flex: 1,
      padding: "16px",
      borderRadius: "10px",
      background: "rgba(255,255,255,0.025)",
      border: "1px solid rgba(255,255,255,0.07)",
      display: "flex",
      flexDirection: "column",
      gap: "4px",
    }}>
      <span style={{ fontSize: "26px", color: "#c49b4a", fontWeight: 300, lineHeight: 1 }}>{num}</span>
      <span style={{ fontSize: "11px", color: "rgba(255,255,255,0.3)" }}>{sub}</span>
    </div>
  );
}

// ── Página ───────────────────────────────────────────────────────────────────
export default function PerfilPage() {
  const { user, loading: authLoading } = useAuth();
  const [uploading, setUploading] = useState(false);
  const [localPhotoURL, setLocalPhotoURL] = useState<string | null>(null);
  const [stats, setStats] = useState({
    totalEvents: 0,
    upcomingEvents: 0,
    daysActive: 0
  });
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  useEffect(() => {
    if (user) {
      setLocalPhotoURL(user.photoURL);
      
      // Cargar estadísticas reales
      fetch("/api/user/stats")
        .then(res => res.json())
        .then(data => {
          if (!data.error) {
            setStats({
              totalEvents: data.totalEvents || 0,
              upcomingEvents: data.upcomingEvents || 0,
              daysActive: data.daysActive || 0
            });
          }
        })
        .catch(err => console.error("Error cargando stats:", err));
    }
  }, [user]);

  useEffect(() => {
    if (!authLoading && !user) router.push("/login");
  }, [user, authLoading, router]);

  if (authLoading) {
    return (
      <div className="min-h-screen bg-neutral-950 flex items-center justify-center text-white text-xs tracking-widest uppercase">
        Cargando...
      </div>
    );
  }

  if (!user) return null;

  const handlePhotoClick = () => fileInputRef.current?.click();

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      if (!res.ok) throw new Error("Error al subir");
      const { url: newPhotoURL } = await res.json();
      
      if (auth.currentUser) {
        const oldPhotoURL = auth.currentUser.photoURL;
        
        // 2. Actualizar perfil en Firebase Auth
        await updateProfile(auth.currentUser, { photoURL: newPhotoURL });
        setLocalPhotoURL(newPhotoURL);
        router.refresh();

        // 3. Eliminar foto antigua de Cloudinary (si existía y era de Cloudinary)
        if (oldPhotoURL && oldPhotoURL.includes("res.cloudinary.com")) {
          console.log("Eliminando foto de perfil antigua...");
          fetch("/api/upload", {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ url: oldPhotoURL }),
          }).catch(err => console.error("Error al borrar foto antigua:", err));
        }

        alert("¡Foto actualizada!");
      }
    } catch (err) {
      console.error(err);
      alert("No se pudo actualizar la foto.");
    } finally {
      setUploading(false);
    }
  };

  const memberSince = user.metadata.creationTime
    ? new Date(user.metadata.creationTime).toLocaleDateString("es-MX", { year: "numeric", month: "long", day: "numeric" })
    : "N/A";

  const displayName = user.displayName || user.email?.split("@")[0] || "Usuario";

  return (
    <div className="min-h-screen bg-neutral-950 text-white relative overflow-hidden">
      <PublicHeder />
      <AnimatedBackground />

      {/* Orb dorado */}
      <div
        aria-hidden
        style={{
          position: "absolute", top: 0, right: 0,
          width: 480, height: 480, borderRadius: "50%",
          background: "radial-gradient(circle, rgba(196,155,74,0.13) 0%, transparent 65%)",
          filter: "blur(80px)", pointerEvents: "none",
        }}
      />
      {/* Orb púrpura */}
      <div
        aria-hidden
        style={{
          position: "absolute", bottom: 0, left: 0,
          width: 380, height: 380, borderRadius: "50%",
          background: "radial-gradient(circle, rgba(100,80,200,0.09) 0%, transparent 65%)",
          filter: "blur(90px)", pointerEvents: "none",
        }}
      />

      <main style={{ position: "relative", zIndex: 10, paddingTop: 112, paddingBottom: 80, paddingLeft: 24, paddingRight: 24 }}>
        <div style={{ maxWidth: 960, margin: "0 auto" }}>

          {/* Cabecera */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 32, paddingBottom: 20, borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ width: 7, height: 7, borderRadius: "50%", background: "rgba(196,155,74,0.6)", display: "inline-block" }} />
              <span style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "0.2em", color: "rgba(196,155,74,0.6)", fontWeight: 500 }}>
                Mi perfil
              </span>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button
                onClick={() => router.push("/dashboard")}
                style={{ fontSize: 12, padding: "6px 16px", borderRadius: 20, border: "1px solid rgba(255,255,255,0.12)", background: "transparent", color: "rgba(255,255,255,0.45)", cursor: "pointer" }}
              >
                Ir a eventos
              </button>
              <button
                onClick={handlePhotoClick}
                disabled={uploading}
                style={{ fontSize: 12, padding: "6px 16px", borderRadius: 20, border: "1px solid rgba(196,155,74,0.4)", background: "rgba(196,155,74,0.12)", color: "#c49b4a", cursor: "pointer", opacity: uploading ? 0.5 : 1 }}
              >
                {uploading ? "Subiendo..." : "Actualizar foto"}
              </button>
            </div>
          </div>

          {/* Contenedor principal */}
          <div style={{
            display: "flex",
            borderRadius: 16,
            border: "1px solid rgba(255,255,255,0.08)",
            overflow: "hidden",
            background: "rgba(255,255,255,0.015)",
            minHeight: 480,
          }}>

            {/* ── PANEL IZQUIERDO ── */}
            <div style={{
              width: 220,
              flexShrink: 0,
              borderRight: "1px solid rgba(255,255,255,0.07)",
              padding: "32px 20px",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 24,
            }}>

              {/* Avatar */}
              <div
                onClick={handlePhotoClick}
                style={{ position: "relative", width: 96, height: 96, cursor: "pointer", flexShrink: 0 }}
              >
                {/* Anillo SVG */}
                <svg
                  style={{ position: "absolute", inset: 0, width: "100%", height: "100%", animation: "spin 14s linear infinite" }}
                  viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg"
                >
                  <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
                  <circle cx="50" cy="50" r="47" stroke="rgba(196,155,74,0.22)" strokeWidth="1" strokeDasharray="5 8" />
                  <circle cx="50" cy="3" r="3" fill="rgba(196,155,74,0.65)" />
                </svg>

                {/* Foto */}
                <div style={{
                  position: "absolute", top: 9, left: 9, right: 9, bottom: 9,
                  borderRadius: "50%",
                  background: "#18171f",
                  border: "1px solid rgba(196,155,74,0.12)",
                  overflow: "hidden",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  {localPhotoURL ? (
                    <Image src={localPhotoURL} alt="Foto" fill style={{ objectFit: "cover" }} unoptimized />
                  ) : (
                    <span style={{ fontSize: 32 }}>👤</span>
                  )}
                  {/* Overlay hover */}
                  <div className="group-avatar-overlay" style={{
                    position: "absolute", inset: 0, borderRadius: "50%",
                    background: "rgba(0,0,0,0.52)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    opacity: 0, transition: "opacity 0.2s",
                  }}
                    onMouseEnter={e => (e.currentTarget.style.opacity = "1")}
                    onMouseLeave={e => (e.currentTarget.style.opacity = "0")}
                  >
                    <IconCamera />
                  </div>
                </div>
              </div>

              {/* Nombre y email */}
              <div style={{ textAlign: "center" }}>
                <p style={{ fontSize: 15, fontWeight: 500, color: "rgba(255,255,255,0.9)", margin: 0, lineHeight: 1.3 }}>{displayName}</p>
                <p style={{ fontSize: 11, color: "rgba(196,155,74,0.65)", margin: "6px 0 0", wordBreak: "break-all" }}>{user.email}</p>
              </div>

              {/* Badges */}
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap", justifyContent: "center" }}>
                <span style={{ fontSize: 10, padding: "3px 10px", borderRadius: 20, background: "rgba(196,155,74,0.1)", border: "1px solid rgba(196,155,74,0.28)", color: "#c49b4a" }}>
                  ✦ Activo
                </span>
                <span style={{ fontSize: 10, padding: "3px 10px", borderRadius: 20, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.4)" }}>
                  Verificado
                </span>
              </div>

              {/* Nav */}
              <nav style={{ width: "100%", display: "flex", flexDirection: "column", gap: 2 }}>
                <NavItem icon={<IconUser />} label="Información" active />
                <NavItem icon={<IconCalendar />} label="Mis eventos" onClick={() => router.push("/dashboard")} />
                <NavItem icon={<IconBell />} label="Notificaciones" />
                <NavItem icon={<IconLock />} label="Seguridad" />
              </nav>
            </div>

            {/* ── PANEL DERECHO ── */}
            <div style={{ flex: 1, padding: "32px 36px", display: "flex", flexDirection: "column", gap: 32, minWidth: 0 }}>

              {/* Sección: Cuenta */}
              <div>
                <p style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: "0.2em", color: "rgba(196,155,74,0.45)", fontWeight: 500, margin: "0 0 16px" }}>
                  Información de la cuenta
                </p>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  <Field label="Nombre de usuario" value={user.displayName || "No configurado"} />
                  <Field label="Miembro desde" value={memberSince} />
                  <div style={{ gridColumn: "1 / -1" }}>
                    <Field label="Correo electrónico" value={user.email ?? ""} />
                  </div>
                  <div style={{ gridColumn: "1 / -1" }}>
                    <Field label="ID de usuario" value={user.uid} mono />
                  </div>
                </div>
              </div>

              {/* Sección: Actividad */}
              <div>
                <p style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: "0.2em", color: "rgba(196,155,74,0.45)", fontWeight: 500, margin: "0 0 16px" }}>
                  Actividad
                </p>
                <div style={{ 
                  display: "grid", 
                  gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))", 
                  gap: "12px" 
                }}>
                  <StatCard num={String(stats.totalEvents)} sub="Eventos totales" />
                  <StatCard num={String(stats.upcomingEvents)} sub="Próximos" />
                  <StatCard num={String(stats.daysActive)} sub="Días activo" />
                </div>
              </div>

              {/* Nota */}
              <div style={{
                marginTop: "auto",
                display: "flex", gap: 12, alignItems: "flex-start",
                padding: "14px 16px",
                borderRadius: 10,
                background: "rgba(196,155,74,0.07)",
                border: "1px solid rgba(196,155,74,0.15)",
              }}>
                <span style={{ color: "rgba(196,155,74,0.6)", flexShrink: 0, marginTop: 1 }}>
                  <IconInfo />
                </span>
                <p style={{ fontSize: 12, color: "rgba(196,155,74,0.7)", lineHeight: 1.65, margin: 0 }}>
                  <span style={{ fontWeight: 500, color: "rgba(196,155,74,0.9)" }}>Nota:</span>{" "}
                  Puedes cambiar tu foto de perfil haciendo clic en el avatar. Próximamente podrás editar más campos.
                </p>
              </div>

            </div>
          </div>
        </div>
      </main>

      <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileChange} disabled={uploading} />
    </div>
  );
}
