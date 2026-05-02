"use client";
import { useState, useRef, KeyboardEvent } from "react";
import { X, Plus } from "lucide-react";

interface Props {
  label: string;
  sublabel?: string;
  placeholder: string;
  tags: string[];
  onChange: (tags: string[]) => void;
  accent?: string;
}

export default function TagInput({ label, sublabel, placeholder, tags, onChange, accent = "var(--gold)" }: Props) {
  const [input, setInput] = useState("");
  const [editIndex, setEditIndex] = useState<number | null>(null);
  const [editValue, setEditValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  function addTag() {
    const val = input.trim();
    if (!val || tags.includes(val)) { setInput(""); return; }
    onChange([...tags, val]);
    setInput("");
    inputRef.current?.focus();
  }

  function removeTag(i: number) {
    onChange(tags.filter((_, idx) => idx !== i));
  }

  function startEdit(i: number) {
    setEditIndex(i);
    setEditValue(tags[i]);
  }

  function commitEdit(i: number) {
    const val = editValue.trim();
    if (!val) { removeTag(i); }
    else {
      const updated = [...tags];
      updated[i] = val;
      onChange(updated);
    }
    setEditIndex(null);
    setEditValue("");
  }

  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" || e.key === ",") { e.preventDefault(); addTag(); }
    if (e.key === "Backspace" && input === "" && tags.length > 0) removeTag(tags.length - 1);
  }

  function handleEditKeyDown(e: KeyboardEvent<HTMLInputElement>, i: number) {
    if (e.key === "Enter") { e.preventDefault(); commitEdit(i); }
    if (e.key === "Escape") { setEditIndex(null); setEditValue(""); }
  }

  return (
    <div>
      <div style={{ marginBottom: 8 }}>
        <label style={{ color: "var(--text2)", fontSize: 13, fontWeight: 500 }}>{label}</label>
        {sublabel && <p style={{ color: "var(--text3)", fontSize: 12, marginTop: 2 }}>{sublabel}</p>}
      </div>

      {/* Tag display area */}
      {tags.length > 0 && (
        <div style={{
          display: "flex", flexWrap: "wrap", gap: 8, padding: "12px 14px",
          background: "var(--bg2)", border: "1px solid var(--border)",
          borderRadius: 12, marginBottom: 10, minHeight: 48,
        }}>
          {tags.map((tag, i) => (
            <span key={i} style={{ display: "inline-flex", alignItems: "center", gap: 0, borderRadius: 20, overflow: "hidden", border: `1px solid ${accent}40`, background: `${accent}15` }}>
              {editIndex === i ? (
                <input
                  autoFocus
                  value={editValue}
                  onChange={e => setEditValue(e.target.value)}
                  onKeyDown={e => handleEditKeyDown(e, i)}
                  onBlur={() => commitEdit(i)}
                  style={{
                    background: "transparent", border: "none", outline: "none",
                    color: accent, fontSize: 13, fontWeight: 500,
                    padding: "4px 10px", minWidth: 60, width: `${Math.max(editValue.length, 4)}ch`,
                  }}
                />
              ) : (
                <button
                  onClick={() => startEdit(i)}
                  title="Click to edit"
                  style={{
                    background: "none", border: "none", cursor: "text",
                    color: accent, fontSize: 13, fontWeight: 500,
                    padding: "5px 10px 5px 12px", lineHeight: 1,
                  }}
                >
                  {tag}
                </button>
              )}
              <button
                onClick={() => removeTag(i)}
                title="Remove"
                style={{
                  background: "none", border: "none", cursor: "pointer",
                  color: accent, padding: "5px 9px 5px 2px",
                  display: "flex", alignItems: "center", opacity: 0.7,
                  transition: "opacity .15s",
                }}
                onMouseEnter={e => (e.currentTarget.style.opacity = "1")}
                onMouseLeave={e => (e.currentTarget.style.opacity = "0.7")}
              >
                <X size={11} />
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Input row */}
      <div style={{ display: "flex", gap: 8 }}>
        <input
          ref={inputRef}
          className="input-luxury"
          placeholder={placeholder}
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          style={{ flex: 1, padding: "11px 14px", borderRadius: 10, fontSize: 14 }}
        />
        <button
          onClick={addTag}
          disabled={!input.trim()}
          style={{
            padding: "11px 18px", borderRadius: 10, border: "none", cursor: input.trim() ? "pointer" : "not-allowed",
            background: input.trim() ? `linear-gradient(135deg,var(--gold),var(--gold2))` : "var(--surface)",
            color: input.trim() ? "#080a0f" : "var(--text3)",
            fontSize: 13, fontWeight: 600, display: "flex", alignItems: "center", gap: 5,
            transition: "all .2s", flexShrink: 0,
          }}
        >
          <Plus size={14} /> Add
        </button>
      </div>
      <p style={{ color: "var(--text3)", fontSize: 11, marginTop: 6 }}>
        Press <kbd style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 4, padding: "1px 5px", fontSize: 10 }}>Enter</kbd> or click Add · Click a tag to edit it · <X size={9} style={{ display: "inline", verticalAlign: "middle" }} /> to remove
      </p>
    </div>
  );
}
