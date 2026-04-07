import { NextRequest, NextResponse } from "next/server";
import { sendContactNotification } from "@/lib/email";
import { routeLogger } from "@/lib/logger";

const log = routeLogger("POST /api/contact");

// POST /api/contact — send a contact-form email via Resend
export async function POST(req: NextRequest) {
  try {
    const { name, email, subject, message } = await req.json();

    if (!name || !email || !subject || !message) {
      return NextResponse.json(
        { error: "All fields are required." },
        { status: 400 },
      );
    }

    log.info({ subject }, "contact form submitted");
    await sendContactNotification(name, email, subject, message);

    return NextResponse.json({ success: true });
  } catch (err) {
    log.error({ err }, "contact API error");
    return NextResponse.json(
      { error: "Internal server error." },
      { status: 500 },
    );
  }
}
