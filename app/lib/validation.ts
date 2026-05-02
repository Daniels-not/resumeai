// ── Validation library for ResumeAI builder ───────────────────────────
// Each step has its own validator returning an array of ValidationError.
// Empty array = valid. Used by the builder to block progression.

import { ResumeData } from "./gemini";

export interface ValidationError {
  field: string;   // human-readable field name
  message: string; // what's wrong
}

// ── Helpers ────────────────────────────────────────────────────────────

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

function isValidPhone(phone: string): boolean {
  const digits = phone.replace(/\D/g, "");
  return digits.length >= 7 && digits.length <= 15;
}

function isValidUrl(url: string): boolean {
  if (!url.trim()) return true;
  try {
    const u = url.startsWith("http") ? url : `https://${url}`;
    new URL(u);
    return true;
  } catch {
    return false;
  }
}

function parseDate(str: string): Date | null {
  if (!str.trim()) return null;
  if (/^present$/i.test(str.trim())) return new Date();

  // "Jan 2022" or "January 2022"
  const monthYear = str.match(/^([A-Za-z]+)\s+(\d{4})$/);
  if (monthYear) {
    const d = new Date(`${monthYear[1]} 1, ${monthYear[2]}`);
    if (!isNaN(d.getTime())) return d;
  }

  // Just a year "2022"
  const yearOnly = str.match(/^(\d{4})$/);
  if (yearOnly) {
    const d = new Date(`Jan 1, ${yearOnly[1]}`);
    if (!isNaN(d.getTime())) return d;
  }

  // MM/YYYY or MM-YYYY
  const slashDate = str.match(/^(\d{1,2})[\/\-](\d{4})$/);
  if (slashDate) {
    const d = new Date(`${slashDate[1]}/01/${slashDate[2]}`);
    if (!isNaN(d.getTime())) return d;
  }

  return null;
}

function validateDateRange(
  start: string,
  end: string,
  label: string
): ValidationError[] {
  const errors: ValidationError[] = [];

  if (!start.trim()) {
    errors.push({
      field: `${label} Start Date`,
      message: `Start date is required for "${label}".`,
    });
    return errors;
  }

  const startDate = parseDate(start);
  if (!startDate) {
    errors.push({
      field: `${label} Start Date`,
      message: `"${start}" is not a valid start date. Try formats like "Jan 2022", "2022", or "01/2022".`,
    });
  }

  if (end.trim() && !/^present$/i.test(end.trim())) {
    const endDate = parseDate(end);
    if (!endDate) {
      errors.push({
        field: `${label} End Date`,
        message: `"${end}" is not a valid end date. Try "Present", "Jan 2024", or "2024".`,
      });
    } else if (startDate && endDate < startDate) {
      errors.push({
        field: `${label} Dates`,
        message: `End date cannot be before start date at "${label}".`,
      });
    }
  }

  // Start date should not be more than 3 months in the future
  if (startDate) {
    const future = new Date();
    future.setMonth(future.getMonth() + 3);
    if (startDate > future) {
      errors.push({
        field: `${label} Start Date`,
        message: `Start date for "${label}" appears to be in the future.`,
      });
    }
  }

  return errors;
}

// ── Step validators ────────────────────────────────────────────────────

export function validateStep0(template: string): ValidationError[] {
  if (!template)
    return [{ field: "Template", message: "Please select a resume template to continue." }];
  return [];
}

export function validateStep1(data: ResumeData): ValidationError[] {
  const errors: ValidationError[] = [];
  const p = data.personalInfo;

  if (!p.name.trim())
    errors.push({ field: "Full Name", message: "Your full name is required." });
  else if (p.name.trim().length < 2)
    errors.push({ field: "Full Name", message: "Please enter your full name (at least 2 characters)." });

  if (!p.email.trim())
    errors.push({ field: "Email", message: "Your email address is required." });
  else if (!isValidEmail(p.email))
    errors.push({ field: "Email", message: `"${p.email}" doesn't look like a valid email address.` });

  if (!p.phone.trim())
    errors.push({ field: "Phone", message: "A phone number is required." });
  else if (!isValidPhone(p.phone))
    errors.push({ field: "Phone", message: "Please enter a valid phone number (at least 7 digits)." });

  if (p.hasLocation && !p.location.trim())
    errors.push({
      field: "Location",
      message: "You selected to include your location — please enter it, or toggle it off.",
    });

  return errors;
}

