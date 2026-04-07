import { logger } from "@/lib/logger";

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL ?? "hello@sagescompass.com";
// Comma-separated list of admin emails for contact/feedback notifications
const ADMIN_EMAILS = (process.env.RESEND_ADMIN_EMAILS ?? "hello@sagescompass.com")
  .split(",")
  .map((e) => e.trim())
  .filter(Boolean);

interface SendEmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  replyTo?: string;
}

export async function sendEmail({ to, subject, html, replyTo }: SendEmailOptions) {
  if (!RESEND_API_KEY) {
    logger.warn("RESEND_API_KEY not set — skipping email");
    return;
  }
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${RESEND_API_KEY}` },
    body: JSON.stringify({ from: `The Sage's Compass <${FROM_EMAIL}>`, to, subject, html, reply_to: replyTo }),
  });
  if (!res.ok) logger.error({ status: res.status, body: await res.text() }, "Resend API error");
}

// ── Email templates ───────────────────────────────────────────────────────────

export function welcomeEmailHtml(firstName: string): string {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <!--[if mso]><style>body{font-family:Georgia,serif!important;}</style><![endif]-->
</head>
<body style="margin:0;padding:0;background-color:#F9F6EF;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#F9F6EF;">
    <tr><td align="center" style="padding:40px 16px;">
      <table role="presentation" width="580" cellpadding="0" cellspacing="0" style="max-width:580px;width:100%;">

        <!-- Header -->
        <tr><td style="background-color:#0B2E4A;border-radius:12px 12px 0 0;padding:28px 32px;text-align:center;">
          <p style="margin:0;font-family:'Cormorant SC',Georgia,serif;font-variant:small-caps;font-size:1.3rem;color:#F9F6EF;letter-spacing:0.06em;">
            The Sage's Compass
          </p>
          <p style="margin:6px 0 0;font-family:Georgia,serif;font-size:0.78rem;color:rgba(249,246,239,0.5);letter-spacing:0.04em;">
            Curriculum matched to your teaching philosophy
          </p>
        </td></tr>

        <!-- Body -->
        <tr><td style="background-color:#FFFFFF;padding:36px 32px 28px;border-left:1px solid #E8E2D6;border-right:1px solid #E8E2D6;">

          <h1 style="margin:0 0 16px;font-family:'Cormorant SC',Georgia,serif;font-variant:small-caps;font-size:1.5rem;color:#0B2E4A;font-weight:700;">
            Welcome${firstName ? `, ${firstName}` : ""}!
          </h1>

          <p style="margin:0 0 20px;font-family:Georgia,serif;font-size:0.95rem;line-height:1.75;color:#444;">
            We're so glad you're here. The Sage's Compass was built for families like yours &mdash; ones who care deeply about how their children learn and want curriculum that actually fits their values.
          </p>

          <!-- Action box -->
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#F5F1E8;border-radius:10px;margin-bottom:24px;">
            <tr><td style="padding:20px 24px;">
              <p style="margin:0 0 12px;font-family:Georgia,serif;font-weight:600;font-size:0.92rem;color:#0B2E4A;">
                Here's what you can do right now:
              </p>
              <table role="presentation" cellpadding="0" cellspacing="0" style="font-family:Georgia,serif;font-size:0.88rem;color:#444;line-height:1.8;">
                <tr><td style="padding:3px 0;vertical-align:top;color:#6E6E9E;width:20px;">&#10003;</td>
                    <td style="padding:3px 0 3px 8px;"><strong>Take the Compass Quiz</strong> &mdash; discover your teaching archetype in 5 minutes</td></tr>
                <tr><td style="padding:3px 0;vertical-align:top;color:#7A9E8A;width:20px;">&#10003;</td>
                    <td style="padding:3px 0 3px 8px;"><strong>Explore curricula</strong> &mdash; browse 70+ matched to your philosophy</td></tr>
                <tr><td style="padding:3px 0;vertical-align:top;color:#9B7E8E;width:20px;">&#10003;</td>
                    <td style="padding:3px 0 3px 8px;"><strong>Create a lesson</strong> &mdash; pick an interest, get a complete lesson plan</td></tr>
              </table>
            </td></tr>
          </table>

          <p style="margin:0 0 28px;font-family:Georgia,serif;font-size:0.88rem;line-height:1.75;color:#555;">
            If you ever have a question, get stuck, or just want to share feedback &mdash; reply to this email. We read every message and respond personally.
          </p>

          <!-- CTA button -->
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
            <tr><td align="center" style="padding:4px 0 8px;">
              <a href="https://thesagescompass.com/compass"
                 style="display:inline-block;background-color:#0B2E4A;color:#F9F6EF;font-family:Georgia,serif;font-size:0.9rem;font-weight:600;text-decoration:none;padding:13px 32px;border-radius:10px;">
                Take the Compass Quiz
              </a>
            </td></tr>
          </table>

        </td></tr>

        <!-- Footer -->
        <tr><td style="background-color:#F9F6EF;border-top:1px solid #E8E2D6;border-left:1px solid #E8E2D6;border-right:1px solid #E8E2D6;border-radius:0 0 12px 12px;padding:24px 32px;">
          <p style="margin:0 0 16px;font-family:Georgia,serif;font-size:0.85rem;color:#888;font-style:italic;line-height:1.7;">
            With gratitude,<br>The Sage's Compass Team
          </p>
          <p style="margin:0;font-family:Georgia,serif;font-size:0.72rem;color:#aaa;text-align:center;">
            &copy; The Sage's Compass &middot;
            <a href="https://thesagescompass.com" style="color:#aaa;text-decoration:none;">thesagescompass.com</a>
          </p>
        </td></tr>

      </table>
    </td></tr>
  </table>
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
    to: ADMIN_EMAILS,
    subject: `[Contact] ${subject} — from ${name}`,
    html: contactNotificationHtml(name, email, subject, message),
    replyTo: email,
  });
}
