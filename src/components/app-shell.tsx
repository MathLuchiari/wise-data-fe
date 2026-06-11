import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import {
  BarChart3,
  LayoutDashboard,
  LogOut,
  PanelLeftClose,
  PanelLeftOpen,
  Sparkles,
} from "lucide-react";
import { ReactNode, useEffect, useState } from "react";
import { mockBackend } from "@/integrations/mock/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "./ui/button";
import { useIsMobile } from "@/hooks/use-mobile";

export function AppShell({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const isMobile = useIsMobile();
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    if (isMobile) setCollapsed(true);
  }, [isMobile]);

  const { data: projects } = useQuery({
    queryKey: ["projects"],
    queryFn: async () => {
      const { data, error } = await mockBackend
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
    queryFn: async () => (await mockBackend.auth.getUser()).data.user,
  });

  async function signOut() {
    await qc.cancelQueries();
    qc.clear();
    await mockBackend.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  return (
    <div className="min-h-screen flex bg-background text-foreground">
      <aside
        className={`sticky top-0 h-screen shrink-0 border-r bg-sidebar flex flex-col transition-[width] duration-200 ease-in-out ${
          collapsed ? "w-16" : "w-60"
        }`}
      >
        <div className="px-2 h-14 flex items-center gap-1 border-b border-sidebar-border">
          <div className="size-7 shrink-0 rounded-md bg-primary/20 flex items-center justify-center">
            <BarChart3 className="size-4 text-primary" />
          </div>
          <span
            className={`font-semibold truncate transition-opacity ${collapsed ? "w-0 opacity-0" : "flex-1 opacity-100"}`}
          >
            WiseData
          </span>
          <Button
            variant="ghost"
            size="icon"
            className="size-8 shrink-0 text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
            onClick={() => setCollapsed((value) => !value)}
            title={collapsed ? "Abrir menu" : "Encolher menu"}
            aria-label={collapsed ? "Abrir menu" : "Encolher menu"}
          >
            {collapsed ? (
              <PanelLeftOpen className="size-4" />
            ) : (
              <PanelLeftClose className="size-4" />
            )}
          </Button>
        </div>

        <nav className="p-2 space-y-0.5">
          <NavItem
            to="/dashboard"
            active={pathname === "/dashboard"}
            collapsed={collapsed}
            icon={<LayoutDashboard className="size-4" />}
          >
            Projetos
          </NavItem>
        </nav>

        <div
          className={`px-3 pt-4 pb-1 text-xs font-medium text-muted-foreground uppercase tracking-wider transition-opacity ${
            collapsed ? "h-0 overflow-hidden py-0 opacity-0" : "opacity-100"
          }`}
        >
          Recentes
        </div>
        <div className="flex-1 overflow-y-auto px-2 space-y-0.5">
          {projects?.map((p) => (
            <Link
              key={p.id}
              to="/projects/$projectId"
              params={{ projectId: p.id }}
              title={p.name}
              className={`block rounded-md text-sm truncate hover:bg-sidebar-accent ${
                collapsed ? "px-0 py-2 text-center font-medium" : "px-2.5 py-1.5"
              } ${
                pathname.includes(p.id)
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-sidebar-foreground/80"
              }`}
            >
              {collapsed ? getProjectInitials(p.name) : p.name}
            </Link>
          ))}
          {projects?.length === 0 && (
            <p
              className={`py-2 text-xs text-muted-foreground ${collapsed ? "text-center" : "px-2.5"}`}
            >
              {collapsed ? "-" : "Sem projetos ainda."}
            </p>
          )}
        </div>

        <div className="p-3 border-t border-sidebar-border space-y-2">
          <div
            className={`flex items-center gap-2 text-xs text-muted-foreground truncate ${
              collapsed ? "justify-center" : ""
            }`}
            title={user?.email}
          >
            <div className="size-6 shrink-0 rounded-full bg-primary/20 flex items-center justify-center text-primary">
              <Sparkles className="size-3" />
            </div>
            <span className={`truncate ${collapsed ? "hidden" : "block"}`}>{user?.email}</span>
          </div>
          <Button
            variant="ghost"
            size={collapsed ? "icon" : "sm"}
            className={`w-full text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground ${
              collapsed ? "justify-center" : "justify-start"
            }`}
            onClick={signOut}
            title="Sair"
            aria-label="Sair"
          >
            <LogOut className={`size-4 ${collapsed ? "" : "mr-2"}`} />
            <span className={collapsed ? "hidden" : "inline"}>Sair</span>
          </Button>
        </div>
      </aside>

      <main className="flex-1 min-w-0 overflow-auto">{children}</main>
    </div>
  );
}

function NavItem({
  to,
  icon,
  children,
  active,
  collapsed,
}: {
  to: string;
  icon: ReactNode;
  children: ReactNode;
  active?: boolean;
  collapsed?: boolean;
}) {
  return (
    <Link
      to={to}
      title={typeof children === "string" ? children : undefined}
      className={`flex items-center gap-2 rounded-md text-sm transition-colors ${
        collapsed ? "justify-center px-2 py-2" : "px-2.5 py-1.5"
      } ${
        active
          ? "bg-sidebar-accent text-sidebar-accent-foreground"
          : "text-sidebar-foreground/80 hover:bg-sidebar-accent"
      }`}
    >
      {icon}
      <span className={collapsed ? "hidden" : "truncate"}>{children}</span>
    </Link>
  );
}

function getProjectInitials(name: string) {
  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("");

  return initials.toUpperCase() || "?";
}
