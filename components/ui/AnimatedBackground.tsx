"use client";

/**
 * AnimatedBackground - Fondo dinámico con orbes pulsantes
 * 
 * Este componente añade elementos visuales que hacen que la interfaz
 * se sienta "viva". Se utilizan 3 orbes con diferentes tamaños
 * y colores para crear un efecto de iluminación tridimensional:
 * - Orbe grande en la base (blur alto para efecto ambient)
 * - Orbe mediano en esquina opuesta (mayor opacidad)
 * - Orbe pequeño cerca del formulario (efecto de flash)
 * 
 * Los colores mantienen la paleta amber con variaciones sutiles
 * de warm-white e indigo para evitar monotonía.
 */
"use client";

import { motion } from "framer-motion";

/**
 * Orb - Componente individual de esfera de luz
 * 
 * Componente reutilizable para cada orbe con diferentes
 * posiciones, tamaños y colores.
 */
function Orb({
  size = "large",
  position = "bottom-right",
  color = "amber"
}: {
  size?: "large" | "medium" | "small";
  position?: string;
  color?: "amber" | "warmWhite" | "indigo";
}) {
  // Tamaños definidos para cada tipo de orbe
  const sizeClasses = {
    large: "w-[600px] h-[600px]",
    medium: "w-[400px] h-[400px]",
    small: "w-[200px] h-[200px]"
  };

  // Colores con variaciones sutiles
  const colorClasses = {
    amber: "bg-amber-400/15",
    warmWhite: "bg-white/10",
    indigo: "bg-indigo-900/30"
  };

  // Posiciones en el contenedor
  const positionClasses = {
    "bottom-right": "bottom-[-20%] right-[-10%]",
    "top-left": "top-[-10%] left-[-10%]",
    "center": "top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
  };

  /**
   * Variantes de animación para el movimiento oscilante
   * 
   * Movimiento suave de balanceo vertical (Y) combinado
   * con escalado sutil para que el orbe "respire" lentamente.
   */
  const orbVariants = {
    initial: { y: 0, scale: 1 },
    animate: {
      y: [0, -30, 0],
      scale: [1, 1.05, 1],
      transition: {
        duration: size === "large" ? 8 : size === "medium" ? 6 : 4,
        repeat: Infinity,
        ease: "easeInOut" as const
      }
    }
  };

  return (
    <motion.div
      variants={orbVariants}
      initial="initial"
      animate="animate"
      className={`
        absolute rounded-full blur-[100px] pointer-events-none
        ${sizeClasses[size]}
        ${colorClasses[color]}
        ${positionClasses[position as keyof typeof positionClasses] || positionClasses["bottom-right"]}
      `}
    />
  );
}

/**
 * Componente principal - AnimatedBackground
 * 
 * Combina los 3 orbes en un contenedor posicionado absolutamente
 * detrás del contenido del formulario.
 */
export default function AnimatedBackground() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {/* Orbe grande en la base - efecto ambient */}
      <Orb size="large" position="bottom-right" color="amber" />
      
      {/* Orbe mediano arriba a la izquierda - contraste */}
      <Orb size="medium" position="top-left" color="warmWhite" />
      
      {/* Orbe pequeño en el centro - flash cerca del formulario */}
      <Orb size="small" position="center" color="indigo" />
    </div>
  );
}