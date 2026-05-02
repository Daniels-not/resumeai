"use client";
import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { generateResume, ResumeData, VolunteerEntry } from "../lib/gemini";
import {
  validateStep0, validateStep1, validateStep2,
  validateStep3, validateStep4, validateStep5,
  validateStep6, validateStep7, ValidationError,
} from "../lib/validation";
import ResumePreview from "../components/ResumePreview";
import TagInput from "../components/TagInput";
import ValidationModal from "../components/ValidationModal";
import MonthYearPicker from "../components/MonthYearPicker";
import {
  ArrowLeft, ArrowRight, Plus, Trash2, Loader2, Check,
  Briefcase, Palette, Zap, Minimize2, Terminal, AlertTriangle,
  Camera, X, Upload, Link, GitBranch, MapPin, Globe,
  Target, Clock, FileText, Languages, Heart, Award, BookOpen, Users,
} from "lucide-react";

const TEMPLATES = [
  { id:"executive", name:"Executive", desc:"Formal & authoritative. Navy/gold serif layout for senior roles, law, finance, and C-suite.", icon:<Briefcase size={22}/>, accent:"#c9a84c", photo:"ask", photoNote:"⚠️ Photos on resumes are uncommon in the US and can introduce hiring bias. Recommended only for international applications." },
  { id:"creative",  name:"Creative",  desc:"Two-column sidebar with bold violet accents. Perfect for design, marketing, media, and agencies.", icon:<Palette size={22}/>, accent:"#6d28d9", photo:"yes", photoNote:"✅ Photos are common in creative fields and widely accepted internationally." },
  { id:"modern",    name:"Modern",    desc:"Charcoal header with teal accents. Great for business, consulting, and startups.", icon:<Zap size={22}/>, accent:"#0d9488", photo:"ask", photoNote:"ℹ️ Photos are optional. Depends on your industry and country." },
  { id:"minimal",   name:"Minimal",   desc:"Swiss editorial. Pure black and white, generous whitespace. A timeless safe choice for any industry.", icon:<Minimize2 size={22}/>, accent:"#888", photo:"ask", photoNote:"ℹ️ Photos are optional. Works with or without depending on your field." },
  { id:"tech",      name:"Tech",      desc:"Dark-mode GitHub aesthetic with monospace font. Built for developers, engineers, and data pros.", icon:<Terminal size={22}/>, accent:"#3fb950", photo:"no", photoNote:"", warning:"Photos are almost never used on tech resumes and can hurt your ATS score. We'll skip the photo step for this template." },
];

const STEPS = ["Template","Basics","Links","Target","Experience","Education","Skills","Extras","Your Resume"];

const emptyData = (): ResumeData => ({
  personalInfo: {
    name:"", email:"", phone:"",
    location:"", hasLocation: false,
    linkedin:"", hasLinkedin: false,
    github:"",   hasGithub:   false,
    portfolio:"",hasPortfolio:false,
    summary:"",  targetRole:"", yearsExp:"", resumeLength:"",
  },
  experience:[{ company:"",title:"",startDate:"",endDate:"",current:false,bullets:[""] }],
  education:[{ school:"",degree:"",field:"",gradYear:"",gpa:"" }],
  skills:[], languages:[], volunteer:[], awards:[], publications:[], associations:[],
  projects:[], certifications:[],
});

const STEP_NAMES: Record<number, string> = {
  0: "Template Selection",
  1: "Basic Information",
  2: "Online Presence",
  3: "Target & Preferences",
  4: "Work Experience",
  5: "Education",
  6: "Skills",
  7: "The Extras",
};

function YesNo({ value, onChange }: { value: boolean; onChange:(v:boolean)=>void }) {
  return (
    <div style={{ display:"flex", gap:8 }}>
      {(["Yes","No"] as const).map(opt => {
        const active = opt==="Yes" ? value : !value;
        return (
          <button key={opt} onClick={()=>onChange(opt==="Yes")}
            style={{ padding:"6px 20px", borderRadius:8, border:`1px solid ${active?"var(--gold)":"var(--border2)"}`,
              background:active?"var(--gold-dim)":"transparent", color:active?"var(--gold)":"var(--text3)",
              fontSize:13, cursor:"pointer", fontWeight:active?600:400, transition:"all .2s" }}>
            {opt}
          </button>
        );
      })}
    </div>
  );
}

function Card({ title, icon, children }: { title:string; icon:React.ReactNode; children:React.ReactNode }) {
  return (
    <div style={{ background:"var(--surface)", border:"1px solid var(--border)", borderRadius:16, padding:24, marginBottom:18 }}>
      <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:18 }}>
        <span style={{ color:"var(--gold)" }}>{icon}</span>
        <h3 style={{ color:"var(--text)", fontSize:15, fontWeight:600 }}>{title}</h3>
      </div>
      {children}
    </div>
  );
}

