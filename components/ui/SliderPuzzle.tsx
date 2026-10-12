"use client";

/**
 * SliderPuzzle - Desafío visual tipo "slider puzzle".
 *
 * El usuario debe arrastrar la pieza hasta el hueco de la imagen.
 * El componente solo reporta el desplazamiento; la validación real
 * la hace el servidor en /api/sessionLogin.
 */
import { useCallback, useEffect, useRef, useState } from "react";

const TOLERANCE = 10; // Debe coincidir con PUZZLE.TOLERANCE en lib/captcha.ts

export interface SliderResult {
  token: string;
  offsetX: number;
  offsetY: number;
  solved: boolean;
}

interface SliderChallengeData {
  token: string;
  gapX: number;
  gapY: number;
  width: number;
  height: number;
  pieceSize: number;
  pieceStartX: number;
  expiresAt: number;
}

interface SliderPuzzleProps {
  onChange: (result: SliderResult | null) => void;
  refreshKey?: number;
}

export default function SliderPuzzle({ onChange, refreshKey = 0 }: SliderPuzzleProps) {
  const [challenge, setChallenge] = useState<SliderChallengeData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [posX, setPosX] = useState(0);
  const [dragging, setDragging] = useState(false);

  const dragStartX = useRef(0);
  const dragStartPos = useRef(0);
  const onChangeRef = useRef(onChange);

  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  const loadChallenge = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/captcha?t=${Date.now()}`, { cache: "no-store" });
      if (!res.ok) throw new Error("No se pudo cargar el desafío");
      const data: SliderChallengeData = await res.json();
      setChallenge(data);
      setPosX(data.pieceStartX);
      onChangeRef.current?.({
        token: data.token,
        offsetX: data.pieceStartX,
        offsetY: data.gapY,
        solved: false,
      });
    } catch {
      setChallenge(null);
      setError("No se pudo cargar el desafío. Intenta de nuevo.");
      onChangeRef.current?.(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (cancelled) return;
      await loadChallenge();
    })();
    return () => {
      cancelled = true;
    };
  }, [loadChallenge, refreshKey]);

  const report = useCallback(
    (x: number) => {
      if (!challenge) return;
      const solved = Math.abs(x - challenge.gapX) <= TOLERANCE;
      onChangeRef.current?.({
        token: challenge.token,
        offsetX: x,
        offsetY: challenge.gapY,
        solved,
      });
    },
    [challenge]
  );

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!challenge) return;
    e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId);
    dragStartX.current = e.clientX;
    dragStartPos.current = posX;
    setDragging(true);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragging || !challenge) return;
    const delta = e.clientX - dragStartX.current;
    const maxX = challenge.width - challenge.pieceSize;
    const next = Math.min(Math.max(dragStartPos.current + delta, 0), maxX);
    setPosX(next);
    report(next);
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragging || !challenge) return;
    setDragging(false);
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {
      // ignore
    }
    report(posX);
  };

  const solved = challenge
    ? Math.abs(posX - challenge.gapX) <= TOLERANCE
    : false;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="text-sm text-neutral-300">
          Desafío de seguridad: desliza la pieza hasta el hueco
        </label>
        <button
          type="button"
          onClick={loadChallenge}
          disabled={loading}
          className="text-xs text-amber-400/80 hover:text-amber-400 transition-colors disabled:opacity-50"
        >
          Refrescar
        </button>
      </div>

      <div className="flex justify-center">
        {loading ? (
          <div
            className="flex items-center justify-center rounded-xl border border-white/10 bg-white/5 text-sm text-neutral-400"
            style={{ width: 320, height: 160 }}
          >
            Cargando desafío...
          </div>
        ) : error ? (
          <div
            className="flex items-center justify-center rounded-xl border border-red-900/40 bg-red-900/10 px-4 text-center text-sm text-red-400"
            style={{ width: 320, height: 160 }}
          >
            {error}
          </div>
        ) : challenge ? (
          <div
            style={{
              position: "relative",
              width: challenge.width,
              height: challenge.height,
              borderRadius: 12,
              overflow: "hidden",
              border: "1px solid rgba(255,255,255,0.15)",
              backgroundImage: "url(/captcha.jpg)",
              backgroundSize: `${challenge.width}px ${challenge.height}px`,
              backgroundPosition: "0 0",
              backgroundRepeat: "no-repeat",
              userSelect: "none",
            }}
          >
            {/* Hueco donde debe encajar la pieza */}
            <div
              style={{
                position: "absolute",
                left: challenge.gapX,
                top: challenge.gapY,
                width: challenge.pieceSize,
                height: challenge.pieceSize,
                borderRadius: 8,
                background: "rgba(0,0,0,0.65)",
                boxShadow: "inset 0 0 0 2px rgba(255,255,255,0.25)",
              }}
            />

            {/* Pieza deslizable */}
            <div
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onPointerCancel={handlePointerUp}
              style={{
                position: "absolute",
                left: posX,
                top: challenge.gapY,
                width: challenge.pieceSize,
                height: challenge.pieceSize,
                borderRadius: 8,
                backgroundImage: "url(/captcha.jpg)",
                backgroundSize: `${challenge.width}px ${challenge.height}px`,
                backgroundPosition: `-${challenge.gapX}px -${challenge.gapY}px`,
                boxShadow: solved
                  ? "0 0 0 2px #22c55e, 0 0 12px rgba(34,197,94,0.6)"
                  : "0 0 0 2px #fbbf24",
                cursor: dragging ? "grabbing" : "grab",
                touchAction: "none",
                zIndex: 2,
              }}
            />
          </div>
        ) : null}
      </div>

      <p
        className={`text-xs text-center transition-colors ${
          solved ? "text-green-400" : "text-neutral-500"
        }`}
      >
        {solved ? "Desafío resuelto, ya puedes continuar." : "Acomoda la pieza para continuar."}
      </p>
    </div>
  );
}
