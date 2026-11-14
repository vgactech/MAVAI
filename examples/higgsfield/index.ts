// Server-side CLI example only. Never import this file into the web application.
// Bun loads the ignored .env.local at runtime; Doppler-injected variables also work.
import {
  APIError,
  AuthenticationError,
  NotEnoughCreditsError,
  TimeoutError,
  config,
  higgsfield,
} from "@higgsfield/client/v2";
import { completedVideoUrl, GenerationResultError } from "./result";

async function main(): Promise<void> {
  const credentials = process.env.HF_CREDENTIALS;
  if (!credentials || !/^[^:\s]+:[^:\s]+$/.test(credentials)) {
    console.error(
      "HF_CREDENTIALS absent ou invalide. Renseignez key-id:key-secret dans .env.local, côté serveur uniquement.",
    );
    process.exitCode = 1;
    return;
  }

  try {
    config({
      credentials,
      // A failed POST must not silently submit another billable generation.
      maxRetries: 0,
      timeout: 30_000,
      maxPollTime: 600_000,
      pollInterval: 3_000,
    });
    const result = await higgsfield.subscribe("bytedance/seedance-2.5/text-to-video", {
      input: {
        prompt: "A cinematic scene at sunset",
        duration: 5,
        resolution: "720p",
        aspect_ratio: "16:9",
      },
      withPolling: true,
    });

    console.log(completedVideoUrl(result));
  } catch (error: unknown) {
    // Never print raw SDK/network errors: they can retain authorization headers.
    if (error instanceof GenerationResultError) {
      console.error(error.message);
    } else if (error instanceof AuthenticationError) {
      console.error("Authentification Higgsfield refusée ; aucun succès confirmé.");
    } else if (error instanceof NotEnoughCreditsError) {
      console.error("Crédits ou accès Higgsfield insuffisants ; aucun succès confirmé.");
    } else if (error instanceof TimeoutError) {
      console.error(
        "Délai de suivi Higgsfield dépassé ; vérifiez la requête dans la console avant de relancer. Aucun succès confirmé.",
      );
    } else if (error instanceof APIError && typeof error.statusCode === "number") {
      console.error(
        `Requête Higgsfield refusée (HTTP ${error.statusCode}) ; aucun succès confirmé.`,
      );
    } else {
      console.error(
        "Erreur réseau ou SDK Higgsfield ; aucun succès confirmé. Vérifiez la console avant de relancer.",
      );
    }
    process.exitCode = 1;
  }
}

await main();
