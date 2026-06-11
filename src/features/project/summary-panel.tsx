import { suggestKpis, type ColumnInfo, type ParsedSheet } from "@/lib/sheet-parser";
import { Database, Columns3, Hash, Calendar, Type, ToggleLeft, Sparkles } from "lucide-react";

export function SummaryPanel({ dataSource }: { dataSource: any }) {
  const columns: ColumnInfo[] = dataSource.schema_json ?? [];
  const sampleRows: Record<string, unknown>[] = dataSource.sample_rows ?? [];

  const metrics = columns.filter((c) => c.type === "number");
  const dims = columns.filter((c) => c.type === "string" || c.type === "boolean");
  const dates = columns.filter((c) => c.type === "date");

  const parsed: ParsedSheet = {
    rows: sampleRows,
    columns,
    rowCount: dataSource.row_count,
    columnCount: dataSource.column_count,
  };
  const kpis = suggestKpis(parsed);

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <section>
        <h2 className="text-sm font-medium text-muted-foreground mb-3">{dataSource.file_name}</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Stat label="Linhas" value={dataSource.row_count?.toLocaleString() ?? "—"} />
          <Stat label="Colunas" value={dataSource.column_count} />
          <Stat label="Métricas" value={metrics.length} hint="Numéricas" />
          <Stat label="Dimensões" value={dims.length + dates.length} hint="Categóricas + Datas" />
        </div>
      </section>

      <section className="grid lg:grid-cols-2 gap-6">
        <div className="bg-card border rounded-lg overflow-hidden">
          <header className="px-4 py-3 border-b flex items-center gap-2">
            <Columns3 className="size-4 text-muted-foreground" />
            <h3 className="text-sm font-medium">Colunas detectadas</h3>
          </header>
          <div className="divide-y max-h-[400px] overflow-auto">
            {columns.map((c) => (
              <div key={c.name} className="px-4 py-2.5 flex items-center justify-between gap-3">
                <div className="min-w-0 flex items-center gap-2">
                  <TypeIcon type={c.type} />
                  <span className="text-sm truncate">{c.name}</span>
                </div>
                <span className="text-xs text-muted-foreground shrink-0">{c.type}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-card border rounded-lg">
          <header className="px-4 py-3 border-b flex items-center gap-2">
            <Sparkles className="size-4 text-primary" />
            <h3 className="text-sm font-medium">KPIs sugeridos</h3>
          </header>
          <div className="p-2 space-y-1">
            {kpis.length === 0 ? (
              <p className="px-2 py-6 text-sm text-muted-foreground text-center">Nenhuma sugestão automática para esta base.</p>
            ) : kpis.map((k, i) => (
              <div key={i} className="px-3 py-2.5 rounded-md hover:bg-accent">
                <p className="text-sm font-medium">{k.title}</p>
                <p className="text-xs text-muted-foreground">{k.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {sampleRows.length > 0 && (
        <section className="bg-card border rounded-lg overflow-hidden">
          <header className="px-4 py-3 border-b">
            <h3 className="text-sm font-medium flex items-center gap-2"><Database className="size-4 text-muted-foreground" /> Amostra dos dados</h3>
          </header>
          <div className="overflow-auto max-h-[360px]">
            <table className="w-full text-sm">
              <thead className="bg-muted/40 sticky top-0">
                <tr>
                  {columns.map((c) => (
                    <th key={c.name} className="px-3 py-2 text-left font-medium text-muted-foreground whitespace-nowrap">{c.name}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sampleRows.slice(0, 20).map((row, i) => (
                  <tr key={i} className="border-t">
                    {columns.map((c) => (
                      <td key={c.name} className="px-3 py-2 whitespace-nowrap text-foreground/90">
                        {String(row[c.name] ?? "")}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
}

function Stat({ label, value, hint }: { label: string; value: string | number; hint?: string }) {
  return (
    <div className="bg-card border rounded-lg p-4">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-2xl font-semibold mt-1 tabular-nums">{value}</p>
      {hint && <p className="text-xs text-muted-foreground mt-0.5">{hint}</p>}
    </div>
  );
}

function TypeIcon({ type }: { type: ColumnInfo["type"] }) {
  const cls = "size-3.5 text-muted-foreground";
  if (type === "number") return <Hash className={cls} />;
  if (type === "date") return <Calendar className={cls} />;
  if (type === "boolean") return <ToggleLeft className={cls} />;
  return <Type className={cls} />;
}
