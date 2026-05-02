"use client";
import { useState, useRef, useEffect } from "react";
import { ChevronDown, X } from "lucide-react";

interface Props {
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  allowPresent?: boolean;
  maxYear?: number;
  minYear?: number;
}

const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

function currentYear() { return new Date().getFullYear(); }

export default function MonthYearPicker({ value, onChange, placeholder = "Select date", allowPresent = false, maxYear, minYear }: Props) {
  const [open, setOpen] = useState(false);
  const [viewYear, setViewYear] = useState(() => {
    if (value && value !== "Present") {
      const y = parseInt(value.split(" ")[1]);
      if (!isNaN(y)) return y;
    }
    return currentYear();
  });
  const ref = useRef<HTMLDivElement>(null);
  const max = maxYear ?? currentYear() + 1;
  const min = minYear ?? 1970;

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  function selectMonth(month: string) { onChange(`${month} ${viewYear}`); setOpen(false); }
  function selectPresent() { onChange("Present"); setOpen(false); }
  function clear(e: React.MouseEvent) { e.stopPropagation(); onChange(""); }

  const selectedMonth = (() => {
    if (!value || value === "Present") return null;
    const parts = value.split(" ");
    if (parts.length === 2 && parseInt(parts[1]) === viewYear) return parts[0];
    return null;
  })();

  return (
    <div ref={ref} style={{ position: "relative", width: "100%" }}>

      {/* Trigger */}
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        style={{
          width: "100%", padding: "12px 15px", borderRadius: 10, fontSize: 14,
          background: "var(--surface)",
          border: `1px solid ${open ? "var(--gold)" : "var(--border)"}`,
          color: value ? "var(--text)" : "var(--text3)",
          display: "flex", alignItems: "center", justifyContent: "space-between",
          cursor: "pointer", textAlign: "left",
          boxShadow: open ? "0 0 0 3px rgba(201,168,76,0.1)" : "none",
          transition: "all .2s",
        }}
      >
        <span>{value || placeholder}</span>
        <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
          {value && (
            <span onClick={clear}
              style={{ color: "var(--text3)", display: "flex", alignItems: "center", padding: 2, borderRadius: 4 }}
              onMouseEnter={e => (e.currentTarget.style.color = "var(--danger)")}
              onMouseLeave={e => (e.currentTarget.style.color = "var(--text3)")}>
              <X size={13} />
            </span>
          )}
          <ChevronDown size={14} color="var(--text3)"
            style={{ transform: open ? "rotate(180deg)" : "none", transition: "transform .2s" }} />
        </span>
      </button>

      {/* Dropdown */}
      {open && (
        <div className="animate-fade-in" style={{
          position: "absolute", top: "calc(100% + 6px)", left: 0, right: 0, zIndex: 100,
          background: "var(--surface2)",
          border: "1px solid var(--border2)",
          borderRadius: 12, padding: 16,
          boxShadow: "0 16px 48px rgba(0,0,0,0.4)",
        }}>

          {/* Present option */}
          {allowPresent && (
            <button onClick={selectPresent} style={{
              width: "100%", padding: "9px 12px", borderRadius: 8,
              marginBottom: 12, cursor: "pointer", fontSize: 13, fontWeight: 600,
              background: value === "Present" ? "var(--gold-dim)" : "var(--surface)",
              color: value === "Present" ? "var(--gold)" : "var(--text2)",
              border: `1px solid ${value === "Present" ? "var(--gold)" : "var(--border)"}`,
              transition: "all .15s",
            }}>
              Present (current role)
            </button>
          )}

          {/* Year navigation */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
            <button onClick={() => setViewYear(y => Math.max(y - 1, min))} disabled={viewYear <= min}
              style={{ background: "none", border: "none", cursor: viewYear > min ? "pointer" : "not-allowed", color: viewYear > min ? "var(--text)" : "var(--text3)", fontSize: 20, lineHeight: 1, padding: "0 10px" }}>
              ‹
            </button>
            <span style={{ color: "var(--text)", fontSize: 15, fontWeight: 700 }}>{viewYear}</span>
            <button onClick={() => setViewYear(y => Math.min(y + 1, max))} disabled={viewYear >= max}
              style={{ background: "none", border: "none", cursor: viewYear < max ? "pointer" : "not-allowed", color: viewYear < max ? "var(--text)" : "var(--text3)", fontSize: 20, lineHeight: 1, padding: "0 10px" }}>
              ›
            </button>
          </div>

          {/* Month grid */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 6 }}>
            {MONTHS.map(m => {
              const isSelected = selectedMonth === m;
              const isFuture =
                viewYear > currentYear() ||
                (viewYear === currentYear() && MONTHS.indexOf(m) > new Date().getMonth());
              return (
                <button key={m}
                  onClick={() => !isFuture && selectMonth(m)}
                  disabled={isFuture}
                  style={{
                    padding: "8px 4px", borderRadius: 8, border: "none",
                    background: isSelected ? "linear-gradient(135deg,var(--gold),var(--gold2))" : "var(--surface)",
                    color: isSelected ? "#080a0f" : isFuture ? "var(--text3)" : "var(--text2)",
                    fontSize: 13, fontWeight: isSelected ? 700 : 400,
                    cursor: isFuture ? "not-allowed" : "pointer",
                    opacity: isFuture ? 0.35 : 1,
                    transition: "all .15s",
                  }}
                  onMouseEnter={e => { if (!isSelected && !isFuture) (e.currentTarget as HTMLButtonElement).style.background = "var(--border)"; }}
                  onMouseLeave={e => { if (!isSelected && !isFuture) (e.currentTarget as HTMLButtonElement).style.background = "var(--surface)"; }}
                >
                  {m}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}