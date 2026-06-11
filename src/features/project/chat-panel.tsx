import { useEffect, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { mockBackend } from "@/integrations/mock/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Bookmark, Send, Sparkles, User } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { toast } from "sonner";
import { ChartRenderer, extractCharts, type ChartSpec } from "./chart-renderer";

const SUGGESTIONS = [
  "Quais KPIs você recomenda para esta base?",
  "Quais são os 10 maiores valores?",
  "Resuma os principais padrões nos dados.",
  "Mostre uma análise por categoria.",
];

type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
};

export function ChatPanel({ projectId, dataSource }: { projectId: string; dataSource: any }) {
  const qc = useQueryClient();
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [streamBuffer, setStreamBuffer] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  const { data: history } = useQuery({
    queryKey: ["messages", projectId],
    queryFn: async () => {
      const { data, error } = await mockBackend
        .from("chat_messages")
        .select("id, role, content")
        .eq("project_id", projectId)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data as Message[];
    },
  });

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [history, streamBuffer]);

  const send = useMutation({
    mutationFn: async (text: string) => {
      const { data: u } = await mockBackend.auth.getUser();
      if (!u.user) throw new Error("Não autenticado");

      const { data: userMsg, error: userErr } = await mockBackend
        .from("chat_messages")
        .insert({ project_id: projectId, user_id: u.user.id, role: "user", content: text })
        .select("id, role, content")
        .single();
      if (userErr) throw userErr;

      qc.setQueryData<Message[]>(["messages", projectId], (prev = []) => [...prev, userMsg as Message]);

      setStreaming(true);
      setStreamBuffer("");

      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId,
          message: text,
          dataSource: {
            file_name: dataSource.file_name,
            row_count: dataSource.row_count,
            column_count: dataSource.column_count,
            schema: dataSource.schema_json,
            sample: (dataSource.sample_rows ?? []).slice(0, 20),
          },
          history: (history ?? []).slice(-10),
        }),
      });

      if (!res.ok) {
        if (res.status === 429) throw new Error("Limite de uso atingido. Tente novamente em alguns instantes.");
        if (res.status === 402) throw new Error("Créditos da IA esgotados. Adicione créditos para continuar.");
        throw new Error(`Erro do assistente (${res.status})`);
      }

      const reader = res.body!.getReader();
      const decoder = new TextDecoder();
      let full = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value);
        full += chunk;
        setStreamBuffer(full);
      }

      const { data: asstMsg } = await mockBackend
        .from("chat_messages")
        .insert({ project_id: projectId, user_id: u.user.id, role: "assistant", content: full })
        .select("id, role, content")
        .single();

      qc.setQueryData<Message[]>(["messages", projectId], (prev = []) => [...prev, asstMsg as Message]);
      setStreaming(false);
      setStreamBuffer("");
    },
    onError: (e: any) => {
      toast.error(e.message);
      setStreaming(false);
      setStreamBuffer("");
    },
  });

  function handleSubmit(text?: string) {
    const t = (text ?? input).trim();
    if (!t || streaming) return;
    setInput("");
    send.mutate(t);
  }

  const isEmpty = (history?.length ?? 0) === 0 && !streaming;

  return (
    <div className="flex h-full">
      <div className="flex-1 flex flex-col min-w-0">
        <div ref={scrollRef} className="flex-1 overflow-auto">
          <div className="max-w-3xl mx-auto px-6 py-6 space-y-6">
            {isEmpty && (
              <div className="text-center py-12">
                <div className="size-10 rounded-lg bg-primary/10 mx-auto flex items-center justify-center text-primary mb-4">
                  <Sparkles className="size-5" />
                </div>
                <h3 className="font-medium">Pergunte sobre seus dados</h3>
                <p className="text-sm text-muted-foreground mt-1">{dataSource.row_count?.toLocaleString()} linhas prontas para análise.</p>
                <div className="grid sm:grid-cols-2 gap-2 mt-6 text-left">
                  {SUGGESTIONS.map((s) => (
                    <button
                      key={s}
                      onClick={() => handleSubmit(s)}
                      className="text-sm text-left px-3 py-2.5 border rounded-md hover:border-primary/50 hover:bg-accent/50 transition-colors"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {history?.map((m) => <MessageBubble key={m.id} message={m} projectId={projectId} />)}

            {streaming && (
              <MessageBubble
                streaming
                message={{ id: "stream", role: "assistant", content: streamBuffer || "Pensando…" }}
                projectId={projectId}
              />
            )}
          </div>
        </div>

        <div className="border-t bg-background">
          <form
            className="max-w-3xl mx-auto px-6 py-4"
            onSubmit={(e) => { e.preventDefault(); handleSubmit(); }}
          >
            <div className="relative">
              <Textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSubmit();
                  }
                }}
                placeholder="Pergunte algo sobre seus dados…"
                className="resize-none pr-12 min-h-[56px]"
                rows={2}
                disabled={streaming}
              />
              <Button
                type="submit"
                size="icon"
                className="absolute right-2 bottom-2 size-8"
                disabled={!input.trim() || streaming}
              >
                <Send className="size-4" />
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

function MessageBubble({ message, streaming, projectId }: { message: Message; streaming?: boolean; projectId: string }) {
  const isUser = message.role === "user";
  const qc = useQueryClient();

  const { cleaned, charts } = !isUser ? extractCharts(message.content) : { cleaned: message.content, charts: [] as ChartSpec[] };

  async function saveAsKpi(chartSpec?: ChartSpec) {
    const defaultTitle = chartSpec?.title ?? cleaned.split("\n").find((l) => l.trim())?.slice(0, 80) ?? "KPI";
    const title = window.prompt("Título do KPI", defaultTitle);
    if (!title) return;
    const value = chartSpec ? "📊" : window.prompt("Valor principal", "—") ?? "—";
    const { data: u } = await mockBackend.auth.getUser();
    if (!u.user) return;
    const { error } = await mockBackend.from("saved_kpis").insert({
      project_id: projectId,
      user_id: u.user.id,
      title,
      value,
      description: cleaned.replace(/\[\[chart:\d+\]\]/g, "").slice(0, 280),
      source_message_id: message.id.length === 36 ? message.id : null,
      chart_spec: (chartSpec ?? null) as any,
    });
    if (error) { toast.error(error.message); return; }
    toast.success(chartSpec ? "Gráfico salvo como KPI" : "KPI salvo");
    qc.invalidateQueries({ queryKey: ["kpis", projectId] });
  }

  const segments = !isUser ? cleaned.split(/(\[\[chart:\d+\]\])/g) : [message.content];

  return (
    <div className={`flex gap-3 ${isUser ? "justify-end" : ""}`}>
      {!isUser && (
        <div className="size-7 shrink-0 rounded-md bg-primary/15 text-primary flex items-center justify-center">
          <Sparkles className="size-3.5" />
        </div>
      )}
      <div className={`min-w-0 max-w-[85%] ${isUser ? "order-first" : ""}`}>
        <div
          className={
            isUser
              ? "bg-primary text-primary-foreground rounded-lg px-3.5 py-2.5 text-sm whitespace-pre-wrap"
              : "text-sm leading-relaxed"
          }
        >
          {isUser ? (
            message.content
          ) : (
            <div className="prose prose-sm prose-invert max-w-none prose-p:my-2 prose-headings:mt-4 prose-headings:mb-2 prose-headings:font-semibold prose-h1:text-base prose-h2:text-sm prose-h3:text-sm prose-ul:my-2 prose-ol:my-2 prose-li:my-0.5 prose-strong:text-foreground prose-code:text-foreground prose-code:bg-muted prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-code:before:content-none prose-code:after:content-none">
              {segments.map((seg, i) => {
                const m = seg.match(/^\[\[chart:(\d+)\]\]$/);
                if (m) {
                  const idx = Number(m[1]);
                  const spec = charts[idx];
                  if (!spec) return null;
                  return (
                    <div key={i} className="not-prose">
                      <ChartRenderer spec={spec} />
                      {!streaming && (
                        <button
                          onClick={() => saveAsKpi(spec)}
                          className="mb-3 -mt-1 text-xs text-muted-foreground hover:text-foreground flex items-center gap-1"
                        >
                          <Bookmark className="size-3" /> Salvar gráfico como KPI
                        </button>
                      )}
                    </div>
                  );
                }
                if (!seg.trim()) return null;
                return (
                  <ReactMarkdown
                    key={i}
                    remarkPlugins={[remarkGfm]}
                    components={{
                      table: ({ node, ...props }) => (
                        <div className="my-3 overflow-x-auto rounded-md border border-border">
                          <table className="w-full text-sm border-collapse" {...props} />
                        </div>
                      ),
                      thead: ({ node, ...props }) => <thead className="bg-muted/50" {...props} />,
                      th: ({ node, ...props }) => (
                        <th className="text-left font-medium px-3 py-2 border-b border-border" {...props} />
                      ),
                      td: ({ node, ...props }) => (
                        <td className="px-3 py-2 border-b border-border/50 align-top" {...props} />
                      ),
                      tr: ({ node, ...props }) => <tr className="hover:bg-muted/30" {...props} />,
                    }}
                  >
                    {normalizeMarkdown(seg)}
                  </ReactMarkdown>
                );
              })}
            </div>
          )}
        </div>
        {!isUser && !streaming && (
          <button onClick={() => saveAsKpi()} className="mt-1.5 text-xs text-muted-foreground hover:text-foreground flex items-center gap-1">
            <Bookmark className="size-3" /> Salvar resposta como KPI
          </button>
        )}
      </div>
      {isUser && (
        <div className="size-7 shrink-0 rounded-md bg-accent text-accent-foreground flex items-center justify-center">
          <User className="size-3.5" />
        </div>
      )}
    </div>
  );
}

// Recovers markdown table formatting when the model emits rows on a single line,
// e.g. "| A | B | | :-- | :-- | | x | y |" → proper multi-line markdown table.
function normalizeMarkdown(input: string): string {
  if (!input) return input;
  let out = input;
  // Insert a newline before any "| " that comes right after another "|" with only
  // spaces between them — that's the boundary between two table rows on one line.
  out = out.replace(/\|[ \t]+\|/g, (m) => {
    // Only split if it really looks like two adjacent row pipes (end of a row
    // immediately followed by start of next). We split on the inner boundary.
    return "|\n|";
  });
  // After the split, separator rows may still be glued — re-run once more.
  out = out.replace(/\|[ \t]+\|/g, "|\n|");
  return out;
}

