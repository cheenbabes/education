export function DataTable<T extends Record<string, string | number | null>>({
  columns,
  rows,
  emptyLabel = "No data",
}: {
  columns: { key: keyof T; label: string; align?: "left" | "right"; format?: (v: T[keyof T]) => string }[];
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
                const v = r[c.key];
                const display = c.format ? c.format(v) : v ?? "—";
                return (
                  <td
                    key={String(c.key)}
                    className={`py-2 tabular-nums ${c.align === "right" ? "text-right" : "text-left"}`}
                  >
                    {display}
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
