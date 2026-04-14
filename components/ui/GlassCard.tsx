"use client";

/**
 * GlassCard - Componente de tarjeta con efecto Glassmorphism
 * 
 * Este componente encapsula el efecto cristal translúcido con animaciones
 * de entrada suaves. Proporciona un efecto visual sofisticado de
 * profundidad y elegancia.
 */
"use client";

import { motion, HTMLMotionProps } from "framer-motion";

interface GlassCardProps extends HTMLMotionProps<"div"> {
  children: React.ReactNode;
}

/**
 * Variantes de animación de entrada
 * 
 * Se definieron estas variantes para que la tarjeta aparezca
 * con un efecto de scroll vertical sutil combinado con un fundido
 * de opacidad. Da una sensación de "flotación" elegante.
 */
const cardVariants = {
  hidden: { 
    y: 30, 
    opacity: 0 
  },
  visible: { 
    y: 0, 
    opacity: 1,
    transition: {
      type: "spring" as const,
      stiffness: 100,
      damping: 20,
      delayChildren: 0.2,
      staggerChildren: 0.1
    }
  }
};

export default function GlassCard({ children, className = "", ...props }: GlassCardProps) {
  return (
    <motion.div
      variants={cardVariants}
      initial="hidden"
      animate="visible"
      className={`
        relative
        bg-white/5
        backdrop-blur-xl
        border border-white/10
        rounded-2xl
        shadow-2xl
        shadow-black/50
        overflow-hidden
        ${className}
      `}
      {...props}
    >
      {/* Capa de brillo sutil en el borde superior para efecto de luz */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-50" />
      
      {/* Segunda capa para mayor profundidad */}
      <div className="relative z-10">
        {children}
      </div>
    </motion.div>
  );
}