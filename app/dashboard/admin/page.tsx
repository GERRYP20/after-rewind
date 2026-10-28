// Panel de administrador: muestra los logs de seguridad (rate limiting, captcha, login)
"use client";
import { useEffect, useState, useCallback } from "react";
import { ShieldAlert, RefreshCw, Lock } from "lucide-react";

interface LogEntry {
  id: string;
  type: string;
  ip: string;
  resource?: string;
  message: string;
  meta?: Record<string, unknown>;
  createdAt: string;
}

const TYPE_FILTERS: { value: string; label: string }[] = [
  { value: "", label: "Todos" },
  { value: "rate_limit_exceeded", label: "Rate limit excedido" },
  { value: "login_blocked_attempts", label: "IP bloqueada" },
  { value: "captcha_failed", label: "Captcha fallido" },
  { value: "login_success", label: "Login exitoso" },
  { value: "login_error", label: "Error de login" },
];

const TYPE_COLORS: Record<string, string> = {
  rate_limit_exceeded: "#f59e0b",
  login_blocked_attempts: "#ef4444",
  captcha_failed: "#f97316",
  login_success: "#22c55e",
  login_error: "#ef4444",
};

export default function AdminLogsPage() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [forbidden, setForbidden] = useState(false);
  const [filter, setFilter] = useState("");

  const load = useCallback(() => {
    const query = filter ? `?type=${filter}` : "";
    fetch(`/api/admin/logs${query}`)
      .then(async (res) => {
        if (res.status === 403) {
          setForbidden(true);
          return null;
        }
        return res.ok ? res.json() : null;
      })
      .then((data) => {
        if (data) setLogs(data.logs);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [filter]);

  useEffect(() => {
    load();
    const interval = setInterval(load, 15_000);
    return () => clearInterval(interval);
  }, [load]);

  if (forbidden) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: "16px",
          color: "#a1a1aa",
        }}
      >
        <Lock size={40} color="#71717a" />
        <p style={{ fontSize: "14px", fontWeight: 700, letterSpacing: "0.05em" }}>
          Acceso denegado: esta cuenta no es administrador.
        </p>
      </div>
    );
  }

  return (
    <div style={{ paddingTop: "clamp(8rem, 12vw, 10rem)", paddingBottom: "4rem", maxWidth: "1100px", margin: "0 auto", padding: "0 24px" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "24px", flexWrap: "wrap", gap: "12px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <ShieldAlert color="#E0B046" size={22} />
          <h1 style={{ fontSize: "20px", fontWeight: 900, color: "#fafafa" }}>Logs de seguridad</h1>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            style={{
              backgroundColor: "#18181b",
              color: "#e4e4e7",
              border: "1px solid #3f3f46",
              borderRadius: "8px",
              padding: "8px 12px",
              fontSize: "12px",
            }}
          >
            {TYPE_FILTERS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>

          <button
            onClick={load}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              backgroundColor: "#18181b",
              border: "1px solid #3f3f46",
              borderRadius: "8px",
              padding: "8px 12px",
              color: "#e4e4e7",
              fontSize: "12px",
              cursor: "pointer",
            }}
          >
            <RefreshCw size={14} /> Actualizar
          </button>
        </div>
      </div>

      {loading ? (
        <p style={{ color: "#71717a", fontSize: "13px" }}>Cargando logs...</p>
      ) : logs.length === 0 ? (
        <p style={{ color: "#71717a", fontSize: "13px" }}>No hay eventos registrados todavía.</p>
      ) : (
        <div style={{ border: "1px solid #3f3f46", borderRadius: "12px", overflow: "hidden" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12.5px" }}>
            <thead>
              <tr style={{ backgroundColor: "#18181b", textAlign: "left", color: "#a1a1aa", textTransform: "uppercase", letterSpacing: "0.05em", fontSize: "10.5px" }}>
                <th style={{ padding: "12px 16px" }}>Fecha</th>
                <th style={{ padding: "12px 16px" }}>Tipo</th>
                <th style={{ padding: "12px 16px" }}>IP</th>
                <th style={{ padding: "12px 16px" }}>Mensaje</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => (
                <tr key={log.id} style={{ borderTop: "1px solid #27272a" }}>
                  <td style={{ padding: "10px 16px", color: "#a1a1aa", whiteSpace: "nowrap" }}>
                    {new Date(log.createdAt).toLocaleString("es-MX")}
                  </td>
                  <td style={{ padding: "10px 16px" }}>
                    <span
                      style={{
                        color: TYPE_COLORS[log.type] ?? "#e4e4e7",
                        fontWeight: 700,
                        fontSize: "11px",
                        textTransform: "uppercase",
                      }}
                    >
                      {log.type}
                    </span>
                  </td>
                  <td style={{ padding: "10px 16px", color: "#e4e4e7", fontFamily: "monospace" }}>{log.ip}</td>
                  <td style={{ padding: "10px 16px", color: "#d4d4d8" }}>{log.message}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
