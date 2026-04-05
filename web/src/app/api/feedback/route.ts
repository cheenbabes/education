import { NextRequest, NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/email";

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  const body = await req.json();
  const { category, message } = body;

  if (!message?.trim()) {
    return NextResponse.json({ error: "Message required" }, { status: 400 });
  }

  // Get user context
  const clerkUser = userId ? await currentUser() : null;
  const email = clerkUser?.emailAddresses?.find(e => e.id === clerkUser.primaryEmailAddressId)?.emailAddress ?? "anonymous";
  const name = clerkUser ? `${clerkUser.firstName ?? ""} ${clerkUser.lastName ?? ""}`.trim() : "Anonymous";

  // Get plan from DB
  const dbUser = userId ? await prisma.user.findUnique({ where: { id: userId }, select: { tier: true, createdAt: true } }) : null;
  const plan = dbUser?.tier ?? "unknown";
  const memberSince = dbUser?.createdAt ? Math.floor((Date.now() - dbUser.createdAt.getTime()) / (1000 * 60 * 60 * 24)) + " days" : "unknown";

  // Save to DB
  await prisma.feedback.create({
    data: { userId: userId ?? null, email, name, plan, category: category ?? "general", message },
  });

  // Send notification
  await sendEmail({
    to: process.env.RESEND_ADMIN_EMAIL ?? "hello@sagescompass.com",
    subject: `[Feedback] ${category ?? "general"} — ${name}`,
    html: `<div style="font-family:Georgia,serif;max-width:580px;margin:0 auto;padding:32px 20px;">
      <h2 style="color:#0B2E4A;">New Feedback</h2>
      <p><strong>From:</strong> ${name} &lt;${email}&gt;</p>
      <p><strong>Plan:</strong> ${plan} · <strong>Member for:</strong> ${memberSince}</p>
      <p><strong>Category:</strong> ${category}</p>
      <hr style="border:none;border-top:1px solid #eee;margin:16px 0;">
      <p style="white-space:pre-wrap;">${message}</p>
    </div>`,
  }).catch(() => {}); // non-blocking

  return NextResponse.json({ ok: true });
}
