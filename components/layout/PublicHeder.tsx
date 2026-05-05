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