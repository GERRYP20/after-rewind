"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation"; 
import { useAuth } from "@/lib/use-auth"; 
import { auth } from "@/lib/firebase-client"; 
import { signOut as firebaseSignOut } from "firebase/auth";
import styles from "./PublicHeder.module.css";
import { User, ShieldAlert } from "lucide-react";

function PublicHeder() {
  const pathname = usePathname();
  const { user, loading } = useAuth();
  const router = useRouter();
  const [loggingOut, setLoggingOut] = useState(false);
  const [deletingAccount, setDeletingAccount] = useState(false);
  // Estado para controlar la visibilidad del menú desplegable del usuario
  const [showUserMenu, setShowUserMenu] = useState(false);
  // Solo se muestra el enlace al panel de admin si el servidor confirma el rol
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    if (!user) {
      setIsAdmin(false);
      return;
    }
    fetch("/api/admin/check")
      .then((res) => (res.ok ? res.json() : { isAdmin: false }))
      .then((data) => setIsAdmin(Boolean(data.isAdmin)))
      .catch(() => setIsAdmin(false));
  }, [user]);

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      // 1. Cerrar sesión en Firebase
      await firebaseSignOut(auth);
      // 2. Limpiar cookies del servidor
      await fetch("/api/logout", { method: "POST" });
      
      // 3. ¡CORRECCIÓN!: Redirigir a la página de inicio
      router.push("/");
      router.refresh(); // Asegura que el estado del servidor se actualice
    } catch (error) {
      console.error("Error al cerrar sesión:", error);
    } finally {
      setLoggingOut(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!user) return;

    const confirmed = window.confirm(
      "¿Estás seguro de que deseas eliminar tu cuenta? Esta acción es irreversible y eliminará todos tus datos (eventos, fotos, comentarios e invitaciones)."
    );

    if (!confirmed) return;

    setDeletingAccount(true);
    try {
      // Llamar al endpoint de borrado en cascada
      const response = await fetch("/api/user/delete", { method: "DELETE" });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Error al eliminar la cuenta");
      }

      // Cerrar sesión en Firebase client-side por si acaso (aunque la cookie ya se borró)
      await firebaseSignOut(auth);

      // Redirigir a la página de inicio y refrescar
      router.push("/");
      router.refresh();
      alert("Tu cuenta y todos tus datos han sido eliminados exitosamente.");
    } catch (error: unknown) {
      console.error("Error al eliminar la cuenta:", error);
      const errorMessage = error instanceof Error ? error.message : "Hubo un error al intentar eliminar tu cuenta por completo. Por favor, inténtalo de nuevo más tarde.";
      alert(errorMessage);
    } finally {
      setDeletingAccount(false);
    }
  };

  const isAuthPage = pathname === "/login" || pathname === "/signup";

  return (
    <header className={styles.siteHeader}>
      <nav className={styles.nav}>
        <Link href="/" className={styles.brand}>
          <Image 
            src="/logo.png" 
            alt="Logo" 
            width={40} 
            height={40} 
            className={styles.logo} 
          />
          <span className={styles.tagline}>AFTER-REWIND</span>
        </Link>

        {user && (
          <ul className={styles.navLinks}>
            {/* Actualizamos los enlaces a las rutas reales que creamos */}
            <li>
              <Link 
                href="/dashboard" 
                className={pathname === "/dashboard" ? styles.activeLink : ""}
              >
                Mis Eventos
              </Link>
            </li>
            <li>
              <Link 
                href="/dashboard/invitaciones/nueva" 
                className={pathname === "/dashboard/invitaciones/nueva" ? styles.activeLink : ""}
              >
                Crear Evento
              </Link>
            </li>
            <li>
              <Link
                href="/dashboard/invitaciones/participando"
                className={pathname === "/dashboard/invitaciones/participando" ? styles.activeLink : ""}
              >
                Invitaciones
              </Link>
            </li>
            {isAdmin && (
              <li>
                <Link
                  href="/dashboard/admin"
                  className={pathname === "/dashboard/admin" ? styles.activeLink : ""}
                >
                  <ShieldAlert size={14} style={{ display: "inline", verticalAlign: "middle", marginRight: "4px" }} /> Admin
                </Link>
              </li>
            )}
          </ul>
        )}
        
        {!isAuthPage && !loading && !user && (
          <Link href="/login" className={styles.navCta}>
            INICIAR SESIÓN
          </Link>
        )}

        {/* Caja de usuario con menú desplegable cuando está autenticado */}
        {!isAuthPage && !loading && user && (
          <div className={styles.userBox}>
            {/* Contenedor clickeable para abrir/cerrar el menú */}
            <div 
              className={styles.userBoxContent}
              onClick={() => setShowUserMenu(!showUserMenu)}
            >
              {/* Avatar genérico del usuario (icono) o foto de perfil */}
              <div className={styles.userAvatar}>
                {user.photoURL ? (
                  <Image 
                    src={user.photoURL} 
                    alt="Perfil" 
                    width={24} 
                    height={24} 
                    className={styles.avatarImage} 
                  />
                ) : (
                  <User size={16} style={{ color: "#a1a1aa" }} />
                )}
              </div>
              {/* Nombre del usuario (displayName o parte del email) */}
              <span className={styles.userName}>
                {user.displayName || user.email?.split('@')[0] || "Usuario"}
              </span>
            </div>

            {/* Menú desplegable con opciones del usuario */}
            {showUserMenu && (
              <div className={styles.dropdown}>
                {/* Mostrar el email del usuario */}
                <div className={styles.dropdownHeader}>
                  <span className={styles.dropdownEmail}>{user.email}</span>
                </div>
                {/* Link a Mi Perfil */}
                <Link 
                  href="/dashboard/perfil" 
                  className={styles.dropdownItem}
                  onClick={() => setShowUserMenu(false)}
                >
                  <User size={14} style={{ display: "inline", verticalAlign: "middle", marginRight: "6px" }} /> Mi Perfil
                </Link>
                {/* Botón para cerrar sesión */}
                <button 
                  onClick={handleLogout}
                  disabled={loggingOut || deletingAccount}
                  className={styles.dropdownLogout}
                >
                  {loggingOut ? "Cerrando sesión..." : "Cerrar sesión"}
                </button>
                {/* Botón para eliminar cuenta */}
                <button 
                  onClick={handleDeleteAccount}
                  disabled={loggingOut || deletingAccount}
                  className={styles.dropdownDelete}
                >
                  {deletingAccount ? "Eliminando..." : "Eliminar cuenta"}
                </button>
              </div>
            )}
          </div>
        )}
      </nav>
    </header>
  );
}

export default PublicHeder;