"use client";
import { Coffee, Heart } from "lucide-react";

export default function BuyMeCoffee() {
  return (
    <div style={{
      textAlign: "center",
      padding: "48px 24px 56px",
      borderTop: "1px solid var(--border)",
      position: "relative",
      overflow: "hidden",
    }}>
      {/* subtle glow */}
      <div style={{
        position: "absolute", width: 400, height: 200,
        background: "rgba(201,168,76,0.05)", borderRadius: "50%",
        filter: "blur(60px)", left: "50%", top: "50%",
        transform: "translate(-50%,-50%)", pointerEvents: "none",
      }} />

      <div style={{ position: "relative", zIndex: 1 }}>
        <div style={{
          display: "inline-flex", alignItems: "center", gap: 6,
          background: "var(--gold-dim)", border: "1px solid rgba(201,168,76,0.25)",
          borderRadius: 100, padding: "4px 14px", marginBottom: 18,
        }}>
          <Heart size={11} color="var(--gold)" fill="var(--gold)" />
          <span style={{ color: "var(--gold)", fontSize: 11, fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase" }}>
            Support the project
          </span>
        </div>

        <p className="font-display" style={{ fontSize: 22, color: "var(--text)", marginBottom: 8 }}>
          Find this useful?
        </p>
        <p style={{ color: "var(--text2)", fontSize: 14, lineHeight: 1.7, maxWidth: 360, margin: "0 auto 24px" }}>
          ResumeAI is completely free and always will be. If it helped you land an interview, a coffee goes a long way ☕
        </p>

        <a
          href="https://buymeacoffee.com/ramycampusk"
          target="_blank"
          rel="noreferrer"
          style={{
            display: "inline-flex", alignItems: "center", gap: 10,
            background: "#FFDD00", color: "#000000",
            padding: "13px 28px", borderRadius: 12,
            fontSize: 15, fontWeight: 700, textDecoration: "none",
            transition: "all 0.3s cubic-bezier(0.4,0,0.2,1)",
            boxShadow: "0 4px 20px rgba(255,221,0,0.25)",
          }}
          onMouseEnter={e => {
            const el = e.currentTarget as HTMLAnchorElement;
            el.style.transform = "translateY(-2px)";
            el.style.boxShadow = "0 8px 32px rgba(255,221,0,0.4)";
          }}
          onMouseLeave={e => {
            const el = e.currentTarget as HTMLAnchorElement;
            el.style.transform = "translateY(0)";
            el.style.boxShadow = "0 4px 20px rgba(255,221,0,0.25)";
          }}
        >
          <Coffee size={18} />
          Buy me a coffee
        </a>

        <p style={{ color: "var(--text3)", fontSize: 11, marginTop: 16 }}>
          Built with ❤️ by Ramy Daniel
        </p>
      </div>
    </div>
  );
}
