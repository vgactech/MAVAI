import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { lovable, type KlerioSession } from "@/integrations/lovable";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: () => {
    const session: KlerioSession | null = lovable.auth.getSession();
    if (!session) throw redirect({ to: "/auth" });
    return { user: session.user };
  },
  component: () => <Outlet />,
});
