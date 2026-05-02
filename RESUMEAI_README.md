# ResumeAI — Developer Documentation

**Built by Ramy Daniel**
Full-stack AI-powered resume builder — Next.js 15, TypeScript, Google Gemini, no database, no login.

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Tech Stack](#2-tech-stack)
3. [Project Structure](#3-project-structure)
4. [Setup & Running Locally](#4-setup--running-locally)
5. [Environment Variables](#5-environment-variables)
6. [How the App Works](#6-how-the-app-works)
7. [File-by-File Breakdown](#7-file-by-file-breakdown)
8. [The 5 Resume Templates](#8-the-5-resume-templates)
9. [The ResumeData Type](#9-the-resumedata-type)
10. [How to Add a New Template](#10-how-to-add-a-new-template)
11. [How to Add a New Builder Step](#11-how-to-add-a-new-builder-step)
12. [How to Add a New Field](#12-how-to-add-a-new-field)
13. [How to Remove a Field or Section](#13-how-to-remove-a-field-or-section)
14. [How to Change the AI Prompt](#14-how-to-change-the-ai-prompt)
15. [How to Change the Gemini Model](#15-how-to-change-the-gemini-model)
16. [Deploying to Vercel](#16-deploying-to-vercel)
17. [Common Issues & Fixes](#17-common-issues--fixes)
18. [Dependencies](#18-dependencies)

---

## 1. Project Overview

ResumeAI has two main flows:

| Flow | What it does |
|---|---|
| **Improve My Resume** | User uploads or pastes their resume → AI gives detailed feedback + generates an improved version → user downloads as PDF |
| **Build From Scratch** | User picks a template → fills in a 9-step guided form → AI generates a polished, ATS-optimized resume → user downloads as PDF |

Key design decisions:
- **No login, no database** — everything lives in React state during the session
- **API key is server-side** — lives in `.env.local`, never exposed to the browser
- **PDF export** uses `html2canvas` + `jsPDF` to screenshot the preview and export it
- **Photo upload** is handled per-template with different recommendations (encouraged, optional, or warned against)

---

## 2. Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 15 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS + inline styles |
| AI | Google Gemini 1.5 Flash |
| PDF Export | jsPDF + html2canvas |
| File Upload | react-dropzone |
| Icons | lucide-react |
| Fonts | Cormorant Garamond + DM Sans (Google Fonts) |
| Deployment | Vercel (recommended) |

---

## 3. Project Structure

```
resumeai/
├── .env.local                  ← Your Gemini API key (you create this)
├── .env.example                ← Template showing what .env.local needs
├── app/
│   ├── layout.tsx              ← Root layout (html/body wrapper)
│   ├── globals.css             ← Global design system (colors, animations, utility classes)
│   ├── page.tsx                ← Homepage (landing page with two CTA cards)
│   │
│   ├── api/
│   │   └── gemini/
│   │       └── route.ts        ← Server-side API route that calls Gemini (keeps key secret)
│   │
│   ├── improve/
│   │   └── page.tsx            ← "Improve My Resume" flow
│   │
│   ├── builder/
│   │   └── page.tsx            ← "Build From Scratch" flow (9-step form)
│   │
│   ├── components/
│   │   ├── ApiKeyModal.tsx     ← Stub (no longer used — key is server-side)
│   │   ├── BuyMeCoffee.tsx     ← Buy Me a Coffee section on homepage
│   │   ├── ResumePreview.tsx   ← Renders resume text as styled HTML + PDF download button
│   │   └── TagInput.tsx        ← Reusable type-to-add chip input (skills, languages, certs)
│   │
│   └── lib/
│       └── gemini.ts           ← All AI calls + TypeScript types for ResumeData
│
├── package.json
├── next.config.ts
├── tsconfig.json
└── postcss.config.mjs
```

---

## 4. Setup & Running Locally

**Prerequisites:** Node.js 18+ installed ([nodejs.org](https://nodejs.org))

```bash
# 1. Install dependencies
npm install

# 2. Create your environment file (see Section 5)
echo "GEMINI_API_KEY=your_key_here" > .env.local

# 3. Start the dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

**Other commands:**
```bash
npm run build     # Build for production
npm run start     # Run production build locally
npm run lint      # Run ESLint
```

---

## 5. Environment Variables

Create a file called `.env.local` in the root of the project:

```
GEMINI_API_KEY=your_gemini_api_key_here
```

**How to get a free Gemini API key:**
1. Go to [aistudio.google.com/app/apikey](https://aistudio.google.com/app/apikey)
2. Sign in with Google
3. Click **Create API Key**
4. Copy the key and paste it in `.env.local`

> ⚠️ Never commit `.env.local` to Git. It is already in `.gitignore` by default in Next.js projects.

---

## 6. How the App Works

### API Flow (important to understand)

```
Browser → /api/gemini (Next.js route) → Google Gemini API
```

The browser **never** calls Gemini directly. It calls your own `/api/gemini` route, which adds the secret key and forwards the request. This keeps your API key safe.

**File:** `app/api/gemini/route.ts`
**Called by:** `app/lib/gemini.ts` via `fetch("/api/gemini", ...)`

### Builder Flow (9 steps)

```
Step 0: Template selection
Step 1: Basics (name, email, phone, location toggle, summary)
Step 2: Links (LinkedIn, GitHub, Portfolio — each with Yes/No toggle)
Step 3: Target & Preferences (target role, years of experience, resume length)
Step 4: Work Experience (repeatable — company, title, dates, bullets)
Step 5: Education (school, degree, field, year, GPA)
Step 6: Skills (TagInput for skills, languages, certifications)
Step 7: Extras (projects, volunteer work, awards, publications, associations)
Step 8: Generated resume + PDF download
```

### Improve Flow

```
1. User uploads file (PDF/DOC/TXT) or pastes text
2. File is read client-side (FileReader API)
3. Text is sent to /api/gemini with an analysis prompt
4. Response is split into FEEDBACK and IMPROVED_RESUME sections
5. Both are shown side-by-side with a PDF download option
```

---

## 7. File-by-File Breakdown

### `app/lib/gemini.ts`
The brain of the app. Contains:
- `callAPI(prompt)` — internal function that POSTs to `/api/gemini`
- `analyzeResume(resumeText)` — takes raw resume text, returns `{ feedback, improved }`
- `generateResume(data, template)` — takes full `ResumeData` + template name, returns resume text
- `ResumeData` interface — the full TypeScript type for all resume fields
- `VolunteerEntry` interface — type for volunteer entries

### `app/api/gemini/route.ts`
Next.js API route. Reads `GEMINI_API_KEY` from environment, forwards requests to Gemini, returns the response. Never touched by the browser directly.

### `app/builder/page.tsx`
The largest file. Contains the full 9-step resume builder:
- `TEMPLATES` array — defines all 5 templates with their id, name, accent color, photo policy, and warning text
- `STEPS` array — the step names shown in the progress bar
- `emptyData()` — returns a fresh blank `ResumeData` object
- `YesNo` component — the Yes/No toggle buttons used for location, LinkedIn, GitHub, Portfolio
- `Card` component — the white/surface card wrapper used in each step
- All state management for the form, photo upload, and generation

### `app/improve/page.tsx`
The resume improvement flow. Handles file upload via react-dropzone, text extraction, and the analyze/results views.

### `app/components/ResumePreview.tsx`
Renders resume plain text into styled HTML based on the selected template. Parses lines to detect:
- Line 0 = name (large heading)
- Lines with `@` or `|` = contact line
- ALL CAPS lines = section headers
- Lines starting with `•`, `-`, `*`, `>` = bullet points
- Everything else = body text

Also handles the PDF download via html2canvas + jsPDF.

### `app/components/TagInput.tsx`
Reusable chip input component used for Skills, Languages, and Certifications.
- Type and press Enter or click Add → chip appears
- Click a chip to edit it inline
- Click ✕ to delete
- Backspace with empty input deletes the last chip
- Props: `label`, `sublabel`, `placeholder`, `tags`, `onChange`, `accent` (color)

### `app/components/BuyMeCoffee.tsx`
The support section at the bottom of the homepage. Change the `href` to your Buy Me a Coffee URL.

### `app/globals.css`
The entire design system. CSS variables at the top control every color:
```css
:root {
  --bg: #080a0f;          /* Page background */
  --gold: #c9a84c;        /* Primary accent */
  --gold2: #e8c97a;       /* Lighter gold */
  --text: #e8eaf0;        /* Primary text */
  --text2: #9aa3b8;       /* Secondary text */
  --success: #4ade80;     /* Green */
  --danger: #f87171;      /* Red */
  --warn: #fbbf24;        /* Yellow warning */
}
```

---

## 8. The 5 Resume Templates

Defined in `app/builder/page.tsx` in the `TEMPLATES` array and rendered in `app/components/ResumePreview.tsx`.

| ID | Name | Accent | Photo Policy | Best For |
|---|---|---|---|---|
| `executive` | Executive | `#c9a84c` (gold) | ⚠️ Warning shown | Senior roles, law, finance, C-suite |
| `creative` | Creative | `#6d28d9` (violet) | ✅ Encouraged | Design, marketing, media, agencies |
| `modern` | Modern | `#0d9488` (teal) | ℹ️ Optional | Business, consulting, startups |
| `minimal` | Minimal | `#888888` (gray) | ℹ️ Optional | Any industry, safe universal choice |
| `tech` | Tech | `#3fb950` (green) | ❌ Not recommended (warning) | Developers, engineers, data roles |

Each template in the `TEMPLATES` array has these fields:
```typescript
{
  id: string;         // Used as identifier throughout the app
  name: string;       // Display name
  desc: string;       // Short description shown on template card
  icon: JSX.Element;  // Lucide icon
  accent: string;     // Hex color for highlights
  photo: "yes" | "ask" | "no";  // Photo policy
  photoNote: string;  // Explanation shown to user in photo modal
  warning?: string;   // If set, shows a warning modal when selected (used for Tech)
}
```

---

## 9. The ResumeData Type

The full shape of all data collected in the builder. Defined in `app/lib/gemini.ts`:

```typescript
interface ResumeData {
  personalInfo: {
    name: string;
    email: string;
    phone: string;
    location: string;
    hasLocation: boolean;       // whether to include location on resume
    linkedin: string;
    hasLinkedin: boolean;
    github: string;
    hasGithub: boolean;
    portfolio: string;
    hasPortfolio: boolean;
    summary: string;
    photoDataUrl?: string;      // base64 encoded photo
    targetRole: string;         // e.g. "Senior Product Manager"
    yearsExp: string;           // e.g. "3–5 years"
    resumeLength: string;       // "1 page" | "2 pages" | "AI decides"
  };
  experience: Array<{
    company: string;
    title: string;
    startDate: string;
    endDate: string;
    current: boolean;
    bullets: string[];
  }>;
  education: Array<{
    school: string;
    degree: string;
    field: string;
    gradYear: string;
    gpa?: string;
  }>;
  skills: string[];
  languages: string[];
  volunteer: VolunteerEntry[];   // { org, role, period, description }
  awards: string[];
  publications: string[];
  associations: string[];
  projects: Array<{
    name: string;
    description: string;
    tech: string;
    link?: string;
  }>;
  certifications: string[];
}
```

---

## 10. How to Add a New Template

**Step 1** — Add it to the `TEMPLATES` array in `app/builder/page.tsx`:
```typescript
{
  id: "corporate",
  name: "Corporate",
  desc: "Your description here.",
  icon: <Building size={22}/>,
  accent: "#1e40af",
  photo: "ask",
  photoNote: "ℹ️ Optional for this template.",
}
```

**Step 2** — Add the style guide for AI in `app/lib/gemini.ts` inside `generateResume()`:
```typescript
const styleGuides: Record<string, string> = {
  // ... existing templates
  corporate: "Professional, structured tone. Emphasize team leadership and process improvement.",
};
```

**Step 3** — Add the visual style in `app/components/ResumePreview.tsx` inside the `TEMPLATES` object:
```typescript
const TEMPLATES = {
  // ... existing templates
  corporate: {
    fontFamily: "'Helvetica Neue', Helvetica, sans-serif",
    nameColor: "#1e3a5f",
    accentColor: "#1e40af",
    subColor: "#475569",
    textColor: "#1e293b",
    bg: "#fff",
    ruleColor: "#1e40af",
  },
};
```

That's it — the template will automatically appear in the selection grid.

---

## 11. How to Add a New Builder Step

**Step 1** — Add the step name to the `STEPS` array in `app/builder/page.tsx`:
```typescript
const STEPS = ["Template","Basics","Links","Target","Experience","Education","Skills","Extras","Your Resume"];
// becomes:
const STEPS = ["Template","Basics","Links","Target","Experience","Education","Skills","Extras","New Step","Your Resume"];
```

**Step 2** — Shift all subsequent step numbers up by 1. For example if the result was step 8, it becomes step 9, etc.

**Step 3** — Add a new step block inside the JSX:
```tsx
{step===8 && (
  <div className="animate-fade-up">
    <h1 className="font-display" style={{ fontSize:46, color:"var(--text)", marginBottom:10 }}>
      Your Step Title
    </h1>
    <p style={{ color:"var(--text2)", fontSize:15, marginBottom:36 }}>
      Step description.
    </p>
    {/* Your fields here */}
    {navBtns(7, ()=>setStep(9))}
  </div>
)}
```

---

## 12. How to Add a New Field

**Step 1** — Add the field to the `ResumeData` interface in `app/lib/gemini.ts`:
```typescript
personalInfo: {
  // ... existing fields
  website: string;  // new field
};
```

**Step 2** — Add it to `emptyData()` in `app/builder/page.tsx`:
```typescript
const emptyData = (): ResumeData => ({
  personalInfo: {
    // ... existing
    website: "",
  },
  // ...
});
```

**Step 3** — Add the input in the appropriate builder step:
```tsx
<div>
  <label style={lStyle}>Personal Website</label>
  <input className="input-luxury" placeholder="yoursite.com"
    value={data.personalInfo.website}
    onChange={e => setP("website", e.target.value)}
    style={iStyle}/>
</div>
```

**Step 4** — Include it in the AI prompt in `generateResume()` inside `app/lib/gemini.ts` if needed:
```typescript
const extras = [
  // ... existing
  pi.website ? `Personal Website: ${pi.website}` : "",
].filter(Boolean).join("\n");
```

---

## 13. How to Remove a Field or Section

**To remove a field:**
1. Delete it from the `ResumeData` interface in `app/lib/gemini.ts`
2. Delete it from `emptyData()` in `app/builder/page.tsx`
3. Delete the input JSX from the builder step
4. Delete any reference to it in the AI prompt in `generateResume()`

**To remove an entire step** (e.g. remove the Extras step):
1. Remove the step name from the `STEPS` array
2. Delete the entire `{step===N && (...)}` block
3. Update the `navBtns()` calls on surrounding steps to connect correctly
4. Update the final `handleGenerate()` call if step numbers shifted

**To remove a template:**
1. Delete its entry from `TEMPLATES` in `app/builder/page.tsx`
2. Delete its entry from `TEMPLATES` in `app/components/ResumePreview.tsx`
3. Delete its style guide from `styleGuides` in `app/lib/gemini.ts`

---

## 14. How to Change the AI Prompt

All prompts are in `app/lib/gemini.ts`.

**Resume analysis prompt** — inside `analyzeResume()`:
```typescript
const raw = await callAPI(`You are an expert resume coach...`);
```
Edit the instructions between the backticks.

**Resume generation prompt** — inside `generateResume()`:
```typescript
return callAPI(`You are a professional resume writer...`);
```

**Template style guides** — the `styleGuides` object inside `generateResume()` controls how AI adjusts tone per template. Edit the string for any template:
```typescript
const styleGuides = {
  executive: "Formal, authoritative tone...",  // ← edit this
  // ...
};
```

**AI parameters** — temperature and max tokens in `app/lib/gemini.ts`:
```typescript
generationConfig: {
  temperature: 0.7,      // 0 = deterministic, 1 = creative
  maxOutputTokens: 8192, // increase for longer resumes
}
```

---

## 15. How to Change the Gemini Model

In `app/api/gemini/route.ts`, change this line:
```typescript
const GEMINI_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent";
```

Available models:
| Model | Speed | Quality | Notes |
|---|---|---|---|
| `gemini-1.5-flash` | Fast | Good | Current default — best for free tier |
| `gemini-1.5-pro` | Slower | Better | Higher quality, uses more quota |
| `gemini-2.0-flash` | Fast | Better | Newer, check availability |

---

## 16. Deploying to Vercel

```bash
# Install Vercel CLI if you don't have it
npm install -g vercel

# Deploy
npx vercel
```

Then:
1. Go to [vercel.com](https://vercel.com) → your project
2. **Settings → Environment Variables**
3. Add: `GEMINI_API_KEY` = your key
4. Redeploy

Your app will be live at `your-project.vercel.app`.

**Custom domain:** Vercel dashboard → Domains → Add your domain.

---

## 17. Common Issues & Fixes

**Hydration error mentioning `data-gr-*` attributes**
Caused by the Grammarly browser extension modifying the DOM. Fix: add `suppressHydrationWarning` to the body tag in `app/layout.tsx`:
```tsx
<body suppressHydrationWarning>{children}</body>
```

**API returns 500 "API key not configured"**
Your `.env.local` file is missing or the key name is wrong. Make sure it's exactly:
```
GEMINI_API_KEY=your_key_here
```
Then restart the dev server (`Ctrl+C` and `npm run dev` again).

**PDF download looks different from the preview**
The PDF is a screenshot of the HTML preview — what you see is what you get. If fonts look different, it may be because Google Fonts haven't loaded. Wait a moment after the resume generates before downloading.

**Resume text doesn't parse correctly in preview**
The `ResumePreview` component parses plain text by detecting patterns (ALL CAPS = section header, `•` = bullet, etc.). If Gemini returns text in an unusual format, the parser might misread it. You can adjust the parsing logic in `app/components/ResumePreview.tsx` in the `renderContent()` function.

**Build error: Module not found**
Run `npm install` again. If a specific package is missing, install it:
```bash
npm install package-name
```

---

## 18. Dependencies

| Package | Version | Purpose |
|---|---|---|
| `next` | 16.2.4 | React framework |
| `react` | 19.2.4 | UI library |
| `typescript` | ^5 | Type safety |
| `tailwindcss` | ^4 | Utility CSS classes |
| `@google/generative-ai` | ^0.24.1 | Gemini SDK (not directly used — we use fetch) |
| `lucide-react` | ^1.8.0 | Icons |
| `jspdf` | ^4.2.1 | PDF generation |
| `html2canvas` | ^1.4.1 | Screenshot HTML for PDF |
| `react-dropzone` | ^15.0.0 | File drag-and-drop upload |
| `framer-motion` | ^12.38.0 | Animations (installed, available to use) |
| `mammoth` | ^1.12.0 | DOCX text extraction |
| `pdf-parse` | ^2.4.5 | PDF text extraction |

---

*Built by Ramy Daniel — Oakwood University CS*
*Support the project: buymeacoffee.com/ramydaniel*
