import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  Area,
  AreaChart,
} from "recharts";

export type ChartSpec = {
  type: "bar" | "line" | "pie" | "area";
  title?: string;
  data: Array<Record<string, unknown>>;
  xKey?: string;
  yKeys?: string[];
};

const COLORS = [
  "hsl(var(--primary))",
  "hsl(217 91% 60%)",
  "hsl(142 71% 45%)",
  "hsl(38 92% 50%)",
  "hsl(280 70% 60%)",
  "hsl(0 72% 60%)",
];

export function isChartSpec(v: any): v is ChartSpec {
  return v && typeof v === "object" && typeof v.type === "string" && Array.isArray(v.data);
}

export function ChartRenderer({ spec, height = 260 }: { spec: ChartSpec; height?: number }) {
  const { type, data, xKey = "name", yKeys = ["value"], title } = spec;

  return (
    <div className="my-3 border rounded-md bg-card overflow-hidden">
      {title && (
        <div className="px-3 py-2 border-b text-xs font-medium text-muted-foreground">{title}</div>
      )}
      <div className="p-3" style={{ height }}>
        <ResponsiveContainer width="100%" height="100%">
          {type === "bar" ? (
            <BarChart data={data} margin={{ top: 8, right: 12, left: 0, bottom: 8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey={xKey} stroke="hsl(var(--muted-foreground))" fontSize={11} />
              <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} />
              <Tooltip contentStyle={{ background: "hsl(var(--popover))", border: "1px solid hsl(var(--border))", fontSize: 12 }} />
              {yKeys.length > 1 && <Legend wrapperStyle={{ fontSize: 11 }} />}
              {yKeys.map((k, i) => (
                <Bar key={k} dataKey={k} fill={COLORS[i % COLORS.length]} radius={[4, 4, 0, 0]} />
              ))}
            </BarChart>
          ) : type === "line" ? (
            <LineChart data={data} margin={{ top: 8, right: 12, left: 0, bottom: 8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey={xKey} stroke="hsl(var(--muted-foreground))" fontSize={11} />
              <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} />
              <Tooltip contentStyle={{ background: "hsl(var(--popover))", border: "1px solid hsl(var(--border))", fontSize: 12 }} />
              {yKeys.length > 1 && <Legend wrapperStyle={{ fontSize: 11 }} />}
              {yKeys.map((k, i) => (
                <Line key={k} type="monotone" dataKey={k} stroke={COLORS[i % COLORS.length]} strokeWidth={2} dot={false} />
              ))}
            </LineChart>
          ) : type === "area" ? (
            <AreaChart data={data} margin={{ top: 8, right: 12, left: 0, bottom: 8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey={xKey} stroke="hsl(var(--muted-foreground))" fontSize={11} />
              <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} />
              <Tooltip contentStyle={{ background: "hsl(var(--popover))", border: "1px solid hsl(var(--border))", fontSize: 12 }} />
              {yKeys.map((k, i) => (
                <Area key={k} type="monotone" dataKey={k} stroke={COLORS[i % COLORS.length]} fill={COLORS[i % COLORS.length]} fillOpacity={0.2} />
              ))}
            </AreaChart>
          ) : (
            <PieChart>
              <Tooltip contentStyle={{ background: "hsl(var(--popover))", border: "1px solid hsl(var(--border))", fontSize: 12 }} />
              <Pie data={data} dataKey={yKeys[0] ?? "value"} nameKey={xKey} outerRadius="80%" label={{ fontSize: 11 }}>
                {data.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Legend wrapperStyle={{ fontSize: 11 }} />
            </PieChart>
          )}
        </ResponsiveContainer>
      </div>
    </div>
  );
}

// Extract ```chart ...``` JSON blocks from markdown content.
export function extractCharts(content: string): { cleaned: string; charts: ChartSpec[] } {
  const charts: ChartSpec[] = [];
  const cleaned = content.replace(/```chart\s*\n?([\s\S]*?)```/g, (_, json) => {
    try {
      const spec = JSON.parse(json.trim());
      if (isChartSpec(spec)) {
        charts.push(spec);
        return `\n[[chart:${charts.length - 1}]]\n`;
      }
    } catch {}
    return "";
  });
  return { cleaned, charts };
}
