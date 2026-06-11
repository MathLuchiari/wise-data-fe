import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { BarChart3 } from "lucide-react";

export const Route = createFileRoute("/auth")({ component: AuthPage });

function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"sign-in" | "sign-up">("sign-in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/dashboard", replace: true });
    });
  }, [navigate]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === "sign-up") {
        const { error } = await supabase.auth.signUp({
          email, password,
          options: { emailRedirectTo: `${window.location.origin}/dashboard` },
        });
        if (error) throw error;
        toast.success("Conta criada. Você já está conectado.");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
      navigate({ to: "/dashboard", replace: true });
    } catch (err: any) {
      toast.error(err.message ?? "Erro ao autenticar");
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogle() {
    setLoading(true);
    const result = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin });
    if (result.error) { toast.error(String(result.error)); setLoading(false); return; }
    if (result.redirected) return;
    navigate({ to: "/dashboard", replace: true });
  }

  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      <div className="hidden lg:flex flex-col justify-between p-12 bg-sidebar border-r">
        <div className="flex items-center gap-2 text-lg font-semibold">
          <div className="size-8 rounded-md bg-primary/20 flex items-center justify-center"><BarChart3 className="size-4 text-primary" /></div>
          WiseData
        </div>
        <div>
          <h2 className="text-3xl font-semibold tracking-tight">Converse com seus dados.</h2>
          <p className="mt-3 text-muted-foreground max-w-md">Suba uma planilha e faça perguntas em linguagem natural. Tabelas, gráficos e KPIs gerados automaticamente.</p>
        </div>
        <p className="text-xs text-muted-foreground">© WiseData</p>
      </div>

      <div className="flex items-center justify-center p-6">
        <div className="w-full max-w-sm space-y-6">
          <div className="lg:hidden flex items-center gap-2 text-lg font-semibold">
            <div className="size-8 rounded-md bg-primary/20 flex items-center justify-center"><BarChart3 className="size-4 text-primary" /></div>
            WiseData
          </div>
          <div>
            <h1 className="text-2xl font-semibold">{mode === "sign-in" ? "Entrar" : "Criar conta"}</h1>
            <p className="text-sm text-muted-foreground">Acesse seu workspace de análise.</p>
          </div>

          <Button variant="outline" className="w-full" onClick={handleGoogle} disabled={loading}>
            Continuar com Google
          </Button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t" /></div>
            <div className="relative flex justify-center"><span className="bg-background px-2 text-xs text-muted-foreground">ou</span></div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="password">Senha</Label>
              <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "..." : mode === "sign-in" ? "Entrar" : "Criar conta"}
            </Button>
          </form>

          <p className="text-sm text-center text-muted-foreground">
            {mode === "sign-in" ? "Não tem conta?" : "Já tem conta?"}{" "}
            <button onClick={() => setMode(mode === "sign-in" ? "sign-up" : "sign-in")} className="text-primary hover:underline">
              {mode === "sign-in" ? "Criar agora" : "Entrar"}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
