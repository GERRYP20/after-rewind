import React from "react";
import Link from "next/link";
import styles from "@/components/layout/PublicHeder.module.css";

export default function Home() {
  return (
    <main className={styles.mainWrapper}>
      {/* 1. SECCIÓN HERO */}
      <section className={styles.hero}>
        <div className={styles.heroContent}>
          <h1>
            Captura la <span className={styles.highlight}>Esencia</span><br />
            de cada instante
          </h1>
          <p className={styles.heroSub}>
            AFTER-REWIND es la plataforma premium para gestionar eventos
            exclusivos y crear memorias visuales inolvidables.
          </p>
          <div className={styles.heroButtons}>
            <Link href="#" className={styles.btnPrimary}>EMPEZAR AHORA</Link>
            <Link href="#" className={styles.btnSecondary}>VER DEMO</Link>
          </div>
        </div>
      </section>

      {/* 2. SECCIÓN DETALLES / STATS */}
      <section id="section2" className={styles.second}>
        <div className={styles.heroContent2}>
          <h1>Excelencia en <span className={styles.highlight}>Detalles</span></h1>
          <p className={styles.heroSub2}>
            Desde la planificación hasta la ejecución, AFTER-REWIND se encarga
            de cada detalle para que tu evento sea perfecto.
          </p>
        </div>
        <div className={styles.stats}>
          <div className={styles.stat}>
            <div className={styles.statNum}>10k</div>
            <div className={styles.statLabel}>Eventos Organizados con nosotros</div>
          </div>
          <div className={styles.stat}>
            <div className={styles.statNum}>500K+</div>
            <div className={styles.statLabel}>Fotos Compartidas</div>
          </div>
          <div className={styles.stat}>
            <div className={styles.statNum}>4.9/5</div>
            <div className={styles.statLabel}>Valoración de Usuarios</div>
          </div>
        </div>
      </section>

      {/* 3. SECCIÓN CÓMO FUNCIONA */}
      <section className={styles.steps}>
        <div className={styles.container}>
          <h2 className={styles.stepsTitle}>Cómo funciona</h2>
          <div className={styles.stepsGrid}>
            <div className={styles.effect}>
              <span>01</span>
              <h3>Crea tu evento</h3>
              <p>Configura tu evento en segundos.</p>
            </div>
            <div className={styles.effect}>
              <span>02</span>
              <h3>Invita amigos</h3>
              <p>Comparte el acceso con quien quieras.</p>
            </div>
            <div className={styles.effect}>
              <span>03</span>
              <h3>Guarda recuerdos</h3>
              <p>Todos pueden subir fotos.</p>
            </div>
          </div>
        </div>
      </section>

      {/* 4. SECCIÓN CTA FINAL */}
      <section className={styles.cta}>
        <div className={styles.ctaContainer}>
          <div className={styles.ctaText}>
            <h2>Todo gran recuerdo comienza con un momento</h2>
            <p>
              Crea eventos, invita a tus amigos y construyan juntos una
              colección de recuerdos que durarán para siempre.
            </p>
          </div>
          <Link href="/signup" className={styles.ctaButton}>Registrarse gratis</Link>
        </div>
      </section>
    </main>
  );
}