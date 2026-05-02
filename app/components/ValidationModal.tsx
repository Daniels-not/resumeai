"use client";
import { X, AlertCircle, AlertTriangle } from "lucide-react";
import { ValidationError } from "../lib/validation";

interface Props {
  errors: ValidationError[];
  onClose: () => void;
  stepName?: string;
}

export default function ValidationModal({ errors, onClose, stepName }: Props) {
  if (errors.length === 0) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(4,6,12,0.96)", backdropFilter: "blur(12px)" }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="animate-fade-up w-full max-w-md"
        style={{
          background: "var(--surface)",
          border: "1px solid rgba(248,113,113,0.3)",
          borderRadius: 20,
          padding: 32,
          maxHeight: "85vh",
          overflow: "auto",
        }}
      >
        {/* Header */}
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 20 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{
              width: 44, height: 44, borderRadius: 12,
              background: "rgba(248,113,113,0.1)", border: "1px solid rgba(248,113,113,0.3)",
              display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
            }}>
              <AlertTriangle size={22} color="var(--danger)" />
            </div>
            <div>
              <h2 className="font-display" style={{ fontSize: 21, color: "var(--text)", lineHeight: 1.2 }}>
                {errors.length === 1 ? "One thing to fix" : `${errors.length} things to fix`}
              </h2>
              {stepName && (
                <p style={{ color: "var(--text3)", fontSize: 12, marginTop: 2 }}>
                  in {stepName}
                </p>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text3)", padding: 4, flexShrink: 0 }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Error list */}
        <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 24 }}>
          {errors.map((err, i) => (
            <div
              key={i}
              style={{
                display: "flex", gap: 10, padding: "12px 14px",
                background: "rgba(248,113,113,0.06)",
                border: "1px solid rgba(248,113,113,0.18)",
                borderRadius: 10,
              }}
            >
              <AlertCircle size={15} color="var(--danger)" style={{ flexShrink: 0, marginTop: 1 }} />
              <div>
                <p style={{ color: "var(--danger)", fontSize: 11, fontWeight: 700, letterSpacing: "0.04em", textTransform: "uppercase", marginBottom: 2 }}>
                  {err.field}
                </p>
                <p style={{ color: "var(--text2)", fontSize: 13, lineHeight: 1.6 }}>
                  {err.message}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Close button */}
        <button
          onClick={onClose}
          style={{
            width: "100%", padding: "12px", borderRadius: 10,
            background: "var(--surface2)", border: "1px solid var(--border2)",
            color: "var(--text)", fontSize: 14, fontWeight: 500, cursor: "pointer",
            transition: "all .2s",
          }}
          onMouseEnter={e => (e.currentTarget.style.borderColor = "var(--gold)")}
          onMouseLeave={e => (e.currentTarget.style.borderColor = "var(--border2)")}
        >
          Got it — let me fix these
        </button>
      </div>
    </div>
  );
}
