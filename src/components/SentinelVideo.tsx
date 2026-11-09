import { useState } from "react";
import { Check, Copy, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { sentinelLinkedIn, sentinelPrompt } from "@/lib/sentinel-content";

export function SentinelVideo({ videoUrl, posterUrl }: { videoUrl: string; posterUrl?: string }) {
  const [copied, setCopied] = useState<string | null>(null);
  const [copyError, setCopyError] = useState(false);
  const [mediaError, setMediaError] = useState(false);

  async function copy(text: string, label: string) {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(label);
      setCopyError(false);
    } catch {
      setCopyError(true);
    }
  }

  return (
    <section aria-labelledby="sentinel-title" className="min-w-0 space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-sm font-medium text-accent">Gabriel × MAVAI · 60 secondes</p>
          <h2 id="sentinel-title" className="mt-2 text-2xl font-semibold sm:text-3xl">Binance Sentinel</h2>
          <p className="mt-2 text-sm text-muted-foreground">Simulation prospective · Intelligence vidéo et vérification</p>
        </div>
        <Button variant="outline" asChild>
          <a href={videoUrl} download="binance-sentinel-mavai.mp4" target="_blank" rel="noreferrer">
            <Download /> Vidéo
          </a>
        </Button>
      </div>
      <video
        aria-label="Binance Sentinel — simulation prospective, narration française"
        controls
        playsInline
        preload="metadata"
        poster={posterUrl}
        className="aspect-video w-full rounded-lg bg-secondary object-contain"
        onError={() => setMediaError(true)}
      >
        <source src={videoUrl} type="video/mp4" />
      </video>
      {mediaError && <p role="alert" className="text-sm text-destructive">La vidéo ne se charge pas. Réessayez ou ouvrez le lien « Vidéo ».</p>}
      <p className="max-w-3xl text-sm leading-relaxed text-muted-foreground">
        Ce scénario ne rapporte pas une attaque réelle contre Binance. L’analyse de deepfakes illustrée est un concept,
        pas une fonction de détection déjà déployée. Aucun partenariat avec Binance, Brut ou Albert School n’est revendiqué.
      </p>
      <div className="divide-y divide-border border-y border-border">
        {[
          { label: "Prompt adapté · 60 secondes", text: sentinelPrompt },
          { label: "Post LinkedIn", text: sentinelLinkedIn },
        ].map(({ label, text }) => (
          <details key={label} className="py-4">
            <summary className="cursor-pointer text-sm font-semibold">{label}</summary>
            <div className="mt-4 flex justify-end">
              <Button variant="outline" size="sm" onClick={() => copy(text, label)}>
                {copied === label ? <Check /> : <Copy />}{copied === label ? "Copié" : "Copier"}
              </Button>
            </div>
            <p className="mt-4 whitespace-pre-wrap break-words text-sm leading-relaxed">{text}</p>
          </details>
        ))}
      </div>
      {copyError && <p role="alert" className="text-sm text-destructive">Copie indisponible. Vous pouvez sélectionner le texte.</p>}
    </section>
  );
}