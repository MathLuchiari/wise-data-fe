import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Bookmark, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { ChartRenderer, isChartSpec } from "./chart-renderer";

export function KpisPanel({ projectId }: { projectId: string }) {
  const qc = useQueryClient();
  const { data: kpis, isLoading } = useQuery({
    queryKey: ["kpis", projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("saved_kpis")
        .select("*")
        .eq("project_id", projectId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("saved_kpis").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["kpis", projectId] });
      toast.success("KPI removido");
    },
  });

  if (isLoading) return <div className="text-sm text-muted-foreground">Carregando…</div>;

  return (
    <div className="max-w-6xl mx-auto">
      <header className="mb-6">
        <h2 className="text-lg font-semibold">KPIs salvos</h2>
        <p className="text-sm text-muted-foreground">Métricas que você salvou a partir das conversas.</p>
      </header>

      {kpis?.length === 0 ? (
        <div className="border border-dashed rounded-lg p-16 text-center">
          <div className="size-10 mx-auto rounded-lg bg-primary/10 flex items-center justify-center text-primary mb-3">
            <Bookmark className="size-4" />
          </div>
          <p className="text-sm font-medium">Nenhum KPI ainda</p>
          <p className="text-sm text-muted-foreground mt-1">Salve respostas do chat como KPI para vê-las aqui.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {kpis?.map((k) => {
            const spec = isChartSpec(k.chart_spec) ? k.chart_spec : null;
            return (
              <div key={k.id} className={`bg-card border rounded-lg p-4 group ${spec ? "md:col-span-2 lg:col-span-2" : ""}`}>
                <div className="flex items-start justify-between">
                  <p className="text-xs text-muted-foreground">{k.title}</p>
                  <button
                    onClick={() => remove.mutate(k.id)}
                    className="text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Trash2 className="size-3.5" />
                  </button>
                </div>
                {spec ? (
                  <ChartRenderer spec={spec} height={220} />
                ) : (
                  <p className="text-2xl font-semibold mt-1 tabular-nums">{k.value}</p>
                )}
                {k.description && <p className="text-xs text-muted-foreground mt-2 line-clamp-3">{k.description}</p>}
              </div>
            );
          })}
        </div>

      )}
    </div>
  );
}
