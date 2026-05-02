"use client";
import React, { useRef } from "react";
import { Download } from "lucide-react";

interface Props { content: string; template?: string; name?: string; photoDataUrl?: string; }

const TEMPLATES = {
  executive: { fontFamily:"Georgia,serif",       nameColor:"#0f1c3f", accentColor:"#c9a84c", subColor:"#555", textColor:"#1a1a1a", bg:"#fff", ruleColor:"#c9a84c" },
  creative:  { fontFamily:"'DM Sans',sans-serif", nameColor:"#18122b", accentColor:"#6d28d9", subColor:"#6b7280", textColor:"#1e1e2e", bg:"#fff", ruleColor:"#6d28d9" },
  modern:    { fontFamily:"'Helvetica Neue',Helvetica,sans-serif", nameColor:"#1c2128", accentColor:"#0d9488", subColor:"#4b5563", textColor:"#111827", bg:"#fff", ruleColor:"#0d9488" },
  minimal:   { fontFamily:"'Helvetica Neue',Helvetica,sans-serif", nameColor:"#000", accentColor:"#000", subColor:"#888", textColor:"#111", bg:"#fff", ruleColor:"#ccc" },
  tech:      { fontFamily:"'Courier New',monospace", nameColor:"#0d1117", accentColor:"#3fb950", subColor:"#8b949e", textColor:"#e6edf3", bg:"#0d1117", ruleColor:"#30363d" },
};

