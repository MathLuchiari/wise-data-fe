import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { BarChart3, LayoutDashboard, LogOut, Sparkles } from "lucide-react";
import { ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "./ui/button";

export function AppShell({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  const { data: projects } = useQuery({
    queryKey: ["projects"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("projects")
        .select("id, name, updated_at")
        .order("updated_at", { ascending: false })
        .limit(20);
      if (error) throw error;
      return data;
    },
  });

  const { data: user } = useQuery({
    queryKey: ["user"],
    queryFn: async () => (await supabase.auth.getUser()).data.user,
  });

  async function signOut() {
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  return (
    <div className="min-h-screen flex bg-background text-foreground">
      <aside className="w-60 shrink-0 border-r bg-sidebar flex flex-col">
        <div className="px-4 h-14 flex items-center gap-2 border-b border-sidebar-border">
          <div className="size-7 rounded-md bg-primary/20 flex items-center justify-center">
            <BarChart3 className="size-4 text-primary" />
          </div>
          <span className="font-semibold">WiseData</span>
        </div>

        <nav className="p-2 space-y-0.5">
          <NavItem to="/dashboard" active={pathname === "/dashboard"} icon={<LayoutDashboard className="size-4" />}>
            Projetos
          </NavItem>
        </nav>

        <div className="px-3 pt-4 pb-1 text-xs font-medium text-muted-foreground uppercase tracking-wider">Recentes</div>
        <div className="flex-1 overflow-y-auto px-2 space-y-0.5">
          {projects?.map((p) => (
            <Link
              key={p.id}
              to="/projects/$projectId"
              params={{ projectId: p.id }}
              className={`block px-2.5 py-1.5 rounded-md text-sm truncate hover:bg-sidebar-accent ${
                pathname.includes(p.id) ? "bg-sidebar-accent text-sidebar-accent-foreground" : "text-sidebar-foreground/80"
              }`}
            >
              {p.name}
            </Link>
          ))}
          {projects?.length === 0 && (
            <p className="px-2.5 py-2 text-xs text-muted-foreground">Sem projetos ainda.</p>
          )}
        </div>

        <div className="p-3 border-t border-sidebar-border space-y-2">
          <div className="flex items-center gap-2 text-xs text-muted-foreground truncate">
            <div className="size-6 rounded-full bg-primary/20 flex items-center justify-center text-primary">
              <Sparkles className="size-3" />
            </div>
            <span className="truncate">{user?.email}</span>
          </div>
          <Button variant="ghost" size="sm" className="w-full justify-start text-muted-foreground" onClick={signOut}>
            <LogOut className="size-4 mr-2" /> Sair
          </Button>
        </div>
      </aside>

      <main className="flex-1 min-w-0 overflow-auto">{children}</main>
    </div>
  );
}

function NavItem({ to, icon, children, active }: { to: string; icon: ReactNode; children: ReactNode; active?: boolean }) {
  return (
    <Link
      to={to}
      className={`flex items-center gap-2 px-2.5 py-1.5 rounded-md text-sm transition-colors ${
        active ? "bg-sidebar-accent text-sidebar-accent-foreground" : "text-sidebar-foreground/80 hover:bg-sidebar-accent"
      }`}
    >
      {icon}
      {children}
    </Link>
  );
}
