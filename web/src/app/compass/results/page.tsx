import type { Metadata } from "next";
import { ARCHETYPES } from "@/lib/compass/archetypes";
import { getComboText } from "@/lib/compass/combo-text";
import { SITE_NAME, SITE_ORIGIN, toSiteUrl } from "@/lib/site";
import { ResultsPageClient } from "./results-client";

interface Props {
  searchParams: Promise<{ a?: string; s?: string; id?: string }>;
}

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const params = await searchParams;
  const archetypeId = params.a;
  const secondaryId = params.s;

  if (!archetypeId) return {};

  const archetype = ARCHETYPES.find((a) => a.id === archetypeId);
  if (!archetype) return {};

  const secondary = secondaryId
    ? ARCHETYPES.find((a) => a.id === secondaryId) ?? null
    : null;

  const combo = secondary ? getComboText(archetypeId, secondaryId!) : null;

  const title = secondary
    ? `I'm ${archetype.name} with ${secondary.name} tendencies`
    : `I'm ${archetype.name}`;

  const description = combo?.shareText ?? archetype.description;

  const ogImageUrl = `${SITE_ORIGIN}/api/og/archetype?a=${archetypeId}${secondaryId ? `&s=${secondaryId}` : ""}`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: toSiteUrl(`/compass/results?a=${archetypeId}${secondaryId ? `&s=${secondaryId}` : ""}`),
      siteName: SITE_NAME,
      images: [{ url: ogImageUrl, width: 1200, height: 630 }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [ogImageUrl],
    },
  };
}

export default function ResultsPage() {
  return <ResultsPageClient />;
}
