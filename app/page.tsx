"use client";
import { useRouter } from "next/navigation";
import { Upload, Wand2, ArrowRight, Sparkles, Star, Zap, Shield } from "lucide-react";
import BuyMeCoffee from "./components/BuyMeCoffee";

export default function Home() {
  const router = useRouter();

  return (
    <main style={{ minHeight: "100vh", background: "var(--bg)", position: "relative", overflow: "hidden" }}>
      {/* Background orbs */}
      <div className="orb" style={{ width: 700, height: 700, background: "rgba(201,168,76,0.055)", top: -300, right: -250 }} />
      <div className="orb" style={{ width: 500, height: 500, background: "rgba(74,124,247,0.04)", bottom: 0, left: -150 }} />

      {/* Nav */}
      <nav style={{ padding: "22px 40px", display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid var(--border)", position: "relative", zIndex: 10 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 34, height: 34, background: "linear-gradient(135deg,var(--gold),var(--gold2))", borderRadius: 9, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Sparkles size={16} color="#080a0f" />
          </div>
          <span className="font-display" style={{ fontSize: 21, color: "var(--text)", letterSpacing: "-0.01em" }}>ResumeAI</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "var(--success)", background: "rgba(74,222,128,0.08)", border: "1px solid rgba(74,222,128,0.2)", padding: "5px 14px", borderRadius: 20 }}>
          <span style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--success)", display: "inline-block" }} />
          Free · No Sign Up Required
        </div>
      </nav>

      {/* Hero */}
      <section style={{ textAlign: "center", padding: "90px 24px 72px", position: "relative", zIndex: 10 }}>
        <div className="animate-fade-up" style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "var(--gold-dim)", border: "1px solid rgba(201,168,76,0.28)", borderRadius: 100, padding: "5px 16px", marginBottom: 32 }}>
          <Star size={11} color="var(--gold)" fill="var(--gold)" />
          <span style={{ color: "var(--gold)", fontSize: 11, letterSpacing: "0.06em", textTransform: "uppercase", fontWeight: 600 }}>AI-Powered · 100% Free · No Login</span>
          <Star size={11} color="var(--gold)" fill="var(--gold)" />
        </div>

        <h1 className="animate-fade-up delay-1 font-display" style={{ fontSize: "clamp(46px,7vw,88px)", lineHeight: 1.05, letterSpacing: "-0.03em", color: "var(--text)", marginBottom: 22 }}>
          Your resume,<br /><span className="gold-shimmer">reimagined by AI</span>
        </h1>

        <p className="animate-fade-up delay-2" style={{ color: "var(--text2)", fontSize: "clamp(15px,2vw,19px)", maxWidth: 540, margin: "0 auto 52px", lineHeight: 1.75 }}>
          I wanted to update my resume but couldn&apos;t find a free, easy way to do it — so I built one for everyone. No signup, no payment, no struggle.
        </p>

        {/* CTA Cards */}
        <div className="animate-fade-up delay-3" style={{ display: "flex", gap: 18, justifyContent: "center", flexWrap: "wrap", maxWidth: 780, margin: "0 auto" }}>
          <button
            onClick={() => router.push("/improve")}
            style={{ flex: "1 1 320px", maxWidth: 370, background: "var(--surface)", border: "1px solid var(--border2)", borderRadius: 20, padding: "32px 28px", cursor: "pointer", textAlign: "left", transition: "all .3s ease" }}
            onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.borderColor = "var(--gold)"; el.style.transform = "translateY(-4px)"; el.style.boxShadow = "0 20px 60px rgba(201,168,76,0.1)"; }}
            onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.borderColor = "var(--border2)"; el.style.transform = ""; el.style.boxShadow = ""; }}
          >
            <div style={{ width: 48, height: 48, background: "var(--gold-dim)", border: "1px solid rgba(201,168,76,0.3)", borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 18 }}>
              <Upload size={22} color="var(--gold)" />
            </div>
            <h3 className="font-display" style={{ fontSize: 24, color: "var(--text)", marginBottom: 10 }}>Improve My Resume</h3>
            <p style={{ color: "var(--text2)", fontSize: 14, lineHeight: 1.7, marginBottom: 20 }}>Upload your current resume. Get detailed AI feedback and an improved, ATS-optimized version instantly.</p>
            <div style={{ display: "flex", alignItems: "center", gap: 6, color: "var(--gold)", fontSize: 14, fontWeight: 500 }}>Get feedback <ArrowRight size={14} /></div>
          </button>

          <button
            onClick={() => router.push("/builder")}
            style={{ flex: "1 1 320px", maxWidth: 370, background: "linear-gradient(135deg,rgba(201,168,76,0.07),rgba(201,168,76,0.02))", border: "1px solid rgba(201,168,76,0.22)", borderRadius: 20, padding: "32px 28px", cursor: "pointer", textAlign: "left", transition: "all .3s ease" }}
            onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.transform = "translateY(-4px)"; el.style.boxShadow = "0 20px 60px rgba(201,168,76,0.15)"; }}
            onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.transform = ""; el.style.boxShadow = ""; }}
          >
            <div style={{ width: 48, height: 48, background: "var(--gold-dim)", border: "1px solid rgba(201,168,76,0.38)", borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 18 }}>
              <Wand2 size={22} color="var(--gold)" />
            </div>
            <h3 className="font-display" style={{ fontSize: 24, color: "var(--text)", marginBottom: 10 }}>Build From Scratch</h3>
            <p style={{ color: "var(--text2)", fontSize: 14, lineHeight: 1.7, marginBottom: 20 }}>Choose from 5 professional templates. Answer smart questions and let AI craft your perfect resume.</p>
            <div style={{ display: "flex", alignItems: "center", gap: 6, color: "var(--gold)", fontSize: 14, fontWeight: 500 }}>Start building <ArrowRight size={14} /></div>
          </button>
        </div>
      </section>

      {/* Features strip */}
      <section className="animate-fade-up delay-4" style={{ borderTop: "1px solid var(--border)", borderBottom: "1px solid var(--border)", padding: "28px 40px", display: "flex", justifyContent: "center", gap: "clamp(20px,5vw,72px)", flexWrap: "wrap" }}>
        {[
          { icon: <Zap size={15} />, label: "Instant Analysis", desc: "Results in seconds" },
          { icon: <Shield size={15} />, label: "Privacy First", desc: "Zero server storage" },
          { icon: <Star size={15} />, label: "Always Free", desc: "No hidden costs" },
          { icon: <Sparkles size={15} />, label: "ATS Optimized", desc: "Beat the bots" },
        ].map(f => (
          <div key={f.label} style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ color: "var(--gold)" }}>{f.icon}</div>
            <div>
              <p style={{ color: "var(--text)", fontSize: 13, fontWeight: 500 }}>{f.label}</p>
              <p style={{ color: "var(--text3)", fontSize: 12 }}>{f.desc}</p>
            </div>
          </div>
        ))}
      </section>

      {/* Buy Me a Coffee */}
      <BuyMeCoffee />
    </main>
  );
}
