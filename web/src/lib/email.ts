const RESEND_API_KEY = process.env.RESEND_API_KEY;
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL ?? "hello@sagescompass.com";
const ADMIN_EMAIL = process.env.RESEND_ADMIN_EMAIL ?? "hello@sagescompass.com";

interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
  replyTo?: string;
}

export async function sendEmail({ to, subject, html, replyTo }: SendEmailOptions) {
  if (!RESEND_API_KEY) {
    console.warn("[email] RESEND_API_KEY not set — skipping email");
    return;
  }
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${RESEND_API_KEY}` },
    body: JSON.stringify({ from: `The Sage's Compass <${FROM_EMAIL}>`, to, subject, html, reply_to: replyTo }),
  });
  if (!res.ok) console.error("[email] Resend error:", await res.text());
}

// ── Email templates ───────────────────────────────────────────────────────────

export function welcomeEmailHtml(firstName: string): string {
  return `
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"></head>
<body style="font-family:Georgia,serif;max-width:580px;margin:0 auto;padding:40px 20px;color:#222;background:#FDFBF7;">
  <div style="text-align:center;margin-bottom:32px;">
    <p style="font-variant:small-caps;font-size:1.1rem;color:#0B2E4A;letter-spacing:0.06em;margin:0;">The Sage's Compass</p>
  </div>
  <h1 style="font-variant:small-caps;font-size:1.6rem;color:#0B2E4A;margin-bottom:8px;">
    Welcome${firstName ? `, ${firstName}` : ""}!
  </h1>
  <p style="font-size:1rem;line-height:1.75;color:#444;margin-bottom:20px;">
    We're so glad you're here. The Sage's Compass was built for families like yours — ones who care deeply about how their children learn and want curriculum that actually fits their values.
  </p>
  <div style="background:#F0EAE0;border-radius:10px;padding:20px 24px;margin-bottom:24px;">
    <p style="font-weight:600;color:#0B2E4A;margin:0 0 12px;font-size:0.95rem;">Here's what you can do right now:</p>
    <ul style="margin:0;padding-left:1.2rem;line-height:2;font-size:0.9rem;color:#444;">
      <li><strong>Take the Compass Quiz</strong> — discover your teaching archetype in 5 minutes</li>
      <li><strong>Explore curricula</strong> — browse 70+ matched to your philosophy</li>
      <li><strong>Generate a lesson</strong> — pick an interest, get a complete lesson plan</li>
    </ul>
  </div>
  <p style="font-size:0.9rem;line-height:1.75;color:#555;margin-bottom:24px;">
    If you ever have a question, get stuck, or just want to share feedback — just reply to this email. We read every message and respond personally.
  </p>
  <div style="text-align:center;margin:32px 0;">
    <a href="https://thesagescompass.com/compass" style="background:#0B2E4A;color:#F9F6EF;padding:12px 28px;border-radius:10px;text-decoration:none;font-size:0.9rem;font-weight:600;">
      Take the Compass Quiz
    </a>
  </div>
  <p style="font-size:0.85rem;color:#888;font-style:italic;line-height:1.7;">
    With gratitude,<br>
    The Sage's Compass Team
  </p>
  <hr style="border:none;border-top:1px solid #eee;margin:32px 0;">
  <p style="font-size:0.75rem;color:#aaa;text-align:center;">
    &copy; The Sage's Compass &middot; <a href="https://thesagescompass.com" style="color:#aaa;">thesagescompass.com</a>
  </p>
</body>
</html>`;
}

export function contactNotificationHtml(name: string, email: string, subject: string, message: string): string {
  return `
<!DOCTYPE html><html><body style="font-family:Georgia,serif;max-width:580px;margin:0 auto;padding:32px 20px;color:#222;">
  <h2 style="color:#0B2E4A;">New Contact Form Submission</h2>
  <p><strong>From:</strong> ${name} &lt;${email}&gt;</p>
  <p><strong>Subject:</strong> ${subject}</p>
  <hr style="border:none;border-top:1px solid #eee;margin:16px 0;">
  <p style="white-space:pre-wrap;">${message}</p>
</body></html>`;
}

export async function sendWelcomeEmail(email: string, firstName: string) {
  return sendEmail({
    to: email,
    subject: "Welcome to The Sage's Compass",
    html: welcomeEmailHtml(firstName),
  });
}

export async function sendContactNotification(name: string, email: string, subject: string, message: string) {
  return sendEmail({
    to: ADMIN_EMAIL,
    subject: `[Contact] ${subject} — from ${name}`,
    html: contactNotificationHtml(name, email, subject, message),
    replyTo: email,
  });
}
