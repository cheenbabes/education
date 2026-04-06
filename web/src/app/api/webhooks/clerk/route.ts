import { Webhook } from "svix";
import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { sendWelcomeEmail } from "@/lib/email";

export async function POST(req: Request) {
  const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET;
  if (!WEBHOOK_SECRET) {
    console.error("[clerk webhook] Missing CLERK_WEBHOOK_SECRET");
    return NextResponse.json({ error: "Missing webhook secret" }, { status: 500 });
  }

  const headerPayload = headers();
  const svix_id = headerPayload.get("svix-id");
  const svix_timestamp = headerPayload.get("svix-timestamp");
  const svix_signature = headerPayload.get("svix-signature");

  if (!svix_id || !svix_timestamp || !svix_signature) {
    return NextResponse.json({ error: "Missing svix headers" }, { status: 400 });
  }

  const payload = await req.text();
  const wh = new Webhook(WEBHOOK_SECRET);

  let evt: { type: string; data: Record<string, unknown> };
  try {
    evt = wh.verify(payload, {
      "svix-id": svix_id,
      "svix-timestamp": svix_timestamp,
      "svix-signature": svix_signature,
    }) as typeof evt;
  } catch (err) {
    console.error("[clerk webhook] Invalid signature:", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  const { type, data } = evt;
  console.log(`[clerk webhook] ${type}`);

  // Only handle user events — billing state is read directly from Clerk API
  if (type === "user.created" || type === "user.updated") {
    const userId = data.id as string | undefined;
    if (!userId) {
      console.error("[clerk webhook] No user id in payload");
      return NextResponse.json({ error: "No user_id in payload" }, { status: 400 });
    }

    const emailAddresses = data.email_addresses as Array<{ id: string; email_address: string }> | undefined;
    const primaryId = data.primary_email_address_id as string | undefined;
    const email = emailAddresses?.find((e) => e.id === primaryId)?.email_address;
    const firstName = (data.first_name as string | undefined) ?? "";

    try {
      if (email) {
        await prisma.user.upsert({
          where: { id: userId },
          update: { email },
          create: { id: userId, email },
        });
        console.log(`[clerk webhook] Synced email for user=${userId}`);

        if (type === "user.created") {
          await sendWelcomeEmail(email, firstName).catch(err => console.error("[welcome email]", err));
        }
      }
    } catch (err) {
      console.error("[clerk webhook] DB error:", err);
      return NextResponse.json({ error: "DB error" }, { status: 500 });
    }
  }

  return NextResponse.json({ received: true });
}
