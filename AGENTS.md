<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.

## What Lovable manages

Rules outside this block are the project's own. Change the pieces below in
Lovable, not by hand. With the [Lovable MCP](https://mcp.lovable.dev)
connected, `send_message` asks Lovable to do it; otherwise ask the user to
use the editor.

- **Database.** Do not add or edit `supabase/migrations/` or `drizzle/`.
  Ask Lovable to change the schema.
- **Generated files.** Do not edit a file whose header says it is automatically
  generated.
- **AI gateway.** Keep model calls on Lovable's gateway, and keep
  `LOVABLE_API_KEY` out of browser code.
- **Connectors.** Lovable provides native connectors. `list_connectors` shows
  which are enabled; `add_connector` only returns the dashboard link. When a
  connector is enabled, calls go through the connector gateway and need
  `LOVABLE_API_KEY`. When Lovable does not provide one, users can bring their
  own key and store it in Secrets.
- **Secrets.** Lovable manages them. Do not put secret values in the repo.
<!-- LOVABLE:END -->

## MAVAI project rules
- Chat runs through authenticated server functions in `src/lib/chat.functions.ts`; AI/voice calls live in `src/lib/mavai-ai.server.ts` (text via Lovable AI, voice in/out via ElevenLabs) so keys never reach the browser.
- Sign-in state comes from Lovable Cloud via `src/lib/auth-session.ts`; never store sessions manually in browser storage.
- Theme is token-driven in `src/styles.css` (`:root` = light, `.dark` = dark) toggled by `ThemeToggle`; components use semantic tokens only.
- ARTcB text calls use the server-only bridge in `src/lib/artcb.server.ts` with the configured HTTPS URL; encoding receipts are not AI answers, so retain Lovable AI for actual answers when ARTcB only acknowledges storage.
- Showcase videos use CDN asset pointers and a reusable player; keep large rendered media outside the repository to preserve deployability.
- The canonical /chat surface uses AI SDK streaming and one FIFO controller for text and voice; authenticated HTTP voice requests propagate cancellation, and each turn owns all audible playback before the next starts.
- Production resources live in owner-scoped projects and items; browser audio and frame tools preserve original inputs rather than pretending to supply external inference engines.
- Project selection is URL-derived and shared across module navigation; new work, conversations, memory and media outputs are project-scoped, with database owner validation, to prevent cross-project leakage while retaining legacy unassigned data.
- Character references are validated inline image data and immutable owner-scoped item versions, so revisions never overwrite an approved reference.
- Music composition is explicitly initiated and claimed by an owner-scoped item ID before billing; playback and mixing reuse its retained completed bytes.

- Imported audio/video and local frame outputs are retained in project-keyed IndexedDB with owner-scoped cloud metadata; never imply these browser-local files sync to other devices.
