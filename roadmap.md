# MAVAI roadmap

## Demande du 8 novembre
- [x] Remplacer la clé ElevenLabs : synthèse et transcription HTTP 200, réponse vocale du chat terminée
- [x] Pistes MAVAI/Vous intégrées au compositeur, invisibles avant clic audio et après Stop
- [x] Navigation de tous les modules par projet ; mémoire et pistes isolées entre deux projets, audio rechargé
- [x] Limites honnêtes dans le chat et compte réel des mémoires, modèle et tokens affichés

## Rapport vocal du 7 novembre
- [x] Fusionner /chat et le texte progressif ; rediriger les anciennes conversations sans perte
- [x] Signaux audio réels rouge/bleu, écoute indépendante et file FIFO texte/vocal
- [x] Lecture intégrale sans troncature, erreurs précises, Stop propagé aux fournisseurs (21 tests ciblés)
- [x] Parcours connecté texte, historique rechargé, anciennes URL, ordinateur/mobile sans débordement
- [x] Lecture et transcription ElevenLabs réelles : vérifiées après remplacement de clé le 8 novembre
- [ ] Micro/haut-parleurs physiques et annulation fournisseur en direct : nécessitent appareils réels ; navigateur automatisé uniquement

- [x] Import MAVAI app from GitHub, sign-in via Lovable Cloud
- [x] Voice key (ElevenLabs) pulled from Doppler
- [x] Chat actually answers (server function was missing)
- [x] Clear chat: write / speak (mic) / attach — no mixed modes
- [x] White theme + dark theme toggle everywhere
- [x] Home page with pitch deck (problem / solution)
- [x] MAVAI dashboard (remove leftover Klerio/OWLY screens)
- [x] Verify ARTcB addresses — public domain responds; old AWS address times out
- [x] Connecter MAVAI à internet (recherche web en direct dans chat + Signal Desk)
- [x] Connect and verify ARTcB anonymous chat with question/message contract and 20s timeout; ARTcB stores reasoning, Lovable AI answers encoding receipts
- [x] Micro : arrêt automatique quand l'utilisateur se tait
- [x] Produire le pitch Binance Sentinel de 60 secondes, narré en français, sans présenter la simulation comme une attaque réelle (écoute humaine et synchronisation fine restent à valider)
- [x] Intégrer la vidéo sur la page /auth demandée, fournir le prompt adapté et le post LinkedIn
- [x] Vérifier la lecture et l'affichage de la vidéo sur ordinateur et mobile

## Intégration des audits approuvée
- [x] Chat : flux progressif, modèle/tokens conservés, voyants basés sur réception réelle
- [ ] Conversations : reprise idempotente, documents, mémoire identifiable
- [x] Projets privés : scènes, plans, personnages, ressources, décisions validées
- [x] Character Studio : fiches privées, références, versions et export
- [x] Continuité : analyse comparée et rapports conservés (validation humaine, faux positifs possibles)
- [x] Audio Studio : pistes, mixage, export indépendant WAV
- [x] Audio IA : composition Lyria 30 s conservée, lecture et ajout au mix vérifiés
- [ ] Audio IA : génération musique/bruitages et séparation des stems
- [ ] Frame Control : extraction, masques, corrections ciblées, tracking
- [x] Frame Control : extraction temporelle, gris/luminosité/pixelisation locales, restauration et export PNG
- [ ] Production Studio : scénario, storyboard, montage, animation et VFX
- [x] Préproduction : scénario, découpage et storyboard textuels assistés, export du projet
- [x] Positionnement audiovisuel et navigation
- [x] Vérifications connectées : projets/personnages conservés, storyboard, comparaison, musique, mix WAV, chat rechargé ; 17 tests ciblés passent
- [ ] Vérifications connectées, scénarios professionnels, publication
