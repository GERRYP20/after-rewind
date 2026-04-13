"use client"; // CRITICAL: Esto permite usar hooks de navegación en el cliente

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation"; // Importamos el hook para detectar la ruta
import styles from "./PublicHeder.module.css";

function PublicHeder() {
  const pathname = usePathname(); // Obtenemos la ruta actual (ej: "/login")

  // Definimos las rutas donde NO queremos que aparezca el botón de iniciar sesión
  const isAuthPage = pathname === "/login" || pathname === "/signup";

  return (
    <header className={styles.siteHeader}>
      <nav className={styles.nav}>
        {/* Cambié el href="#" por "/" para que el logo siempre lleve al inicio */}
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

        <ul className={styles.navLinks}>
          <li><Link href="/dashboard">Inicio</Link></li>
          <li><Link href="#">Crear Evento</Link></li>
          <li><Link href="#">Mis Eventos</Link></li>
          <li><Link href="#">Invitaciones</Link></li>
        </ul>
        
        {/* Lógica condicional: Si NO es una página de autenticación, muestra el botón */}
        {!isAuthPage && (
          <Link href="/login" className={styles.navCta}>
            INICIAR SESIÓN
          </Link>
        )}
      </nav>
    </header>
  );
}

export default PublicHeder;