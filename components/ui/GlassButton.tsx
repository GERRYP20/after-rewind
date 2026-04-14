"use client";

/**
 * GlassButton - Botón con efectos de escala y respuesta orgánica
 * 
 * Este componente proporciona reacciones orgánicas cuando el usuario
 * interactúa con el botón principal:
 * - Escala ligeramente al hover (1.02)
 * - Escala hacia abajo al press/tap (0.98)
 * Da la sensación de un elemento "vivo" y responsivo.
 */
"use client";

import { motion, HTMLMotionProps } from "framer-motion";

interface GlassButtonProps extends HTMLMotionProps<"button"> {
  children: React.ReactNode;
  variant?: "primary" | "secondary" | "outline";
}

/**
 * Variantes de estilo para diferentes usos del botón
 * 
 * Se definieron estas variantes para mantener consistencia
 * con el diseño existente mientras se añaden los efectos.
 */
const variantStyles = {
  primary: `
    bg-amber-400
    text-neutral-900
    font-bold
    hover:bg-amber-400
    hover:brightness-110
  `,
  secondary: `
    bg-white/10
    text-white
    border border-white/20
    hover:bg-amber-400/30
    hover:border-amber-400/50
  `,
  outline: `
    bg-transparent
    text-white
    border border-white/20
    hover:bg-white/10
  `
};

export default function GlassButton({ 
  children, 
  variant = "primary",
  className = "", 
  ...props 
}: GlassButtonProps) {
  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      transition={{ 
        type: "spring", 
        stiffness: 400, 
        damping: 17 
      }}
      className={`
        w-full
        px-6 py-3
        rounded-lg
        text-base
        transition-colors
        duration-200
        disabled:opacity-60
        disabled:cursor-not-allowed
        ${variantStyles[variant]}
        ${className}
      `}
      {...props}
    >
      {children}
    </motion.button>
  );
}