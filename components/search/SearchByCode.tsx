"use client";

import { useState, FormEvent, ChangeEvent } from "react";
import { useRouter } from "next/navigation";

/**
 * Componente de búsqueda por código de acceso.
 * 
 * Permite al usuario buscar eventos de otros usuarios ingresando
 * un código de acceso. Al encontrar el evento, redirige a la página
 * de detalles del evento.
 */
export default function SearchByCode() {
  // Estado para almacenar el código ingresado
  const [code, setCode] = useState("");
  // Estado para indicar si hay una búsqueda en progreso
  const [loading, setLoading] = useState(false);
  // Estado para mostrar mensajes de error
  const [error, setError] = useState("");
  
  // Router de Next.js para navegar entre páginas
  const router = useRouter();

  /**
   * Maneja los cambios en el campo de entrada.
   * Convierte automáticamente a mayúsculas y elimina espacios.
   */
  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    setCode(e.target.value.toUpperCase().replace(/\s/g, ""));
    setError(""); // Limpia el error cuando el usuario comienza a escribir
  };

  /**
   * Maneja el envío del formulario de búsqueda.
   * Llama a la API para buscar el evento por código.
   */
  const handleSearch = async (e: FormEvent) => {
    e.preventDefault();
    
    // Validación: el código no puede estar vacío
    if (!code.trim()) {
      setError("Ingresa un código");
      return;
    }

    setLoading(true);
    setError("");

    try {
      // Realiza la búsqueda a través de la API
      const res = await fetch(`/api/invitations/by-code?code=${encodeURIComponent(code)}`);
      const data = await res.json();

      if (!res.ok) {
        // Si la respuesta no es exitosa, muestra el error
        throw new Error(data.error || "Error al buscar");
      }

      // Si se encuentra el evento, redirige a la página de detalles
      router.push(`/dashboard/invitaciones/${data.id}`);
    } catch (err) {
      // Muestra el mensaje de error apropiado
      setError("Código no encontrado");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        backgroundColor: "#18181b",
        border: "1px solid #3f3f46",
        borderRadius: "16px",
        padding: "24px",
      }}
    >
      {/* Título de la sección */}
      <div style={{ marginBottom: "16px" }}>
        <h2
          style={{
            color: "white",
            fontSize: "16px",
            fontWeight: 800,
            margin: "0 0 4px 0",
            display: "flex",
            alignItems: "center",
            gap: "8px",
          }}
        >
          🔍 Unirse a un evento
        </h2>
        <p
          style={{
            color: "#71717a",
            fontSize: "13px",
            margin: 0,
          }}
        >
          Ingresa el código de acceso que te proporcionaron
        </p>
      </div>

      {/* Formulario de búsqueda */}
      <form onSubmit={handleSearch} style={{ display: "flex", gap: "12px" }}>
        {/* Campo de entrada para el código */}
        <input
          type="text"
          value={code}
          onChange={handleChange}
          placeholder="Código (ej: ABC123)"
          disabled={loading}
          maxLength={20}
          style={{
            flex: 1,
            padding: "12px 16px",
            backgroundColor: "#09090b",
            border: `1px solid ${error ? "#f43f5e" : "#3f3f46"}`,
            borderRadius: "10px",
            color: "white",
            fontSize: "14px",
            fontFamily: "monospace",
            fontWeight: 600,
            letterSpacing: "0.1em",
            outline: "none",
            transition: "border-color 0.2s",
          }}
          onFocus={(e) => {
            if (!error) e.target.style.borderColor = "#E0B046";
          }}
          onBlur={(e) => {
            if (!error) e.target.style.borderColor = "#3f3f46";
          }}
        />

        {/* Botón de búsqueda */}
        <button
          type="submit"
          disabled={loading || !code.trim()}
          style={{
            padding: "12px 24px",
            borderRadius: "10px",
            backgroundColor: loading ? "#52525b" : "#E0B046",
            border: "none",
            color: loading ? "#a1a1aa" : "#09090b",
            fontSize: "13px",
            fontWeight: 800,
            textTransform: "uppercase",
            letterSpacing: "0.1em",
            cursor: loading ? "not-allowed" : "pointer",
            transition: "background-color 0.2s",
            whiteSpace: "nowrap",
          }}
          onMouseEnter={(e) => {
            if (!loading && code.trim()) {
              e.currentTarget.style.backgroundColor = "#c99a2e";
            }
          }}
          onMouseLeave={(e) => {
            if (!loading) {
              e.currentTarget.style.backgroundColor = "#E0B046";
            }
          }}
        >
          {loading ? "Buscando..." : "Buscar"}
        </button>
      </form>

      {/* Mensaje de error */}
      {error && (
        <p
          style={{
            color: "#f43f5e",
            fontSize: "12px",
            margin: "12px 0 0 0",
            fontWeight: 600,
          }}
        >
          {error}
        </p>
      )}
    </div>
  );
}