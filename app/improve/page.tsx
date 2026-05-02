"use client";
import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useDropzone } from "react-dropzone";
import { analyzeResume } from "../lib/gemini";
import ResumePreview from "../components/ResumePreview";
import { Upload, FileText, ArrowLeft, ChevronRight, AlertCircle, CheckCircle, Loader2 } from "lucide-react";

export default function ImprovePage() {
  const router = useRouter();
  const [view, setView]           = useState<"upload"|"analyzing"|"results">("upload");
  const [file, setFile]           = useState<File|null>(null);
  const [resumeText, setResumeText] = useState("");
  const [feedback, setFeedback]   = useState("");
  const [improved, setImproved]   = useState("");
  const [error, setError]         = useState("");
  const [tab, setTab]             = useState<"feedback"|"preview">("feedback");
  const [stepIdx, setStepIdx]     = useState(0);
  const [extracting, setExtracting] = useState(false);

  const steps = [
    "Reading your resume…",
    "Identifying strengths…",
    "Spotting improvements…",
    "Generating optimized version…",
    "Finalizing…",
  ];

  // ── File drop ─────────────────────────────────────────────────────
  const onDrop = useCallback(async (accepted: File[]) => {
    const f = accepted[0];
    if (!f) return;
    setFile(f);
    setError("");
    setResumeText(""); // clear previous
    setExtracting(true);

    try {
      const text = await extractText(f);
      if (!text || text.trim().length < 50) {
        setError("Could not extract readable text from this file. Please paste your resume text in the box below instead.");
      } else {
        setResumeText(text);
      }
    } catch {
      setError("Could not read this file. Please paste your resume text in the box below.");
    } finally {
      setExtracting(false);
    }
  }, []);

  // ── Text extraction — handles PDF, DOCX, TXT ────────────────────
  async function extractText(f: File): Promise<string> {
    const name = f.name.toLowerCase();

    // Plain text files — read directly
    if (name.endsWith(".txt") || name.endsWith(".md")) {
      return f.text();
    }

    // DOCX — use mammoth via dynamic import
    if (name.endsWith(".docx") || name.endsWith(".doc")) {
      const mammoth = await import("mammoth");
      const arrayBuffer = await f.arrayBuffer();
      const result = await mammoth.extractRawText({ arrayBuffer });
      return result.value;
    }

    // PDF — extract text by sending to our own API route
    if (name.endsWith(".pdf")) {
      return extractPdfText(f);
    }

    // Fallback — try reading as text
    return f.text();
  }

  // ── PDF text extraction via API route ───────────────────────────
  async function extractPdfText(f: File): Promise<string> {
    // Convert PDF to base64 and ask Gemini to extract the text
    const arrayBuffer = await f.arrayBuffer();
    const bytes = new Uint8Array(arrayBuffer);
    let binary = "";
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    const base64 = btoa(binary);

    const res = await fetch("/api/gemini", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{
          parts: [
            {
              inline_data: {
                mime_type: "application/pdf",
                data: base64,
              },
            },
            {
              text: "Extract ALL the text from this resume PDF exactly as it appears. Output only the raw resume text with no commentary, no markdown formatting, no explanations. Preserve the structure with line breaks between sections.",
            },
          ],
        }],
        generationConfig: { temperature: 0, maxOutputTokens: 8192 },
      }),
    });

    if (!res.ok) {
      throw new Error("PDF extraction failed");
    }

    const data = await res.json();
    const extracted = data.candidates?.[0]?.content?.parts?.[0]?.text || "";

    if (!extracted || extracted.length < 50) {
      throw new Error("No readable text found in PDF");
    }

    return extracted;
  }

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    maxFiles: 1,
    maxSize: 10 * 1024 * 1024,
    accept: {
      "application/pdf": [".pdf"],
      "text/plain": [".txt"],
      "application/msword": [".doc"],
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [".docx"],
    },
  });

  // ── Analyze ───────────────────────────────────────────────────────
  async function handleAnalyze() {
    if (!resumeText.trim()) {
      setError("No resume content found. Please paste your resume text in the box below.");
      return;
    }
    setView("analyzing");
    setError("");
    let s = 0;
    const iv = setInterval(() => {
      s = Math.min(s + 1, steps.length - 1);
      setStepIdx(s);
    }, 1300);
    try {
      const result = await analyzeResume(resumeText);
      clearInterval(iv);
      setFeedback(result.feedback);
      setImproved(result.improved);
      setView("results");
    } catch (e: unknown) {
      clearInterval(iv);
      setError(e instanceof Error ? e.message : "Analysis failed. Please try again.");
      setView("upload");
    }
  }

  // ── Analyzing screen ──────────────────────────────────────────────
  if (view === "analyzing") return (
    <main style={{ minHeight:"100vh", background:"var(--bg)", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:28 }}>
      <div className="orb" style={{ width:400, height:400, background:"rgba(201,168,76,0.07)", top:"20%", left:"30%" }}/>
      <div style={{ textAlign:"center" }}>
        <div style={{ width:76, height:76, margin:"0 auto 28px", borderRadius:"50%", background:"var(--gold-dim)", border:"2px solid var(--gold)", display:"flex", alignItems:"center", justifyContent:"center" }}>
          <Loader2 size={30} color="var(--gold)" className="animate-spin"/>
        </div>
        <h2 className="font-display" style={{ fontSize:34, color:"var(--text)", marginBottom:10 }}>Analyzing your resume</h2>
        <p style={{ color:"var(--gold)", fontSize:15 }} className="animate-pulse-gold">{steps[stepIdx]}</p>
      </div>
      <div style={{ display:"flex", gap:6 }}>
        {steps.map((_,i) => (
          <div key={i} style={{ width:i<=stepIdx?22:7, height:4, borderRadius:2, background:i<=stepIdx?"var(--gold)":"var(--border2)", transition:"all .3s ease" }}/>
        ))}
      </div>
    </main>
  );

  // ── Results screen ────────────────────────────────────────────────
  if (view === "results") return (
    <main style={{ minHeight:"100vh", background:"var(--bg)", display:"flex", flexDirection:"column" }}>
      <nav style={{ padding:"16px 28px", borderBottom:"1px solid var(--border)", display:"flex", alignItems:"center", gap:14, background:"var(--bg2)", flexShrink:0 }}>
        <button onClick={() => router.push("/")} style={{ background:"none", border:"none", cursor:"pointer", color:"var(--text2)", display:"flex", alignItems:"center", gap:6, fontSize:13 }}>
          <ArrowLeft size={15}/> Home
        </button>
        <span style={{ color:"var(--border2)" }}>|</span>
        <span className="font-display" style={{ color:"var(--text)", fontSize:17 }}>Resume Analysis</span>
      </nav>
      <div style={{ display:"flex", flex:1, overflow:"hidden" }}>
        {/* Left — feedback */}
        <div style={{ flex:1, overflow:"auto", borderRight:"1px solid var(--border)", padding:"24px 28px" }}>
          <div style={{ display:"flex", gap:6, marginBottom:22 }}>
            {(["feedback","preview"] as const).map(t => (
              <button key={t} onClick={() => setTab(t)}
                style={{ padding:"7px 18px", borderRadius:8, border:"none", cursor:"pointer", fontSize:13, fontWeight:500,
                  background:tab===t?"var(--gold-dim)":"transparent",
                  color:tab===t?"var(--gold)":"var(--text3)",
                  borderBottom:tab===t?"2px solid var(--gold)":"2px solid transparent",
                  transition:"all .2s ease" }}>
                {t==="feedback" ? "📋 AI Feedback" : "✨ Improved Version"}
              </button>
            ))}
          </div>

          {tab === "feedback" ? (
            <div className="animate-fade-in">
              {feedback.split("\n").map((line, i) => {
                const tr = line.trim();
                if (!tr) return <div key={i} style={{ height:7 }}/>;
                if (tr.endsWith(":") && tr.length < 55)
                  return <h3 key={i} style={{ color:"var(--gold)", fontSize:13, fontWeight:700, letterSpacing:"0.05em", textTransform:"uppercase", marginTop:22, marginBottom:10, paddingBottom:7, borderBottom:"1px solid var(--border)" }}>{tr.replace(/:$/,"")}</h3>;
                if (tr.startsWith("-") || tr.startsWith("•")) {
                  const isGood = /good|strong|excellent|well|clear/i.test(tr);
                  const isBad  = /missing|weak|lack|no |improve|add|consider/i.test(tr);
                  return (
                    <div key={i} style={{ display:"flex", gap:10, marginBottom:7, padding:"9px 13px",
                      background:isGood?"rgba(74,222,128,0.05)":isBad?"rgba(248,113,113,0.05)":"var(--surface)",
                      borderRadius:8, border:`1px solid ${isGood?"rgba(74,222,128,0.15)":isBad?"rgba(248,113,113,0.15)":"var(--border)"}` }}>
                      {isGood
                        ? <CheckCircle size={13} color="var(--success)" style={{ flexShrink:0, marginTop:2 }}/>
                        : isBad
                          ? <AlertCircle size={13} color="var(--danger)" style={{ flexShrink:0, marginTop:2 }}/>
                          : <ChevronRight size={13} color="var(--text3)" style={{ flexShrink:0, marginTop:2 }}/>}
                      <p style={{ color:"var(--text2)", fontSize:13, lineHeight:1.7 }}>{tr.replace(/^[-•]\s*/,"")}</p>
                    </div>
                  );
                }
                return <p key={i} style={{ color:"var(--text2)", fontSize:13, lineHeight:1.7 }}>{tr}</p>;
              })}
            </div>
          ) : (
            <div className="animate-fade-in" style={{ background:"var(--surface)", borderRadius:12, padding:22, border:"1px solid var(--border)" }}>
              <pre style={{ color:"var(--text2)", fontSize:12, lineHeight:1.8, whiteSpace:"pre-wrap", fontFamily:"inherit" }}>{improved}</pre>
            </div>
          )}
        </div>

        {/* Right — preview */}
        <div style={{ flex:1, padding:"24px 28px", overflow:"auto" }}>
          <p style={{ color:"var(--text2)", fontSize:13, fontWeight:500, marginBottom:16 }}>✨ Improved Resume Preview</p>
          {improved
            ? <ResumePreview content={improved} template="executive" name="improved_resume"/>
            : <div style={{ display:"flex", alignItems:"center", justifyContent:"center", height:"50vh", color:"var(--text3)", fontSize:14 }}>Preview appears here</div>
          }
        </div>
      </div>
    </main>
  );

  // ── Upload screen ─────────────────────────────────────────────────
  return (
    <main style={{ minHeight:"100vh", background:"var(--bg)" }}>
      <div className="orb" style={{ width:400, height:400, background:"rgba(201,168,76,0.06)", top:-100, right:-100 }}/>
      <nav style={{ padding:"18px 28px", borderBottom:"1px solid var(--border)", display:"flex", alignItems:"center", gap:14, position:"relative", zIndex:10 }}>
        <button onClick={() => router.push("/")} style={{ background:"none", border:"none", cursor:"pointer", color:"var(--text2)", display:"flex", alignItems:"center", gap:6, fontSize:13 }}>
          <ArrowLeft size={15}/> Back
        </button>
        <span className="font-display" style={{ color:"var(--text)", fontSize:19 }}>Improve My Resume</span>
      </nav>

      <div style={{ maxWidth:660, margin:"0 auto", padding:"56px 24px", position:"relative", zIndex:10 }}>
        <div className="animate-fade-up" style={{ textAlign:"center", marginBottom:44 }}>
          <h1 className="font-display" style={{ fontSize:46, color:"var(--text)", marginBottom:10 }}>Upload your resume</h1>
          <p style={{ color:"var(--text2)", fontSize:16 }}>Get expert AI feedback and an improved version in seconds</p>
        </div>

        {/* Drop zone */}
        <div className="animate-fade-up delay-1" {...getRootProps()}
          style={{ border:`2px dashed ${isDragActive?"var(--gold)":file?"var(--success)":"var(--border2)"}`, borderRadius:18, padding:"52px 36px", textAlign:"center", cursor:"pointer", transition:"all .3s ease", background:isDragActive?"var(--gold-dim)":file?"rgba(74,222,128,0.04)":"var(--surface)", marginBottom:20 }}>
          <input {...getInputProps()}/>
          {extracting ? (
            <>
              <Loader2 size={38} color="var(--gold)" className="animate-spin" style={{ margin:"0 auto 14px" }}/>
              <p style={{ color:"var(--gold)", fontSize:17, fontWeight:500 }}>Extracting text from {file?.name}…</p>
              <p style={{ color:"var(--text3)", fontSize:13, marginTop:6 }}>Reading your resume, just a moment</p>
            </>
          ) : file ? (
            <>
              <CheckCircle size={38} color="var(--success)" style={{ margin:"0 auto 14px" }}/>
              <p style={{ color:"var(--success)", fontSize:17, fontWeight:500 }}>{file.name}</p>
              <p style={{ color:"var(--text3)", fontSize:13, marginTop:4 }}>
                {(file.size/1024).toFixed(0)} KB
                {resumeText ? ` · ${resumeText.split(/\s+/).length} words extracted` : ""}
                {" · Click to replace"}
              </p>
            </>
          ) : (
            <>
              <Upload size={38} color={isDragActive?"var(--gold)":"var(--text3)"} style={{ margin:"0 auto 14px" }}/>
              <p style={{ color:"var(--text)", fontSize:17, fontWeight:500 }}>
                {isDragActive ? "Drop it here!" : "Drag & drop your resume"}
              </p>
              <p style={{ color:"var(--text3)", fontSize:13, marginTop:7 }}>PDF, DOC, DOCX, or TXT · Max 10MB</p>
            </>
          )}
        </div>

        {/* Manual paste */}
        <div className="animate-fade-up delay-2" style={{ marginBottom:20 }}>
          <label style={{ display:"flex", alignItems:"center", gap:7, color:"var(--text3)", fontSize:12, marginBottom:7 }}>
            <FileText size={13}/>
            {file ? "Extracted text — review and edit if needed" : "Or paste your resume text directly"}
          </label>
          <textarea
            className="input-luxury"
            value={resumeText}
            onChange={e => !extracting && setResumeText(e.target.value)}
            placeholder={extracting ? "Extracting text, please wait…" : "Paste your resume content here…"}
            readOnly={extracting}
            style={{ width:"100%", minHeight:180, padding:14, borderRadius:12, fontSize:13, lineHeight:1.7, resize:"vertical", opacity: extracting ? 0.5 : 1, cursor: extracting ? "not-allowed" : "text" }}
          />
          {resumeText && (
            <p style={{ color:"var(--text3)", fontSize:11, marginTop:5 }}>
              {resumeText.split(/\s+/).filter(Boolean).length} words · {resumeText.length} characters
            </p>
          )}
        </div>

        {error && (
          <div style={{ display:"flex", gap:9, padding:"13px 15px", background:"rgba(248,113,113,0.08)", border:"1px solid rgba(248,113,113,0.25)", borderRadius:10, marginBottom:18 }}>
            <AlertCircle size={15} color="var(--danger)" style={{ flexShrink:0, marginTop:1 }}/>
            <p style={{ color:"var(--danger)", fontSize:13 }}>{error}</p>
          </div>
        )}

        <button
          onClick={handleAnalyze}
          disabled={!resumeText.trim()}
          className="btn-gold animate-fade-up delay-3"
          style={{ width:"100%", padding:15, borderRadius:12, fontSize:15, border:"none", cursor:resumeText.trim()?"pointer":"not-allowed", display:"flex", alignItems:"center", justifyContent:"center", gap:9 }}>
          ✨ Analyze &amp; Improve My Resume
        </button>
      </div>
    </main>
  );
}