export default function BuilderPage() {
  const router = useRouter();
  const [step, setStep]             = useState(0);
  const [template, setTemplate]     = useState("");
  const [showWarn, setShowWarn]     = useState(false);
  const [data, setData]             = useState<ResumeData>(emptyData());
  const [generated, setGenerated]   = useState("");
  const [generating, setGenerating] = useState(false);
  const [genStep, setGenStep]       = useState(0);
  const [photoMode, setPhotoMode]   = useState<"idle"|"ask"|"upload"|"done">("idle");
  const [photoUrl, setPhotoUrl]     = useState<string|null>(null);
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);
  const [showValidation, setShowValidation]     = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const genSteps = ["Analyzing your information…","Crafting compelling bullets…","Optimizing for ATS…","Polishing final touches…","Almost done…"];
  const tpl = TEMPLATES.find(t => t.id === template);

  function tryAdvance(errors: ValidationError[], goTo: () => void) {
    if (errors.length > 0) { setValidationErrors(errors); setShowValidation(true); }
    else goTo();
  }

  const setP = (f:string, v:unknown) =>
    setData(d => ({ ...d, personalInfo:{ ...d.personalInfo, [f]:v } }));

  const setExp = (i:number, f:string, v:unknown) =>
    setData(d => { const e=[...d.experience]; e[i]={...e[i],[f]:v}; return {...d,experience:e}; });

  const setBullet = (ei:number, bi:number, v:string) =>
    setData(d => {
      const e=[...d.experience]; const b=[...e[ei].bullets];
      b[bi]=v; e[ei]={...e[ei],bullets:b}; return {...d,experience:e};
    });

  const setEdu = (i:number, f:string, v:string) =>
    setData(d => { const e=[...d.education]; e[i]={...e[i],[f]:v}; return {...d,education:e}; });

  const setVol = (i:number, f:keyof VolunteerEntry, v:string) =>
    setData(d => { const e=[...d.volunteer]; e[i]={...e[i],[f]:v}; return {...d,volunteer:e}; });

  function handlePhotoFile(e:React.ChangeEvent<HTMLInputElement>) {
    const f=e.target.files?.[0]; if(!f) return;
    const r=new FileReader();
    r.onload=ev => {
      const url=ev.target?.result as string;
      setPhotoUrl(url); setP("photoDataUrl",url); setPhotoMode("done");
    };
    r.readAsDataURL(f);
  }

  function afterPhoto() { setPhotoMode("idle"); setStep(2); }

  function handleNextFromBasics() {
    const errors = validateStep1(data);
    if (errors.length > 0) { setValidationErrors(errors); setShowValidation(true); return; }
    if (!tpl) return;
    if (tpl.photo==="no") { setStep(2); return; }
    setPhotoMode("ask");
  }

  async function handleGenerate() {
    const errors = validateStep7(data);
    if (errors.length > 0) { setValidationErrors(errors); setShowValidation(true); return; }
    setGenerating(true); setStep(8);
    let s=0;
    const iv=setInterval(()=>{ s=Math.min(s+1,genSteps.length-1); setGenStep(s); },1600);
    try {
      const result=await generateResume(data, template);
      clearInterval(iv); setGenerated(result); setGenerating(false);
    } catch(e) { clearInterval(iv); console.error(e); setGenerating(false); }
  }

  const iStyle:React.CSSProperties = { width:"100%", padding:"12px 15px", borderRadius:10, fontSize:14 };
  const lStyle:React.CSSProperties = { color:"var(--text2)", fontSize:13, display:"block", marginBottom:6 };

  function navBtns(back: number, onNext: () => void, nextLabel = "Continue") {
    return (
      <div style={{ display:"flex", gap:12, marginTop:8 }}>
        <button onClick={()=>setStep(back)} className="btn-ghost"
          style={{ padding:"13px 22px", borderRadius:10, fontSize:15, cursor:"pointer" }}>
          <ArrowLeft size={16}/>
        </button>
        <button onClick={onNext} className="btn-gold"
          style={{ padding:"13px 30px", borderRadius:10, fontSize:15, border:"none", cursor:"pointer", display:"flex", alignItems:"center", gap:8 }}>
          {nextLabel} <ArrowRight size={16}/>
        </button>
      </div>
    );
  }

  // ── Photo overlay ─────────────────────────────────────────────────
  if (photoMode !== "idle") return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background:"rgba(4,6,12,0.97)", backdropFilter:"blur(12px)" }}>
      <div className="animate-fade-up w-full max-w-md"
        style={{ background:"var(--surface)", border:`1px solid ${tpl?.accent||"var(--border2)"}40`, borderRadius:20, padding:36 }}>

        {photoMode==="ask" && <>
          <div style={{ width:56,height:56,borderRadius:"50%",background:`${tpl?.accent}20`,border:`2px solid ${tpl?.accent}60`,display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 20px" }}>
            <Camera size={24} color={tpl?.accent}/>
          </div>
          <h2 className="font-display" style={{ fontSize:26,color:"var(--text)",textAlign:"center",marginBottom:10 }}>Add a profile photo?</h2>
          {tpl?.photoNote && (
            <div style={{ background:"rgba(255,255,255,0.04)",border:"1px solid var(--border)",borderRadius:10,padding:"12px 14px",marginBottom:22 }}>
              <p style={{ color:"var(--text2)",fontSize:13,lineHeight:1.6 }}>{tpl.photoNote}</p>
            </div>
          )}
          <div style={{ display:"flex",gap:10,flexDirection:"column" }}>
            <button onClick={()=>setPhotoMode("upload")} className="btn-gold"
              style={{ padding:13,borderRadius:10,fontSize:14,border:"none",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:8 }}>
              <Upload size={15}/> Yes, upload a photo
            </button>
            <button onClick={afterPhoto} className="btn-ghost"
              style={{ padding:13,borderRadius:10,fontSize:14,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:8 }}>
              No thanks, continue without
            </button>
          </div>
        </>}

        {photoMode==="upload" && <>
          <h2 className="font-display" style={{ fontSize:24,color:"var(--text)",marginBottom:6 }}>Upload your photo</h2>
          <p style={{ color:"var(--text2)",fontSize:13,marginBottom:22 }}>Square photos work best. JPG, PNG, or WEBP.</p>
          <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" onChange={handlePhotoFile} style={{ display:"none" }}/>
          <div onClick={()=>fileRef.current?.click()}
            style={{ border:"2px dashed var(--border2)",borderRadius:14,padding:"44px 24px",textAlign:"center",cursor:"pointer",marginBottom:18,transition:"border-color .2s" }}
            onMouseEnter={e=>(e.currentTarget.style.borderColor=tpl?.accent||"var(--gold)")}
            onMouseLeave={e=>(e.currentTarget.style.borderColor="var(--border2)")}>
            <Camera size={32} color="var(--text3)" style={{ margin:"0 auto 12px" }}/>
            <p style={{ color:"var(--text)",fontSize:15,fontWeight:500 }}>Click to choose photo</p>
            <p style={{ color:"var(--text3)",fontSize:12,marginTop:6 }}>JPG · PNG · WEBP</p>
          </div>
          <button onClick={afterPhoto} className="btn-ghost"
            style={{ width:"100%",padding:11,borderRadius:10,fontSize:13,cursor:"pointer" }}>
            Skip — continue without photo
          </button>
        </>}

        {photoMode==="done" && photoUrl && <>
          <h2 className="font-display" style={{ fontSize:24,color:"var(--text)",textAlign:"center",marginBottom:20 }}>Looking good! 👌</h2>
          <div style={{ display:"flex",justifyContent:"center",marginBottom:22 }}>
            <div style={{ position:"relative",display:"inline-block" }}>
              <img src={photoUrl} alt="Preview" style={{ width:110,height:110,borderRadius:"50%",objectFit:"cover",border:`3px solid ${tpl?.accent}` }}/>
              <button onClick={()=>{ setPhotoUrl(null); setP("photoDataUrl",undefined); setPhotoMode("ask"); }}
                style={{ position:"absolute",top:-4,right:-4,width:26,height:26,borderRadius:"50%",background:"var(--danger)",border:"none",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center" }}>
                <X size={13} color="white"/>
              </button>
            </div>
          </div>
          <div style={{ display:"flex",gap:10 }}>
            <button onClick={()=>setPhotoMode("upload")} className="btn-ghost"
              style={{ flex:1,padding:12,borderRadius:10,fontSize:13,cursor:"pointer" }}>Change</button>
            <button onClick={afterPhoto} className="btn-gold"
              style={{ flex:2,padding:12,borderRadius:10,fontSize:14,border:"none",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:7 }}>
              <Check size={15}/> Use this photo
            </button>
          </div>
        </>}
      </div>
    </div>
  );

  // ── Main layout ───────────────────────────────────────────────────
  return (
    <main style={{ minHeight:"100vh", background:"var(--bg)" }}>

      {showValidation && (
        <ValidationModal
          errors={validationErrors}
          stepName={STEP_NAMES[step]}
          onClose={() => setShowValidation(false)}
        />
      )}

      <nav style={{ padding:"14px 28px",borderBottom:"1px solid var(--border)",display:"flex",alignItems:"center",gap:14,position:"sticky",top:0,zIndex:20,background:"var(--bg2)" }}>
        <button onClick={()=>router.push("/")} style={{ background:"none",border:"none",cursor:"pointer",color:"var(--text2)",display:"flex",alignItems:"center",gap:6,fontSize:13 }}>
          <ArrowLeft size={15}/> Home
        </button>
        <span style={{ color:"var(--border2)" }}>|</span>
        <div style={{ display:"flex",alignItems:"center",gap:0,flex:1,overflowX:"auto",paddingBottom:2 }}>
          {STEPS.map((s,i) => (
            <div key={s} style={{ display:"flex",alignItems:"center",flexShrink:0 }}>
              <button onClick={()=>i<step&&setStep(i)}
                style={{ display:"flex",alignItems:"center",gap:5,padding:"4px 8px",borderRadius:8,border:"none",cursor:i<step?"pointer":"default",background:"none",whiteSpace:"nowrap" }}>
                <div style={{ width:20,height:20,borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,fontWeight:700,flexShrink:0,transition:"all .3s",
                  background:i<step?"var(--gold-dim)":i===step?"linear-gradient(135deg,var(--gold),var(--gold2))":"var(--surface)",
                  color:i<step?"var(--gold)":i===step?"#080a0f":"var(--text3)",
                  border:`1px solid ${i<step?"var(--gold)":i===step?"transparent":"var(--border)"}` }}>
                  {i<step?<Check size={10}/>:i+1}
                </div>
                <span style={{ fontSize:11,color:i===step?"var(--text)":i<step?"var(--gold)":"var(--text3)" }}>{s}</span>
              </button>
              {i<STEPS.length-1 && <div style={{ width:12,height:1,background:i<step?"var(--gold)":"var(--border)",flexShrink:0 }}/>}
            </div>
          ))}
        </div>
      </nav>

      <div style={{ maxWidth:step===8?1200:700, margin:"0 auto", padding:"44px 22px" }}>

        {/* ══ STEP 0 — Template ══════════════════════════════════════════ */}
        {step===0 && (
          <div className="animate-fade-up">
            <h1 className="font-display" style={{ fontSize:46,color:"var(--text)",marginBottom:10 }}>Choose your style</h1>
            <p style={{ color:"var(--text2)",fontSize:15,marginBottom:36 }}>Pick the template that matches your industry and personality.</p>

            {showWarn && tpl?.warning && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
                style={{ background:"rgba(4,6,12,0.97)",backdropFilter:"blur(12px)" }}>
                <div className="animate-fade-up w-full max-w-md"
                  style={{ background:"var(--surface)",border:"1px solid rgba(251,191,36,0.3)",borderRadius:20,padding:36 }}>
                  <div style={{ width:52,height:52,background:"rgba(251,191,36,0.1)",border:"1px solid rgba(251,191,36,0.4)",borderRadius:14,display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 18px" }}>
                    <AlertTriangle size={24} color="var(--warn)"/>
                  </div>
                  <h2 className="font-display" style={{ fontSize:24,color:"var(--text)",textAlign:"center",marginBottom:12 }}>Note about Tech resumes</h2>
                  <p style={{ color:"var(--text2)",fontSize:14,lineHeight:1.7,textAlign:"center",marginBottom:24 }}>{tpl.warning}</p>
                  <div style={{ display:"flex",gap:10 }}>
                    <button onClick={()=>{ setTemplate(""); setShowWarn(false); }} className="btn-ghost"
                      style={{ flex:1,padding:12,borderRadius:10,fontSize:13,cursor:"pointer" }}>Go back</button>
                    <button onClick={()=>{ setShowWarn(false); setStep(1); }} className="btn-gold"
                      style={{ flex:2,padding:12,borderRadius:10,fontSize:14,border:"none",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:7 }}>
                      <Check size={15}/> Got it, continue
                    </button>
                  </div>
                </div>
              </div>
            )}

            <div style={{ display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(260px,1fr))",gap:16,marginBottom:36 }}>
              {TEMPLATES.map(t => (
                <button key={t.id} onClick={()=>{ setTemplate(t.id); if(t.warning) setShowWarn(true); }}
                  style={{ padding:"24px 20px",borderRadius:16,border:`2px solid ${template===t.id?t.accent:"var(--border2)"}`,background:template===t.id?`${t.accent}12`:"var(--surface)",cursor:"pointer",textAlign:"left",transition:"all .25s",transform:template===t.id?"translateY(-2px)":"none",boxShadow:template===t.id?`0 12px 40px ${t.accent}20`:"none" }}>
                  <div style={{ color:template===t.id?t.accent:"var(--text3)",marginBottom:12 }}>{t.icon}</div>
                  <h3 style={{ color:"var(--text)",fontSize:17,fontWeight:600,marginBottom:6 }}>{t.name}</h3>
                  <p style={{ color:"var(--text2)",fontSize:13,lineHeight:1.5,marginBottom:10 }}>{t.desc}</p>
                  {t.id==="tech" && <p style={{ fontSize:11,color:"var(--warn)",display:"flex",alignItems:"center",gap:4 }}><AlertTriangle size={10}/>Photo not recommended</p>}
                  {t.photo==="yes" && <p style={{ fontSize:11,color:"var(--success)" }}>✓ Photo supported</p>}
                  {template===t.id && <p style={{ marginTop:10,display:"flex",alignItems:"center",gap:5,color:t.accent,fontSize:13,fontWeight:600 }}><Check size={13}/> Selected</p>}
                </button>
              ))}
            </div>
            <button
              disabled={!template}
              onClick={() => tryAdvance(validateStep0(template), () => { if(!tpl?.warning) setStep(1); })}
              className="btn-gold"
              style={{ padding:"14px 32px",borderRadius:10,fontSize:15,border:"none",cursor:template?"pointer":"not-allowed",display:"flex",alignItems:"center",gap:8 }}>
              Continue <ArrowRight size={16}/>
            </button>
          </div>
        )}

        {/* ══ STEP 1 — Basics ════════════════════════════════════════════ */}
        {step===1 && (
          <div className="animate-fade-up">
            <h1 className="font-display" style={{ fontSize:46,color:"var(--text)",marginBottom:10 }}>The basics</h1>
            <p style={{ color:"var(--text2)",fontSize:15,marginBottom:36 }}>Your core identity — name, contact, and summary.</p>

            <Card title="Contact Information" icon={<Briefcase size={16}/>}>
              <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:16 }}>
                <div style={{ gridColumn:"1 / -1" }}>
                  <label style={lStyle}>Full Name *</label>
                  <input className="input-luxury" placeholder="Jane Doe" value={data.personalInfo.name} onChange={e=>setP("name",e.target.value)} style={iStyle}/>
                </div>
                <div>
                  <label style={lStyle}>Email *</label>
                  <input className="input-luxury" type="email" placeholder="jane@example.com" value={data.personalInfo.email} onChange={e=>setP("email",e.target.value)} style={iStyle}/>
                </div>
                <div>
                  <label style={lStyle}>Phone *</label>
                  <input className="input-luxury" type="tel" placeholder="+1 (555) 123-4567" value={data.personalInfo.phone} onChange={e=>setP("phone",e.target.value)} style={iStyle}/>
                </div>
              </div>
            </Card>

            <Card title="Location" icon={<MapPin size={16}/>}>
              <div style={{ display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:14 }}>
                <div>
                  <p style={{ color:"var(--text)",fontSize:14,fontWeight:500,marginBottom:3 }}>Do you want to include your location?</p>
                  <p style={{ color:"var(--text3)",fontSize:12 }}>City and state is enough — no street address needed.</p>
                </div>
                <YesNo value={data.personalInfo.hasLocation} onChange={v=>setP("hasLocation",v)}/>
              </div>
              {data.personalInfo.hasLocation && (
                <div className="animate-fade-in">
                  <input className="input-luxury" placeholder="e.g. New York, NY  or  Remote" value={data.personalInfo.location}
                    onChange={e=>setP("location",e.target.value)} style={iStyle}/>
                </div>
              )}
            </Card>

            <div style={{ marginBottom:18 }}>
              <label style={lStyle}>Professional Summary <span style={{ color:"var(--text3)" }}>(optional — AI writes one if left blank)</span></label>
              <textarea className="input-luxury" placeholder="Results-driven engineer with 5+ years building scalable systems…"
                value={data.personalInfo.summary} onChange={e=>setP("summary",e.target.value)}
                style={{ ...iStyle,minHeight:96,lineHeight:1.7,resize:"vertical" }}/>
            </div>

            {navBtns(0, handleNextFromBasics)}
          </div>
        )}

        {/* ══ STEP 2 — Links ═════════════════════════════════════════════ */}
        {step===2 && (
          <div className="animate-fade-up">
            <h1 className="font-display" style={{ fontSize:46,color:"var(--text)",marginBottom:10 }}>Online presence</h1>
            <p style={{ color:"var(--text2)",fontSize:15,marginBottom:36 }}>Only add what you have and want recruiters to see.</p>

            <Card title="LinkedIn" icon={<Link size={16}/>}>
              <div style={{ display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:14 }}>
                <div>
                  <p style={{ color:"var(--text)",fontSize:14,fontWeight:500,marginBottom:3 }}>Do you want to add your LinkedIn?</p>
                  <p style={{ color:"var(--text3)",fontSize:12 }}>Highly recommended — most recruiters check it.</p>
                </div>
                <YesNo value={data.personalInfo.hasLinkedin} onChange={v=>setP("hasLinkedin",v)}/>
              </div>
              {data.personalInfo.hasLinkedin && (
                <div className="animate-fade-in">
                  <input className="input-luxury" placeholder="linkedin.com/in/janedoe" value={data.personalInfo.linkedin}
                    onChange={e=>setP("linkedin",e.target.value)} style={iStyle}/>
                  <p style={{ color:"var(--text3)",fontSize:12,marginTop:6 }}>Tip: make sure your LinkedIn is up to date before you apply.</p>
                </div>
              )}
            </Card>

            <Card title="GitHub" icon={<GitBranch size={16}/>}>
              <div style={{ display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:14 }}>
                <div>
                  <p style={{ color:"var(--text)",fontSize:14,fontWeight:500,marginBottom:3 }}>Do you want to add your GitHub?</p>
                  <p style={{ color:"var(--text3)",fontSize:12 }}>Essential for tech roles, great for any developer.</p>
                </div>
                <YesNo value={data.personalInfo.hasGithub} onChange={v=>setP("hasGithub",v)}/>
              </div>
              {data.personalInfo.hasGithub && (
                <div className="animate-fade-in">
                  <input className="input-luxury" placeholder="github.com/janedoe" value={data.personalInfo.github}
                    onChange={e=>setP("github",e.target.value)} style={iStyle}/>
                </div>
              )}
            </Card>

            <Card title="Portfolio / Website" icon={<Globe size={16}/>}>
              <div style={{ display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:14 }}>
                <div>
                  <p style={{ color:"var(--text)",fontSize:14,fontWeight:500,marginBottom:3 }}>Do you want to add a portfolio or website?</p>
                  <p style={{ color:"var(--text3)",fontSize:12 }}>Great for creative, design, and developer roles.</p>
                </div>
                <YesNo value={data.personalInfo.hasPortfolio} onChange={v=>setP("hasPortfolio",v)}/>
              </div>
              {data.personalInfo.hasPortfolio && (
                <div className="animate-fade-in">
                  <input className="input-luxury" placeholder="janedoe.dev" value={data.personalInfo.portfolio}
                    onChange={e=>setP("portfolio",e.target.value)} style={iStyle}/>
                </div>
              )}
            </Card>

            {navBtns(1, () => tryAdvance(validateStep2(data), () => setStep(3)))}
          </div>
        )}

        {/* ══ STEP 3 — Target ════════════════════════════════════════════ */}
        {step===3 && (
          <div className="animate-fade-up">
            <h1 className="font-display" style={{ fontSize:46,color:"var(--text)",marginBottom:10 }}>Target & preferences</h1>
            <p style={{ color:"var(--text2)",fontSize:15,marginBottom:36 }}>Helps AI tailor your resume to exactly the right role and length.</p>

            <Card title="Target Role" icon={<Target size={16}/>}>
              <label style={lStyle}>What job title or role are you applying for? <span style={{ color:"var(--gold)",fontSize:12 }}>(highly recommended)</span></label>
              <input className="input-luxury" placeholder="e.g. Senior Product Manager, UX Designer, Software Engineer"
                value={data.personalInfo.targetRole} onChange={e=>setP("targetRole",e.target.value)} style={iStyle}/>
              <p style={{ color:"var(--text3)",fontSize:12,marginTop:7,lineHeight:1.5 }}>
                The more specific, the better — AI will tailor every keyword, bullet point, and tone to this role.
              </p>
            </Card>

            <Card title="Experience Level" icon={<Clock size={16}/>}>
              <label style={lStyle}>How many years of professional experience do you have?</label>
              <div style={{ display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:10 }}>
                {["0–1 years","1–3 years","3–5 years","5–10 years","10–15 years","15+ years"].map(opt=>(
                  <button key={opt} onClick={()=>setP("yearsExp",opt)}
                    style={{ padding:"11px 8px",borderRadius:10,border:`1px solid ${data.personalInfo.yearsExp===opt?"var(--gold)":"var(--border)"}`,background:data.personalInfo.yearsExp===opt?"var(--gold-dim)":"var(--surface2)",color:data.personalInfo.yearsExp===opt?"var(--gold)":"var(--text2)",fontSize:13,cursor:"pointer",fontWeight:data.personalInfo.yearsExp===opt?600:400,transition:"all .2s",textAlign:"center" }}>
                    {opt}
                  </button>
                ))}
              </div>
            </Card>

            <Card title="Resume Length" icon={<FileText size={16}/>}>
              <label style={lStyle}>How long should your resume be?</label>
              <div style={{ display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:10 }}>
                {[
                  { val:"1 page", desc:"Best for under 5 years" },
                  { val:"2 pages", desc:"Senior or extensive history" },
                  { val:"AI decides", desc:"Let AI judge from your info" },
                ].map(({val,desc})=>(
                  <button key={val} onClick={()=>setP("resumeLength",val)}
                    style={{ padding:"14px 12px",borderRadius:12,border:`1px solid ${data.personalInfo.resumeLength===val?"var(--gold)":"var(--border)"}`,background:data.personalInfo.resumeLength===val?"var(--gold-dim)":"var(--surface2)",cursor:"pointer",textAlign:"center",transition:"all .2s" }}>
                    <p style={{ color:data.personalInfo.resumeLength===val?"var(--gold)":"var(--text)",fontSize:14,fontWeight:600,marginBottom:4 }}>{val}</p>
                    <p style={{ color:"var(--text3)",fontSize:11,lineHeight:1.4 }}>{desc}</p>
                  </button>
                ))}
              </div>
            </Card>

            {navBtns(2, () => tryAdvance(validateStep3(data), () => setStep(4)))}
          </div>
        )}

        {/* ══ STEP 4 — Experience ════════════════════════════════════════ */}
        {step===4 && (
          <div className="animate-fade-up">
            <h1 className="font-display" style={{ fontSize:46,color:"var(--text)",marginBottom:10 }}>Work experience</h1>
            <p style={{ color:"var(--text2)",fontSize:15,marginBottom:36 }}>Add your roles. The more detail, the better AI can amplify your bullets.</p>

            {data.experience.map((exp,i)=>(
              <div key={i} style={{ background:"var(--surface)",border:"1px solid var(--border)",borderRadius:16,padding:24,marginBottom:18 }}>
                <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:18 }}>
                  <span style={{ color:"var(--gold)",fontSize:12,fontWeight:600,letterSpacing:"0.06em",textTransform:"uppercase" }}>Role {i+1}</span>
                  {data.experience.length>1 && (
                    <button onClick={()=>setData(d=>({...d,experience:d.experience.filter((_,x)=>x!==i)}))}
                      style={{ background:"none",border:"none",cursor:"pointer",color:"var(--danger)" }}>
                      <Trash2 size={15}/>
                    </button>
                  )}
                </div>

                {/* Title & Company */}
                <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:14,marginBottom:14 }}>
                  <div>
                    <label style={lStyle}>Job Title *</label>
                    <input className="input-luxury" placeholder="Senior Software Engineer"
                      value={exp.title} onChange={e=>setExp(i,"title",e.target.value)} style={iStyle}/>
                  </div>
                  <div>
                    <label style={lStyle}>Company *</label>
                    <input className="input-luxury" placeholder="Acme Corp"
                      value={exp.company} onChange={e=>setExp(i,"company",e.target.value)} style={iStyle}/>
                  </div>
                </div>

                {/* ── Date pickers ── */}
                <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:14,marginBottom:16 }}>
                  <div>
                    <label style={lStyle}>Start Date *</label>
                    <MonthYearPicker
                      value={exp.startDate}
                      onChange={(v: string) => setExp(i,"startDate",v)}
                      placeholder="Select start date"
                    />
                  </div>
                  <div>
                    <label style={lStyle}>End Date</label>
                    <MonthYearPicker
                      value={exp.endDate}
                      onChange={(v: string) => setExp(i,"endDate",v)}
                      placeholder="Select end date"
                      allowPresent
                    />
                  </div>
                </div>

                {/* Bullets */}
                <label style={lStyle}>Key achievements — add numbers &amp; metrics for maximum impact!</label>
                {exp.bullets.map((b,bi)=>(
                  <div key={bi} style={{ display:"flex",gap:8,marginBottom:7 }}>
                    <input className="input-luxury"
                      placeholder="e.g. Reduced API latency by 60% through query optimization and caching"
                      value={b} onChange={e=>setBullet(i,bi,e.target.value)}
                      style={{ flex:1,padding:"11px 14px",borderRadius:9,fontSize:13 }}/>
                    {exp.bullets.length>1 && (
                      <button onClick={()=>setExp(i,"bullets",exp.bullets.filter((_,x)=>x!==bi))}
                        style={{ background:"none",border:"none",cursor:"pointer",color:"var(--text3)" }}>
                        <Trash2 size={13}/>
                      </button>
                    )}
                  </div>
                ))}
                <button onClick={()=>setExp(i,"bullets",[...exp.bullets,""])}
                  style={{ background:"none",border:"none",cursor:"pointer",color:"var(--gold)",fontSize:13,display:"flex",alignItems:"center",gap:6,marginTop:4 }}>
                  <Plus size={13}/> Add bullet
                </button>
              </div>
            ))}

            <button
              onClick={()=>setData(d=>({...d,experience:[...d.experience,{company:"",title:"",startDate:"",endDate:"",current:false,bullets:[""]}]}))}
              className="btn-ghost"
              style={{ width:"100%",padding:13,borderRadius:12,fontSize:14,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:8,marginBottom:32 }}>
              <Plus size={15}/> Add Another Role
            </button>

            {navBtns(3, () => tryAdvance(validateStep4(data), () => setStep(5)))}
          </div>
        )}

        {/* ══ STEP 5 — Education ═════════════════════════════════════════ */}
        {step===5 && (
          <div className="animate-fade-up">
            <h1 className="font-display" style={{ fontSize:46,color:"var(--text)",marginBottom:10 }}>Education</h1>
            <p style={{ color:"var(--text2)",fontSize:15,marginBottom:36 }}>Your academic background.</p>

            {data.education.map((edu,i)=>(
              <div key={i} style={{ background:"var(--surface)",border:"1px solid var(--border)",borderRadius:16,padding:24,marginBottom:18 }}>
                <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:14 }}>
                  {[
                    {f:"school",   l:"School / University *", ph:"Oakwood University", full:true},
                    {f:"degree",   l:"Degree *",               ph:"Bachelor of Science"},
                    {f:"field",    l:"Field of Study *",       ph:"Computer Science"},
                    {f:"gradYear", l:"Graduation Year",        ph:"2025"},
                    {f:"gpa",      l:"GPA (optional)",         ph:"3.8"},
                  ].map(({f,l,ph,full})=>(
                    <div key={f} style={{ gridColumn:full?"1 / -1":undefined }}>
                      <label style={lStyle}>{l}</label>
                      <input className="input-luxury" placeholder={ph}
                        value={(edu as Record<string,string>)[f]||""}
                        onChange={e=>setEdu(i,f,e.target.value)} style={iStyle}/>
                    </div>
                  ))}
                </div>
              </div>
            ))}

            {navBtns(4, () => tryAdvance(validateStep5(data), () => setStep(6)))}
          </div>
        )}

        {/* ══ STEP 6 — Skills ════════════════════════════════════════════ */}
        {step===6 && (
          <div className="animate-fade-up">
            <h1 className="font-display" style={{ fontSize:46,color:"var(--text)",marginBottom:10 }}>Skills</h1>
            <p style={{ color:"var(--text2)",fontSize:15,marginBottom:36 }}>Type each one and press Enter or Add. Click any tag to edit it.</p>

            <Card title="Your Skills" icon={<Zap size={16}/>}>
              <TagInput
                label="Technical & soft skills"
                sublabel="e.g. React, Leadership, SQL, Figma — add one at a time"
                placeholder="Type a skill and press Enter…"
                tags={data.skills.filter(Boolean)}
                onChange={tags=>setData(d=>({...d,skills:tags}))}
              />
            </Card>

            <Card title="Languages Spoken" icon={<Languages size={16}/>}>
              <TagInput
                label="Languages you speak"
                sublabel="Optional — great for international roles"
                placeholder="Type a language and press Enter…"
                tags={data.languages}
                onChange={tags=>setData(d=>({...d,languages:tags}))}
              />
            </Card>

            <Card title="Certifications" icon={<Award size={16}/>}>
              <TagInput
                label="Professional certifications"
                sublabel="Optional — e.g. AWS Solutions Architect (2023)"
                placeholder="Type a certification and press Enter…"
                tags={data.certifications||[]}
                onChange={tags=>setData(d=>({...d,certifications:tags}))}
              />
            </Card>

            {navBtns(5, () => tryAdvance(validateStep6(data), () => setStep(7)))}
          </div>
        )}

        {/* ══ STEP 7 — Extras ════════════════════════════════════════════ */}
        {step===7 && (
          <div className="animate-fade-up">
            <h1 className="font-display" style={{ fontSize:46,color:"var(--text)",marginBottom:10 }}>The extras</h1>
            <p style={{ color:"var(--text2)",fontSize:15,marginBottom:36 }}>These set you apart. Add what applies — skip what doesn&apos;t.</p>

            <Card title="Notable Projects" icon={<Globe size={16}/>}>
              {(data.projects||[]).length===0 ? (
                <button onClick={()=>setData(d=>({...d,projects:[{name:"",description:"",tech:"",link:""}]}))}
                  style={{ background:"none",border:"1px dashed var(--border2)",borderRadius:10,padding:"14px 18px",color:"var(--text3)",fontSize:13,cursor:"pointer",width:"100%",display:"flex",alignItems:"center",justifyContent:"center",gap:7 }}>
                  <Plus size={14}/> Add a project
                </button>
              ):(data.projects||[]).map((proj,i)=>(
                <div key={i} style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:16,paddingBottom:16,borderBottom:"1px solid var(--border)" }}>
                  <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",gridColumn:"1 / -1" }}>
                    <span style={{ color:"var(--gold)",fontSize:12,fontWeight:600 }}>Project {i+1}</span>
                    <button onClick={()=>setData(d=>({...d,projects:(d.projects||[]).filter((_,x)=>x!==i)}))}
                      style={{ background:"none",border:"none",cursor:"pointer",color:"var(--danger)" }}><Trash2 size={14}/></button>
                  </div>
                  {[
                    {f:"name",        l:"Project Name",    ph:"My Awesome App",                full:true},
                    {f:"description", l:"What it does",    ph:"A brief description and impact",full:true},
                    {f:"tech",        l:"Tech Stack",      ph:"React, Node.js, PostgreSQL"},
                    {f:"link",        l:"Link (optional)", ph:"github.com/you/project"},
                  ].map(({f,l,ph,full})=>(
                    <div key={f} style={{ gridColumn:full?"1 / -1":undefined }}>
                      <label style={lStyle}>{l}</label>
                      <input className="input-luxury" placeholder={ph}
                        value={(proj as Record<string,string>)[f]||""}
                        onChange={e=>{ const p=[...(data.projects||[])]; (p[i] as Record<string,string>)[f]=e.target.value; setData(d=>({...d,projects:p})); }}
                        style={iStyle}/>
                    </div>
                  ))}
                </div>
              ))}
              {(data.projects||[]).length>0 && (
                <button onClick={()=>setData(d=>({...d,projects:[...(d.projects||[]),{name:"",description:"",tech:"",link:""}]}))}
                  style={{ background:"none",border:"none",cursor:"pointer",color:"var(--gold)",fontSize:13,display:"flex",alignItems:"center",gap:6,marginTop:4 }}>
                  <Plus size={13}/> Add another project
                </button>
              )}
            </Card>

            <Card title="Volunteer & Community Work" icon={<Heart size={16}/>}>
              <p style={{ color:"var(--text2)",fontSize:13,marginBottom:14,lineHeight:1.6 }}>
                Community involvement is especially valued for recent grads and mission-driven roles. Don&apos;t skip this!
              </p>
              {data.volunteer.length===0 ? (
                <button onClick={()=>setData(d=>({...d,volunteer:[{org:"",role:"",period:"",description:""}]}))}
                  style={{ background:"none",border:"1px dashed var(--border2)",borderRadius:10,padding:"14px 18px",color:"var(--text3)",fontSize:13,cursor:"pointer",width:"100%",display:"flex",alignItems:"center",justifyContent:"center",gap:7 }}>
                  <Plus size={14}/> Add volunteer experience
                </button>
              ):data.volunteer.map((v,i)=>(
                <div key={i} style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:16,paddingBottom:16,borderBottom:"1px solid var(--border)" }}>
                  <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",gridColumn:"1 / -1" }}>
                    <span style={{ color:"var(--gold)",fontSize:12,fontWeight:600 }}>Entry {i+1}</span>
                    <button onClick={()=>setData(d=>({...d,volunteer:d.volunteer.filter((_,x)=>x!==i)}))}
                      style={{ background:"none",border:"none",cursor:"pointer",color:"var(--danger)" }}><Trash2 size={14}/></button>
                  </div>
                  {([
                    {f:"org"         as keyof VolunteerEntry, l:"Organization", ph:"Habitat for Humanity",                        full:true},
                    {f:"role"        as keyof VolunteerEntry, l:"Your Role",    ph:"Volunteer Coordinator"},
                    {f:"period"      as keyof VolunteerEntry, l:"Period",       ph:"2022–Present"},
                    {f:"description" as keyof VolunteerEntry, l:"What you did", ph:"Led team of 10 volunteers, organized events", full:true},
                  ] as {f:keyof VolunteerEntry,l:string,ph:string,full?:boolean}[]).map(({f,l,ph,full})=>(
                    <div key={f} style={{ gridColumn:full?"1 / -1":undefined }}>
                      <label style={lStyle}>{l}</label>
                      <input className="input-luxury" placeholder={ph} value={v[f]||""} onChange={e=>setVol(i,f,e.target.value)} style={iStyle}/>
                    </div>
                  ))}
                </div>
              ))}
              {data.volunteer.length>0 && (
                <button onClick={()=>setData(d=>({...d,volunteer:[...d.volunteer,{org:"",role:"",period:"",description:""}]}))}
                  style={{ background:"none",border:"none",cursor:"pointer",color:"var(--gold)",fontSize:13,display:"flex",alignItems:"center",gap:6,marginTop:4 }}>
                  <Plus size={13}/> Add another
                </button>
              )}
            </Card>

            <Card title="Awards & Honors" icon={<Award size={16}/>}>
              <label style={lStyle}>Dean&apos;s list, scholarships, competitions, recognition <span style={{ color:"var(--text3)" }}>(optional)</span></label>
              <textarea className="input-luxury"
                placeholder={"Dean's List — Fall 2022, Spring 2023\nNational Merit Scholar\nFirst Place — Regional Hackathon 2023"}
                value={data.awards.join("\n")} onChange={e=>setData(d=>({...d,awards:e.target.value.split("\n")}))}
                style={{ ...iStyle,minHeight:88,lineHeight:1.7,resize:"vertical" }}/>
            </Card>

            <Card title="Publications & Research" icon={<BookOpen size={16}/>}>
              <label style={lStyle}>Papers, articles, theses, or research contributions <span style={{ color:"var(--text3)" }}>(optional)</span></label>
              <textarea className="input-luxury"
                placeholder={`"Deep Learning for Medical Imaging" — IEEE Conference 2023\nUndergraduate thesis: "Bias in NLP Models"`}
                value={data.publications.join("\n")} onChange={e=>setData(d=>({...d,publications:e.target.value.split("\n")}))}
                style={{ ...iStyle,minHeight:80,lineHeight:1.7,resize:"vertical" }}/>
            </Card>

            <Card title="Professional Associations" icon={<Users size={16}/>}>
              <label style={lStyle}>Organizations, clubs, professional memberships <span style={{ color:"var(--text3)" }}>(optional)</span></label>
              <textarea className="input-luxury"
                placeholder={"ACM — Student Member\nOakwood University CS Club — Dashboard Lead\nNational Society of Black Engineers (NSBE)"}
                value={data.associations.join("\n")} onChange={e=>setData(d=>({...d,associations:e.target.value.split("\n")}))}
                style={{ ...iStyle,minHeight:80,lineHeight:1.7,resize:"vertical" }}/>
            </Card>

            {navBtns(6, handleGenerate, "✨ Generate My Resume")}
          </div>
        )}

        {/* ══ STEP 8 — Result ════════════════════════════════════════════ */}
        {step===8 && (
          <div className="animate-fade-up" style={{ maxWidth:"100%" }}>
            {generating ? (
              <div style={{ textAlign:"center",padding:"80px 0" }}>
                <div style={{ width:80,height:80,margin:"0 auto 30px",borderRadius:"50%",background:"var(--gold-dim)",border:"2px solid var(--gold)",display:"flex",alignItems:"center",justifyContent:"center" }}>
                  <Loader2 size={32} color="var(--gold)" className="animate-spin"/>
                </div>
                <h2 className="font-display" style={{ fontSize:34,color:"var(--text)",marginBottom:12 }}>Crafting your resume</h2>
                <p style={{ color:"var(--gold)",fontSize:16 }} className="animate-pulse-gold">{genSteps[genStep]}</p>
                <div style={{ display:"flex",justifyContent:"center",gap:6,marginTop:28 }}>
                  {genSteps.map((_,i)=><div key={i} style={{ width:i<=genStep?20:6,height:4,borderRadius:2,background:i<=genStep?"var(--gold)":"var(--border2)",transition:"all .3s" }}/>)}
                </div>
              </div>
            ):generated ? (
              <>
                <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:28,flexWrap:"wrap",gap:12 }}>
                  <div>
                    <h1 className="font-display" style={{ fontSize:38,color:"var(--text)" }}>Your resume is ready ✨</h1>
                    <p style={{ color:"var(--text2)",fontSize:14,marginTop:4 }}>
                      AI-crafted · ATS-optimized · {TEMPLATES.find(t=>t.id===template)?.name} template
                      {data.personalInfo.targetRole?` · Tailored for ${data.personalInfo.targetRole}`:""}
                      {photoUrl?" · Photo included":""}
                    </p>
                  </div>
                  <button onClick={()=>setStep(7)} className="btn-ghost"
                    style={{ padding:"10px 20px",borderRadius:10,fontSize:13,cursor:"pointer",display:"flex",alignItems:"center",gap:7 }}>
                    <ArrowLeft size={13}/> Edit info
                  </button>
                </div>
                <div style={{ height:"72vh" }}>
                  <ResumePreview content={generated} template={template}
                    name={data.personalInfo.name||"resume"} photoDataUrl={photoUrl||undefined}/>
                </div>
              </>
            ):null}
          </div>
        )}

      </div>
    </main>
  );
}