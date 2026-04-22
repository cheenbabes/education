import type { ReactNode } from "react";

type Cell = string | number | boolean | null;

interface Column<T> {
  key: keyof T;
  label: string;
  align?: "left" | "right";
  format?: (v: T[keyof T]) => string;
  /** Custom React renderer for the cell. Overrides `format` when present. */
  render?: (row: T) => ReactNode;
  /** Optional max width so long seed/interest strings don't blow out the layout. */
  maxWidth?: string;
}

export function DataTable<T extends Record<string, Cell>>({
  columns,
  rows,
  emptyLabel = "No data",
}: {
  columns: Column<T>[];
  rows: T[];
  emptyLabel?: string;
}) {
  if (rows.length === 0) {
    return <div className="py-8 text-center text-sm text-neutral-500">{emptyLabel}</div>;
  }
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-neutral-200 text-xs uppercase tracking-wide text-neutral-500">
            {columns.map((c) => (
              <th key={String(c.key)} className={`py-2 ${c.align === "right" ? "text-right" : "text-left"}`}>
                {c.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i} className="border-b border-neutral-100 last:border-b-0">
              {columns.map((c) => {
                const content = c.render
                  ? c.render(r)
                  : (() => {
                      const v = r[c.key];
                      if (c.format) return c.format(v);
                      return v === null || v === undefined ? "—" : String(v);
                    })();
                const style: React.CSSProperties = c.maxWidth
                  ? { maxWidth: c.maxWidth, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }
                  : {};
                return (
                  <td
                    key={String(c.key)}
                    className={`py-2 pr-3 tabular-nums ${c.align === "right" ? "text-right" : "text-left"}`}
                    style={style}
                    title={c.maxWidth && typeof r[c.key] === "string" ? String(r[c.key]) : undefined}
                  >
                    {content}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
