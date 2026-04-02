import { Webhook } from "svix";
import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

// Maps Clerk plan keys → our tier values
const PLAN_TO_TIER: Record<string, string> = {
  homestead_monthly: "homestead",
  schoolhouse_monthly: "schoolhouse",
};

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
  console.log(`[clerk webhook] ${type}`, JSON.stringify(data, null, 2));

  // Billing events: data.payer.user_id — User events: data.id
  const userId =
    (data.payer as { user_id?: string } | undefined)?.user_id ??
    (data.id as string | undefined);

  if (!userId) {
    console.error("[clerk webhook] No user_id found in payload");
    return NextResponse.json({ error: "No user_id in payload" }, { status: 400 });
  }

  try {
    if (type === "subscription.created" || type === "subscription.updated") {
      // Find the current plan — prefer "active", fall back to "upcoming"
      // "upcoming" means paid but not yet started (e.g. upgrading mid annual cycle)
      const items = (data.items as Array<{ status: string; plan: { slug?: string } }> | undefined) ?? [];
      const currentItem =
        items.find((i) => i.status === "active") ??
        items.find((i) => i.status === "upcoming");
      const planKey = currentItem?.plan?.slug;
      const tier = planKey ? (PLAN_TO_TIER[planKey] ?? "compass") : "compass";
      await prisma.user.upsert({
        where: { id: userId },
        update: { tier },
        create: { id: userId, email: `${userId}@clerk.placeholder`, tier },
      });
      console.log(`[clerk webhook] Set tier=${tier} for user=${userId}`);
    } else if (type === "subscription.deleted") {
      await prisma.user.update({
        where: { id: userId },
        data: { tier: "compass" },
      });
      console.log(`[clerk webhook] Downgraded user=${userId} to compass`);
    } else if (type === "subscription.past_due") {
      console.log(`[clerk webhook] past_due for user=${userId} — no action, awaiting retry`);
    } else if (type === "user.created" || type === "user.updated") {
      // Sync real email to DB whenever Clerk fires a user event
      const emailAddresses = data.email_addresses as Array<{ id: string; email_address: string }> | undefined;
      const primaryId = data.primary_email_address_id as string | undefined;
      const email = emailAddresses?.find((e) => e.id === primaryId)?.email_address;
      if (email) {
        await prisma.user.upsert({
          where: { id: userId },
          update: { email },
          create: { id: userId, email },
        });
        console.log(`[clerk webhook] Synced email for user=${userId}`);
      }
    }
    // All other events are intentionally ignored
  } catch (err) {
    console.error("[clerk webhook] DB error:", err);
    return NextResponse.json({ error: "DB error" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
