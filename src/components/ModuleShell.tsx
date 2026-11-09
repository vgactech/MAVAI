import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ThemeToggle";
import { MavaiMark } from "@/components/MavaiMark";
import { ProjectWorkspace } from './ProjectWorkspace';

export function ModuleShell({ title, subtitle, children,projectId }: { title: string; subtitle: string; children: ReactNode;projectId?:string }) {
  return (
    <div className="min-h-dvh bg-background text-foreground">
      <header className="flex items-center gap-3 border-b border-border px-4 py-3">
        <Button asChild variant="ghost" size="icon" aria-label="Retour au tableau de bord">
          <Link to="/dashboard">
            <ArrowLeft className="size-4" />
          </Link>
        </Button>
        <MavaiMark className="size-7" />
        <span className="font-display font-semibold">MAVAI · {title}</span>
        <div className="flex-1" />
        <ThemeToggle />
      </header>
      <ProjectWorkspace projectId={projectId} required={title!=="Mes productions"&&title!=="Mes projets"}><main className="mx-auto w-full max-w-4xl px-4 py-10">
        <h1 className="text-3xl font-semibold">{title}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
        <div className="mt-8">{children}</div>
      </main></ProjectWorkspace>
    </div>
  );
}
