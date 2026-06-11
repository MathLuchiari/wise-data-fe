import { useState, useRef } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { mockBackend } from "@/integrations/mock/client";
import { parseFile } from "@/lib/sheet-parser";
import { Upload, FileSpreadsheet, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export function UploadPanel({ projectId, existing }: { projectId: string; existing: any }) {
  const qc = useQueryClient();
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [progress, setProgress] = useState<string | null>(null);

  const upload = useMutation({
    mutationFn: async (file: File) => {
      const ext = file.name.split(".").pop()?.toLowerCase();
      if (!ext || !["csv", "xlsx", "xls"].includes(ext)) {
        throw new Error("Apenas CSV ou XLSX são suportados.");
      }
      setProgress("Analisando planilha…");
      const parsed = await parseFile(file);
      if (parsed.rowCount === 0) throw new Error("Planilha vazia.");

      setProgress("Enviando arquivo…");
      const { data: u } = await mockBackend.auth.getUser();
      if (!u.user) throw new Error("Não autenticado");
      const path = `${u.user.id}/${projectId}/${Date.now()}-${file.name}`;
      const { error: upErr } = await mockBackend.storage.from("spreadsheets").upload(path, file);
      if (upErr) throw upErr;

      setProgress("Salvando metadados…");
      // delete previous data_sources for this project (simple v1)
      await mockBackend.from("data_sources").delete().eq("project_id", projectId);

      const sample = parsed.rows.slice(0, 50);
      const { error: dbErr } = await mockBackend.from("data_sources").insert({
        project_id: projectId,
        user_id: u.user.id,
        file_name: file.name,
        file_path: path,
        file_type: ext,
        row_count: parsed.rowCount,
        column_count: parsed.columnCount,
        schema_json: parsed.columns as any,
        sample_rows: sample as any,
      });
      if (dbErr) throw dbErr;

      await mockBackend.from("projects").update({ updated_at: new Date().toISOString() }).eq("id", projectId);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["data_source", projectId] });
      qc.invalidateQueries({ queryKey: ["projects"] });
      toast.success("Planilha processada");
      setProgress(null);
    },
    onError: (e: any) => {
      toast.error(e.message);
      setProgress(null);
    },
  });

  function handleFile(file: File) {
    upload.mutate(file);
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {existing && (
        <div className="bg-card border rounded-lg p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="size-9 rounded-md bg-primary/10 flex items-center justify-center text-primary">
              <FileSpreadsheet className="size-4" />
            </div>
            <div>
              <p className="text-sm font-medium">{existing.file_name}</p>
              <p className="text-xs text-muted-foreground">
                {existing.row_count?.toLocaleString()} linhas · {existing.column_count} colunas
              </p>
            </div>
          </div>
          <div className="text-xs text-primary flex items-center gap-1"><Check className="size-3" /> Pronto</div>
        </div>
      )}

      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          const f = e.dataTransfer.files[0];
          if (f) handleFile(f);
        }}
        className={`border-2 border-dashed rounded-xl p-12 text-center transition-colors ${
          dragOver ? "border-primary bg-primary/5" : "border-border"
        }`}
      >
        <div className="size-12 mx-auto rounded-lg bg-primary/10 flex items-center justify-center text-primary mb-4">
          <Upload className="size-5" />
        </div>
        <h3 className="font-medium">
          {existing ? "Substituir planilha" : "Arraste sua planilha"}
        </h3>
        <p className="text-sm text-muted-foreground mt-1">CSV ou XLSX · até ~20MB</p>
        <input
          ref={inputRef}
          type="file"
          accept=".csv,.xlsx,.xls"
          className="hidden"
          onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
        />
        <Button className="mt-5" onClick={() => inputRef.current?.click()} disabled={upload.isPending}>
          {upload.isPending ? progress ?? "Processando…" : "Escolher arquivo"}
        </Button>
      </div>

      {upload.error && (
        <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/10 border border-destructive/30 rounded-md px-3 py-2">
          <X className="size-4" /> {(upload.error as Error).message}
        </div>
      )}
    </div>
  );
}
