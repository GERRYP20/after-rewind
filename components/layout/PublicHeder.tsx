"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation"; 
import { useAuth } from "@/lib/use-auth"; 
import { auth } from "@/lib/firebase-client"; 
import { signOut as firebaseSignOut } from "firebase/auth";
import styles from "./PublicHeder.module.css";

function PublicHeder() {
  const pathname = usePathname();
  const { user, loading } = useAuth();
  const router = useRouter();
  const [loggingOut, setLoggingOut] = useState(false);
  // Estado para controlar la visibilidad del menú desplegable del usuario
  const [showUserMenu, setShowUserMenu] = useState(false);

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
            <li><Link href="/dashboard">Mis Eventos</Link></li>
            <li><Link href="/dashboard/invitaciones/nueva">Crear Evento</Link></li>
            <li><Link href="#">Invitaciones</Link></li>
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
              {/* Avatar genérico del usuario (icono) */}
              <div className={styles.userAvatar}>
                👤
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
                {/* Botón para cerrar sesión */}
                <button 
                  onClick={handleLogout}
                  disabled={loggingOut}
                  className={styles.dropdownLogout}
                >
                  {loggingOut ? "Cerrando sesión..." : "Cerrar sesión"}
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