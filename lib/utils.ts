/**
 * Genera un código de acceso aleatorio y seguro
 * Formato: XXXXX-XXXXX (10 caracteres alfanuméricos en mayúsculas)
 */
export function generateAccessCode(): string {
  // Usamos un set de caracteres que evita confusiones visuales (como 0 y O)
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; 
  let code = "";
  
  for (let i = 0; i < 10; i++) {
    // Insertamos un guión en la mitad para mejorar la legibilidad
    if (i === 5) code += "-";
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  
  return code;
}
