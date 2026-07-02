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
