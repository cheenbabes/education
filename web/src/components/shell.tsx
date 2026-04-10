import Link from "next/link";
import { Nav } from "./nav";

type PageHue =
  | "home" | "compass" | "results" | "generate" | "lessons"
  | "dashboard" | "children" | "calendar" | "standards" | "archetypes" | "audit";

interface ShellProps {
  children: React.ReactNode;
  hue?: PageHue;
  fullWidth?: boolean;
}

export function Shell({ children, hue = "home", fullWidth = false }: ShellProps) {
  return (
    <div className={`watercolor-page hue-${hue}`} style={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
      <Nav />
      <main className={fullWidth ? "" : "max-w-5xl mx-auto px-4 py-8"} style={{ flex: 1 }}>
        {children}
      </main>
      <footer style={{ background: "#082f4e", padding: "1rem 1.5rem" }}>
        <div style={{
          maxWidth: "64rem",
          margin: "0 auto",
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "0.5rem",
          fontSize: "0.75rem",
          color: "rgba(249,246,239,0.4)",
        }}>
          <span>© {new Date().getFullYear()} The Sage&apos;s Compass</span>
          <div style={{ display: "flex", gap: "1.25rem" }}>
            {([["Privacy", "/privacy"], ["Terms", "/terms"], ["Data Deletion", "/data-deletion"], ["Contact", "/contact"]] as const).map(([label, href]) => (
              <Link key={label} href={href} style={{ color: "rgba(249,246,239,0.4)", textDecoration: "none" }}>
                {label}
              </Link>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
}
