"use client";
import { useState } from "react";
import { useUser } from "@clerk/nextjs";
import { usePathname } from "next/navigation";

const CATEGORIES = [
  { value: "bug", label: "Something's broken" },
  { value: "feature", label: "Feature idea" },
  { value: "general", label: "General feedback" },
];

// Only show on authenticated app pages, not public/marketing pages
const HIDDEN_PATHS = ["/", "/contact", "/about", "/pricing", "/explore", "/archetypes", "/compass", "/privacy", "/terms", "/sign-in", "/sign-up"];

export function FeedbackButton() {
  const { isSignedIn } = useUser();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [category, setCategory] = useState("general");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  if (!isSignedIn) return null;
  if (HIDDEN_PATHS.some(p => pathname === p || (p !== "/" && pathname.startsWith(p + "/")))) return null;

  const handleSubmit = async () => {
    if (!message.trim()) return;
    setSubmitting(true);
    await fetch("/api/feedback", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ category, message }),
    });
    setSubmitting(false);
    setSubmitted(true);
    setTimeout(() => { setOpen(false); setSubmitted(false); setMessage(""); setCategory("general"); }, 2000);
  };

  return (
    <>
      {/* Floating button */}
      <button
        onClick={() => setOpen(true)}
        style={{
          position: "fixed", bottom: "24px", right: "24px", zIndex: 100,
          background: "#0B2E4A", color: "#F9F6EF",
          border: "none", borderRadius: "50px",
          padding: "0.55rem 1.1rem",
          fontSize: "0.8rem", fontWeight: 600, fontFamily: "Georgia, serif",
          cursor: "pointer", boxShadow: "0 4px 16px rgba(11,46,74,0.3)",
          display: "flex", alignItems: "center", gap: "0.4rem",
          transition: "transform 0.15s, box-shadow 0.15s",
        }}
        onMouseEnter={e => (e.currentTarget.style.transform = "translateY(-2px)")}
        onMouseLeave={e => (e.currentTarget.style.transform = "translateY(0)")}
      >
        Feedback
      </button>

      {/* Modal backdrop */}
      {open && (
        <div
          onClick={() => setOpen(false)}
          style={{ position: "fixed", inset: 0, background: "rgba(11,46,74,0.3)", backdropFilter: "blur(2px)", zIndex: 200 }}
        />
      )}

      {/* Modal panel */}
      {open && (
        <div style={{
          position: "fixed", bottom: "80px", right: "24px", zIndex: 300,
          width: "min(360px, calc(100vw - 48px))",
          background: "rgba(253,251,247,0.97)", backdropFilter: "blur(16px)",
          border: "1px solid rgba(0,0,0,0.1)", borderRadius: "14px",
          padding: "1.5rem", boxShadow: "0 8px 32px rgba(11,46,74,0.18)",
          display: "flex", flexDirection: "column", gap: "0.875rem",
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <h3 className="font-cormorant-sc" style={{ fontSize: "1rem", color: "#0B2E4A", margin: 0 }}>Share Feedback</h3>
            <button onClick={() => setOpen(false)} style={{ background: "none", border: "none", cursor: "pointer", fontSize: "1.1rem", color: "#888", padding: "0 4px" }}>&times;</button>
          </div>

          {submitted ? (
            <div style={{ textAlign: "center", padding: "1rem 0" }}>
              <p style={{ fontSize: "0.9rem", color: "#4a8b6e" }}>Thank you — we read every message.</p>
            </div>
          ) : (
            <>
              <select
                value={category}
                onChange={e => setCategory(e.target.value)}
                style={{ padding: "0.45rem 0.6rem", borderRadius: "8px", border: "1px solid rgba(0,0,0,0.12)", fontSize: "0.85rem", fontFamily: "Georgia, serif", background: "rgba(255,255,255,0.8)", color: "#333" }}
              >
                {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>

              <textarea
                value={message}
                onChange={e => setMessage(e.target.value)}
                placeholder="Tell us what's on your mind..."
                rows={4}
                style={{ padding: "0.5rem 0.65rem", borderRadius: "8px", border: "1px solid rgba(0,0,0,0.12)", fontSize: "0.875rem", fontFamily: "Georgia, serif", resize: "vertical", background: "rgba(255,255,255,0.8)", color: "#222", lineHeight: 1.6 }}
              />

              <button
                onClick={handleSubmit}
                disabled={!message.trim() || submitting}
                style={{
                  background: "#0B2E4A", color: "#F9F6EF", border: "none", borderRadius: "8px",
                  padding: "0.6rem", fontSize: "0.875rem", fontWeight: 600, fontFamily: "Georgia, serif",
                  cursor: message.trim() && !submitting ? "pointer" : "not-allowed",
                  opacity: message.trim() && !submitting ? 1 : 0.5,
                }}
              >
                {submitting ? "Sending..." : "Send Feedback"}
              </button>

              <p style={{ fontSize: "0.72rem", color: "#aaa", textAlign: "center", margin: 0 }}>
                We reply personally to every message.
              </p>
            </>
          )}
        </div>
      )}
    </>
  );
}
