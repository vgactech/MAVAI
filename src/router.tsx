import { QueryClient } from "@tanstack/react-query";
import { createRouter } from "@tanstack/react-router";
import { routeTree } from "./routeTree.gen";

export const getRouter = () => {
  const queryClient = new QueryClient();

  const router = createRouter({
    routeTree,
    context: { queryClient },
    scrollRestoration: true,
    defaultPreloadStaleTime: 0,
  });

  return router;
};

// After a new deploy, an open tab may request old page files; reload once to fetch the current version.
if (typeof window !== "undefined") {
  const reloadOnce = () => {
    const key = "mavai-chunk-reload";
    if (sessionStorage.getItem(key) === location.href) return;
    sessionStorage.setItem(key, location.href);
    location.reload();
  };
  window.addEventListener("vite:preloadError", (e) => { e.preventDefault(); reloadOnce(); });
  window.addEventListener("unhandledrejection", (e) => {
    if (/dynamically imported module|Importing a module script failed/i.test(String(e.reason?.message ?? e.reason))) reloadOnce();
  });
}
