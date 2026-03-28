import { Nav } from "./nav";

type PageHue =
  | "home" | "compass" | "results" | "generate" | "lessons"
  | "dashboard" | "children" | "calendar" | "standards" | "archetypes";

interface ShellProps {
  children: React.ReactNode;
  hue?: PageHue;
  fullWidth?: boolean;
}

export function Shell({ children, hue = "home", fullWidth = false }: ShellProps) {
  return (
    <div className={`watercolor-page hue-${hue}`}>
      <Nav />
      <main className={fullWidth ? "" : "max-w-5xl mx-auto px-4 py-8"}>
        {children}
      </main>
    </div>
  );
}
