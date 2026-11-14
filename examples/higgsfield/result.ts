/** Only a completed response containing an HTTPS video is a success. */
export class GenerationResultError extends Error {}

export function completedVideoUrl(result: unknown): string {
  if (!result || typeof result !== "object" || !("status" in result)) {
    throw new GenerationResultError("Réponse Higgsfield invalide ; aucun succès confirmé.");
  }

  switch (result.status) {
    case "failed":
      throw new GenerationResultError("La génération Higgsfield a échoué.");
    case "canceled":
    case "cancelled":
      throw new GenerationResultError("La génération Higgsfield a été annulée.");
    case "nsfw":
    case "moderated":
    case "blocked":
      throw new GenerationResultError("La génération Higgsfield a été bloquée par la modération.");
    case "completed":
      break;
    default:
      throw new GenerationResultError(
        "La génération Higgsfield n’est pas terminée ; aucun succès confirmé.",
      );
  }

  if (
    !("video" in result) ||
    !result.video ||
    typeof result.video !== "object" ||
    !("url" in result.video) ||
    typeof result.video.url !== "string"
  ) {
    throw new GenerationResultError("Génération terminée sans URL vidéo valide.");
  }

  let url: URL;
  try {
    url = new URL(result.video.url);
  } catch {
    throw new GenerationResultError("Génération terminée sans URL vidéo valide.");
  }
  if (url.protocol !== "https:" || url.username || url.password) {
    throw new GenerationResultError("Génération terminée sans URL vidéo HTTPS valide.");
  }
  return url.toString();
}
