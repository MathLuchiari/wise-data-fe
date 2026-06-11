import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/chat")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const body = await request.json();
        const { message, dataSource } = body as {
          message: string;
          dataSource: {
            file_name: string;
            row_count: number;
            column_count: number;
            schema: Array<{ name: string; type: string; uniqueCount: number; sampleValues: unknown[] }>;
            sample: Record<string, unknown>[];
          };
        };

        const columns = dataSource.schema.map((column) => column.name).slice(0, 8);
        const sample = dataSource.sample.slice(0, 5);
        const response = [
          `## Análise mock`,
          ``,
          `Recebi sua pergunta: **${message}**`,
          ``,
          `Estou rodando em modo mock, então esta resposta é gerada localmente para desenvolvimento do frontend.`,
          ``,
          `### Base atual`,
          ``,
          `- Arquivo: **${dataSource.file_name}**`,
          `- Linhas: **${dataSource.row_count.toLocaleString("pt-BR")}**`,
          `- Colunas: **${dataSource.column_count}**`,
          `- Campos principais: ${columns.length ? columns.join(", ") : "não informado"}`,
          ``,
          sample.length
            ? `### Amostra\n\n${toMarkdownTable(sample)}`
            : `### Amostra\n\nNenhuma amostra disponível no mock.`,
          ``,
          `### Sugestões`,
          ``,
          `- Validar os principais KPIs com dados reais quando o backend definitivo estiver conectado.`,
          `- Usar este fluxo para ajustar UX, estados de loading e salvamento de KPIs.`,
        ].join("\n");

        return new Response(response, {
          headers: { "content-type": "text/plain; charset=utf-8" },
        });
      },
    },
  },
});

function toMarkdownTable(rows: Record<string, unknown>[]) {
  const keys = Object.keys(rows[0] ?? {}).slice(0, 6);
  if (!keys.length) return "Sem colunas para exibir.";
  const header = `| ${keys.join(" | ")} |`;
  const separator = `| ${keys.map(() => "---").join(" | ")} |`;
  const body = rows
    .map((row) => `| ${keys.map((key) => formatCell(row[key])).join(" | ")} |`)
    .join("\n");
  return [header, separator, body].join("\n");
}

function formatCell(value: unknown) {
  if (value == null) return "";
  return String(value).replace(/\|/g, "\\|").slice(0, 80);
}
