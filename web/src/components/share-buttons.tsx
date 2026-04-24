"use client";

import { useState, useEffect } from "react";
import { SITE_ORIGIN } from "@/lib/site";

interface ShareButtonsProps {
  archetypeId: string;
  archetypeName: string;
  secondaryId: string | null;
  secondaryName: string | null;
  shareText: string;
  archetypeColor: string;
  /**
   * `horizontal` (default) renders the original wide row with a "Share your
   * archetype" eyebrow. `vertical` renders a compact column of icon-only
   * buttons suitable for floating in a card corner.
   */
  variant?: "horizontal" | "vertical";
}

export function ShareButtons({
  archetypeId,
  archetypeName,
  secondaryId,
  secondaryName,
  shareText,
  archetypeColor,
  variant = "horizontal",
}: ShareButtonsProps) {
  const [copied, setCopied] = useState(false);
  const [canNativeShare, setCanNativeShare] = useState(false);

  useEffect(() => {
    setCanNativeShare(typeof navigator.share === "function");
  }, []);

  const shareUrl = `${SITE_ORIGIN}/compass/results?a=${archetypeId}${secondaryId ? `&s=${secondaryId}` : ""}`;
  const imageUrl = `${SITE_ORIGIN}/archetypes/results/${archetypeId.replace("the-", "")}.png`;

  const fullText = secondaryName
    ? `I'm ${archetypeName} with ${secondaryName} tendencies! ${shareText}`
    : `I'm ${archetypeName}! ${shareText}`;

  const shareTitle = secondaryName
    ? `I'm ${archetypeName} with ${secondaryName} tendencies`
    : `I'm ${archetypeName}`;

  const handleNativeShare = async () => {
    try {
      await navigator.share({
        title: shareTitle,
        text: `${fullText}\n\nTake the free quiz:`,
        url: shareUrl,
      });
    } catch {
      // user cancelled
    }
  };

  const handleFacebook = () => {
    window.open(
      `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`,
      "_blank",
      "width=600,height=400",
    );
  };

  const handleTwitter = () => {
    const text = `${fullText}\n\nTake the free quiz:`;
    window.open(
      `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(shareUrl)}`,
      "_blank",
      "width=600,height=400",
    );
  };

  const handlePinterest = () => {
    window.open(
      `https://pinterest.com/pin/create/button/?url=${encodeURIComponent(shareUrl)}&media=${encodeURIComponent(imageUrl)}&description=${encodeURIComponent(fullText)}`,
      "_blank",
      "width=750,height=550",
    );
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
    }
  };

  const isVertical = variant === "vertical";

  const pill: React.CSSProperties = isVertical
    ? {
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        width: "30px",
        height: "30px",
        background: "rgba(255,255,255,0.68)",
        backdropFilter: "blur(10px)",
        WebkitBackdropFilter: "blur(10px)",
        border: "1px solid rgba(255,255,255,0.55)",
        borderRadius: "8px",
        cursor: "pointer",
        transition: "all 0.2s ease",
        color: "var(--text-secondary)",
        padding: 0,
      }
    : {
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        width: "40px",
        height: "40px",
        background: "rgba(255,255,255,0.68)",
        backdropFilter: "blur(10px)",
        WebkitBackdropFilter: "blur(10px)",
        border: "1px solid rgba(255,255,255,0.45)",
        borderRadius: "10px",
        cursor: "pointer",
        transition: "all 0.2s ease",
        color: "var(--text-secondary)",
      };

  const iconSize = isVertical ? 14 : 18;
  const xIconSize = isVertical ? 12 : 16;

  const buttons = (
    <>
      {canNativeShare && (
        <button onClick={handleNativeShare} style={pill} title="Share" aria-label="Share">
          <svg width={iconSize} height={iconSize} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8" />
            <polyline points="16 6 12 2 8 6" />
            <line x1="12" y1="2" x2="12" y2="15" />
          </svg>
        </button>
      )}

      <button onClick={handleFacebook} style={pill} title="Share on Facebook" aria-label="Share on Facebook">
        <svg width={iconSize} height={iconSize} viewBox="0 0 24 24" fill="currentColor">
          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
        </svg>
      </button>

      <button onClick={handlePinterest} style={pill} title="Pin on Pinterest" aria-label="Pin on Pinterest">
        <svg width={iconSize} height={iconSize} viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 0C5.373 0 0 5.372 0 12c0 5.084 3.163 9.426 7.627 11.174-.105-.949-.2-2.405.042-3.441.218-.937 1.407-5.965 1.407-5.965s-.359-.719-.359-1.782c0-1.668.967-2.914 2.171-2.914 1.023 0 1.518.769 1.518 1.69 0 1.029-.655 2.568-.994 3.995-.283 1.194.599 2.169 1.777 2.169 2.133 0 3.772-2.249 3.772-5.495 0-2.873-2.064-4.882-5.012-4.882-3.414 0-5.418 2.561-5.418 5.207 0 1.031.397 2.138.893 2.738a.36.36 0 01.083.345l-.333 1.36c-.053.22-.174.267-.402.161-1.499-.698-2.436-2.889-2.436-4.649 0-3.785 2.75-7.262 7.929-7.262 4.163 0 7.398 2.967 7.398 6.931 0 4.136-2.607 7.464-6.227 7.464-1.216 0-2.359-.631-2.75-1.378l-.748 2.853c-.271 1.043-1.002 2.35-1.492 3.146C9.57 23.812 10.763 24 12 24c6.627 0 12-5.373 12-12 0-6.628-5.373-12-12-12z" />
        </svg>
      </button>

      <button onClick={handleTwitter} style={pill} title="Share on X" aria-label="Share on X">
        <svg width={xIconSize} height={xIconSize} viewBox="0 0 24 24" fill="currentColor">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
        </svg>
      </button>

      <button onClick={handleCopy} style={pill} title="Copy link" aria-label="Copy link">
        {copied ? (
          <svg width={iconSize} height={iconSize} viewBox="0 0 24 24" fill="none" stroke={archetypeColor} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        ) : (
          <svg width={iconSize} height={iconSize} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71" />
            <path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71" />
          </svg>
        )}
      </button>
    </>
  );

  if (isVertical) {
    return (
      <div className="flex flex-col items-center" style={{ gap: "0.35rem" }}>
        {buttons}
        {copied && (
          <span
            className="text-xs animate-fadeIn"
            style={{ color: archetypeColor, fontSize: "0.62rem", whiteSpace: "nowrap" }}
            aria-live="polite"
          >
            Copied
          </span>
        )}
      </div>
    );
  }

  return (
    <div className="pt-4 mt-4" style={{ borderTop: "1px solid rgba(0,0,0,0.07)" }}>
      <p
        className="text-center mb-3"
        style={{ fontSize: "0.68rem", fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--text-tertiary)" }}
      >
        Share your archetype
      </p>
      <div className="flex items-center justify-center gap-2 flex-wrap">
        {buttons}
      </div>
      {copied && (
        <p className="text-center mt-2 text-xs animate-fadeIn" style={{ color: archetypeColor }}>
          Link copied!
        </p>
      )}
    </div>
  );
}
