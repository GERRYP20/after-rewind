"use client"; // CRITICAL: Esto permite usar hooks de navegación en el cliente

import React, {useEffect, useState} from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation"; // Importamos el hook para detectar la ruta
import { auth } from "@/lib/firebase-client";
import { onAuthStateChanged, User } from "firebase/auth";
import styles from "./PublicHeder.module.css";

function PublicHeder() {
  const pathname = usePathname(); // Obtenemos la ruta actual (ej: "/login")
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    //El observadpr detecta si hay n usuario logueado
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

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
        
        {/* Lógica condicional: Oculta el boton si la pagina de login/signup o si el usuario ya inicio sesion (user != null) */}
        {!isAuthPage && !user &&(
          <Link href="/login" className={styles.navCta}>
            INICIAR SESIÓN
          </Link>
        )}

        {/*Mostrar boton de Salir si hay un usuario */}
        {user && (
          <button onClick={() => auth.signOut()} className={styles.navCta}>
            CERRAR SESIÓN 
          </button>
        )}
      </nav>
    </header>
  );
}

export default PublicHeder;
