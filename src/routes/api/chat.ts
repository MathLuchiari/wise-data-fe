import { createFileRoute } from "@tanstack/react-router";
import { streamText } from "ai";
import { createLovableAiGatewayProvider } from "@/lib/ai-gateway.server";

export const Route = createFileRoute("/api/chat")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const key = process.env.LOVABLE_API_KEY;
        if (!key) return new Response("Missing LOVABLE_API_KEY", { status: 500 });

        const body = await request.json();
        const { message, dataSource, history } = body as {
          message: string;
          dataSource: {
            file_name: string;
            row_count: number;
            column_count: number;
            schema: Array<{ name: string; type: string; uniqueCount: number; sampleValues: unknown[] }>;
            sample: Record<string, unknown>[];
          };
          history: Array<{ role: "user" | "assistant"; content: string }>;
        };

        const schemaSummary = dataSource.schema
          .map((c) => `- "${c.name}" (${c.type}, ${c.uniqueCount} valores únicos, exemplos: ${JSON.stringify(c.sampleValues?.slice(0, 3) ?? [])})`)
          .join("\n");

        const sampleText = dataSource.sample.length
          ? `\n\nAmostra de até 20 linhas (JSON):\n${JSON.stringify(dataSource.sample.slice(0, 20))}`
          : "";

        const system = `Você é o WiseData, um assistente de BI conversacional que ajuda usuários não técnicos a analisar planilhas.

Base atual: "${dataSource.file_name}"
- ${dataSource.row_count.toLocaleString("pt-BR")} linhas, ${dataSource.column_count} colunas.

Colunas:
${schemaSummary}
${sampleText}

Diretrizes de formatação (IMPORTANTE):
- Responda em português, de forma clara e direta.
- Use markdown rico: títulos curtos (##, ###), listas com - , **negrito** para destaques, e \`código\` quando útil.
- Para qualquer dado comparativo, use SEMPRE tabelas markdown no formato GFM, com cada linha em uma linha separada. Exemplo correto:

| Coluna A | Coluna B |
| :--- | ---: |
| valor 1 | 10 |
| valor 2 | 20 |

  NUNCA coloque a tabela inteira em uma única linha. Sempre quebre linhas entre o cabeçalho, o separador e cada linha de dados.
- Separe seções com linhas em branco. Use uma linha em branco antes e depois de listas e tabelas.

GRÁFICOS (muito importante):
- Sempre que a pergunta envolver comparação, distribuição, evolução temporal, ranking, top N, share/participação ou qualquer análise que se beneficie de visualização, INCLUA um gráfico junto da resposta.
- Para emitir um gráfico, use um bloco de código com a linguagem \`chart\` contendo um JSON com este formato exato:

\`\`\`chart
{"type":"bar","title":"Receita por plataforma","xKey":"plataforma","yKeys":["receita"],"data":[{"plataforma":"PlayStation","receita":8950},{"plataforma":"PC","receita":7620}]}
\`\`\`

  Regras dos gráficos:
  - "type" deve ser um destes: "bar", "line", "area" ou "pie".
  - "data" é um array de objetos. Cada objeto tem a chave de categoria (xKey) e uma ou mais chaves numéricas (yKeys).
  - Para "pie", use exatamente uma chave em yKeys.
  - Mantenha no máximo ~12 pontos no gráfico (agregue/agrupe se necessário). Valores devem ser números (sem R$, sem separador de milhar).
  - Use o gráfico ANTES da tabela quando ambos forem relevantes. Não repita o gráfico no texto.
  - Se a pergunta for puramente textual (ex.: "o que significa esta coluna?"), NÃO gere gráfico.

- Quando o usuário pedir cálculos (totais, médias, top N), use a amostra para estimar e deixe explícito se a resposta é baseada na amostra ou em toda a base. Se a pergunta exigir cálculo exato sobre toda a base, explique a limitação.
- Sugira KPIs relevantes quando fizer sentido, em uma seção "Sugestões" ao final.
- Se a pergunta não puder ser respondida com os dados disponíveis, avise o usuário e sugira o que seria necessário.
- Seja conciso. Prefira tabelas e listas a parágrafos longos.`;

        const gateway = createLovableAiGatewayProvider(key);
        const result = streamText({
          model: gateway("google/gemini-3-flash-preview"),
          system,
          messages: [
            ...history.map((m) => ({ role: m.role, content: m.content })),
            { role: "user" as const, content: message },
          ],
        });

        return result.toTextStreamResponse();
      },
    },
  },
});
