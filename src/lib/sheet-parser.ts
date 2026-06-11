import Papa from "papaparse";
import * as XLSX from "xlsx";

export type ColumnInfo = {
  name: string;
  type: "number" | "date" | "string" | "boolean";
  sampleValues: (string | number | null)[];
  uniqueCount: number;
};

export type ParsedSheet = {
  rows: Record<string, unknown>[];
  columns: ColumnInfo[];
  rowCount: number;
  columnCount: number;
};

function detectType(values: unknown[]): ColumnInfo["type"] {
  const nonNull = values.filter((v) => v !== null && v !== undefined && v !== "");
  if (nonNull.length === 0) return "string";
  const numericCount = nonNull.filter((v) => typeof v === "number" || (!isNaN(Number(v)) && String(v).trim() !== "")).length;
  if (numericCount / nonNull.length > 0.85) return "number";
  const dateCount = nonNull.filter((v) => {
    const s = String(v);
    return /\d{2,4}[-/]\d{1,2}[-/]\d{1,4}/.test(s) || !isNaN(Date.parse(s));
  }).length;
  if (dateCount / nonNull.length > 0.8) return "date";
  const boolCount = nonNull.filter((v) => v === true || v === false || /^(true|false|sim|nao|não|yes|no)$/i.test(String(v))).length;
  if (boolCount / nonNull.length > 0.9) return "boolean";
  return "string";
}

function analyze(rows: Record<string, unknown>[]): ParsedSheet {
  const columnNames = rows.length > 0 ? Object.keys(rows[0]) : [];
  const columns: ColumnInfo[] = columnNames.map((name) => {
    const values = rows.map((r) => r[name]);
    const unique = new Set(values.map((v) => String(v)));
    const sample = values.filter((v) => v !== null && v !== undefined && v !== "").slice(0, 5) as (string | number | null)[];
    return {
      name,
      type: detectType(values),
      sampleValues: sample,
      uniqueCount: unique.size,
    };
  });
  return { rows, columns, rowCount: rows.length, columnCount: columnNames.length };
}

export async function parseFile(file: File): Promise<ParsedSheet> {
  const ext = file.name.split(".").pop()?.toLowerCase();
  if (ext === "csv") {
    return new Promise((resolve, reject) => {
      Papa.parse<Record<string, unknown>>(file, {
        header: true,
        dynamicTyping: true,
        skipEmptyLines: true,
        complete: (result) => resolve(analyze(result.data)),
        error: reject,
      });
    });
  }
  const buf = await file.arrayBuffer();
  const wb = XLSX.read(buf, { type: "array" });
  const ws = wb.Sheets[wb.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws, { defval: null });
  return analyze(rows);
}

export function suggestKpis(parsed: ParsedSheet): { title: string; description: string }[] {
  const numericCols = parsed.columns.filter((c) => c.type === "number");
  const dimCols = parsed.columns.filter((c) => c.type === "string" && c.uniqueCount > 1 && c.uniqueCount < parsed.rowCount);
  const dateCols = parsed.columns.filter((c) => c.type === "date");
  const kpis: { title: string; description: string }[] = [];
  for (const n of numericCols.slice(0, 3)) {
    kpis.push({ title: `Total de ${n.name}`, description: `Soma da coluna ${n.name}` });
  }
  if (numericCols[0] && dimCols[0]) {
    kpis.push({ title: `${numericCols[0].name} por ${dimCols[0].name}`, description: `Top categorias por ${numericCols[0].name}` });
  }
  if (numericCols[0] && dateCols[0]) {
    kpis.push({ title: `${numericCols[0].name} ao longo do tempo`, description: `Evolução temporal de ${numericCols[0].name}` });
  }
  return kpis.slice(0, 5);
}

export function computeAggregates(parsed: ParsedSheet) {
  const totals: Record<string, number> = {};
  for (const c of parsed.columns.filter((c) => c.type === "number")) {
    let sum = 0;
    for (const r of parsed.rows) {
      const v = Number(r[c.name]);
      if (!isNaN(v)) sum += v;
    }
    totals[c.name] = sum;
  }
  return { totals };
}