export function validateStep2(data: ResumeData): ValidationError[] {
  const errors: ValidationError[] = [];
  const p = data.personalInfo;

  if (p.hasLinkedin && !p.linkedin.trim())
    errors.push({
      field: "LinkedIn",
      message: "You selected to add LinkedIn — please enter your profile URL, or toggle it off.",
    });
  else if (p.hasLinkedin && !p.linkedin.toLowerCase().includes("linkedin"))
    errors.push({
      field: "LinkedIn",
      message: "That doesn't look like a LinkedIn URL. It should contain 'linkedin.com/in/…'",
    });

  if (p.hasGithub && !p.github.trim())
    errors.push({
      field: "GitHub",
      message: "You selected to add GitHub — please enter your profile URL, or toggle it off.",
    });
  else if (p.hasGithub && !isValidUrl(p.github))
    errors.push({
      field: "GitHub",
      message: "Please enter a valid GitHub URL (e.g. github.com/yourname).",
    });

  if (p.hasPortfolio && !p.portfolio.trim())
    errors.push({
      field: "Portfolio",
      message: "You selected to add a portfolio — please enter the URL, or toggle it off.",
    });
  else if (p.hasPortfolio && !isValidUrl(p.portfolio))
    errors.push({
      field: "Portfolio",
      message: "Please enter a valid portfolio URL (e.g. yoursite.dev).",
    });

  return errors;
}

export function validateStep3(_data: ResumeData): ValidationError[] {
  // Target & preferences are all optional — no hard requirements
  return [];
}

export function validateStep4(data: ResumeData): ValidationError[] {
  const errors: ValidationError[] = [];

  if (data.experience.length === 0) {
    errors.push({ field: "Experience", message: "Please add at least one work experience entry." });
    return errors;
  }

  data.experience.forEach((exp, i) => {
    const label = exp.title || exp.company || `Role ${i + 1}`;

    if (!exp.title.trim())
      errors.push({
        field: `Role ${i + 1} — Job Title`,
        message: `Job title is required for role ${i + 1}.`,
      });

    if (!exp.company.trim())
      errors.push({
        field: `Role ${i + 1} — Company`,
        message: `Company name is required for role ${i + 1}.`,
      });

    // Date validation
    errors.push(...validateDateRange(exp.startDate, exp.endDate, label));

    // At least one non-empty bullet
    const filledBullets = exp.bullets.filter((b) => b.trim().length > 0);
    if (filledBullets.length === 0)
      errors.push({
        field: `Role ${i + 1} — Achievements`,
        message: `Please add at least one achievement or responsibility for "${label}".`,
      });

    // Bullet quality — warn if very short
    exp.bullets.forEach((b, bi) => {
      if (b.trim() && b.trim().length < 10)
        errors.push({
          field: `Role ${i + 1} — Bullet ${bi + 1}`,
          message: `Bullet ${bi + 1} at "${label}" is too short. Add more detail for better AI results.`,
        });
    });
  });

  return errors;
}

export function validateStep5(data: ResumeData): ValidationError[] {
  const errors: ValidationError[] = [];

  if (data.education.length === 0) {
    errors.push({ field: "Education", message: "Please add at least one education entry." });
    return errors;
  }

  data.education.forEach((edu, i) => {
    if (!edu.school.trim())
      errors.push({
        field: `Education ${i + 1} — School`,
        message: "School or university name is required.",
      });

    if (!edu.degree.trim())
      errors.push({
        field: `Education ${i + 1} — Degree`,
        message: "Degree type is required (e.g. Bachelor of Science).",
      });

    if (!edu.field.trim())
      errors.push({
        field: `Education ${i + 1} — Field`,
        message: "Field of study is required (e.g. Computer Science).",
      });

    if (edu.gradYear.trim()) {
      const year = parseInt(edu.gradYear.trim());
      const currentYear = new Date().getFullYear();
      if (isNaN(year) || year < 1950 || year > currentYear + 6)
        errors.push({
          field: `Education ${i + 1} — Graduation Year`,
          message: `"${edu.gradYear}" doesn't look like a valid graduation year.`,
        });
    }

    if (edu.gpa && edu.gpa.trim()) {
      const gpa = parseFloat(edu.gpa);
      if (isNaN(gpa) || gpa < 0 || gpa > 4.0)
        errors.push({
          field: `Education ${i + 1} — GPA`,
          message: "GPA should be a number between 0.0 and 4.0.",
        });
    }
  });

  return errors;
}

export function validateStep6(data: ResumeData): ValidationError[] {
  const errors: ValidationError[] = [];
  const skills = data.skills.filter((s) => s.trim().length > 0);

  if (skills.length === 0)
    errors.push({
      field: "Skills",
      message:
        "Please add at least one skill. This is one of the most important sections for ATS scoring.",
    });
  else if (skills.length < 3)
    errors.push({
      field: "Skills",
      message: `You only have ${skills.length} skill${skills.length === 1 ? "" : "s"}. Adding more will significantly improve your resume's ATS score.`,
    });

  return errors;
}

export function validateStep7(_data: ResumeData): ValidationError[] {
  // Extras are all optional — no hard requirements
  return [];
}