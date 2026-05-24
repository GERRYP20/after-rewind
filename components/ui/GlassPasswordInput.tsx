"use client";

/**
 * GlassPasswordInput - Campo de contraseña con icono de ojito
 * 
 * Este componente combina el campo de contraseña con un botón
 * para mostrar/ocultar la contraseña usando iconos de ojo.
 * Es más intuitivo y accesible que usar texto.
 */
"use client";

import { forwardRef, useState } from "react";

interface GlassPasswordInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
}

/**
 * Input de contraseña con botón de icono
 * 
 * Se usa forwardRef para mantener compatibilidad con formularios.
 */
const GlassPasswordInput = forwardRef<HTMLInputElement, GlassPasswordInputProps>(
  ({ label, className = "", ...props }, ref) => {
    const [showPassword, setShowPassword] = useState(false);

    return (
      <div className="relative">
        <label className="block text-sm font-medium text-neutral-200 mb-2">
          {label}
        </label>
        
        <div className="relative">
          <input
            ref={ref}
            type={showPassword ? "text" : "password"}
            className={`
              w-full
              px-4 py-3
              pr-12
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
          
          {/* Botón de mostrar/ocultar contraseña con icono de ojo */}
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-white transition-colors p-1"
            aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
          >
            {showPassword ? (
              /* Icono de ojo abierto (contraseña visible) */
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="2" 
                strokeLinecap="round" 
                strokeLinejoin="round"
                className="w-5 h-5"
              >
                <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                <line x1="1" y1="1" x2="23" y2="23" />
              </svg>
            ) : (
              /* Icono de ojo cerrado (contraseña oculta) */
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="2" 
                strokeLinecap="round" 
                strokeLinejoin="round"
                className="w-5 h-5"
              >
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                <circle cx="12" cy="12" r="3" />
              </svg>
            )}
          </button>
        </div>
      </div>
    );
  }
);

GlassPasswordInput.displayName = "GlassPasswordInput";

export default GlassPasswordInput;