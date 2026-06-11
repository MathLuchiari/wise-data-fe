import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Plus, FileSpreadsheet, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

export const Route = createFileRoute("/_authenticated/dashboard")({ component: Dashboard });

function Dashboard() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [desc, setDesc] = useState("");

  const { data: projects, isLoading } = useQuery({
    queryKey: ["projects"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("projects")
        .select("id, name, description, updated_at, data_sources(id, file_name, row_count)")
        .order("updated_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const create = useMutation({
    mutationFn: async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) throw new Error("Não autenticado");
      const { data, error } = await supabase
        .from("projects")
        .insert({ name: name.trim(), description: desc.trim() || null, user_id: u.user.id })
        .select("id")
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ["projects"] });
      setOpen(false); setName(""); setDesc("");
      toast.success("Projeto criado");
      navigate({ to: "/projects/$projectId", params: { projectId: data.id } });
    },
    onError: (e: any) => toast.error(e.message),
  });

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <header className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Projetos</h1>
          <p className="text-sm text-muted-foreground mt-1">Crie um projeto para começar a analisar uma planilha.</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="size-4 mr-1.5" /> Novo projeto</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Novo projeto</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor="n">Nome</Label>
                <Input id="n" value={name} onChange={(e) => setName(e.target.value)} placeholder="Vendas Q3" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="d">Descrição (opcional)</Label>
                <Textarea id="d" value={desc} onChange={(e) => setDesc(e.target.value)} rows={3} />
              </div>
            </div>
            <DialogFooter>
              <Button variant="ghost" onClick={() => setOpen(false)}>Cancelar</Button>
              <Button onClick={() => create.mutate()} disabled={!name.trim() || create.isPending}>
                {create.isPending ? "Criando…" : "Criar"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </header>

      {isLoading ? (
        <div className="text-sm text-muted-foreground">Carregando…</div>
      ) : projects?.length === 0 ? (
        <EmptyState onCreate={() => setOpen(true)} />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {projects?.map((p) => {
            const ds = p.data_sources?.[0];
            return (
              <button
                key={p.id}
                onClick={() => navigate({ to: "/projects/$projectId", params: { projectId: p.id } })}
                className="text-left bg-card border rounded-lg p-4 hover:border-primary/50 transition-colors group"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="size-9 rounded-md bg-primary/10 flex items-center justify-center text-primary">
                    <FileSpreadsheet className="size-4" />
                  </div>
                  <ArrowRight className="size-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                <h3 className="font-medium truncate">{p.name}</h3>
                <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2 min-h-[2rem]">
                  {p.description || "Sem descrição"}
                </p>
                <div className="mt-3 pt-3 border-t flex items-center justify-between text-xs text-muted-foreground">
                  <span>{ds ? `${ds.row_count?.toLocaleString() ?? "—"} linhas` : "Sem dados"}</span>
                  <span>{formatDistanceToNow(new Date(p.updated_at), { addSuffix: true, locale: ptBR })}</span>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

function EmptyState({ onCreate }: { onCreate: () => void }) {
  return (
    <div className="border border-dashed rounded-lg p-16 text-center">
      <div className="size-12 rounded-lg bg-primary/10 mx-auto flex items-center justify-center text-primary mb-4">
        <FileSpreadsheet className="size-5" />
      </div>
      <h2 className="font-medium">Nenhum projeto ainda</h2>
      <p className="text-sm text-muted-foreground mt-1 max-w-sm mx-auto">
        Crie um projeto para fazer upload de uma planilha e começar a conversar com seus dados.
      </p>
      <Button className="mt-5" onClick={onCreate}><Plus className="size-4 mr-1.5" /> Criar projeto</Button>
    </div>
  );
}
