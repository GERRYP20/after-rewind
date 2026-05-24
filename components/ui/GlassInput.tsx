"use client";

/**
 * GlassInput - Campo de texto con efecto de brillo en foco
 * 
 * Este componente proporciona micro-interacción visual cuando el usuario
 * interactúa con los campos de formulario. Cuando el campo está activo
 * (focus), el borde brilla en ámbar dando feedback visual inmediato.
 */
"use client";

import { motion } from "framer-motion";
import { forwardRef } from "react";

interface GlassInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
}

/**
 * Input con ref
 * 
 * Se usan forwardRef para mantener compatibilidad con formularios
 * existentes que utilizan refs.
 */
const GlassInput = forwardRef<HTMLInputElement, GlassInputProps>(
  ({ label, className = "", ...props }, ref) => {
    return (
      <div className="relative">
        <label className="block text-sm font-medium text-neutral-200 mb-2">
          {label}
        </label>
        
        <div className="relative">
          <input
            ref={ref}
            className={`
              w-full
              px-4 py-3
              bg-white/5
              border border-white/10
              rounded-lg
              text-white
              placeholder:text-neutral-500
              transition-all
              duration-300
              ease-out
              focus:outline-none
              focus:bg-white/10
              focus:border-amber-400/50
              focus:ring-2
              focus:ring-amber-400/20
              hover:border-white/20
              ${className}
            `}
            {...props}
          />
          
          {/* Indicador de foco con brillo - se muestra cuando está activo */}
          <motion.div
            initial={{ opacity: 0 }}
            whileFocus={{ opacity: 1 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0 rounded-lg pointer-events-none"
            style={{
              boxShadow: "0 0 20px rgba(251, 191, 36, 0.15), inset 0 0 10px rgba(251, 191, 36, 0.05)",
              border: "1px solid rgba(251, 191, 36, 0.3)"
            }}
          />
        </div>
      </div>
    );
  }
);

GlassInput.displayName = "GlassInput";

export default GlassInput;