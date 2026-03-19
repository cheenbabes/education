"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { GraphData } from "@/components/explore/types";

// Dynamic import to avoid SSR issues with Three.js
const ExploreCanvas = dynamic(
  () => import("@/components/explore/ExploreCanvas"),
  { ssr: false },
);

export default function ExplorePage() {
  const [data, setData] = useState<GraphData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/explore/graph")
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then(setData)
      .catch((err) => setError(err.message));
  }, []);

  if (error) {
    return (
      <div className="w-screen h-screen bg-[#0a0a0f] flex items-center justify-center">
        <p className="text-red-400 text-sm">Failed to load graph: {error}</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="w-screen h-screen bg-[#0a0a0f] flex items-center justify-center">
        <p className="text-gray-500 text-sm animate-pulse">
          Loading constellation...
        </p>
      </div>
    );
  }

  return (
    <div className="w-screen h-screen bg-[#0a0a0f]">
      <ExploreCanvas data={data} />
    </div>
  );
}
