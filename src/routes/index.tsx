import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { mockBackend } from "@/integrations/mock/client";
import { Button } from "@/components/ui/button";
import {
  BarChart3,
  MessageSquare,
  Sparkles,
  Table2,
  LineChart,
  Upload,
  ArrowRight,
  Check,
} from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "WiseData — Converse com suas planilhas" },
      {
        name: "description",
        content:
          "WiseData é o assistente de BI conversacional que transforma planilhas em insights. Faça upload, pergunte em linguagem natural e receba tabelas, gráficos e KPIs.",
      },
      { property: "og:title", content: "WiseData — BI conversacional para planilhas" },
      {
        property: "og:description",
        content: "Suba um CSV ou XLSX e converse com seus dados. Sem SQL, sem fórmulas.",
      },
    ],
  }),
  component: LandingPage,
});

function LandingPage() {
  const navigate = useNavigate();
  const [signedIn, setSignedIn] = useState(false);

  useEffect(() => {
    mockBackend.auth.getSession().then(({ data }) => setSignedIn(!!data.session));
  }, []);

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Nav */}
      <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-6">
          <Link to="/" className="flex items-center gap-2 text-sm font-semibold">
            <div className="flex size-7 items-center justify-center rounded-md bg-primary/20">
              <BarChart3 className="size-4 text-primary" />
            </div>
            WiseData
          </Link>
          <nav className="hidden items-center gap-6 text-sm text-muted-foreground md:flex">
            <a href="#features" className="hover:text-foreground">Recursos</a>
            <a href="#how" className="hover:text-foreground">Como funciona</a>
            <a href="#pricing" className="hover:text-foreground">Planos</a>
          </nav>
          <div className="flex items-center gap-2">
            {signedIn ? (
              <Button size="sm" onClick={() => navigate({ to: "/dashboard" })}>
                Ir para o app
              </Button>
            ) : (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate({ to: "/auth" })}
                >
                  Entrar
                </Button>
                <Button size="sm" onClick={() => navigate({ to: "/auth" })}>
                  Criar conta
                </Button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden border-b border-border/60">
        <div
          className="pointer-events-none absolute inset-0 opacity-60"
          style={{
            background:
              "radial-gradient(60% 50% at 50% 0%, color-mix(in oklch, var(--color-primary) 18%, transparent) 0%, transparent 70%)",
          }}
        />
        <div className="relative mx-auto max-w-6xl px-6 py-24 text-center">
          <div className="mx-auto mb-6 inline-flex items-center gap-2 rounded-full border border-border/60 bg-card/60 px-3 py-1 text-xs text-muted-foreground">
            <Sparkles className="size-3 text-primary" />
            BI conversacional com IA
          </div>
          <h1 className="mx-auto max-w-3xl text-4xl font-semibold tracking-tight md:text-6xl">
            Converse com suas planilhas.
            <span className="block text-muted-foreground">
              Decisões em minutos, não em horas.
            </span>
          </h1>
          <p className="mx-auto mt-6 max-w-xl text-base text-muted-foreground">
            Suba um CSV ou XLSX e pergunte em linguagem natural. O WiseData
            responde com tabelas, gráficos e KPIs prontos para salvar.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Button size="lg" onClick={() => navigate({ to: "/auth" })}>
              Criar conta grátis
              <ArrowRight className="ml-1 size-4" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={() => navigate({ to: "/auth" })}
            >
              Entrar
            </Button>
          </div>
          <p className="mt-4 text-xs text-muted-foreground">
            Sem cartão de crédito. Comece em segundos.
          </p>

          {/* Mock product card */}
          <div className="mx-auto mt-16 max-w-4xl rounded-xl border border-border/60 bg-card/80 p-3 shadow-2xl shadow-primary/5">
            <div className="flex items-center gap-1.5 border-b border-border/60 px-2 pb-2">
              <span className="size-2.5 rounded-full bg-destructive/60" />
              <span className="size-2.5 rounded-full bg-chart-4/60" />
              <span className="size-2.5 rounded-full bg-chart-3/60" />
              <span className="ml-3 text-xs text-muted-foreground">
                wisedata.app / projects / vendas-2026
              </span>
            </div>
            <div className="grid gap-3 p-4 md:grid-cols-[1fr_1.2fr]">
              <div className="space-y-3 text-left">
                <div className="rounded-md border border-border/60 bg-background/60 p-3">
                  <p className="text-xs text-muted-foreground">Você</p>
                  <p className="text-sm">Qual plataforma teve maior receita?</p>
                </div>
                <div className="rounded-md border border-border/60 bg-background/60 p-3">
                  <p className="text-xs text-primary">WiseData</p>
                  <p className="text-sm">
                    PlayStation lidera com R$ 8.950 em receita acumulada.
                  </p>
                </div>
              </div>
              <div className="flex items-end gap-2 rounded-md border border-border/60 bg-background/60 p-4">
                {[60, 38, 82, 50, 24, 70].map((h, i) => (
                  <div
                    key={i}
                    className="flex-1 rounded-sm"
                    style={{
                      height: `${h}%`,
                      background:
                        i === 2
                          ? "var(--color-primary)"
                          : "color-mix(in oklch, var(--color-primary) 30%, transparent)",
                    }}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="border-b border-border/60">
        <div className="mx-auto max-w-6xl px-6 py-20">
          <div className="mb-12 max-w-2xl">
            <h2 className="text-3xl font-semibold tracking-tight">
              Tudo que você precisa para entender seus dados
            </h2>
            <p className="mt-3 text-muted-foreground">
              Pensado para times de negócio. Análise sem SQL, sem fórmulas
              complexas, sem perder tempo formatando relatórios.
            </p>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {[
              {
                icon: Upload,
                title: "Upload em segundos",
                desc: "Suba CSV ou XLSX. Detectamos colunas, tipos e geramos um resumo automático.",
              },
              {
                icon: MessageSquare,
                title: "Chat com IA",
                desc: "Pergunte em português. Receba respostas com contexto, tabelas e justificativas.",
              },
              {
                icon: LineChart,
                title: "Gráficos automáticos",
                desc: "Comparações, distribuições e tendências viram visualizações na hora.",
              },
              {
                icon: Table2,
                title: "Tabelas legíveis",
                desc: "Markdown limpo, ordenação clara e fácil de copiar para qualquer lugar.",
              },
              {
                icon: Sparkles,
                title: "KPIs sugeridos",
                desc: "Salve métricas e gráficos como KPIs do projeto com um clique.",
              },
              {
                icon: BarChart3,
                title: "Workspace organizado",
                desc: "Cada planilha vira um projeto. Histórico de conversas e KPIs persistidos.",
              },
            ].map(({ icon: Icon, title, desc }) => (
              <div
                key={title}
                className="rounded-lg border border-border/60 bg-card p-5"
              >
                <div className="mb-3 flex size-9 items-center justify-center rounded-md bg-primary/15">
                  <Icon className="size-4 text-primary" />
                </div>
                <h3 className="text-sm font-semibold">{title}</h3>
                <p className="mt-1.5 text-sm text-muted-foreground">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How */}
      <section id="how" className="border-b border-border/60">
        <div className="mx-auto max-w-6xl px-6 py-20">
          <h2 className="text-3xl font-semibold tracking-tight">
            Do upload ao insight em 3 passos
          </h2>
          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {[
              {
                n: "01",
                t: "Suba sua planilha",
                d: "CSV ou XLSX. Detectamos o esquema automaticamente.",
              },
              {
                n: "02",
                t: "Pergunte",
                d: "Use linguagem natural. O assistente entende o contexto da base.",
              },
              {
                n: "03",
                t: "Salve KPIs",
                d: "Transforme respostas e gráficos em métricas do projeto.",
              },
            ].map((s) => (
              <div
                key={s.n}
                className="rounded-lg border border-border/60 bg-card p-6"
              >
                <p className="text-xs font-mono text-primary">{s.n}</p>
                <h3 className="mt-2 text-base font-semibold">{s.t}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{s.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing teaser */}
      <section id="pricing" className="border-b border-border/60">
        <div className="mx-auto max-w-3xl px-6 py-20 text-center">
          <h2 className="text-3xl font-semibold tracking-tight">
            Comece grátis hoje
          </h2>
          <p className="mt-3 text-muted-foreground">
            Crie sua conta e analise sua primeira planilha em menos de 1 minuto.
          </p>
          <ul className="mx-auto mt-6 grid max-w-md gap-2 text-left text-sm text-muted-foreground">
            {[
              "Projetos ilimitados em beta",
              "Chat com IA incluso",
              "Gráficos e KPIs automáticos",
            ].map((i) => (
              <li key={i} className="flex items-center gap-2">
                <Check className="size-4 text-primary" />
                {i}
              </li>
            ))}
          </ul>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Button size="lg" onClick={() => navigate({ to: "/auth" })}>
              Criar conta grátis
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={() => navigate({ to: "/auth" })}
            >
              Já tenho conta
            </Button>
          </div>
        </div>
      </section>

      <footer className="mx-auto flex max-w-6xl items-center justify-between px-6 py-8 text-xs text-muted-foreground">
        <span>© {new Date().getFullYear()} WiseData</span>
        <span>BI conversacional</span>
      </footer>
    </div>
  );
}
