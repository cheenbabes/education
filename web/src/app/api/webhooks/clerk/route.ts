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

  const userId = data.user_id as string | undefined;
  if (!userId) {
    return NextResponse.json({ error: "No user_id in payload" }, { status: 400 });
  }

  try {
    if (type === "subscription.created" || type === "subscription.updated") {
      const planKey = (data.plan as { slug?: string } | undefined)?.slug;
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
      // Payment failed — Clerk/Stripe will retry automatically.
      // Only downgrade if subscription.deleted fires after all retries fail.
      console.log(`[clerk webhook] past_due for user=${userId} — no action, awaiting retry`);
    }
    // All other subscription.* events are intentionally ignored
  } catch (err) {
    console.error("[clerk webhook] DB error:", err);
    return NextResponse.json({ error: "DB error" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
