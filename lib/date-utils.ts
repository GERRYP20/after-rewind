/**
 * Utilidades para el manejo de fechas en el frontend y backend.
 */

/**
 * Parsea una cadena de fecha "YYYY-MM-DD" a un objeto Date local
 * evitando desplazamientos por zona horaria.
 */
export function parseLocalDate(dateString: string): Date {
  if (!dateString) return new Date();
  
  // Si ya es un formato ISO completo, lo parseamos normal
  if (dateString.includes("T")) {
    return new Date(dateString);
  }

  // Si es YYYY-MM-DD, parseamos componentes individuales para evitar UTC shift
  const [year, month, day] = dateString.split("-").map(Number);
  return new Date(year, month - 1, day);
}

/**
 * Formatea una fecha en formato largo legible para México.
 */
export function formatLongDate(dateString: string): string {
  const date = parseLocalDate(dateString);
  return date.toLocaleDateString("es-MX", {
    dateStyle: "full",
  });
}
