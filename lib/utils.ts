/**
 * Genera un código de acceso aleatorio y seguro
 * Formato: XXXXX-XXXXX (10 caracteres alfanuméricos en mayúsculas)
 */
export function generateAccessCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // Evitamos caracteres ambiguos como O, 0, I, 1
  let code = "";
  
  for (let i = 0; i < 10; i++) {
    if (i === 5) code += "-";
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  
  return code;
}
