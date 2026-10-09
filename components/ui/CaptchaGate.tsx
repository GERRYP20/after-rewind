"use client";

/**
 * CaptchaGate - Muro de verificación a pantalla completa.
 *
 * Se muestra al entrar a la landing "/". Consulta /api/captcha/status para
 * saber si el visitante ya resolvió el desafío (cookie httpOnly). Si no,
 * bloquea todo el contenido con el SliderPuzzle hasta resolverlo y valida
 * la respuesta en /api/captcha/verify.
 */
import { useCallback, useEffect, useState } from "react";
import AnimatedBackground from "@/components/ui/AnimatedBackground";
import GlassCard from "@/components/ui/GlassCard";
import GlassButton from "@/components/ui/GlassButton";
import SliderPuzzle, { SliderResult } from "@/components/ui/SliderPuzzle";

type GateStatus = "checking" | "locked" | "passed";

export default function CaptchaGate({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<GateStatus>("checking");
  const [captcha, setCaptcha] = useState<SliderResult | null>(null);
  const [captchaKey, setCaptchaKey] = useState(0);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  // Al montar, comprobamos si ya existe la cookie de verificación
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/captcha/status", { cache: "no-store" });
        const data = await res.json();
        if (!cancelled) setStatus(data?.passed ? "passed" : "locked");
      } catch {
        // Fail closed: ante cualquier error exigimos verificación
        if (!cancelled) setStatus("locked");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleContinue = useCallback(async () => {
    setErr(null);

    if (!captcha?.solved) {
      setErr("Resuelve el desafío de seguridad para continuar.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/captcha/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          captchaToken: captcha.token,
          captchaOffsetX: captcha.offsetX,
          captchaOffsetY: captcha.offsetY,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setErr(data.error || "No se pudo verificar. Intenta de nuevo.");
        setCaptcha(null);
        setCaptchaKey((k) => k + 1);
        return;
      }

      setStatus("passed");
    } catch {
      setErr("No se pudo verificar. Intenta de nuevo.");
      setCaptcha(null);
      setCaptchaKey((k) => k + 1);
    } finally {
      setLoading(false);
    }
  }, [captcha]);

  // Mientras verificamos el estado mostramos una pantalla de carga para no
  // filtrar el contenido antes de saber si corresponde el muro.
  if (status === "checking") {
    return (
      <section className="relative overflow-hidden bg-neutral-950 min-h-[calc(100vh-4rem)] flex items-center justify-center">
        <AnimatedBackground />
        <p className="relative text-neutral-400">Verificando seguridad...</p>
      </section>
    );
  }

  if (status === "locked") {
    return (
      <section className="relative overflow-hidden bg-neutral-950 min-h-[calc(100vh-4rem)]">
        <AnimatedBackground />

        <div className="max-w-7xl mx-auto px-4 py-30 relative">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h1 className="text-4xl md:text-5xl font-extrabold leading-tight text-white">
                VERIFICACIÓN <span className="text-amber-400">DE SEGURIDAD</span>
              </h1>
              <p className="mt-5 text-amber-400 text-lg">
                Antes de entrar a AFTER-REWIND, resuelve el desafío visual para
                confirmar que eres una persona.
              </p>
            </div>

            <div className="max-w-md mx-auto w-full">
              <GlassCard className="p-8">
                <h2 className="text-2xl font-bold text-center mb-6 text-white">
                  Desafío de seguridad
                </h2>

                <div className="space-y-5">
                  <SliderPuzzle onChange={setCaptcha} refreshKey={captchaKey} />

                  {err && (
                    <p className="text-sm text-red-400 bg-red-900/20 p-3 rounded-lg border border-red-900/30">
                      {err}
                    </p>
                  )}

                  <GlassButton
                    type="button"
                    onClick={handleContinue}
                    disabled={loading || !captcha?.solved}
                  >
                    {loading ? "Verificando..." : "Continuar"}
                  </GlassButton>
                </div>
              </GlassCard>
            </div>
          </div>
        </div>
      </section>
    );
  }

  return <>{children}</>;
}
