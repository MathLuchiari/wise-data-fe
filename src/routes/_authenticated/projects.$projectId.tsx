import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { mockBackend } from "@/integrations/mock/client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UploadPanel } from "@/features/project/upload-panel";
import { SummaryPanel } from "@/features/project/summary-panel";
import { ChatPanel } from "@/features/project/chat-panel";
import { KpisPanel } from "@/features/project/kpis-panel";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export const Route = createFileRoute("/_authenticated/projects/$projectId")({
  component: ProjectPage,
});

function ProjectPage() {
  const { projectId } = Route.useParams();
  const navigate = useNavigate();

  const { data: project, isLoading } = useQuery({
    queryKey: ["project", projectId],
    queryFn: async () => {
      const { data, error } = await mockBackend
        .from("projects")
        .select("id, name, description")
        .eq("id", projectId)
        .single();
      if (error) throw error;
      return data;
    },
  });

  const { data: dataSource } = useQuery({
    queryKey: ["data_source", projectId],
    queryFn: async () => {
      const { data, error } = await mockBackend
        .from("data_sources")
        .select("*")
        .eq("project_id", projectId)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  if (isLoading) return <div className="p-8 text-sm text-muted-foreground">Carregando…</div>;
  if (!project) return <div className="p-8 text-sm">Projeto não encontrado.</div>;

  const hasData = !!dataSource;

  return (
    <div className="flex flex-col h-screen">
      <header className="px-6 h-14 border-b flex items-center gap-3 shrink-0">
        <Button variant="ghost" size="icon" onClick={() => navigate({ to: "/dashboard" })}>
          <ArrowLeft className="size-4" />
        </Button>
        <div>
          <h1 className="font-semibold text-sm">{project.name}</h1>
          {project.description && <p className="text-xs text-muted-foreground">{project.description}</p>}
        </div>
      </header>

      <Tabs defaultValue={hasData ? "chat" : "upload"} className="flex-1 flex flex-col min-h-0">
        <div className="px-6 border-b">
          <TabsList className="h-11 bg-transparent p-0 gap-1">
            <TabsTrigger value="upload" className="data-[state=active]:bg-accent">Base de dados</TabsTrigger>
            <TabsTrigger value="summary" disabled={!hasData}>Resumo</TabsTrigger>
            <TabsTrigger value="chat" disabled={!hasData}>Chat</TabsTrigger>
            <TabsTrigger value="kpis" disabled={!hasData}>KPIs</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="upload" className="flex-1 overflow-auto p-6 m-0">
          <UploadPanel projectId={projectId} existing={dataSource} />
        </TabsContent>
        <TabsContent value="summary" className="flex-1 overflow-auto p-6 m-0">
          {dataSource && <SummaryPanel dataSource={dataSource} />}
        </TabsContent>
        <TabsContent value="chat" className="flex-1 min-h-0 m-0">
          {dataSource && <ChatPanel projectId={projectId} dataSource={dataSource} />}
        </TabsContent>
        <TabsContent value="kpis" className="flex-1 overflow-auto p-6 m-0">
          <KpisPanel projectId={projectId} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
