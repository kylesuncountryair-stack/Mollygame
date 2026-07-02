export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function emailDomainAllowed(email: string): boolean {
  const allowed = process.env.ALLOWED_EMAIL_DOMAIN?.trim();
  if (!allowed) return true;
  return email.toLowerCase().endsWith(`@${allowed.toLowerCase()}`);
}

export function isValidPassword(password: string): boolean {
  return typeof password === "string" && password.length >= 8;
}

// Accepts either (or both) env vars:
//   ADMIN_EMAIL="alice@company.com"
//   ADMIN_EMAILS="alice@company.com, bob@company.com, carol@company.com"
export function isAdminEmail(email: string): boolean {
  const combined = [process.env.ADMIN_EMAIL, process.env.ADMIN_EMAILS].filter(Boolean).join(",");
  const admins = combined
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
  return admins.includes(email.toLowerCase());
}
