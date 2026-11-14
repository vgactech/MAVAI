import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { BnbDesk } from "@/components/bnb/BnbDesk";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/bnb")({
  head: () => ({ meta: [
    { title: "Poste BNB — DR MANATHAN" },
    { name: "description", content: "Marché BNB, wallet, analyse croisée et trades signés par l'utilisateur sur BNB Chain." },
    { property: "og:title", content: "Poste BNB — DR MANATHAN" },
    { property: "og:description", content: "Analyse croisée et trades BNB Chain signés dans votre wallet." },
    { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" },
  ] }),
  component: () => (
    <div className="min-h-dvh bg-background text-foreground">
      <header className="flex items-center gap-3 border-b border-border px-4 py-3">
        <Button asChild size="icon-sm" variant="ghost"><Link to="/dashboard" aria-label="Retour"><ArrowLeft className="size-4" /></Link></Button>
        <div><h1 className="font-semibold">Poste BNB · DR MANATHAN</h1><p className="text-xs text-muted-foreground">Vous choisissez, vérifiez et signez. Aucun trade automatique.</p></div>
      </header>
      <BnbDesk />
    </div>
  ),
});
