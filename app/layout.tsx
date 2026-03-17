import type { Metadata } from "next";
import { Poppins } from "next/font/google";
import "./globals.css";
// Importamos el Header desde la carpeta de componentes
import PublicHeder from "@/components/layout/PublicHeder";

// 1. Configuración de la fuente
const poppins = Poppins({
  subsets: ["latin"],
  weight: ["300", "400", "600", "700"],
  variable: "--font-poppins", // Esto permite usar la fuente en CSS
});

// 2. Metadatos 
export const metadata: Metadata = {
  title: "AFTER-REWIND | Captura la Esencia",
  description: "Plataforma premium para gestionar eventos",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body className={poppins.className}>
        {/* Al poner el Header aquí, aparecerá automáticamente 
           en todas las páginas sin tener que importarlo en cada una.
        */}
        <PublicHeder />
        
        {children}
      </body>
    </html>
  );
}