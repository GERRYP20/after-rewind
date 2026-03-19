import React from "react";
import Image from "next/image";
import Link from "next/link";
import styles from "./PublicHeder.module.css";

function PublicHeder() {
  return (
    <header className={styles.siteHeader}>
      <nav className={styles.nav}>
        <Link href="#" className={styles.brand}>
          <Image src="/logo.png" alt="Logo" width={40} height={40} className={styles.logo} />
          <span className={styles.tagline}>AFTER-REWIND</span>
        </Link>
        <ul className={styles.navLinks}>
          <li><Link href="/dashboard">Inicio</Link></li>
          <li><Link href="#">Crear Evento</Link></li>
          <li><Link href="#">Mis Eventos</Link></li>
          <li><Link href="#">Invitaciones</Link></li>
        </ul>
        <Link href="/login" className={styles.navCta}>INICIAR SESIÓN</Link>
      </nav>
    </header>
  );
}

export default PublicHeder;