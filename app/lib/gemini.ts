async function callAPI(prompt: string): Promise<string> {
  const res = await fetch("/api/gemini", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.7, maxOutputTokens: 8192 },
    }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error || `Request failed (${res.status})`);
  }
  const data = await res.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text || "";
}

export async function analyzeResume(resumeText: string): Promise<{ feedback: string; improved: string }> {
  const raw = await callAPI(`You are an expert resume coach. Analyze this resume and respond in EXACTLY this format:

===FEEDBACK===
[Detailed critique: ATS score estimate, missing sections, weak bullets, skills gaps, action verbs, formatting issues. Use bullet points with - prefix. Group under clear sub-headings ending with colon.]
===IMPROVED_RESUME===
[The complete improved resume in plain text, all sections, strong action verbs, metrics added]

CRITICAL RULES for the improved resume:
- NEVER invent or fabricate contact information (phone, email, address, LinkedIn, GitHub, website)
- Only include contact details that are explicitly present in the original resume
- If a phone number is not in the original, do NOT add one
- If an email is not in the original, do NOT add one
- Only improve what is already there — do not hallucinate any personal details

Resume:
---
${resumeText}
---`);

  const feedbackMatch = raw.match(/===FEEDBACK===([\s\S]*?)===IMPROVED_RESUME===/);
  const improvedMatch = raw.match(/===IMPROVED_RESUME===([\s\S]*)$/);
  return {
    feedback: feedbackMatch?.[1]?.trim() || raw,
    improved: improvedMatch?.[1]?.trim() || "",
  };
}

export async function generateResume(data: ResumeData, template: string): Promise<string> {
  const styleGuides: Record<string, string> = {
    executive: "Formal, authoritative tone. Lead with strategic impact. Emphasize leadership, scale, business outcomes. Sophisticated language.",
    creative:  "Dynamic, personality-forward. Highlight creative achievements and innovative projects. Show originality and range.",
    modern:    "Crisp, results-driven. Balance professionalism with energy. Strong metrics. Contemporary language.",
    minimal:   "Ultra-concise. Every word earns its place. No fluff. Clean parallel structure.",
    tech:      "Technical precision. Lead with impact metrics. Emphasize stack, architecture decisions, scale. Include GitHub/portfolio prominently.",
  };

  const pi = data.personalInfo;
  const extras = [
    pi.targetRole     ? `Target Role: ${pi.targetRole}`           : "",
    pi.yearsExp       ? `Years of Experience: ${pi.yearsExp}`     : "",
    pi.resumeLength   ? `Preferred Length: ${pi.resumeLength}`    : "",
    data.languages?.length ? `Languages: ${data.languages.join(", ")}` : "",
    data.volunteer?.length ? `Volunteer/Community:\n${data.volunteer.map(v=>`- ${v.org}: ${v.role} (${v.period}) — ${v.description}`).join("\n")}` : "",
    data.awards?.length ? `Awards & Honors:\n${data.awards.map(a=>`- ${a}`).join("\n")}` : "",
    data.publications?.length ? `Publications/Research:\n${data.publications.map(p=>`- ${p}`).join("\n")}` : "",
    data.associations?.length ? `Professional Associations:\n${data.associations.map(a=>`- ${a}`).join("\n")}` : "",
  ].filter(Boolean).join("\n");

  return callAPI(`You are a professional resume writer. Create a polished, ATS-optimized resume.
Template style: ${template} — ${styleGuides[template] ?? styleGuides.minimal}

${pi.targetRole ? `TARGET ROLE: ${pi.targetRole} — tailor every section toward this position.` : ""}
${pi.resumeLength ? `LENGTH PREFERENCE: ${pi.resumeLength}` : ""}

Candidate data:
${JSON.stringify(data, null, 2)}

${extras ? `Additional context:\n${extras}` : ""}

Rules:
- Use strong action verbs (Architected, Spearheaded, Engineered, Delivered, Scaled, Reduced, etc.)
- Add quantifiable metrics wherever the data implies them
- Tailor keywords to the target role if provided
- ${pi.resumeLength === "1 page" ? "Keep to 1 page — be ruthlessly concise" : pi.resumeLength === "2 pages" ? "Can use 2 pages — be thorough" : "1 page if under 5 years experience, 2 pages max otherwise"}
- Write a compelling professional summary if not provided
- Output ONLY the resume text — no explanations, no markdown fences`);
}

export interface VolunteerEntry {
  org: string;
  role: string;
  period: string;
  description: string;
}

export interface ResumeData {
  personalInfo: {
    name: string;
    email: string;
    phone: string;
    location: string;
    hasLocation: boolean;
    linkedin: string;
    hasLinkedin: boolean;
    github: string;
    hasGithub: boolean;
    portfolio: string;
    hasPortfolio: boolean;
    summary: string;
    photoDataUrl?: string;
    targetRole: string;
    yearsExp: string;
    resumeLength: string;
  };
  experience: Array<{
    company: string; title: string; startDate: string; endDate: string;
    current: boolean; bullets: string[];
  }>;
  education: Array<{
    school: string; degree: string; field: string; gradYear: string; gpa?: string;
  }>;
  skills: string[];
  languages: string[];
  volunteer: VolunteerEntry[];
  awards: string[];
  publications: string[];
  associations: string[];
  projects: Array<{ name: string; description: string; tech: string; link?: string }>;
  certifications: string[];
}