Higgsfield / Seedance 2.5 — exemple serveur

Préparation
1. Installer Bun, puis exécuter `bun install --frozen-lockfile` à la racine.
2. Créer .env.local à la racine et saisir localement :
   HF_CREDENTIALS=YOUR_KEY_ID:YOUR_KEY_SECRET
   Remplacer les deux valeurs fictives dans le fichier local uniquement.
   Autre possibilité : injecter HF_CREDENTIALS avec Doppler au runtime.
3. Ne jamais copier la clé dans un chat, le navigateur, VITE_*, Git ou des logs.
   .env.local est déjà ignoré par Git. Bun charge ce fichier au runtime.

Vérification hors ligne
  bun run higgsfield:check
  bun run higgsfield:test

Exécution réelle — crée une génération vidéo FACTURABLE
  bun run higgsfield:example

L'exemple utilise le SDK officiel @higgsfield/client/v2 et subscribe avec polling.
Modèle : bytedance/seedance-2.5/text-to-video
Prompt : A cinematic scene at sunset
Durée : 5 secondes ; résolution : 720p ; format d'image : 16:9.
Seule une réponse completed avec une URL vidéo HTTPS produit une sortie de succès.
Toute erreur produit un code de sortie non nul et un message expurgé.
Le POST n'est pas réessayé automatiquement afin d'éviter une double facturation.

Attention au suivi des requêtes
Un timeout ou l'arrêt du CLI ne prouve pas que la génération distante est arrêtée.
Consulter la console Higgsfield avant de soumettre une nouvelle génération.
Dans le SDK installé 0.2.6, le polling connaît completed, failed et nsfw.
Si l'API émet canceled/cancelled ou une autre variante de modération, le SDK peut
continuer jusqu'au timeout. L'exemple n'annonce alors jamais un succès ; son
validateur rejette aussi ces statuts s'ils sont retournés directement.
Pour un worker de production, utiliser le suivi et l'annulation explicites ou
des webhooks avec récupération par polling selon la documentation officielle.

Sources officielles consultées avant implémentation
https://docs.higgsfield.ai/docs/how-to/sdk
https://console.higgsfield.ai/models/bytedance/seedance-2.5/text-to-video/api-reference

Les tests hors ligne ne prouvent pas l'accès au modèle ni une génération réelle.
Consulter le rapport de vérification de la mission pour le résultat du test live.
