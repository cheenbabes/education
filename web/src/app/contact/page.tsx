"use client";

import { Shell } from "@/components/shell";
import { Suspense, useState, useEffect, FormEvent } from "react";
import { useSearchParams } from "next/navigation";

const frostCard: React.CSSProperties = {
  background: "rgba(255,255,255,0.72)",
  backdropFilter: "blur(12px)",
  border: "1px solid rgba(255,255,255,0.5)",
  borderRadius: "12px",
  padding: "1.25rem",
};

const nightButton: React.CSSProperties = {
  background: "#0B2E4A",
  color: "#F9F6EF",
  borderRadius: "10px",
  padding: "0.6rem 1.4rem",
  fontSize: "0.85rem",
  border: "none",
  cursor: "pointer",
  width: "100%",
};

const subjects = ["General", "Curriculum Suggestion", "Bug Report", "Partnership"] as const;

const SUBJECT_PARAM_MAP: Record<string, string> = {
  "curriculum-suggestion": "Curriculum Suggestion",
};

type Status = "idle" | "sending" | "success" | "error";

export default function ContactPage() {
  return (
    <Suspense fallback={null}>
      <ContactPageInner />
    </Suspense>
  );
}

function ContactPageInner() {
  const searchParams = useSearchParams();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState<string>(subjects[0]);
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    const subjectParam = searchParams.get("subject");
    if (subjectParam && SUBJECT_PARAM_MAP[subjectParam]) {
      setSubject(SUBJECT_PARAM_MAP[subjectParam]);
    }
  }, [searchParams]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setStatus("sending");
    setErrorMsg("");

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, subject, message }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Something went wrong. Please try again.");
      }

      setStatus("success");
      setName("");
      setEmail("");
      setSubject(subjects[0]);
      setMessage("");
    } catch (err: unknown) {
      setStatus("error");
      setErrorMsg(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    }
  }

  return (
    <Shell hue="compass">
      <div className="max-w-xl mx-auto space-y-8" style={{ paddingTop: "4rem", paddingBottom: "4rem" }}>
        {/* Header */}
        <div className="space-y-2 text-center">
          <h1
            className="font-cormorant-sc text-4xl"
            style={{ color: "#0B2E4A" }}
          >
            Contact Us
          </h1>
          <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
            We&apos;d love to hear from you. Send us a message and we&apos;ll
            get back to you as soon as we can.
          </p>
        </div>

        {/* Success banner */}
        {status === "success" && (
          <div
            style={{
              ...frostCard,
              borderColor: "rgba(196,152,61,0.4)",
              background: "rgba(196,152,61,0.08)",
            }}
          >
            <p
              className="font-cormorant-sc text-lg"
              style={{ color: "#0B2E4A", fontWeight: 600 }}
            >
              Message Sent
            </p>
            <p className="text-sm mt-1" style={{ color: "var(--text-secondary)" }}>
              Thank you for reaching out. We&apos;ll respond within 1-2 business
              days.
            </p>
          </div>
        )}

        {/* Form card */}
        <form onSubmit={handleSubmit} style={frostCard} className="space-y-5">
          {/* Name */}
          <div className="space-y-1.5">
            <label
              htmlFor="name"
              className="block text-sm font-medium"
              style={{ color: "#0B2E4A" }}
            >
              Name
            </label>
            <input
              id="name"
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
              className="w-full text-sm px-3 py-2 rounded-lg outline-none transition-colors"
              style={{
                background: "rgba(255,255,255,0.6)",
                border: "1px solid rgba(11,46,74,0.15)",
                color: "#0B2E4A",
              }}
            />
          </div>

          {/* Email */}
          <div className="space-y-1.5">
            <label
              htmlFor="email"
              className="block text-sm font-medium"
              style={{ color: "#0B2E4A" }}
            >
              Email
            </label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full text-sm px-3 py-2 rounded-lg outline-none transition-colors"
              style={{
                background: "rgba(255,255,255,0.6)",
                border: "1px solid rgba(11,46,74,0.15)",
                color: "#0B2E4A",
              }}
            />
          </div>

          {/* Subject dropdown */}
          <div className="space-y-1.5">
            <label
              htmlFor="subject"
              className="block text-sm font-medium"
              style={{ color: "#0B2E4A" }}
            >
              Subject
            </label>
            <div style={{ position: "relative" }}>
              <select
                id="subject"
                required
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="w-full text-sm px-3 py-2 rounded-lg outline-none transition-colors"
                style={{
                  background: "rgba(255,255,255,0.6)",
                  border: "1px solid rgba(11,46,74,0.15)",
                  color: "#0B2E4A",
                  appearance: "none",
                  WebkitAppearance: "none",
                  paddingRight: "2rem",
                  cursor: "pointer",
                }}
              >
                {subjects.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
              <svg
                style={{ position: "absolute", right: "0.75rem", top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }}
                width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#5A5A5A" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
              >
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </div>
          </div>

          {/* Message */}
          <div className="space-y-1.5">
            <label
              htmlFor="message"
              className="block text-sm font-medium"
              style={{ color: "#0B2E4A" }}
            >
              Message
            </label>
            <textarea
              id="message"
              required
              rows={5}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="How can we help?"
              className="w-full text-sm px-3 py-2 rounded-lg outline-none transition-colors resize-y"
              style={{
                background: "rgba(255,255,255,0.6)",
                border: "1px solid rgba(11,46,74,0.15)",
                color: "#0B2E4A",
              }}
            />
          </div>

          {/* Error message */}
          {status === "error" && (
            <p className="text-sm" style={{ color: "#b91c1c" }}>
              {errorMsg}
            </p>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={status === "sending"}
            style={{
              ...nightButton,
              opacity: status === "sending" ? 0.7 : 1,
            }}
          >
            {status === "sending" ? "Sending..." : "Send Message"}
          </button>
        </form>
      </div>
    </Shell>
  );
}