// Strip markdown bold/italic markers from display text
function stripMarkdown(text: string): string {
  return text
    .replace(/\*\*([^*]+)\*\*/g, "$1")  // **bold**
    .replace(/\*([^*]+)\*/g, "$1")       // *italic*
    .replace(/^#{1,3}\s+/, "")           // ### headers
    .replace(/^[-•*]\s+/, "")            // leading bullets
    .trim();
}

// Detect if a line is a section header
function isSectionHeader(line: string): boolean {
  const tr = line.trim();
  // ALL CAPS line (no digits, reasonable length)
  if (tr === tr.toUpperCase() && tr.length > 2 && tr.length < 50 && !/\d/.test(tr)) return true;
  // Markdown header
  if (/^#{1,3}\s+/.test(tr)) return true;
  // Line that is just **Something** or *Something* (bold section title pattern)
  if (/^\*{1,2}[A-Z][^*]+\*{1,2}$/.test(tr)) return true;
  // Common resume section names (even if mixed case)
  const sections = /^(summary|experience|education|skills|projects|certifications|awards|publications|associations|volunteer|languages|objective|profile|technical skills|work experience|professional experience|honors)/i;
  if (sections.test(tr.replace(/[*#:]/g, "").trim())) return true;
  return false;
}

// Detect if a line is a job/school title row
function isRoleHeader(line: string): boolean {
  const tr = line.trim().replace(/\*\*/g, "");
  // Has pipe separator (common in resumes: "Company | City | Date")
  if (tr.includes("|")) return true;
  // Has a dash with dates: "Company — Jan 2020 – Present"
  if (/[–—-]\s*(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec|\d{4}|Present)/i.test(tr)) return true;
  return false;
}

export default function ResumePreview({ content, template = "minimal", name = "resume", photoDataUrl }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const t = TEMPLATES[template as keyof typeof TEMPLATES] ?? TEMPLATES.minimal;

  async function handleDownload() {
    const { default: html2canvas } = await import("html2canvas");
    const { default: jsPDF } = await import("jspdf");
    if (!ref.current) return;
    const canvas = await html2canvas(ref.current, { scale: 2, useCORS: true, backgroundColor: t.bg });
    const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
    const w = pdf.internal.pageSize.getWidth();
    pdf.addImage(canvas.toDataURL("image/png"), "PNG", 0, 0, w, (canvas.height * w) / canvas.width);
    pdf.save(`${name.replace(/\s+/g, "_")}_resume.pdf`);
  }

  function renderContent(text: string) {
    const lines = text.split("\n");
    const elements: React.ReactElement[] = [];
    let nameWritten = false;

    lines.forEach((line, i) => {
      const raw = line;
      const tr  = line.trim();

      if (!tr) {
        elements.push(<div key={i} style={{ height: 6 }} />);
        return;
      }

      // ── Name (very first non-empty line) ──────────────────────────
      if (!nameWritten) {
        nameWritten = true;
        elements.push(
          <h1 key={i} style={{ fontFamily: t.fontFamily, color: t.nameColor, fontSize: 24, fontWeight: 700, marginBottom: 3, letterSpacing: "-0.01em" }}>
            {stripMarkdown(tr)}
          </h1>
        );
        return;
      }

      // ── Contact / link line (2nd-4th lines with @ | · symbols) ───
      if (i < 5 && (tr.includes("@") || tr.includes("|") || tr.includes("·") || tr.includes("linkedin") || tr.includes("github"))) {
        elements.push(
          <p key={i} style={{ color: t.subColor, fontSize: 10.5, marginBottom: 10, lineHeight: 1.6 }}>
            {stripMarkdown(tr)}
          </p>
        );
        return;
      }

      // ── Section header ────────────────────────────────────────────
      if (isSectionHeader(tr)) {
        elements.push(
          <div key={i} style={{ marginTop: 18, marginBottom: 7 }}>
            <h2 style={{
              fontFamily: t.fontFamily, color: t.accentColor,
              fontSize: 11, fontWeight: 700, letterSpacing: "0.1em",
              textTransform: "uppercase", paddingBottom: 4,
              borderBottom: `1.5px solid ${t.ruleColor}`,
            }}>
              {stripMarkdown(tr)}
            </h2>
          </div>
        );
        return;
      }

      // ── Role / company header line ────────────────────────────────
      if (isRoleHeader(tr)) {
        elements.push(
          <p key={i} style={{ color: t.textColor, fontSize: 11, fontWeight: 700, lineHeight: 1.6, marginBottom: 1 }}>
            {stripMarkdown(tr)}
          </p>
        );
        return;
      }

      // ── Bullet point ──────────────────────────────────────────────
      if (/^[•\-\*>⚫●◆▸►]\s/.test(tr) || /^\*\*[•\-]/.test(tr)) {
        elements.push(
          <p key={i} style={{ color: t.textColor, fontSize: 11, lineHeight: 1.75, paddingLeft: 14, position: "relative", marginBottom: 2 }}>
            <span style={{ position: "absolute", left: 3, color: t.accentColor }}>•</span>
            {stripMarkdown(tr.replace(/^[•\-\*>⚫●◆▸►]\s*/, ""))}
          </p>
        );
        return;
      }

      // ── Date / location line (italic, subdued) ────────────────────
      if (/^(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec|\d{4}|Present)/i.test(tr) ||
          /\d{4}\s*[–—-]\s*(Present|\d{4})/i.test(tr)) {
        elements.push(
          <p key={i} style={{ color: t.subColor, fontSize: 10, lineHeight: 1.5, fontStyle: "italic", marginBottom: 4 }}>
            {stripMarkdown(tr)}
          </p>
        );
        return;
      }

      // ── Bold line (job titles, degree names) ──────────────────────
      if (/\*\*[^*]+\*\*/.test(raw) && tr.replace(/\*\*/g, "").length < 80) {
        elements.push(
          <p key={i} style={{ color: t.textColor, fontSize: 11, fontWeight: 700, lineHeight: 1.6, marginBottom: 1 }}>
            {stripMarkdown(tr)}
          </p>
        );
        return;
      }

      // ── Default body text ─────────────────────────────────────────
      elements.push(
        <p key={i} style={{ color: t.textColor, fontSize: 11, lineHeight: 1.75 }}>
          {stripMarkdown(tr)}
        </p>
      );
    });

    return elements;
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 10 }}>
        <button onClick={handleDownload} className="btn-gold"
          style={{ padding: "8px 18px", borderRadius: 8, fontSize: 13, border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}>
          <Download size={14}/> Download PDF
        </button>
      </div>
      <div style={{ flex: 1, overflow: "auto", background: "#e8e8e8", borderRadius: 12, padding: 16 }}>
        <div ref={ref} style={{ background: t.bg, padding: "36px 44px", fontFamily: t.fontFamily, maxWidth: 720, margin: "0 auto", boxShadow: "0 4px 24px rgba(0,0,0,0.18)", position: "relative" }}>
          {photoDataUrl && template !== "tech" && (
            <img src={photoDataUrl} alt="Profile" style={{ position: "absolute", top: 36, right: 44, width: 72, height: 72, borderRadius: "50%", objectFit: "cover", border: `2px solid ${t.ruleColor}` }}/>
          )}
          {renderContent(content)}
        </div>
      </div>
    </div>
  );
}