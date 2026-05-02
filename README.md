# ✨ ResumeAI — AI-Powered Resume Builder

A premium, no-login resume builder powered by Google Gemini AI.
Built by Ramy Daniel.

---

## 🚀 Setup in 3 Steps

### 1. Add your Gemini API key
Create a file called `.env.local` in the project root:
```
GEMINI_API_KEY=your_key_here
```
Get a free key at → https://aistudio.google.com/app/apikey

### 2. Install & run
```bash
npm install
npm run dev
```
Open http://localhost:3000 — users need zero setup.

### 3. Deploy to Vercel (free)
```bash
npx vercel
```
Then add `GEMINI_API_KEY` in your Vercel project's Environment Variables dashboard.

---

## ✨ Features
- **Improve My Resume** — Upload PDF/TXT → AI feedback + improved version side-by-side
- **Build From Scratch** — 5 unique templates, guided form, AI-generated output
- **Smart Photo Logic** — per-template advice (encouraged, optional, or warned against)
- **PDF Download** — one-click export
- **No login, no database, zero cost for users**

## 🎨 Templates
| Template | Best For | Photo |
|---|---|---|
| Executive | Senior/corporate | ⚠️ Warning (US bias risk) |
| Creative | Design/marketing/media | ✅ Encouraged |
| Modern | Business/consulting/startups | ℹ️ Optional |
| Minimal | Any industry | ℹ️ Optional |
| Tech | Developers/engineers | ❌ Not recommended |

## 🔒 Security
Your Gemini API key lives in `.env.local` (server-side only).
Users never see it. It is never sent to the browser.

## ☕ Support
https://buymeacoffee.com/ramydaniel
