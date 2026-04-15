"use client"; // CRITICAL: Esto permite usar hooks de navegación en el cliente

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation"; // Importamos el hook para detectar la ruta
import { useAuth } from "@/lib/use-auth"; // Hook para detectar autenticación
import { auth } from "@/lib/firebase-client"; // Firebase auth
import { signOut as firebaseSignOut } from "firebase/auth";
import styles from "./PublicHeder.module.css";

function PublicHeder() {
  const pathname = usePathname(); // Obtenemos la ruta actual (ej: "/login")
  const { user, loading } = useAuth(); // Obtenemos el estado de autenticación
  const router = useRouter();
  const [loggingOut, setLoggingOut] = useState(false);

  // Función para cerrar sesión
  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await firebaseSignOut(auth);
      await fetch("/api/logout", { method: "POST" });
      router.refresh();
    } catch (error) {
      console.error("Error al cerrar sesión:", error);
    } finally {
      setLoggingOut(false);
    }
  };

  // Definimos las rutas donde NO queremos que aparezca el botón de iniciar sesión
  const isAuthPage = pathname === "/login" || pathname === "/signup";

  return (
    <header className={styles.siteHeader}>
      <nav className={styles.nav}>
        {/* Cambiamos el href="#" por "/" para que el logo siempre lleve al inicio */}
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
            <li><Link href="/dashboard">Inicio</Link></li>
            <li><Link href="#">Crear Evento</Link></li>
            <li><Link href="#">Mis Eventos</Link></li>
            <li><Link href="#">Invitaciones</Link></li>
          </ul>
        )}
        
        {/* Lógica condicional: Si NO es página de auth Y el usuario NO está logueado, muestra el botón */}
        {!isAuthPage && !loading && !user && (
          <Link href="/login" className={styles.navCta}>
            INICIAR SESIÓN
          </Link>
        )}

        {/* Si el usuario está logueado, muestra el botón de cerrar sesión */}
        {!isAuthPage && !loading && user && (
          <button 
            onClick={handleLogout}
            disabled={loggingOut}
            className={styles.navCta}
          >
            {loggingOut ? "CERRANDO..." : "CERRAR SESIÓN"}
          </button>
        )}
      </nav>
    </header>
  );
}

export default PublicHeder;